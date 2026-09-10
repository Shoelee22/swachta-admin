'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AdminShell } from '../../../components/AdminShell'
import { supabase } from '../../../lib/supabase'

type WorkerDetail = {
  id: string
  employee_code: string
  vehicle_type: string | null
  vehicle_number: string | null
  is_available: boolean
  rating: number | null
  users: { full_name: string | null; phone: string | null } | null
}

type AssignmentRow = {
  id: string
  status: string
  assigned_at: string
  bookings: { booking_code: string; status: string; price: number; scheduled_date: string; services: { name: string } | null } | null
}

function WorkerDetailInner() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const [worker, setWorker] = useState<WorkerDetail | null>(null)
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    if (!id) return
    const [{ data: workerData, error: workerError }, { data: assignmentData }] = await Promise.all([
      supabase.from('workers').select('id, employee_code, vehicle_type, vehicle_number, is_available, rating, users(full_name, phone)').eq('id', id).maybeSingle(),
      supabase.from('worker_assignments').select('id, status, assigned_at, bookings(booking_code, status, price, scheduled_date, services(name))').eq('worker_id', id).order('assigned_at', { ascending: false }).limit(20),
    ])
    if (workerError) setError(workerError.message)
    else {
      setWorker((workerData as unknown as WorkerDetail) ?? null)
      setAssignments((assignmentData ?? []) as unknown as AssignmentRow[])
      setError(null)
    }
  }

  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleAvailability() {
    if (!worker) return
    const { error: updateError } = await supabase.from('workers').update({ is_available: !worker.is_available }).eq('id', worker.id)
    if (updateError) setError(updateError.message)
    else {
      setMessage('Availability updated.')
      await load()
    }
  }

  const completed = assignments.filter((a) => a.status === 'completed').length
  const today = new Date().toISOString().slice(0, 10)
  const jobsToday = assignments.filter((a) => a.assigned_at.slice(0, 10) === today).length

  return (
    <AdminShell>
      <div style={{ padding: 32, maxWidth: 860 }}>
        <Link href="/workers" style={{ color: '#158263', fontWeight: 600 }}>‹ Workers</Link>
        {error ? <p style={{ color: '#E53935', marginTop: 12 }}>{error}</p> : null}
        {message ? <p style={{ color: '#158263', marginTop: 12 }}>{message}</p> : null}
        {!worker && !error ? <p style={{ color: '#6B7280', marginTop: 12 }}>Loading…</p> : null}
        {worker ? (
          <>
            <div style={{ marginTop: 16, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: '#158263', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>
                {(worker.users?.full_name ?? 'W').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <strong style={{ fontSize: 18, color: '#1B382C' }}>{worker.users?.full_name ?? worker.employee_code}</strong>
                <div style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>
                  {worker.employee_code}{worker.vehicle_type ? ` · ${worker.vehicle_type}` : ''}{worker.vehicle_number ? ` · ${worker.vehicle_number}` : ''}{worker.users?.phone ? ` · ${worker.users.phone}` : ''}
                </div>
              </div>
              <button type="button" onClick={toggleAvailability} aria-pressed={worker.is_available} style={{ minHeight: 42, borderRadius: 10, border: '1px solid #E5E7EB', background: worker.is_available ? '#DDF0E3' : '#fff', color: worker.is_available ? '#158263' : '#6B7280', fontWeight: 700, padding: '0 16px', cursor: 'pointer' }}>
                {worker.is_available ? 'Available' : 'Unavailable'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
              {[
                { label: 'Jobs today', value: String(jobsToday) },
                { label: 'Completed jobs', value: String(completed) },
                { label: 'Rating', value: worker.rating === null ? '—' : `${worker.rating} ★` },
              ].map((kpi) => (
                <div key={kpi.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 18 }}>
                  <div style={{ color: '#6B7280', fontSize: 13 }}>{kpi.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#1B382C', marginTop: 4 }}>{kpi.value}</div>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: 17, color: '#1B382C', marginTop: 24 }}>Assigned jobs</h2>
            <div style={{ marginTop: 12, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
              {assignments.length === 0 ? <p style={{ padding: 20, color: '#6B7280', fontSize: 14 }}>No assignments yet.</p> : null}
              {assignments.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid #E5E7EB' }}>
                  <div>
                    <strong style={{ fontSize: 14, color: '#1B382C' }}>{a.bookings?.services?.name ?? 'Pickup'}</strong>
                    <span style={{ color: '#6B7280', fontSize: 13, marginLeft: 8 }}>{a.bookings?.booking_code ?? ''}</span>
                    <div style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>{a.bookings?.scheduled_date ?? ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>₹{a.bookings?.price ?? 0}</div>
                    <div style={{ fontSize: 12, color: '#158263', textTransform: 'capitalize' }}>{a.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </AdminShell>
  )
}

export default function WorkerDetailPage() {
  return (
    <Suspense fallback={<AdminShell><div style={{ padding: 32, color: '#6B7280' }}>Loading…</div></AdminShell>}>
      <WorkerDetailInner />
    </Suspense>
  )
}
