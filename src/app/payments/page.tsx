'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminShell } from '../../components/AdminShell'
import { supabase } from '../../lib/supabase'

type PaymentRow = {
  id: string
  amount: number
  status: string
  method: string | null
  created_at: string
  bookings: { booking_code: string; users: { full_name: string | null } | null } | null
}

const FILTERS = ['all', 'paid', 'created', 'failed', 'refunded'] as const
type Filter = (typeof FILTERS)[number]

export default function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [collectedToday, setCollectedToday] = useState(0)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const today = new Date().toISOString().slice(0, 10)
      const [todayPaid, byStatus, list] = await Promise.all([
        supabase.from('payments').select('amount').eq('status', 'paid').gte('created_at', today),
        supabase.from('payments').select('status'),
        supabase
          .from('payments')
          .select('id, amount, status, method, created_at, bookings(booking_code, users(full_name))')
          .order('created_at', { ascending: false })
          .limit(50),
      ])
      if (!active) return
      if (list.error) setError(list.error.message)
      else setError(null)
      setCollectedToday((todayPaid.data ?? []).reduce((sum, p) => sum + Number((p as { amount: number }).amount), 0))
      const tally: Record<string, number> = {}
      for (const p of byStatus.data ?? []) tally[(p as { status: string }).status] = (tally[(p as { status: string }).status] ?? 0) + 1
      setCounts(tally)
      setRows((list.data ?? []) as unknown as PaymentRow[])
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [])

  const visible = filter === 'all' ? rows : rows.filter((r) => r.status === filter)
  const kpis = [
    { label: 'Collected today', value: `₹${collectedToday.toLocaleString('en-IN')}` },
    { label: 'Pending', value: String(counts.created ?? 0) },
    { label: 'Failed', value: String(counts.failed ?? 0) },
    { label: 'Refunded', value: String(counts.refunded ?? 0) },
  ]

  return (
    <AdminShell>
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 24, color: '#1B382C' }}>Payments</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24 }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 20 }}>
              <div style={{ color: '#6B7280', fontSize: 13 }}>{kpi.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1B382C', marginTop: 6 }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} style={{ padding: '8px 14px', borderRadius: 999, border: '1px solid #E5E7EB', background: filter === f ? '#158263' : '#fff', color: filter === f ? '#fff' : '#6B7280', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? <p style={{ marginTop: 20, color: '#6B7280' }}>Loading…</p> : null}
        {error ? <p style={{ marginTop: 20, color: '#E53935' }}>{error}</p> : null}
        <div style={{ marginTop: 16, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
          {!loading && visible.length === 0 ? <p style={{ padding: 20, color: '#6B7280', fontSize: 14 }}>No payments in this state.</p> : null}
          {visible.map((row, i) => (
            <Link key={row.id} href={{ pathname: '/payments/detail', query: { id: row.id } }} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid #E5E7EB', cursor: 'pointer' }}>
                <div>
                  <strong style={{ color: '#1B382C', fontSize: 14 }}>{row.bookings?.users?.full_name ?? 'Customer'}</strong>
                  <span style={{ color: '#6B7280', fontSize: 13, marginLeft: 8 }}>{row.bookings?.booking_code ?? ''}</span>
                  <div style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>{new Date(row.created_at).toLocaleString('en-IN')}{row.method ? ` · ${row.method}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>₹{Number(row.amount).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: 12, textTransform: 'capitalize', color: row.status === 'paid' ? '#158263' : row.status === 'failed' ? '#E53935' : '#6B7280' }}>{row.status}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}
