import { describe, expect, it } from 'vitest'
import { useAuthStore } from '../auth.store'

describe('auth store persistence', () => {
  it('never writes the access token to storage', () => {
    useAuthStore
      .getState()
      .setAuth({ id: 'u', email: 'a@b.c', name: 'A', role: 'lawyer' }, 'secret-access-token', null, [], ['*'])
    const raw = localStorage.getItem('ll:auth') ?? ''
    expect(raw).not.toContain('secret-access-token')
    expect(JSON.parse(raw).state.isAuthenticated).toBe(true)
  })

  it('discards a token persisted by an older build', async () => {
    useAuthStore.setState({ token: null, isAuthenticated: false })
    localStorage.setItem(
      'll:auth',
      JSON.stringify({ state: { user: { id: 'u' }, token: 'legacy', memberships: [] }, version: 0 }),
    )
    await useAuthStore.persist.rehydrate()
    expect(useAuthStore.getState()).toMatchObject({ token: null, isAuthenticated: false })
    await Promise.resolve()
    expect(localStorage.getItem('ll:auth') ?? '').not.toContain('legacy')
  })
})
