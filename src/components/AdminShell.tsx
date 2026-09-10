'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', glyph: '▦' },
  { href: '/bookings', label: 'Bookings', glyph: '📦' },
  { href: '/workers', label: 'Workers', glyph: '👷' },
  { href: '/payments', label: 'Payments', glyph: '💳' },
  { href: '/pricing', label: 'Pricing', glyph: '🏷️' },
  { href: '/support', label: 'Support', glyph: '🎧' },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7FCFE' }}>
      <aside style={{ width: 232, background: '#1B382C', padding: '24px 14px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 24px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#158263', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>S</div>
          <strong style={{ color: '#fff', fontSize: 16 }}>Swachta Ops</strong>
        </div>
        <nav style={{ display: 'grid', gap: 4 }}>
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href) ?? false
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  color: active ? '#fff' : 'rgba(255,255,255,0.72)',
                  background: active ? '#158263' : 'transparent',
                }}
              >
                <span>{item.glyph}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <button
          type="button"
          onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          style={{ marginTop: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
        >
          Sign out
        </button>
      </aside>
      <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
    </div>
  )
}
