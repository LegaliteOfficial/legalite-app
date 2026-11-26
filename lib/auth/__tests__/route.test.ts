// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const jar = new Map<string, { value: string; options?: Record<string, unknown> }>()
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)!.value } : undefined),
    set: (name: string, value: string, options?: Record<string, unknown>) => jar.set(name, { value, options }),
  }),
}))

import { POST } from '@/app/api/auth/[action]/route'

const call = (action: string, body: unknown, origin = 'http://app.test') =>
  POST(
    new Request(`http://app.test/api/auth/${action}`, {
      method: 'POST',
      headers: { origin, host: 'app.test', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ action }) },
  )

const payload = (refresh: string | null) => ({
  token: 'access',
  refresh_token: refresh,
  access_token_expires_at: '2030-01-01T00:00:00.000Z',
  user: { id: 'u' },
})

describe('POST /api/auth/:action', () => {
  beforeEach(() => {
    jar.clear()
    vi.restoreAllMocks()
  })

  it('sets the refresh cookie and keeps the token out of the body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ data: { login: payload('sid.secret') } }))
    const res = await call('login', { input: { email: 'a@b.c', password: 'pw' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.token).toBe('access')
    expect(json.data).not.toHaveProperty('refresh_token')
    const cookie = jar.get('ll_rt')!
    expect(cookie.value).toBe('sid.secret')
    expect(cookie.options).toMatchObject({ httpOnly: true, sameSite: 'strict', path: '/api/auth' })
  })

  it('refuses a cross-site request before calling the API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const res = await call('login', { input: {} }, 'https://evil.test')
    expect(res.status).toBe(403)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns 404 for an unknown action', async () => {
    expect((await call('constructor', {})).status).toBe(404)
    expect((await call('graphql', {})).status).toBe(404)
  })

  it('refreshes with the cookie and rotates it', async () => {
    jar.set('ll_rt', { value: 'sid.old' })
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ data: { refreshSession: payload('sid.new') } }))
    const res = await call('refresh', {})
    expect(res.status).toBe(200)
    const sent = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
    expect(sent.variables.input.refresh_token).toBe('sid.old')
    expect(jar.get('ll_rt')!.value).toBe('sid.new')
  })

  it('leaves the cookie alone when the grace path returns no new token', async () => {
    jar.set('ll_rt', { value: 'sid.current' })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ data: { refreshSession: payload(null) } }))
    await call('refresh', {})
    expect(jar.get('ll_rt')!.value).toBe('sid.current')
  })

  it('answers 401 without a cookie and clears a rejected one', async () => {
    expect((await call('refresh', {})).status).toBe(401)
    jar.set('ll_rt', { value: 'sid.stolen' })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ errors: [{ message: 'Your session has ended.', extensions: { code: 'UNAUTHENTICATED' } }] }),
    )
    const res = await call('refresh', {})
    expect(res.status).toBe(401)
    expect(jar.get('ll_rt')!.options?.maxAge).toBe(0)
  })

  it('logout revokes upstream and always clears the cookie', async () => {
    jar.set('ll_rt', { value: 'sid.secret' })
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('down'))
    const res = await call('logout', {})
    expect(res.status).toBe(200)
    expect(fetchSpy).toHaveBeenCalled()
    expect(jar.get('ll_rt')!.options?.maxAge).toBe(0)
  })

  it('passes the access token through for switch-firm', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ data: { switchFirm: payload(null) } }))
    await call('switch-firm', { input: { firmId: 'f' }, accessToken: 'acc' })
    const headers = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>
    expect(headers.authorization).toBe('Bearer acc')
  })

  it('does not send a bearer token for public actions', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ data: { login: payload('a.b') } }))
    await call('login', { input: {}, accessToken: 'acc' })
    const headers = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>
    expect(headers.authorization).toBeUndefined()
  })
})
