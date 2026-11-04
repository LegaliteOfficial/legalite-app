import { describe, it, expect } from 'vitest'
import { SOCIAL_ACCOUNTS, SOCIAL_PROFILE_URLS } from '../social-links'

/**
 * These guard the shape of the list rather than its contents. A handle is
 * normally added by pasting a URL straight out of the browser, which brings
 * a `/posts/` suffix or a share token with it, and the broken LinkedIn URL
 * these replaced went unnoticed in production precisely because nothing
 * ever looked at it.
 */
describe('SOCIAL_ACCOUNTS', () => {
  it('has at least one account', () => {
    expect(SOCIAL_ACCOUNTS.length).toBeGreaterThan(0)
  })

  it.each(SOCIAL_ACCOUNTS)('$label is an https URL', ({ href }) => {
    expect(() => new URL(href)).not.toThrow()
    expect(new URL(href).protocol).toBe('https:')
  })

  it.each(SOCIAL_ACCOUNTS)('$label carries no share token', ({ href }) => {
    // ?cplk= from Instagram, ?igsh= from an Instagram app share, and
    // ?trk= / ?originalSubdomain= from LinkedIn.
    expect(new URL(href).search).toBe('')
  })

  it.each(SOCIAL_ACCOUNTS)('$label points at the profile, not a sub-view', ({ href }) => {
    // /posts/, /about/, /featured/ all land somewhere inside the profile
    // instead of on it.
    expect(new URL(href).pathname).not.toMatch(
      /\/(posts|about|featured|reels|tagged)\/?$/,
    )
  })

  it.each(SOCIAL_ACCOUNTS)('$label has a local icon asset path', ({ icon }) => {
    expect(icon.startsWith('/')).toBe(true)
    expect(icon.endsWith('.svg')).toBe(true)
  })

  it('has no duplicate labels', () => {
    const labels = SOCIAL_ACCOUNTS.map((a) => a.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('has no duplicate URLs', () => {
    const urls = SOCIAL_ACCOUNTS.map((a) => a.href)
    expect(new Set(urls).size).toBe(urls.length)
  })
})

describe('SOCIAL_PROFILE_URLS', () => {
  it('mirrors the account list, so sameAs cannot drift out of step', () => {
    expect(SOCIAL_PROFILE_URLS).toEqual(SOCIAL_ACCOUNTS.map((a) => a.href))
  })
})
