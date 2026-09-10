'use client'

import { useEffect, useState } from 'react'
import { AdminShell } from '../../components/AdminShell'
import { supabase } from '../../lib/supabase'

type TicketRow = {
  id: string
  subject: string
  body: string
  status: 'open' | 'in_progress' | 'resolved'
  created_at: string
  users: { full_name: string | null; phone: string | null } | null
}

type ReplyRow = {
  id: string
  body: string
  is_admin: boolean
  created_at: string
}

const STATUSES: TicketRow['status'][] = ['open', 'in_progress', 'resolved']

export default function SupportPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [replies, setReplies] = useState<ReplyRow[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadTickets() {
    const { data, error: loadError } = await supabase
      .from('support_tickets')
      .select('id, subject, body, status, created_at, users(full_name, phone)')
      .order('created_at', { ascending: false })
    if (loadError) setError(loadError.message)
    else {
      setTickets((data ?? []) as unknown as TicketRow[])
      setError(null)
    }
  }

  useEffect(() => { void loadTickets() }, [])

  useEffect(() => {
    if (!selectedId) return
    supabase
      .from('ticket_replies')
      .select('id, body, is_admin, created_at')
      .eq('ticket_id', selectedId)
      .order('created_at')
      .then(({ data }) => setReplies((data ?? []) as ReplyRow[]))
  }, [selectedId])

  const selected = tickets.find((t) => t.id === selectedId) ?? null

  async function sendReply() {
    if (!selectedId || !replyText.trim() || sending) return
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error: insertError } = await supabase.from('ticket_replies').insert({
      ticket_id: selectedId,
      author_user_id: user?.id ?? null,
      body: replyText.trim(),
      is_admin: true,
    })
    setSending(false)
    if (insertError) setError(insertError.message)
    else {
      setReplyText('')
      const { data } = await supabase.from('ticket_replies').select('id, body, is_admin, created_at').eq('ticket_id', selectedId).order('created_at')
      setReplies((data ?? []) as ReplyRow[])
    }
  }

  async function setStatus(status: TicketRow['status']) {
    if (!selectedId) return
    const { error: updateError } = await supabase.from('support_tickets').update({ status }).eq('id', selectedId)
    if (updateError) setError(updateError.message)
    else await loadTickets()
  }

  return (
    <AdminShell>
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 24, color: '#1B382C' }}>Support tickets</h1>
        {error ? <p style={{ color: '#E53935', marginTop: 12 }}>{error}</p> : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: 16, marginTop: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden', alignSelf: 'start' }}>
            {tickets.length === 0 ? <p style={{ padding: 20, color: '#6B7280', fontSize: 14 }}>No tickets yet.</p> : null}
            {tickets.map((ticket, i) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedId(ticket.id)}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: selectedId === ticket.id ? '#F2FAF5' : '#fff', border: 0, borderTop: i === 0 ? 'none' : '1px solid #E5E7EB', padding: '14px 16px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong style={{ fontSize: 14, color: '#1B382C' }}>{ticket.subject}</strong>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize', color: ticket.status === 'open' ? '#B45309' : ticket.status === 'resolved' ? '#158263' : '#1D4ED8' }}>
                    {ticket.status.replaceAll('_', ' ')}
                  </span>
                </div>
                <div style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>
                  {ticket.users?.full_name ?? 'Customer'} · {new Date(ticket.created_at).toLocaleDateString('en-IN')}
                </div>
              </button>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 20, minHeight: 320 }}>
            {!selected ? (
              <p style={{ color: '#6B7280', fontSize: 14 }}>Select a ticket to view the conversation.</p>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 16, color: '#1B382C' }}>{selected.subject}</strong>
                  <select value={selected.status} onChange={(e) => setStatus(e.target.value as TicketRow['status'])} style={{ minHeight: 38, borderRadius: 8, border: '1px solid #E5E7EB', padding: '0 10px' }}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginTop: 16, padding: 14, background: '#F7FCFE', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{selected.users?.full_name ?? 'Customer'} · {new Date(selected.created_at).toLocaleString('en-IN')}</div>
                  <p style={{ fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>{selected.body}</p>
                </div>
                {replies.map((reply) => (
                  <div key={reply.id} style={{ marginTop: 10, padding: 14, borderRadius: 12, background: reply.is_admin ? '#DDF0E3' : '#F7FCFE' }}>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{reply.is_admin ? 'Swachta Support' : 'Customer'} · {new Date(reply.created_at).toLocaleString('en-IN')}</div>
                    <p style={{ fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>{reply.body}</p>
                  </div>
                ))}
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply…"
                  style={{ marginTop: 16, width: '100%', minHeight: 88, borderRadius: 12, border: '1px solid #E5E7EB', padding: 12, fontSize: 14, fontFamily: 'inherit' }}
                />
                <button type="button" onClick={sendReply} disabled={sending || !replyText.trim()} style={{ marginTop: 10, minHeight: 44, border: 0, borderRadius: 10, background: '#158263', color: '#fff', fontWeight: 700, padding: '0 18px', cursor: 'pointer' }}>
                  {sending ? 'Sending…' : 'Send reply'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
