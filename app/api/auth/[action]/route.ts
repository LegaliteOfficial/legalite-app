/**
 * POST /api/auth/:action
 * ----------------------
 * Sign-in, refresh, firm switch and sign-out, run on the app's own server so
 * the refresh token lives only in an HttpOnly cookie. See lib/auth/bff.ts.
 *
 * Body: { input?: object, accessToken?: string } (accessToken only for the
 * actions that act on an existing session: switch-firm, accept-invitation).
 * Response: { data } with the auth payload minus refresh_token, or
 * { error: { message, code } } with a matching HTTP status.
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  ACTIONS,
  REFRESH_COOKIE_MAX_AGE,
  REFRESH_COOKIE_PATH,
  callUpstream,
  clientIp,
  isSameOrigin,
  refreshCookieName,
  stripRefreshToken,
} from '@/lib/auth/bff'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE = { 'cache-control': 'no-store' }

function fail(message: string, code: string, status: number) {
  return NextResponse.json({ error: { message, code } }, { status, headers: NO_STORE })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params
  const spec = Object.prototype.hasOwnProperty.call(ACTIONS, action) ? ACTIONS[action] : undefined
  if (!spec) return fail('Not found.', 'NOT_FOUND', 404)
  if (!isSameOrigin(request)) return fail('Request refused.', 'FORBIDDEN', 403)

  let body: { input?: Record<string, unknown>; accessToken?: string } = {}
  try {
    const text = await request.text()
    if (text) body = JSON.parse(text) as typeof body
  } catch {
    return fail('Request refused.', 'BAD_REQUEST', 400)
  }

  const jar = await cookies()
  const name = refreshCookieName()
  const production = process.env.NODE_ENV === 'production'
  const clearCookie = () =>
    jar.set(name, '', { httpOnly: true, secure: production, sameSite: 'strict', path: REFRESH_COOKIE_PATH, maxAge: 0 })

  let variables: Record<string, unknown> | undefined
  if (spec.usesCookie) {
    const refreshToken = jar.get(name)?.value
    if (!refreshToken) {
      if (action === 'logout') return NextResponse.json({ data: true }, { headers: NO_STORE })
      return fail('Your session has ended. Please sign in again.', 'UNAUTHENTICATED', 401)
    }
    variables = { input: { refresh_token: refreshToken } }
  } else {
    if (!body.input || typeof body.input !== 'object') return fail('Request refused.', 'BAD_REQUEST', 400)
    variables = { input: body.input }
  }

  const result = await callUpstream({
    spec,
    variables,
    bearer: spec.bearer ? body.accessToken ?? null : null,
    ip: clientIp(request),
    userAgent: request.headers.get('user-agent'),
  })

  if (action === 'logout') {
    // Signing out always clears the cookie, even if the API was unreachable.
    clearCookie()
    return NextResponse.json({ data: true }, { headers: NO_STORE })
  }

  if (!result.ok) {
    if (action === 'refresh' && result.error.status === 401) clearCookie()
    return fail(result.error.message, result.error.code, result.error.status)
  }

  const payload = result.data as { refresh_token?: string | null }
  if (payload.refresh_token) {
    jar.set(name, payload.refresh_token, {
      httpOnly: true,
      secure: production,
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_COOKIE_MAX_AGE,
    })
  }
  return NextResponse.json({ data: stripRefreshToken(payload) }, { headers: NO_STORE })
}
