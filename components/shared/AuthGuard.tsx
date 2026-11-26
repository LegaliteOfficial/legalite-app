'use client'

/**
 * AuthGuard
 * ---------
 * Client-side guard for dashboard routes.
 *
 * The access token lives in memory only; the refresh token is an HttpOnly
 * cookie the page cannot read. The store persists just a "this browser is
 * signed in" flag, so after a reload the guard:
 *
 *  1. Waits for the Zustand store to hydrate.
 *  2. Not signed in: redirects to /login.
 *  3. Signed in but no access token yet: asks /api/auth/refresh for one.
 *     - Session ended (signed out elsewhere, expired, revoked): the local
 *       sign-in is cleared and the redirect in step 2 runs.
 *     - API unreachable (cold start, network): shows the loader and tries
 *       again shortly, so a blip does not sign anyone out.
 *  4. Renders a centred loader until there is a token, so signed-out
 *     visitors never see a flash of dashboard content.
 */

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { refreshAccessToken } from '@/lib/auth/session-client'

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

const RETRY_MS = 5_000

export function AuthGuard({ children }: { children: React.ReactNode }) {
  if (DEV_BYPASS) return <>{children}</>
  return <RealAuthGuard>{children}</RealAuthGuard>
}

function RealAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const token = useAuthStore((s) => s.token)
  const hydrated = useStoreHydration()
  const [attempt, setAttempt] = useState(0)
  const [unreachable, setUnreachable] = useState(false)

  // Signed in but no access token in memory (fresh page load): get one.
  useEffect(() => {
    if (!hydrated || !isAuthenticated || token) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    void refreshAccessToken().then((outcome) => {
      if (cancelled) return
      setUnreachable(outcome === 'unavailable')
      if (outcome === 'unavailable') {
        timer = setTimeout(() => setAttempt((n) => n + 1), RETRY_MS)
      }
    })
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [hydrated, isAuthenticated, token, attempt])

  // Redirect to login when we've finished hydrating and there's no sign-in.
  useEffect(() => {
    if (!hydrated || isAuthenticated) return
    const next = pathname && pathname !== '/login' ? `?next=${encodeURIComponent(pathname)}` : ''
    router.replace(`/login${next}`)
  }, [hydrated, isAuthenticated, pathname, router])

  if (!hydrated || !isAuthenticated || !token) {
    return (
      <div
        className="flex h-screen flex-col items-center justify-center gap-4"
        style={{ background: 'var(--cream)' }}
      >
        <div
          className="h-8 w-8 rounded-full animate-spin"
          style={{
            border: '3px solid rgba(201,151,43,0.2)',
            borderTopColor: 'var(--gold)',
          }}
        />
        {unreachable && isAuthenticated && (
          <p className="text-sm text-muted-foreground">
            We could not reach Legalite. Trying again...
          </p>
        )}
      </div>
    )
  }

  return <>{children}</>
}
