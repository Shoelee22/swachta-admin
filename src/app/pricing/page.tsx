'use client'

import { useEffect, useState } from 'react'
import { AdminShell } from '../../components/AdminShell'
import { supabase } from '../../lib/supabase'

type ServiceRow = {
  id: string
  name: string
  slug: string
  price: number
  is_active: boolean
}

export default function PricingPage() {
  const [rows, setRows] = useState<ServiceRow[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data, error: loadError } = await supabase
      .from('services')
      .select('id, name, slug, price, is_active')
      .order('name')
    if (loadError) setError(loadError.message)
    else {
      const list = (data ?? []) as ServiceRow[]
      setRows(list)
      setDrafts(Object.fromEntries(list.map((s) => [s.id, String(s.price)])))
      setError(null)
    }
  }

  useEffect(() => { void load() }, [])

  async function savePrice(service: ServiceRow) {
    const next = Number(drafts[service.id])
    if (!Number.isFinite(next) || next < 0) {
      setError('Enter a valid non-negative price.')
      return
    }
    setSavingId(service.id)
    setMessage(null)
    const { error: updateError } = await supabase.from('services').update({ price: next }).eq('id', service.id)
    setSavingId(null)
    if (updateError) setError(updateError.message)
    else {
      setMessage(`${service.name} price updated.`)
      await load()
    }
  }

  async function toggleActive(service: ServiceRow) {
    const { error: updateError } = await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id)
    if (updateError) setError(updateError.message)
    else await load()
  }

  return (
    <AdminShell>
      <div style={{ padding: 32, maxWidth: 820 }}>
        <h1 style={{ fontSize: 24, color: '#1B382C' }}>Service pricing</h1>
        <p style={{ color: '#6B7280', marginTop: 4, fontSize: 14 }}>Price changes apply to new bookings immediately; existing bookings keep their locked price.</p>

        {message ? <p style={{ color: '#158263', marginTop: 12 }}>{message}</p> : null}
        {error ? <p style={{ color: '#E53935', marginTop: 12 }}>{error}</p> : null}

        <div style={{ marginTop: 20, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
          {rows.map((service, i) => (
            <div key={service.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderTop: i === 0 ? 'none' : '1px solid #E5E7EB', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <strong style={{ color: '#1B382C', fontSize: 15 }}>{service.name}</strong>
                <div style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>{service.slug}</div>
              </div>
              <input
                value={drafts[service.id] ?? ''}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [service.id]: e.target.value }))}
                inputMode="numeric"
                aria-label={`Price for ${service.name}`}
                style={{ width: 110, minHeight: 42, borderRadius: 10, border: '1px solid #E5E7EB', padding: '0 12px', fontSize: 15 }}
              />
              <button type="button" onClick={() => savePrice(service)} disabled={savingId === service.id} style={{ minHeight: 42, border: 0, borderRadius: 10, background: '#158263', color: '#fff', fontWeight: 700, padding: '0 16px', cursor: 'pointer' }}>
                {savingId === service.id ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => toggleActive(service)}
                aria-pressed={service.is_active}
                style={{ minHeight: 42, borderRadius: 10, border: '1px solid #E5E7EB', background: service.is_active ? '#DDF0E3' : '#fff', color: service.is_active ? '#158263' : '#6B7280', fontWeight: 700, padding: '0 16px', cursor: 'pointer' }}
              >
                {service.is_active ? 'Active' : 'Hidden'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}
