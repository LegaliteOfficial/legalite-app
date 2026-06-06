'use client'

import { HOUR_HEIGHT } from '../_constants'

/**
 * Horizontal rule + left dot showing the current time on today's
 * column. Positioned absolutely against the day column's top so it
 * lands at `(hours + minutes/60) * HOUR_HEIGHT` pixels.
 */
export function NowLine({ now }: { now: Date }) {
  const top = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none"
      style={{ top, zIndex: 2 }}
      aria-hidden
    >
      <span
        className="absolute -left-1 -top-1 inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: 'var(--now-line)' }}
      />
      <span
        className="block"
        style={{ borderTop: '2px solid var(--now-line)' }}
      />
    </div>
  )
}
