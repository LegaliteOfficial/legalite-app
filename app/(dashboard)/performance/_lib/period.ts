export type PeriodId =
  | 'this_quarter'
  | 'last_3_months'
  | 'this_year'
  | 'last_12_months'
  | 'all_time'

export const PERIODS: { id: PeriodId; label: string }[] = [
  { id: 'this_quarter', label: 'This quarter' },
  { id: 'last_3_months', label: 'Last 3 months' },
  { id: 'this_year', label: 'This year' },
  { id: 'last_12_months', label: 'Last 12 months' },
  { id: 'all_time', label: 'All time' },
]

export interface Range {
  /** Epoch ms inclusive start, or null for open-ended. */
  start: number | null
  end: number | null
}

/** Resolve a preset to a concrete [start, end] range from "now". */
export function periodRange(id: PeriodId): Range {
  const now = new Date()
  const end = now.getTime()
  switch (id) {
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3)
      const start = new Date(now.getFullYear(), q * 3, 1).getTime()
      return { start, end }
    }
    case 'last_3_months': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 3)
      return { start: d.getTime(), end }
    }
    case 'this_year':
      return { start: new Date(now.getFullYear(), 0, 1).getTime(), end }
    case 'last_12_months': {
      const d = new Date(now)
      d.setFullYear(d.getFullYear() - 1)
      return { start: d.getTime(), end }
    }
    case 'all_time':
      return { start: null, end: null }
  }
}

/** Label for the prior comparison window (used in trend copy). */
export function comparisonLabel(id: PeriodId): string {
  switch (id) {
    case 'this_quarter':
      return 'last quarter'
    case 'this_year':
      return 'last year'
    case 'all_time':
      return ''
    default:
      return 'the previous period'
  }
}

/** Same-length window immediately before the given range. */
export function previousRange(range: Range): Range {
  if (range.start === null || range.end === null) return { start: null, end: null }
  const span = range.end - range.start
  return { start: range.start - span, end: range.start }
}

export function inRange(iso: string, range: Range): boolean {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return false
  if (range.start !== null && t < range.start) return false
  if (range.end !== null && t > range.end) return false
  return true
}
