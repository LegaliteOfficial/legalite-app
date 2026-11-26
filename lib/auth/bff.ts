/**
 * Server-side half of sign-in (used only by app/api/auth/[action]/route.ts).
 *
 * The browser never sees the refresh token. These routes call the API on the
 * browser's behalf, put the refresh token in an HttpOnly cookie scoped to
 * /api/auth, and hand the page back only the short-lived access token. A
 * script injected into the page can therefore steal at most 15 minutes of
 * access, and cannot keep a session alive on its own.
 *
 * Each action has a fixed GraphQL document, so the route cannot be used to
 * send arbitrary queries with the app server's trust.
 */

export const REFRESH_COOKIE_DEV = 'll_rt'
/** `__Secure-` makes browsers refuse the cookie unless it is Secure. */
export const REFRESH_COOKIE_PROD = '__Secure-ll_rt'
export const REFRESH_COOKIE_PATH = '/api/auth'
/** Matches the API's absolute session lifetime (SESSION_MAX_AGE_MS). */
export const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60

export const BFF_SECRET_HEADER = 'x-legalite-bff'
export const BFF_CLIENT_IP_HEADER = 'x-legalite-client-ip'
export const BFF_CLIENT_UA_HEADER = 'x-legalite-client-ua'

const PAYLOAD = /* GraphQL */ `
  token
  refresh_token
  access_token_expires_at
  user {
    id
    email
    name
    role
    first_name
    last_name
    gba_number
    supreme_court_enrollment_no
    practising_license_no
    digital_address
    verification_status
    created_at
  }
  active_membership { firm_id firm_name firm_slug firm_role professional_title status }
  memberships { firm_id firm_name firm_slug firm_role professional_title status }
  permissions
`

interface ActionSpec {
  /** Field the API returns the result under. */
  field: string
  query: string
  /** Needs the caller's access token (Authorization header). */
  bearer?: boolean
  /** Sends the refresh cookie instead of a request body. */
  usesCookie?: boolean
  /** Returns a Boolean, not an auth payload. */
  plain?: boolean
}

export const ACTIONS: Record<string, ActionSpec> = {
  login: {
    field: 'login',
    query: `mutation Login($input: LoginInput!) { login(input: $input) { ${PAYLOAD} } }`,
  },
  register: {
    field: 'registerOwner',
    query: `mutation RegisterOwner($input: RegisterOwnerInput!) { registerOwner(input: $input) { ${PAYLOAD} } }`,
  },
  'accept-invite': {
    field: 'acceptInvite',
    query: `mutation AcceptInvite($input: AcceptInviteInput!) { acceptInvite(input: $input) { ${PAYLOAD} } }`,
  },
  google: {
    field: 'googleAuth',
    query: `mutation GoogleAuth($input: GoogleAuthInput!) { googleAuth(input: $input) { ${PAYLOAD} } }`,
  },
  'accept-invitation': {
    field: 'acceptInvitation',
    bearer: true,
    query: `mutation AcceptInvitation($input: LookupInvitationInput!) { acceptInvitation(input: $input) { ${PAYLOAD} } }`,
  },
  'switch-firm': {
    field: 'switchFirm',
    bearer: true,
    query: `mutation SwitchFirm($input: SwitchFirmInput!) { switchFirm(input: $input) { ${PAYLOAD} } }`,
  },
  refresh: {
    field: 'refreshSession',
    usesCookie: true,
    query: `mutation RefreshSession($input: RefreshSessionInput!) { refreshSession(input: $input) { ${PAYLOAD} } }`,
  },
  logout: {
    field: 'logout',
    usesCookie: true,
    plain: true,
    query: `mutation Logout($input: LogoutInput) { logout(input: $input) }`,
  },
}

export function refreshCookieName(production = process.env.NODE_ENV === 'production'): string {
  return production ? REFRESH_COOKIE_PROD : REFRESH_COOKIE_DEV
}

export function graphqlUrl(): string {
  return (
    process.env.LEGALITE_API_GRAPHQL_URL ??
    process.env.NEXT_PUBLIC_GRAPHQL_URL ??
    'https://legalite-backend-production.up.railway.app/graphql'
  )
}

/**
 * The request must come from a page on this app. Together with the
 * SameSite=Strict cookie this stops another site from making a signed-in
 * browser call these routes.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return false
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (!host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/**
 * The visitor's IP as the hosting platform reports it. The platform's proxy
 * writes the left-most X-Forwarded-For entry, so only the first is used.
 */
export function clientIp(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for')
  const first = xff?.split(',')[0]?.trim()
  return first || req.headers.get('x-real-ip') || null
}

export interface UpstreamError {
  message: string
  code: string
  status: number
}

const GENERIC = 'Something went wrong. Please try again.'

function statusFor(code: string): number {
  switch (code) {
    case 'UNAUTHENTICATED':
      return 401
    case 'FORBIDDEN':
      return 403
    case 'TOO_MANY_REQUESTS':
      return 429
    case 'BAD_REQUEST':
    case 'BAD_USER_INPUT':
    case 'GRAPHQL_VALIDATION_FAILED':
      return 400
    case 'NOT_FOUND':
      return 404
    default:
      return 502
  }
}

/** Read the first GraphQL error into a status the browser can act on. */
export function upstreamError(body: unknown): UpstreamError | null {
  const errors = (body as { errors?: Array<{ message?: string; extensions?: { code?: string } }> })
    ?.errors
  if (!errors?.length) return null
  const first = errors[0]
  const code = first.extensions?.code ?? 'INTERNAL_SERVER_ERROR'
  // Class-validator errors arrive as BAD_REQUEST with the message we want.
  return { message: first.message || GENERIC, code, status: statusFor(code) }
}

/** Drop the refresh token before the payload goes to the page. */
export function stripRefreshToken<T extends { refresh_token?: unknown }>(
  payload: T,
): Omit<T, 'refresh_token'> {
  const copy = { ...payload }
  delete copy.refresh_token
  return copy
}

export interface CallUpstreamOptions {
  spec: ActionSpec
  variables: Record<string, unknown> | undefined
  bearer?: string | null
  ip: string | null
  userAgent: string | null
  fetchImpl?: typeof fetch
}

export async function callUpstream({
  spec,
  variables,
  bearer,
  ip,
  userAgent,
  fetchImpl = fetch,
}: CallUpstreamOptions): Promise<{ ok: true; data: unknown } | { ok: false; error: UpstreamError }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  const secret = process.env.BFF_SHARED_SECRET
  if (secret) {
    headers[BFF_SECRET_HEADER] = secret
    if (ip) headers[BFF_CLIENT_IP_HEADER] = ip
    if (userAgent) headers[BFF_CLIENT_UA_HEADER] = userAgent.slice(0, 300)
  }
  if (bearer) headers.authorization = `Bearer ${bearer}`

  let res: Response
  try {
    res = await fetchImpl(graphqlUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: spec.query, variables }),
      cache: 'no-store',
    })
  } catch {
    return {
      ok: false,
      error: { message: 'We could not reach Legalite. Check your connection and try again.', code: 'UNAVAILABLE', status: 503 },
    }
  }

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // Non-JSON (proxy error page). Fall through to the generic error.
  }
  const err = upstreamError(body)
  if (err) return { ok: false, error: err }
  const data = (body as { data?: Record<string, unknown> } | null)?.data?.[spec.field]
  if (data === undefined || data === null) {
    return {
      ok: false,
      error: { message: GENERIC, code: 'UNAVAILABLE', status: res.status >= 500 ? 503 : 502 },
    }
  }
  return { ok: true, data }
}
