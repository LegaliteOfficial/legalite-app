import { describe, it, expect } from 'vitest'
import {
  normalisePhone,
  formatPhoneForDisplay,
  buildWhatsAppUrl,
  buildTelUrl,
  buildMailtoUrl,
  canUseChannel,
} from '../contact-channels'

describe('normalisePhone', () => {
  // The three shapes that actually appear in this database.
  it('accepts spaced international', () => {
    expect(normalisePhone('+233 20 555 0101')).toBe('233205550101')
  })
  it('accepts compact international', () => {
    expect(normalisePhone('+233201234567')).toBe('233201234567')
  })
  it('accepts national with trunk prefix', () => {
    expect(normalisePhone('024 123 4567')).toBe('233241234567')
  })

  it('accepts 00 as an international prefix', () => {
    expect(normalisePhone('00233241234567')).toBe('233241234567')
  })
  it('accepts a bare national number', () => {
    expect(normalisePhone('241234567')).toBe('233241234567')
  })
  it('strips punctuation', () => {
    expect(normalisePhone('(024) 123-4567')).toBe('233241234567')
  })
  it('keeps a foreign international number as given', () => {
    expect(normalisePhone('+1 415 555 1234')).toBe('14155551234')
  })

  it('rejects empty and unusable input', () => {
    expect(normalisePhone('')).toBeNull()
    expect(normalisePhone(null)).toBeNull()
    expect(normalisePhone(undefined)).toBeNull()
    expect(normalisePhone('n/a')).toBeNull()
    expect(normalisePhone('12345')).toBeNull()
    expect(normalisePhone('0123')).toBeNull()
  })
})

describe('formatPhoneForDisplay', () => {
  it('groups a Ghanaian number', () => {
    expect(formatPhoneForDisplay('0241234567')).toBe('+233 24 123 4567')
  })
  it('falls back to plain international for other countries', () => {
    expect(formatPhoneForDisplay('+1 415 555 1234')).toBe('+14155551234')
  })
  it('returns null when unusable', () => {
    expect(formatPhoneForDisplay('nope')).toBeNull()
  })
})

describe('buildWhatsAppUrl', () => {
  it('uses bare digits, never a plus or spaces', () => {
    expect(buildWhatsAppUrl('+233 24 123 4567')).toBe('https://wa.me/233241234567')
  })
  it('encodes a prefilled message', () => {
    expect(buildWhatsAppUrl('0241234567', 'Hello Ama & co')).toBe(
      'https://wa.me/233241234567?text=Hello%20Ama%20%26%20co',
    )
  })
  it('omits the query when the message is blank', () => {
    expect(buildWhatsAppUrl('0241234567', '   ')).toBe('https://wa.me/233241234567')
  })
  it('returns null rather than a broken link', () => {
    expect(buildWhatsAppUrl('')).toBeNull()
  })
})

describe('buildTelUrl', () => {
  it('keeps the plus for the dialler', () => {
    expect(buildTelUrl('024 123 4567')).toBe('tel:+233241234567')
  })
  it('returns null when unusable', () => {
    expect(buildTelUrl('x')).toBeNull()
  })
})

describe('buildMailtoUrl', () => {
  it('builds a plain mailto', () => {
    expect(buildMailtoUrl('ama@example.com')).toBe('mailto:ama@example.com')
  })
  it('encodes subject and body', () => {
    expect(buildMailtoUrl('ama@example.com', { subject: 'Re: Case 12', body: 'Hi Ama' })).toBe(
      'mailto:ama@example.com?subject=Re%3A+Case+12&body=Hi+Ama',
    )
  })
  it('returns null without an address', () => {
    expect(buildMailtoUrl('  ')).toBeNull()
  })
})

describe('canUseChannel', () => {
  it('requires a readable phone for call and whatsapp', () => {
    expect(canUseChannel('call', { phone: '0241234567' })).toBe(true)
    expect(canUseChannel('whatsapp', { phone: '0241234567' })).toBe(true)
    expect(canUseChannel('call', { phone: 'n/a' })).toBe(false)
    expect(canUseChannel('whatsapp', { phone: null })).toBe(false)
  })
  it('requires an email for email', () => {
    expect(canUseChannel('email', { email: 'a@b.com' })).toBe(true)
    expect(canUseChannel('email', { email: '  ' })).toBe(false)
  })
})
