'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminShell } from '../../components/AdminShell'
import { supabase } from '../../lib/supabase'

type BookingRow = {
  id: string
  booking_code: string
  status: string
  payment_status: string
  price: number
  scheduled_date: string
  created_at: string
  services: { name: string } | null
  pickup_slots: { label: string } | null
}

const FILTERS = ['all', 'pending', 'confirmed', 'assigned', 'on_the_way', 'completed', 'cancelled'] as const
type Filter = (typeof FILTERS)[number]

export default function BookingsPage() {
  const [rows, setRows] = useState<BookingRow[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    let query = supabase
      .from('bookings')
      .select('id, booking_code, status, payment_status, price, scheduled_date, created_at, services(name), pickup_slots(label)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    query.then(({ data, error: queryError }) => {
      if (!active) return
      if (queryError) setError(queryError.message)
      else {
        setRows((data ?? []) as unknown as BookingRow[])
        setError(null)
      }
      setLoading(false)
    })
    return () => { active = false }
  }, [filter])

  return (
    <AdminShell>
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 24, color: '#1B382C' }}>Bookings</h1>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: '1px solid #E5E7EB',
                background: filter === f ? '#158263' : '#fff',
                color: filter === f ? '#fff' : '#6B7280',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
        {loading ? <p style={{ marginTop: 24, color: '#6B7280' }}>Loading…</p> : null}
        {error ? (
          <p style={{ marginTop: 24, color: '#E53935' }}>
            {error} — sign in with an admin account to view bookings.
          </p>
        ) : null}
        {!loading && !error && rows.length === 0 ? <p style={{ marginTop: 24, color: '#6B7280' }}>No bookings in this state.</p> : null}
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          {rows.map((row) => (
            <Link
              key={row.id}
              href={{ pathname: '/bookings/detail', query: { id: row.id } }}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, cursor: 'pointer' }}>
                <div>
                  <strong style={{ color: '#1B382C' }}>{row.services?.name ?? 'Service'}</strong>
                  <span style={{ color: '#6B7280', marginLeft: 8, fontSize: 13 }}>{row.booking_code}</span>
                  <div style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>{row.scheduled_date}{row.pickup_slots ? ` · ${row.pickup_slots.label}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>₹{row.price}</div>
                  <div style={{ fontSize: 13, color: '#158263', textTransform: 'capitalize' }}>{row.status.replaceAll('_', ' ')} · {row.payment_status}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}
