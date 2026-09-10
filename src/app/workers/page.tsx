'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminShell } from '../../components/AdminShell'
import { supabase } from '../../lib/supabase'

type WorkerRow = {
  id: string
  employee_code: string
  vehicle_type: string | null
  vehicle_number: string | null
  is_available: boolean
  rating: number | null
  users: { full_name: string | null; phone: string | null } | null
}

export default function WorkersPage() {
  const [rows, setRows] = useState<WorkerRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('workers')
      .select('id, employee_code, vehicle_type, vehicle_number, is_available, rating, users(full_name, phone)')
      .order('created_at', { ascending: false })
    if (loadError) setError(loadError.message)
    else {
      setRows((data ?? []) as unknown as WorkerRow[])
      setError(null)
    }
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  async function createWorker(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase.from('workers').insert({
      user_id: userId.trim(),
      employee_code: employeeCode.trim(),
      vehicle_type: vehicleType.trim() || null,
      vehicle_number: vehicleNumber.trim() || null,
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setUserId('')
    setEmployeeCode('')
    setVehicleType('')
    setVehicleNumber('')
    await load()
  }

  return (
    <AdminShell>
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 24, color: '#1B382C' }}>Workers</h1>
        <p style={{ color: '#6B7280', marginTop: 4, fontSize: 14 }}>
          Workers sign up through the mobile app first; link their user account here to activate them.
        </p>

        <form onSubmit={createWorker} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: 12, marginTop: 24, alignItems: 'end' }}>
          <label style={labelStyle}>User ID<input required value={userId} onChange={(e) => setUserId(e.target.value)} style={inputStyle} placeholder="auth user uuid" /></label>
          <label style={labelStyle}>Employee code<input required value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} style={inputStyle} placeholder="SW-001" /></label>
          <label style={labelStyle}>Vehicle type<input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} style={inputStyle} placeholder="Mini truck" /></label>
          <label style={labelStyle}>Vehicle number<input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} style={inputStyle} placeholder="UP16 AB 1234" /></label>
          <button type="submit" disabled={saving} style={{ minHeight: 44, border: 0, borderRadius: 12, background: '#158263', color: '#fff', fontWeight: 700, padding: '0 18px', cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Add worker'}
          </button>
        </form>

        {loading ? <p style={{ marginTop: 24, color: '#6B7280' }}>Loading…</p> : null}
        {error ? <p style={{ marginTop: 24, color: '#E53935' }}>{error}</p> : null}
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          {rows.map((row) => (
            <Link key={row.id} href={{ pathname: '/workers/detail', query: { id: row.id } }} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, cursor: 'pointer' }}>
                <div>
                  <strong style={{ color: '#1B382C' }}>{row.users?.full_name ?? row.employee_code}</strong>
                  <div style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
                    {row.employee_code}{row.vehicle_type ? ` · ${row.vehicle_type}` : ''}{row.vehicle_number ? ` · ${row.vehicle_number}` : ''}{row.users?.phone ? ` · ${row.users.phone}` : ''}
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: row.is_available ? '#158263' : '#6B7280' }}>
                  {row.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </Link>
          ))}
          {!loading && !error && rows.length === 0 ? <p style={{ color: '#6B7280' }}>No workers yet.</p> : null}
        </div>
      </div>
    </AdminShell>
  )
}

const labelStyle: React.CSSProperties = { display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }
const inputStyle: React.CSSProperties = { minHeight: 44, borderRadius: 10, border: '1px solid #E5E7EB', padding: '0 12px', fontSize: 14 }
