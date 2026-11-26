'use client'

/**
 * Browser half of sign-in.
 *
 * The access token is kept in memory only (the auth store does not persist
 * it). Reloading the page, or the token nearing expiry, swaps the HttpOnly
 * refresh cookie for a new access token through /api/auth/refresh. Only one
 * refresh runs at a time per tab; tabs racing each other are covered by the
 * API's short grace window.
 */

import { useAuthStore, type FirmMembership, type User } from '@/stores/auth.store'

export interface AuthPayload {
  token: string
  access_token_expires_at?: string | null
  user: User
  active_membership?: FirmMembership | null
  memberships?: FirmMembership[] | null
  permissions?: string[] | null
}

export class AuthRequestError extends Error {
  readonly code: string
  readonly status: number
  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'AuthRequestError'
    this.code = code
    this.status = status
  }
}

export type AuthAction =
  | 'login'
  | 'register'
  | 'accept-invite'
  | 'google'
  | 'accept-invitation'
  | 'switch-firm'
  | 'refresh'
  | 'logout'

/** Refresh this long before the access token expires. */
const REFRESH_LEAD_MS = 60_000

export async function callAuth<T = AuthPayload>(
  action: AuthAction,
  body: { input?: unknown; accessToken?: string | null } = {},
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  let res: Response
  try {
    res = await fetchImpl(`/api/auth/${action}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: action === 'logout',
    })
  } catch {
    throw new AuthRequestError(
      'We could not reach Legalite. Check your connection and try again.',
      'UNAVAILABLE',
      0,
    )
  }
  type Body = { data?: T; error?: { message?: string; code?: string } }
  const json = (await res.json().catch(() => null)) as Body | null
  if (!res.ok || !json || json.data === undefined) {
    throw new AuthRequestError(
      json?.error?.message ?? 'Something went wrong. Please try again.',
      json?.error?.code ?? 'UNAVAILABLE',
      res.status,
    )
  }
  return json.data
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRefresh(expiresAt: string | null | undefined) {
  if (typeof window === 'undefined') return
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = null
  if (!expiresAt) return
  const delay = new Date(expiresAt).getTime() - Date.now() - REFRESH_LEAD_MS
  refreshTimer = setTimeout(() => void refreshAccessToken(), Math.max(delay, 5_000))
}

export function cancelScheduledRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = null
}

/** Store a fresh sign-in or refresh result and plan the next refresh. */
export function applyAuthPayload(payload: AuthPayload) {
  useAuthStore
    .getState()
    .setAuth(
      payload.user,
      payload.token,
      payload.active_membership ?? null,
      payload.memberships ?? [],
      payload.permissions ?? [],
      payload.access_token_expires_at ?? null,
    )
  scheduleRefresh(payload.access_token_expires_at)
}

export type RefreshOutcome = 'ok' | 'ended' | 'unavailable'

let inFlight: Promise<RefreshOutcome> | null = null

/**
 * Get a new access token from the refresh cookie. 'ended' means the session
 * is gone (signed out elsewhere, expired, revoked) and the local sign-in has
 * been cleared; 'unavailable' means the API could not be reached.
 */
export function refreshAccessToken(fetchImpl: typeof fetch = fetch): Promise<RefreshOutcome> {
  if (inFlight) return inFlight
  inFlight = (async (): Promise<RefreshOutcome> => {
    try {
      applyAuthPayload(await callAuth('refresh', {}, fetchImpl))
      return 'ok'
    } catch (err) {
      if (err instanceof AuthRequestError && (err.status === 401 || err.status === 403)) {
        cancelScheduledRefresh()
        useAuthStore.getState().clearLocal()
        return 'ended'
      }
      return 'unavailable'
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}

/**
 * The current access token, refreshed first when it is missing or about to
 * expire. Null when not signed in or the session has ended.
 */
export async function getAccessToken(): Promise<string | null> {
  const { token, accessTokenExpiresAt, isAuthenticated } = useAuthStore.getState()
  const fresh =
    token &&
    (!accessTokenExpiresAt || new Date(accessTokenExpiresAt).getTime() - Date.now() > 15_000)
  if (fresh) return token
  if (!isAuthenticated) return null
  const outcome = await refreshAccessToken()
  return outcome === 'ok' ? useAuthStore.getState().token : token
}

/** End this session on the server and clear the local sign-in. */
export async function signOut(): Promise<void> {
  cancelScheduledRefresh()
  try {
    await callAuth('logout')
  } catch {
    // The cookie is cleared server-side whenever the route is reached; a
    // failure here still signs the browser out locally.
  }
}
