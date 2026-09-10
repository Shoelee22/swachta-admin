'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

type BookingDetail = {
  id: string
  booking_code: string
  status: string
  payment_status: string
  price: number
  scheduled_date: string
  services: { name: string } | null
  pickup_slots: { label: string; start_time: string; end_time: string } | null
  addresses: { address_line_1: string; address_line_2: string | null; city: string; pincode: string } | null
  users: { full_name: string | null; phone: string | null } | null
}

type WorkerOption = { id: string; employee_code: string; users: { full_name: string | null } | null }

const STATUSES = ['pending', 'confirmed', 'assigned', 'on_the_way', 'reached', 'picked_up', 'completed', 'cancelled', 'failed', 'refunded']

function BookingDetailInner() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [workers, setWorkers] = useState<WorkerOption[]>([])
  const [workerId, setWorkerId] = useState('')
  const [nextStatus, setNextStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    const [{ data: bookingData, error: bookingError }, { data: workerData }] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, booking_code, status, payment_status, price, scheduled_date, services(name), pickup_slots(label, start_time, end_time), addresses(address_line_1, address_line_2, city, pincode), users(full_name, phone)')
        .eq('id', id)
        .maybeSingle(),
      supabase.from('workers').select('id, employee_code, users(full_name)').eq('is_available', true),
    ])
    if (bookingError) setError(bookingError.message)
    else {
      setBooking((bookingData as unknown as BookingDetail) ?? null)
      setWorkers((workerData ?? []) as unknown as WorkerOption[])
      setError(null)
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  async function assign() {
    if (!workerId) return
    setBusy(true)
    setMessage(null)
    const { error: rpcError } = await supabase.rpc('admin_assign_worker', { p_booking_id: id, p_worker_id: workerId })
    setBusy(false)
    if (rpcError) setError(rpcError.message)
    else {
      setMessage('Worker assigned.')
      await load()
    }
  }

  async function updateStatus() {
    if (!nextStatus) return
    setBusy(true)
    setMessage(null)
    const { error: rpcError } = await supabase.rpc('admin_update_booking_status', { p_booking_id: id, p_new_status: nextStatus, p_note: 'Updated by admin' })
    setBusy(false)
    if (rpcError) setError(rpcError.message)
    else {
      setMessage('Status updated.')
      setNextStatus('')
      await load()
    }
  }

  if (!id) {
    return <main style={{ padding: 32 }}><p style={{ color: '#E53935' }}>Missing booking id.</p><Link href="/bookings" style={{ color: '#158263' }}>Back to bookings</Link></main>
  }

  if (error && !booking) {
    return <main style={{ padding: 32 }}><p style={{ color: '#E53935' }}>{error}</p><Link href="/bookings" style={{ color: '#158263' }}>Back to bookings</Link></main>
  }

  if (!booking) {
    return <main style={{ padding: 32 }}><p style={{ color: '#6B7280' }}>Loading…</p></main>
  }

  const address = booking.addresses
    ? `${booking.addresses.address_line_1}${booking.addresses.address_line_2 ? `, ${booking.addresses.address_line_2}` : ''}, ${booking.addresses.city} - ${booking.addresses.pincode}`
    : '—'

  return (
    <main style={{ padding: 32, maxWidth: 720 }}>
      <Link href="/bookings" style={{ color: '#158263', fontWeight: 600 }}>‹ Bookings</Link>
      <h1 style={{ fontSize: 24, color: '#1B382C', marginTop: 12 }}>{booking.services?.name ?? 'Booking'}</h1>
      <p style={{ color: '#6B7280', marginTop: 4 }}>{booking.booking_code}</p>

      <div style={{ marginTop: 20, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 20, display: 'grid', gap: 10 }}>
        <Row label="Customer" value={booking.users?.full_name ?? '—'} />
        <Row label="Phone" value={booking.users?.phone ?? '—'} />
        <Row label="Date" value={booking.scheduled_date} />
        <Row label="Slot" value={booking.pickup_slots?.label ?? '—'} />
        <Row label="Address" value={address} />
        <Row label="Amount" value={`₹${booking.price}`} />
        <Row label="Status" value={booking.status.replaceAll('_', ' ')} />
        <Row label="Payment" value={booking.payment_status} />
      </div>

      <h2 style={{ fontSize: 17, color: '#1B382C', marginTop: 28 }}>Assign worker</h2>
      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} style={{ minHeight: 44, borderRadius: 10, border: '1px solid #E5E7EB', padding: '0 12px', flex: 1, minWidth: 220 }}>
          <option value="">Select worker…</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>{w.users?.full_name ?? w.employee_code}</option>
          ))}
        </select>
        <button type="button" onClick={assign} disabled={busy || !workerId || booking.status !== 'confirmed'} style={buttonStyle}>
          {booking.status === 'confirmed' ? 'Assign' : `Assign (needs confirmed, is ${booking.status})`}
        </button>
      </div>

      <h2 style={{ fontSize: 17, color: '#1B382C', marginTop: 28 }}>Update status</h2>
      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} style={{ minHeight: 44, borderRadius: 10, border: '1px solid #E5E7EB', padding: '0 12px', flex: 1, minWidth: 220 }}>
          <option value="">Select status…</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
          ))}
        </select>
        <button type="button" onClick={updateStatus} disabled={busy || !nextStatus} style={buttonStyle}>Update</button>
      </div>

      {message ? <p style={{ color: '#158263', marginTop: 16 }}>{message}</p> : null}
      {error ? <p style={{ color: '#E53935', marginTop: 16 }}>{error}</p> : null}
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ color: '#6B7280', fontSize: 14 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  minHeight: 44,
  border: 0,
  borderRadius: 10,
  background: '#158263',
  color: '#fff',
  fontWeight: 700,
  padding: '0 18px',
  cursor: 'pointer',
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<main style={{ padding: 32 }}><p style={{ color: '#6B7280' }}>Loading…</p></main>}>
      <BookingDetailInner />
    </Suspense>
  )
}
