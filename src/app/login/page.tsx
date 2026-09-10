'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setLoading(false)
      setError(signInError.message)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('role').eq('id', user?.id ?? '').maybeSingle()
    setLoading(false)
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      await supabase.auth.signOut()
      setError('This account does not have admin access.')
      return
    }
    router.push('/bookings')
  }

  return (
    <main style={{ maxWidth: 420, margin: '96px auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, color: '#1B382C' }}>Swachta Operations</h1>
      <p style={{ color: '#6B7280', marginTop: 4 }}>Sign in with an admin account.</p>
      <form onSubmit={signIn} style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <label style={{ display: 'grid', gap: 6, fontSize: 14, fontWeight: 600 }}>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
        </label>
        <label style={{ display: 'grid', gap: 6, fontSize: 14, fontWeight: 600 }}>
          Password
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="current-password" />
        </label>
        {error ? <p style={{ color: '#E53935', fontSize: 14 }}>{error}</p> : null}
        <button type="submit" disabled={loading} style={{ minHeight: 48, border: 0, borderRadius: 12, background: '#158263', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  minHeight: 48,
  borderRadius: 12,
  border: '1px solid #E5E7EB',
  padding: '0 14px',
  fontSize: 15,
}
