import { useEffect, useState } from 'react'

/**
 * The current time as state, refreshed on an interval. Components that
 * compare against "now" (overdue, expired) read it from here rather than
 * calling Date.now() while rendering, so a render stays a pure function of its
 * inputs and the label updates on its own as time passes.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
