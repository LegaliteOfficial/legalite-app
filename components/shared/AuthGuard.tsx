'use client'

/**
 * AuthGuard
 * ---------
 * Client-side guard for dashboard routes.
 *
 * The auth token lives in localStorage (via Zustand `persist`), so we can't
 * gate this in Next.js middleware (which runs on the edge with no DOM).
 * Instead we mount the guard at the layout level and:
 *
 *  1. Wait for Zustand `persist` to hydrate from localStorage using its
 *     built-in `useAuthStore.persist.hasHydrated()` reactive hook —
 *     no manual setHydrated effect (React 19 lint flags that).
 *  2. If no token after hydration, redirect to /login.
 *  3. If a token IS present, validate it once via `GET /auth/me`.
 *     - Only a real `401 Unauthorized` clears the token (token genuinely
 *       invalid: signed by a rotated JWT_SECRET, deleted user, etc.).
 *     - Other errors (500 from a cold backend, network, CORS hiccup) are
 *       treated as "token presumed valid" so a transient API blip doesn't
 *       bounce the user out on every refresh.
 *  4. Render a centred loader until we know the auth status — prevents a
 *     flash of dashboard content for unauthenticated visitors.
 */

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'

/** Subscribe to Zustand persist hydration without setState-in-effect. */
function useStoreHydration(): boolean {
  return useSyncExternalStore(
    (cb) => useAuthStore.persist.onFinishHydration(cb),
    () => useAuthStore.persist.hasHydrated(),
    () => false, // server snapshot — always not hydrated on the server
  )
}

// DEV ONLY — bypass auth while Supabase is unreachable. Remove the env var
// (.env.local: NEXT_PUBLIC_DEV_BYPASS_AUTH) once real auth works.
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  if (DEV_BYPASS) return <>{children}</>
  return <RealAuthGuard>{children}</RealAuthGuard>
}

function RealAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, token, logout } = useAuthStore()
  const hydrated = useStoreHydration()
  // Track which token we've already validated against the API. When this
  // matches the current token we know the token is good. Setting state
  // happens only inside the async .then/.catch (external system callbacks)
  // so React 19's "no setState in effect body" rule is satisfied.
  const [validatedToken, setValidatedToken] = useState<string | null>(null)

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated || !token) return // missing token → handled by redirect effect below
    if (validatedToken === token) return // already validated this exact token
    let cancelled = false
    api
      .get('/auth/me')
      .then(() => {
        if (!cancelled) setValidatedToken(token)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const status = isAxiosError(err) ? err.response?.status : undefined
        if (status === 401) {
          // Token is genuinely invalid → clear it.
          logout()
        } else {
          // Network error, 500, CORS, cold start — assume token still valid
          // and let the user proceed. They'll see real errors on the next
          // failed action and can re-login then if it's actually broken.
          setValidatedToken(token)
        }
      })
    return () => { cancelled = true }
  }, [hydrated, isAuthenticated, token, validatedToken, logout])

  // Redirect to login when we've finished hydrating and there's no token.
  useEffect(() => {
    if (!hydrated) return
    if (isAuthenticated && token) return
    const next = pathname && pathname !== '/login' ? `?next=${encodeURIComponent(pathname)}` : ''
    router.replace(`/login${next}`)
  }, [hydrated, isAuthenticated, token, pathname, router])

  const isValid = isAuthenticated && token && validatedToken === token
  if (!hydrated || !isValid) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: 'var(--cream)' }}
      >
        <div
          className="h-8 w-8 rounded-full animate-spin"
          style={{
            border: '3px solid rgba(201,151,43,0.2)',
            borderTopColor: 'var(--gold)',
          }}
        />
      </div>
    )
  }

  return <>{children}</>
}
