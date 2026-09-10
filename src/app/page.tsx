'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard')
  }, [router])
  return <main style={{ padding: 32, color: '#6B7280' }}>Redirecting to dashboard…</main>
}
