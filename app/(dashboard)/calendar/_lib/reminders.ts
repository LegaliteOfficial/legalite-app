/**
 * Pure reminder helpers — offset translation, ID generation, email
 * parsing, and toast-summary formatting.
 */

import { REMINDER_OFFSETS, type Reminder, type ReminderOffsetKey } from '../_types'

/** Resolve an offset key to its minute value. Defaults to 15. */
export function offsetMinutes(key: ReminderOffsetKey): number {
  return REMINDER_OFFSETS.find((o) => o.key === key)?.minutes ?? 15
}

/** Pick the nearest offset key for a given day count (edit prefill). */
export function daysToOffsetKey(
  days: number | null | undefined,
): ReminderOffsetKey {
  if (days == null) return '15m'
  if (days >= 7) return '1w'
  if (days >= 2) return '2d'
  if (days >= 1) return '1d'
  // Sub-day reminders were stored as `0` in the legacy column.
  return '15m'
}

export function newReminderId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `rem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Strict-ish email parser. Splits a comma- or newline-separated string
 * into trimmed entries, drops blanks. Each entry is validated against
 * a minimal regex — strict enough to catch typos, loose enough not to
 * reject legitimate addresses.
 */
export function parseEmails(raw: string): { valid: string[]; invalid: string[] } {
  const EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/
  const valid: string[] = []
  const invalid: string[] = []
  for (const piece of raw.split(/[,\n]/)) {
    const trimmed = piece.trim()
    if (!trimmed) continue
    if (EMAIL_RE.test(trimmed)) valid.push(trimmed)
    else invalid.push(trimmed)
  }
  return { valid, invalid }
}

/**
 * Compact summary of the configured reminders, used in the success
 * toast. Examples:
 *   - 1 push reminder
 *   - 1 push + 1 email reminder (to 2 recipients)
 */
export function summariseReminders(reminders: Reminder[]): string | null {
  if (reminders.length === 0) return null
  let push = 0
  let email = 0
  let totalEmails = 0
  for (const r of reminders) {
    if (r.channel === 'email') {
      email++
      totalEmails += parseEmails(r.emails).valid.length
    } else {
      push++
    }
  }
  if (email === 0) return `${push} push reminder${push === 1 ? '' : 's'} set`
  if (push === 0) {
    return `${email} email reminder${email === 1 ? '' : 's'} to ${totalEmails} recipient${totalEmails === 1 ? '' : 's'}`
  }
  return `${push} push + ${email} email reminder${email === 1 ? '' : 's'} (to ${totalEmails} recipient${totalEmails === 1 ? '' : 's'})`
}
