'use client'

/**
 * OAuth callback — client-side PKCE code exchange.
 *
 * Why client-side? With @supabase/ssr the PKCE code-verifier ends up in
 * the BROWSER client's storage (cookies + in-memory). The previous
 * server-side route handler couldn't reliably read that verifier on
 * production, causing every OAuth attempt to fail with
 * "PKCE code verifier not found in storage".
 *
 * Doing the exchange on the same client instance that initiated the OAuth
 * flow guarantees the verifier is available — no cookie round-trip needed.
 *
 * Flow:
 *   1. Read `?code=...` from URL.
 *   2. Browser supabase client exchanges code -> session (uses its own
 *      verifier, no server lookup).
 *   3. Post the session access_token to our backend /auth/google to get
 *      our app's JWT.
 *   4. Persist that JWT in Zustand and bounce to /dashboard.
 */

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { useMutation } from '@apollo/client/react'
import { GoogleAuthMutationDoc } from '@/lib/graphql/auth'

function CallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()
  const called = useRef(false)
  const [googleAuth] = useMutation(GoogleAuthMutationDoc)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const code = searchParams.get('code')
    const errorDescription = searchParams.get('error_description')

    if (errorDescription) {
      router.replace(`/login?error=oauth_failed&reason=${encodeURIComponent(errorDescription).slice(0, 200)}`)
      return
    }
    if (!code) {
      router.replace('/login?error=missing_code')
      return
    }

    const supabase = createSupabaseClient()
    supabase.auth
      .exchangeCodeForSession(code)
      .then(async ({ data, error }) => {
        if (error || !data.session?.access_token) {
          const reason = error?.message ?? 'no_session'
          router.replace(`/login?error=oauth_failed&reason=${encodeURIComponent(reason).slice(0, 200)}`)
          return
        }
        try {
          const res = await googleAuth({
            variables: { input: { accessToken: data.session.access_token } },
          })
          const payload = res.data?.googleAuth
          if (!payload) throw new Error('Empty googleAuth response')
          setAuth(
            payload.user,
            payload.token,
            payload.active_membership ?? null,
            payload.memberships ?? [],
          )
          router.replace('/dashboard')
        } catch (err: unknown) {
          const reason =
            err instanceof Error ? err.message : 'backend_auth_failed'
          router.replace(`/login?error=oauth_failed&reason=${encodeURIComponent(reason).slice(0, 200)}`)
        }
      })
      .catch((err: unknown) => {
        const reason =
          err instanceof Error ? err.message : 'exchange_threw'
        router.replace(`/login?error=oauth_failed&reason=${encodeURIComponent(reason).slice(0, 200)}`)
      })
  }, [router, searchParams, setAuth, googleAuth])

  return null
}

export default function AuthCallbackPage() {
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
        <CallbackInner />
      </Suspense>
    </div>
  )
}
