'use client'

import { sameDay } from '../_lib/date'

/**
 * Day-of-week header row for the Day / Work-week / Week views. One
 * cell per visible day plus a left gutter cell over the hour-label
 * column. Today's column gets a gold number + thin gold underline.
 */
export function DayHeaderRow({
  visibleDays,
  now,
}: {
  visibleDays: Date[]
  now: Date
}) {
  return (
    <div
      className="grid border-b shrink-0"
      style={{
        gridTemplateColumns: `64px repeat(${visibleDays.length}, 1fr)`,
        borderColor: 'var(--border-soft)',
      }}
    >
      <div />
      {visibleDays.map((d) => {
        const isToday = sameDay(d, now)
        return (
          <div
            key={d.toISOString()}
            className="px-4 py-3 border-l"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <div
              className="text-[22px] font-semibold tabular-nums leading-tight"
              style={{ color: isToday ? 'var(--accent-today)' : 'var(--text-primary)' }}
            >
              {d.getDate()}
            </div>
            <div
              className="text-[12px] mt-0.5"
              style={{ color: isToday ? 'var(--accent-today)' : 'var(--text-muted)' }}
            >
              {d.toLocaleDateString('en-GB', { weekday: 'long' })}
            </div>
            {isToday && (
              <span
                aria-hidden
                className="block h-[2px] mt-2 rounded-full"
                style={{ background: 'var(--accent-today)', maxWidth: 80 }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
