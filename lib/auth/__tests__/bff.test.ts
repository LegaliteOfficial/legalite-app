// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ACTIONS,
  callUpstream,
  clientIp,
  isSameOrigin,
  refreshCookieName,
  stripRefreshToken,
  upstreamError,
} from '../bff'

const req = (headers: Record<string, string>) => new Request('http://app.test/api/auth/login', { method: 'POST', headers })

describe('isSameOrigin', () => {
  it('accepts a request from a page on this host', () => {
    expect(isSameOrigin(req({ origin: 'https://app.test', host: 'app.test' }))).toBe(true)
  })
  it('refuses another site', () => {
    expect(isSameOrigin(req({ origin: 'https://evil.test', host: 'app.test' }))).toBe(false)
  })
  it('refuses a request with no Origin', () => {
    expect(isSameOrigin(req({ host: 'app.test' }))).toBe(false)
  })
  it('uses the forwarded host behind a proxy', () => {
    expect(
      isSameOrigin(req({ origin: 'https://legalite.app', host: 'internal:3000', 'x-forwarded-host': 'legalite.app' })),
    ).toBe(true)
  })
})

describe('clientIp', () => {
  it('takes the left-most forwarded address', () => {
    expect(clientIp(req({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }))).toBe('203.0.113.9')
  })
  it('falls back to x-real-ip, then null', () => {
    expect(clientIp(req({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2')
    expect(clientIp(req({}))).toBeNull()
  })
})

describe('upstreamError', () => {
  it('maps GraphQL codes to HTTP statuses', () => {
    expect(upstreamError({ errors: [{ message: 'Bad', extensions: { code: 'UNAUTHENTICATED' } }] })?.status).toBe(401)
    expect(upstreamError({ errors: [{ message: 'Slow down', extensions: { code: 'TOO_MANY_REQUESTS' } }] })).toEqual({
      message: 'Slow down',
      code: 'TOO_MANY_REQUESTS',
      status: 429,
    })
    expect(upstreamError({ errors: [{ message: 'x' }] })?.status).toBe(502)
  })
  it('returns null when there are no errors', () => {
    expect(upstreamError({ data: {} })).toBeNull()
  })
})

describe('stripRefreshToken', () => {
  it('removes the refresh token and keeps the rest', () => {
    expect(stripRefreshToken({ token: 'a', refresh_token: 'secret' })).toEqual({ token: 'a' })
  })
})

describe('refreshCookieName', () => {
  it('uses the __Secure- prefix in production', () => {
    expect(refreshCookieName(true)).toBe('__Secure-ll_rt')
    expect(refreshCookieName(false)).toBe('ll_rt')
  })
})

describe('callUpstream', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('sends the fixed document, shared secret and client details', async () => {
    vi.stubEnv('BFF_SHARED_SECRET', 'x'.repeat(40))
    vi.stubEnv('LEGALITE_API_GRAPHQL_URL', 'http://api.test/graphql')
    const fetchImpl = vi.fn(async () => Response.json({ data: { login: { token: 't' } } }))
    const out = await callUpstream({
      spec: ACTIONS.login,
      variables: { input: { email: 'a', password: 'b' } },
      ip: '203.0.113.9',
      userAgent: 'UA',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(out).toEqual({ ok: true, data: { token: 't' } })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://api.test/graphql')
    const headers = init.headers as Record<string, string>
    expect(headers['x-legalite-bff']).toBe('x'.repeat(40))
    expect(headers['x-legalite-client-ip']).toBe('203.0.113.9')
    expect(headers['x-legalite-client-ua']).toBe('UA')
    expect(headers.authorization).toBeUndefined()
    expect(JSON.parse(init.body as string).query).toContain('refresh_token')
  })

  it('does not forward client details without a secret', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ data: { switchFirm: { token: 't' } } }))
    await callUpstream({
      spec: ACTIONS['switch-firm'],
      variables: { input: { firmId: 'f' } },
      bearer: 'access',
      ip: '1.2.3.4',
      userAgent: 'UA',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    const headers = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>
    expect(headers['x-legalite-client-ip']).toBeUndefined()
    expect(headers.authorization).toBe('Bearer access')
  })

  it('reports an unreachable API as 503', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed')
    })
    const out = await callUpstream({
      spec: ACTIONS.refresh,
      variables: {},
      ip: null,
      userAgent: null,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.error.status).toBe(503)
  })
})
