/**
 * Case IDs.
 *
 * The case code is the firm's own reference for a matter — the thing a
 * partner quotes on the phone. It is not the court's suit number (that is
 * `suit_number`, assigned by the registry) and not the database id (a UUID
 * nobody can read aloud).
 *
 * It used to be typed by hand, which meant most cases had none, and the
 * ones that did followed no pattern. It is now generated when the case is
 * created.
 *
 * Format: LL-YYYY-NNNN, e.g. LL-2026-0042.
 *   LL    firm prefix, so a code pasted into an email is recognisable
 *   YYYY  year the matter was opened, which is how firms file
 *   NNNN  sequence within that year, zero padded to sort correctly as text
 *
 * Caveat worth knowing: the sequence is derived from the codes the client
 * can already see. Two people creating a case in the same second could
 * both compute the same next number. Only the database can settle that,
 * so when the backend assigns codes it should own this and the frontend
 * should stop sending one. `nextCaseCode` is deliberately pure and takes
 * the existing codes as an argument so that swap is a one line change.
 */

export const CASE_CODE_PREFIX = 'LL'

/** Matches the codes this module produces, and nothing else. */
const CODE_RE = /^([A-Z]{2,5})-(\d{4})-(\d{4,})$/

export interface ParsedCaseCode {
  prefix: string
  year: number
  sequence: number
}

export function parseCaseCode(code: string | null | undefined): ParsedCaseCode | null {
  if (!code) return null
  const m = CODE_RE.exec(code.trim().toUpperCase())
  if (!m) return null
  return { prefix: m[1], year: Number(m[2]), sequence: Number(m[3]) }
}

/**
 * Next code for the given year, one past the highest already in use.
 *
 * Unparseable or hand typed codes are ignored rather than guessed at, so a
 * legacy value like "Smith matter" cannot corrupt the sequence.
 */
export function nextCaseCode(
  existingCodes: readonly (string | null | undefined)[],
  opts: { year?: number; prefix?: string } = {},
): string {
  const year = opts.year ?? new Date().getFullYear()
  const prefix = (opts.prefix ?? CASE_CODE_PREFIX).toUpperCase()

  let highest = 0
  for (const raw of existingCodes) {
    const parsed = parseCaseCode(raw)
    if (!parsed) continue
    if (parsed.prefix !== prefix || parsed.year !== year) continue
    if (parsed.sequence > highest) highest = parsed.sequence
  }

  return formatCaseCode(prefix, year, highest + 1)
}

export function formatCaseCode(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`
}

/**
 * What to show when a case has no code. Older cases created before codes
 * were generated genuinely have none, and inventing one at display time
 * would imply a stored value that is not there.
 */
export function displayCaseCode(code: string | null | undefined): string | null {
  const trimmed = code?.trim()
  return trimmed ? trimmed : null
}
