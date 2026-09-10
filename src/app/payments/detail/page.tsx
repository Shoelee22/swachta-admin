'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AdminShell } from '../../../components/AdminShell'
import { supabase } from '../../../lib/supabase'

type PaymentDetail = {
  id: string
  amount: number
  status: string
  method: string | null
  provider: string
  provider_order_id: string | null
  provider_payment_id: string | null
  created_at: string
  updated_at: string
  bookings: { id: string; booking_code: string; status: string } | null
}

function PaymentDetailInner() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    supabase
      .from('payments')
      .select('id, amount, status, method, provider, provider_order_id, provider_payment_id, created_at, updated_at, bookings(id, booking_code, status)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (loadError) setError(loadError.message)
        else setPayment((data as unknown as PaymentDetail) ?? null)
      })
  }, [id])

  if (!id) {
    return <AdminShell><div style={{ padding: 32 }}><p style={{ color: '#E53935' }}>Missing payment id.</p></div></AdminShell>
  }

  return (
    <AdminShell>
      <div style={{ padding: 32, maxWidth: 720 }}>
        <Link href="/payments" style={{ color: '#158263', fontWeight: 600 }}>‹ Payments</Link>
        {error ? <p style={{ color: '#E53935', marginTop: 12 }}>{error}</p> : null}
        {!payment && !error ? <p style={{ color: '#6B7280', marginTop: 12 }}>Loading…</p> : null}
        {payment ? (
          <>
            <div style={{ marginTop: 16, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#1B382C' }}>₹{Number(payment.amount).toLocaleString('en-IN')}</div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, textTransform: 'capitalize', color: payment.status === 'paid' ? '#158263' : payment.status === 'failed' ? '#E53935' : '#6B7280' }}>
                {payment.status}{payment.method ? ` · ${payment.method}` : ''}
              </div>
            </div>

            <div style={{ marginTop: 16, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 20, display: 'grid', gap: 10 }}>
              <Row label="Provider" value={payment.provider} />
              <Row label="Order ID" value={payment.provider_order_id ?? '—'} />
              <Row label="Payment ID" value={payment.provider_payment_id ?? '—'} />
              <Row label="Webhook" value={payment.provider_payment_id ? 'Verified (capture confirmed)' : 'Awaiting confirmation'} />
              <Row label="Created" value={new Date(payment.created_at).toLocaleString('en-IN')} />
              <Row label="Updated" value={new Date(payment.updated_at).toLocaleString('en-IN')} />
            </div>

            {payment.bookings ? (
              <Link href={{ pathname: '/bookings/detail', query: { id: payment.bookings.id } }} style={{ textDecoration: 'none' }}>
                <div style={{ marginTop: 16, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 16, display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: 14, color: '#6B7280' }}>Related booking</span>
                  <strong style={{ color: '#158263', fontSize: 14 }}>{payment.bookings.booking_code} →</strong>
                </div>
              </Link>
            ) : null}

            <p style={{ marginTop: 16, color: '#6B7280', fontSize: 13 }}>
              Refunds are issued from the Razorpay dashboard; the payment row updates via webhook.
            </p>
          </>
        ) : null}
      </div>
    </AdminShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ color: '#6B7280', fontSize: 14 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}

export default function PaymentDetailPage() {
  return (
    <Suspense fallback={<AdminShell><div style={{ padding: 32, color: '#6B7280' }}>Loading…</div></AdminShell>}>
      <PaymentDetailInner />
    </Suspense>
  )
}
