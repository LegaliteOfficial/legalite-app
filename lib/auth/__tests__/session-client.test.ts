import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth.store'
import { AuthRequestError, callAuth, getAccessToken, refreshAccessToken } from '../session-client'

const user = { id: 'u', email: 'a@b.c', name: 'A', role: 'lawyer' }
const okPayload = (token: string) =>
  Response.json({
    data: { token, access_token_expires_at: new Date(Date.now() + 900_000).toISOString(), user, permissions: ['*'] },
  })

describe('session client', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, accessTokenExpiresAt: null, isAuthenticated: false })
  })
  afterEach(() => vi.restoreAllMocks())

  it('callAuth turns an error body into AuthRequestError', async () => {
    const f = vi.fn(async () =>
      Response.json({ error: { message: 'Invalid credentials', code: 'UNAUTHENTICATED' } }, { status: 401 }),
    )
    await expect(callAuth('login', { input: {} }, f as unknown as typeof fetch)).rejects.toMatchObject({
      message: 'Invalid credentials',
      code: 'UNAUTHENTICATED',
      status: 401,
    })
  })

  it('callAuth reports a network failure', async () => {
    const f = vi.fn(async () => {
      throw new TypeError('offline')
    })
    await expect(callAuth('refresh', {}, f as unknown as typeof fetch)).rejects.toBeInstanceOf(AuthRequestError)
  })

  it('runs one refresh at a time and stores the token in memory', async () => {
    useAuthStore.setState({ isAuthenticated: true })
    const f = vi.fn(async () => okPayload('fresh'))
    const [a, b] = await Promise.all([
      refreshAccessToken(f as unknown as typeof fetch),
      refreshAccessToken(f as unknown as typeof fetch),
    ])
    expect(a).toBe('ok')
    expect(b).toBe('ok')
    expect(f).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().token).toBe('fresh')
    expect(localStorage.getItem('ll:auth') ?? '').not.toContain('fresh')
  })

  it('clears the local sign-in when the session has ended', async () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'old', user })
    const f = vi.fn(async () => Response.json({ error: { message: 'ended', code: 'UNAUTHENTICATED' } }, { status: 401 }))
    expect(await refreshAccessToken(f as unknown as typeof fetch)).toBe('ended')
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: false, token: null, user: null })
  })

  it('keeps the sign-in when the API is unreachable', async () => {
    useAuthStore.setState({ isAuthenticated: true, user })
    const f = vi.fn(async () => {
      throw new TypeError('offline')
    })
    expect(await refreshAccessToken(f as unknown as typeof fetch)).toBe('unavailable')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('getAccessToken returns a token that is not about to expire', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'live',
      accessTokenExpiresAt: new Date(Date.now() + 600_000).toISOString(),
    })
    expect(await getAccessToken()).toBe('live')
    expect(spy).not.toHaveBeenCalled()
  })

  it('getAccessToken renews a token close to expiry', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(okPayload('renewed'))
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'stale',
      accessTokenExpiresAt: new Date(Date.now() + 5_000).toISOString(),
    })
    expect(await getAccessToken()).toBe('renewed')
  })

  it('getAccessToken is null when signed out', async () => {
    expect(await getAccessToken()).toBeNull()
  })
})
