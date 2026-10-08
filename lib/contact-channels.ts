/**
 * Contact channels — how we reach a person from a contact record.
 *
 * Every outbound action (call, WhatsApp, email) goes through here rather
 * than building URLs at the call site, for two reasons:
 *
 *   1. Phone numbers in this database are not in one format. Real records
 *      hold "+233 20 555 0101", "+233201234567" and "024 123 4567". A
 *      `tel:` link tolerates all three; a WhatsApp deep link does not — it
 *      needs bare international digits, and silently opens an empty chat
 *      if given anything else. Normalisation lives in one place so that
 *      failure cannot creep back in per button.
 *
 *   2. WhatsApp is a deep link today. Moving to the Business API later
 *      changes how a message is sent but not what the caller asks for, so
 *      callers depend on `sendWhatsApp` rather than on wa.me.
 */

/** Ghana. Numbers with no country information are assumed to be local. */
export const DEFAULT_COUNTRY_CODE = '233'

/**
 * Reduces a stored phone number to bare international digits.
 *
 * Returns null when the input cannot be read as a phone number, so callers
 * can disable the control instead of opening a broken link.
 *
 * Known limitation: a ten digit number with no country code and no leading
 * zero is assumed local. There is no country field on the contact to
 * disambiguate a foreign national number, and guessing local is right far
 * more often for a Ghanaian firm.
 */
export function normalisePhone(
  raw: string | null | undefined,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): string | null {
  if (!raw) return null

  let value = raw.trim()
  if (value.startsWith('+')) value = value.slice(1)
  else if (value.startsWith('00')) value = value.slice(2)

  const digits = value.replace(/\D/g, '')
  if (!digits) return null

  // Already international for this country, e.g. 233201234567.
  if (digits.startsWith(countryCode) && digits.length >= countryCode.length + 8) {
    return digits
  }

  // National format carrying the trunk prefix, e.g. 0241234567.
  if (digits.startsWith('0')) {
    const national = digits.slice(1)
    return national.length >= 8 ? countryCode + national : null
  }

  // Bare national number with no trunk prefix, e.g. 241234567.
  if (digits.length >= 8 && digits.length <= 10) return countryCode + digits

  // Long enough to be another country's international number: leave it.
  if (digits.length > 10 && digits.length <= 15) return digits

  return null
}

/** Display form for a Ghanaian number: +233 24 123 4567. */
export function formatPhoneForDisplay(
  raw: string | null | undefined,
): string | null {
  const e164 = normalisePhone(raw)
  if (!e164) return null
  if (!e164.startsWith(DEFAULT_COUNTRY_CODE)) return `+${e164}`
  const rest = e164.slice(DEFAULT_COUNTRY_CODE.length)
  if (rest.length !== 9) return `+${e164}`
  return `+${DEFAULT_COUNTRY_CODE} ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`
}

export type ChannelKind = 'call' | 'whatsapp' | 'email'

/** True when the contact has enough detail for this channel to work. */
export function canUseChannel(
  kind: ChannelKind,
  contact: { phone?: string | null; email?: string | null },
): boolean {
  if (kind === 'email') return Boolean(contact.email?.trim())
  return normalisePhone(contact.phone) !== null
}

export function buildTelUrl(phone: string | null | undefined): string | null {
  const e164 = normalisePhone(phone)
  return e164 ? `tel:+${e164}` : null
}

/**
 * wa.me requires bare international digits with no plus and no spaces.
 * A prefilled message is optional; WhatsApp shows it in the composer and
 * the sender still has to press send, so nothing leaves the device on its
 * own.
 */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message?: string,
): string | null {
  const e164 = normalisePhone(phone)
  if (!e164) return null
  const base = `https://wa.me/${e164}`
  return message?.trim()
    ? `${base}?text=${encodeURIComponent(message.trim())}`
    : base
}

export function buildMailtoUrl(
  email: string | null | undefined,
  opts: { subject?: string; body?: string } = {},
): string | null {
  const address = email?.trim()
  if (!address) return null
  const params = new URLSearchParams()
  if (opts.subject?.trim()) params.set('subject', opts.subject.trim())
  if (opts.body?.trim()) params.set('body', opts.body.trim())
  const qs = params.toString()
  return `mailto:${address}${qs ? `?${qs}` : ''}`
}

export interface ChannelTarget {
  phone?: string | null
  email?: string | null
}

export interface ChannelResult {
  /** False when the contact is missing the detail this channel needs. */
  ok: boolean
  /** What actually happened, for the activity log. */
  kind: ChannelKind
  /** The address or number used, in canonical form. */
  target: string | null
  /** Human readable reason when ok is false. */
  reason?: string
}

/**
 * Opens a channel. Deliberately the only way the UI reaches a contact, so
 * that swapping the WhatsApp deep link for the Business API later is a
 * change inside this function rather than across every button.
 *
 * Returns what happened so the caller can write an activity record. It
 * does not log anything itself: logging needs a mutation and a contact id,
 * which are the caller's concern, and a pure URL builder stays testable.
 */
export function openChannel(
  kind: ChannelKind,
  contact: ChannelTarget,
  opts: { message?: string; subject?: string } = {},
): ChannelResult {
  if (kind === 'email') {
    const url = buildMailtoUrl(contact.email, {
      subject: opts.subject,
      body: opts.message,
    })
    if (!url) return { ok: false, kind, target: null, reason: 'No email address on this contact.' }
    window.open(url, '_self')
    return { ok: true, kind, target: contact.email!.trim() }
  }

  const e164 = normalisePhone(contact.phone)
  if (!e164) {
    return {
      ok: false,
      kind,
      target: null,
      reason: contact.phone?.trim()
        ? 'That phone number could not be read.'
        : 'No phone number on this contact.',
    }
  }

  if (kind === 'call') {
    window.open(`tel:+${e164}`, '_self')
    return { ok: true, kind, target: `+${e164}` }
  }

  // WhatsApp opens in a new tab so the user does not lose their place in
  // the app when WhatsApp Web takes over the window.
  const url = buildWhatsAppUrl(contact.phone, opts.message)!
  window.open(url, '_blank', 'noopener,noreferrer')
  return { ok: true, kind, target: `+${e164}` }
}
