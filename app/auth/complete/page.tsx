'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useMutation } from '@apollo/client/react'
import { GoogleAuthMutationDoc } from '@/lib/graphql/auth'

function AuthCompleteInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()
  const called = useRef(false)
  const [googleAuth] = useMutation(GoogleAuthMutationDoc)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const token = searchParams.get('token')

    if (!token) {
      router.replace('/login')
      return
    }

    googleAuth({ variables: { input: { accessToken: token } } })
      .then((res) => {
        const payload = res.data?.googleAuth
        if (!payload) throw new Error('Empty googleAuth response')
        setAuth(
          payload.user,
          payload.token,
          payload.active_membership ?? null,
          payload.memberships ?? [],
        )
        router.replace('/dashboard')
      })
      .catch((err) => {
        console.error('API auth error:', err)
        router.replace('/login')
      })
  }, [router, searchParams, setAuth, googleAuth])

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
