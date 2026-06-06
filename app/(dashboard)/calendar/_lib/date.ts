/**
 * Pure date helpers used by the calendar grid + month picker.
 */

/**
 * Anchor a Date to the Sunday that starts its week. The reference
 * screenshot begins the row at Sunday and runs through Saturday.
 */
export function startOfWeek(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  out.setDate(out.getDate() - out.getDay())
  return out
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function formatHourLabel(h: number): string {
  if (h === 0) return '12 am'
  if (h === 12) return '12 pm'
  return h < 12 ? `${h} am` : `${h - 12} pm`
}

/**
 * Step a Date forward (or backward) by whole calendar months, clamping
 * day-of-month to the last day of the target month so e.g.
 * (31 Jan + 1 month) lands on 28/29 Feb rather than 3 Mar.
 */
export function addMonths(d: Date, n: number): Date {
  const out = new Date(d)
  const day = out.getDate()
  out.setDate(1)
  out.setMonth(out.getMonth() + n)
  const lastDay = new Date(out.getFullYear(), out.getMonth() + 1, 0).getDate()
  out.setDate(Math.min(day, lastDay))
  return out
}

/**
 * Build the 42 (6 weeks × 7 days) day cells that fill a month view
 * grid. Starts on the Sunday on-or-before the 1st of `anchor`'s month
 * and runs forward 42 days so the bottom row tail-bleeds into the
 * following month. Fixed 6-row height avoids the layout jump months
 * get when they need 5 vs 6 rows.
 */
export function monthGridDays(anchor: Date): Date[] {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const gridStart = startOfWeek(firstOfMonth)
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

/** Format a minute-of-day (0..1439) as a 12-hour clock string. */
export function formatMinutesAsClock(m: number): string {
  const h = Math.floor(m / 60)
  const mm = m % 60
  const hr12 = ((h + 11) % 12) + 1
  const ampm = h < 12 ? 'am' : 'pm'
  return `${hr12}:${mm.toString().padStart(2, '0')} ${ampm}`
}

/** Format minute-of-day (0..1439) as `HH:MM` for `<input type="time">`. */
export function minutesToHHMM(m: number): string {
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${h.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
}

/**
 * `<input type="date">` wants YYYY-MM-DD in local time. Building it
 * from `.toISOString().slice(0, 10)` would give UTC, which is off-by-
 * one for users west of UTC near midnight.
 */
export function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** `<input type="time">` wants HH:MM in 24-hour local time. */
export function toTimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
