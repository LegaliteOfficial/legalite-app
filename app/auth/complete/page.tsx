'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { applyAuthPayload, callAuth } from '@/lib/auth/session-client'

function AuthCompleteInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const token = searchParams.get('token')

    if (!token) {
      router.replace('/login')
      return
    }

    callAuth('google', { input: { accessToken: token } })
      .then((payload) => {
        applyAuthPayload(payload)
        router.replace('/dashboard')
      })
      .catch(() => {
        router.replace('/login?error=oauth_failed')
      })
  }, [router, searchParams])

  return null
}

export default function AuthCompletePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--navy)' }}
    >
      <div className="text-center">
        <div
          className="font-heading text-2xl font-bold mb-3"
          style={{ color: 'var(--gold-light)' }}
        >
          LegaLite
        </div>
        <div className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Signing you in...
        </div>
      </div>
      <Suspense>
        <AuthCompleteInner />
      </Suspense>
    </div>
  )
}
