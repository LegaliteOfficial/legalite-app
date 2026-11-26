/**
 * Events cannot start in the past. The backend enforces this; these helpers
 * let the forms say so before a round trip, and set `min` on date inputs so
 * the picker greys out past days.
 */

/** Leeway for a form left open a minute or two. The server allows five. */
const PAST_GRACE_MS = 60 * 1000

export const PAST_EVENT_MESSAGE =
  'Events cannot be scheduled in the past. Pick a start time from now on.'

/** True when a timed start has already passed. */
export function isPastStart(start: Date, now: Date = new Date()): boolean {
  return start.getTime() < now.getTime() - PAST_GRACE_MS
}

/** Today's date as `YYYY-MM-DD` in the user's timezone, for `<input min>`. */
export function todayInputValue(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
