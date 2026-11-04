/**
 * Human readable reference codes for cases and clients.
 *
 * These are the firm's own references — the thing a partner quotes on the
 * phone. They are not the court's suit number (assigned by the registry)
 * and not the database id (a UUID nobody can read aloud).
 *
 * Both used to be typed by hand, which meant most records had none and the
 * ones that did followed no pattern. They are now generated on creation.
 *
 * Format: PP-YYYY-NNNN, e.g. LL-2026-0042.
 *   PP    entity prefix, so a code pasted into an email says what it is
 *   YYYY  year the record was opened, which is how firms file
 *   NNNN  sequence within that year, zero padded to sort correctly as text
 *
 * Cases and clients use different prefixes on purpose. They previously
 * shared "LL", so LL-0004 could have meant either, and nothing stopped a
 * case and a client carrying the same reference.
 *
 * Caveat worth knowing: the sequence is derived from the codes the client
 * can already see. Two people creating a record in the same second could
 * both compute the same next number. Only the database can settle that, so
 * when the backend assigns codes it should own this and the frontend should
 * stop sending one. The generators are deliberately pure and take the
 * existing codes as an argument so that swap is a one line change.
 */

export const CASE_CODE_PREFIX = 'LL'
export const CLIENT_CODE_PREFIX = 'CL'

/** Matches the codes this module produces, and nothing else. */
const CODE_RE = /^([A-Z]{2,5})-(\d{4})-(\d{4,})$/

export interface ParsedReferenceCode {
  prefix: string
  year: number
  sequence: number
}

export function parseReferenceCode(
  code: string | null | undefined,
): ParsedReferenceCode | null {
  if (!code) return null
  const m = CODE_RE.exec(code.trim().toUpperCase())
  if (!m) return null
  return { prefix: m[1], year: Number(m[2]), sequence: Number(m[3]) }
}

export function formatReferenceCode(
  prefix: string,
  year: number,
  sequence: number,
): string {
  return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`
}

/**
 * Next code for the given year and prefix, one past the highest already in
 * use.
 *
 * Codes that do not parse, or that belong to another entity or year, are
 * ignored rather than guessed at. That matters twice over: a legacy value
 * like "Smith matter" cannot corrupt the sequence, and the old shared
 * "LL-0004" client codes cannot be mistaken for the new series.
 */
export function nextReferenceCode(
  existingCodes: readonly (string | null | undefined)[],
  opts: { prefix: string; year?: number },
): string {
  const year = opts.year ?? new Date().getFullYear()
  const prefix = opts.prefix.toUpperCase()

  let highest = 0
  for (const raw of existingCodes) {
    const parsed = parseReferenceCode(raw)
    if (!parsed) continue
    if (parsed.prefix !== prefix || parsed.year !== year) continue
    if (parsed.sequence > highest) highest = parsed.sequence
  }

  return formatReferenceCode(prefix, year, highest + 1)
}

/**
 * What to show when a record has no code. Records created before codes were
 * generated genuinely have none, and inventing one at display time would
 * imply a stored value that is not there.
 */
export function displayReferenceCode(code: string | null | undefined): string | null {
  const trimmed = code?.trim()
  return trimmed ? trimmed : null
}

// ── Entity specific wrappers ──────────────────────────────────────────────

export function nextCaseCode(
  existingCodes: readonly (string | null | undefined)[],
  opts: { year?: number; prefix?: string } = {},
): string {
  return nextReferenceCode(existingCodes, {
    prefix: opts.prefix ?? CASE_CODE_PREFIX,
    year: opts.year,
  })
}

export function nextClientCode(
  existingCodes: readonly (string | null | undefined)[],
  opts: { year?: number; prefix?: string } = {},
): string {
  return nextReferenceCode(existingCodes, {
    prefix: opts.prefix ?? CLIENT_CODE_PREFIX,
    year: opts.year,
  })
}

export const displayCaseCode = displayReferenceCode
export const displayClientCode = displayReferenceCode
export const parseCaseCode = parseReferenceCode
export const formatCaseCode = formatReferenceCode
