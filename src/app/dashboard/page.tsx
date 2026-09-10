'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminShell } from '../../components/AdminShell'
import { supabase } from '../../lib/supabase'

type LiveBooking = {
  id: string
  booking_code: string
  status: string
  price: number
  scheduled_date: string
  services: { name: string } | null
  users: { full_name: string | null } | null
}

export default function DashboardPage() {
  const [pickupsToday, setPickupsToday] = useState(0)
  const [activeWorkers, setActiveWorkers] = useState(0)
  const [revenueToday, setRevenueToday] = useState(0)
  const [completionRate, setCompletionRate] = useState<number | null>(null)
  const [live, setLive] = useState<LiveBooking[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      const today = new Date().toISOString().slice(0, 10)
      const [pickups, workers, payments, completed, total, bookings] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('scheduled_date', today),
        supabase.from('workers').select('id', { count: 'exact', head: true }).eq('is_available', true),
        supabase.from('payments').select('amount').eq('status', 'paid').gte('created_at', today),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id, booking_code, status, price, scheduled_date, services(name), users(full_name)').order('created_at', { ascending: false }).limit(8),
      ])
      if (!active) return
      const firstError = pickups.error ?? workers.error ?? payments.error ?? bookings.error
      if (firstError) setError(firstError.message)
      setPickupsToday(pickups.count ?? 0)
      setActiveWorkers(workers.count ?? 0)
      setRevenueToday((payments.data ?? []).reduce((sum, p) => sum + Number((p as { amount: number }).amount), 0))
      setCompletionRate(total.count ? Math.round(((completed.count ?? 0) / total.count) * 100) : null)
      setLive((bookings.data ?? []) as unknown as LiveBooking[])
    }
    void load()
    return () => { active = false }
  }, [])

  const kpis = [
    { label: "Today's pickups", value: String(pickupsToday) },
    { label: 'Active workers', value: String(activeWorkers) },
    { label: 'Revenue today', value: `₹${revenueToday.toLocaleString('en-IN')}` },
    { label: 'Completion rate', value: completionRate === null ? '—' : `${completionRate}%` },
  ]

  return (
    <AdminShell>
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 24, color: '#1B382C' }}>Dashboard</h1>
        {error ? <p style={{ color: '#E53935', marginTop: 12 }}>{error}</p> : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24 }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 20 }}>
              <div style={{ color: '#6B7280', fontSize: 13 }}>{kpi.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1B382C', marginTop: 6 }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 17, color: '#1B382C', marginTop: 32 }}>Live bookings</h2>
        <div style={{ marginTop: 12, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
          {live.length === 0 ? (
            <p style={{ padding: 20, color: '#6B7280', fontSize: 14 }}>No bookings yet.</p>
          ) : (
            live.map((row, i) => (
              <Link key={row.id} href={{ pathname: '/bookings/detail', query: { id: row.id } }} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid #E5E7EB', cursor: 'pointer' }}>
                  <div>
                    <strong style={{ color: '#1B382C', fontSize: 14 }}>{row.users?.full_name ?? 'Customer'}</strong>
                    <span style={{ color: '#6B7280', fontSize: 13, marginLeft: 8 }}>{row.booking_code}</span>
                    <div style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>{row.services?.name ?? 'Service'} · {row.scheduled_date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>₹{row.price}</div>
                    <div style={{ fontSize: 12, color: '#158263', textTransform: 'capitalize' }}>{row.status.replaceAll('_', ' ')}</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  )
}
