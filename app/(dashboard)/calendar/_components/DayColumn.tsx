'use client'

import { useState } from 'react'
import type { Deadline } from '@/hooks/use-deadlines'
import {
  DEFAULT_EVENT_MINUTES,
  HOUR_HEIGHT,
  HOURS,
  SLOT_SNAP_MINUTES,
} from '../_constants'
import { formatMinutesAsClock } from '../_lib/date'
import { EventPreviewPopover } from './EventPreviewPopover'
import { NowLine } from './NowLine'

/**
 * One day column in the time grid. Renders hour / half-hour grid
 * lines, the now-line (if today), and event blocks. The column itself
 * is also a click target — clicking empty space opens the new-event
 * dialog with the day pre-filled and the time snapped to the nearest
 * 15-minute slot. Hovering shows a ghost block at the cursor.
 */
export function DayColumn({
  day,
  isToday,
  events,
  now,
  onSlotClick,
  onEventClick,
}: {
  day: Date
  isToday: boolean
  events: Deadline[]
  now: Date
  onSlotClick: (startMinutes: number, endMinutes: number) => void
  onEventClick: (deadline: Deadline) => void
}) {
  const [hoverMinutes, setHoverMinutes] = useState<number | null>(null)

  /**
   * Convert a mouse Y position (relative to the column's top) into a
   * minute-of-day, snapped to `SLOT_SNAP_MINUTES` and clamped to a
   * legal range.
   */
  const minutesFromY = (yPx: number): number => {
    const raw = (yPx / HOUR_HEIGHT) * 60
    const snapped = Math.round(raw / SLOT_SNAP_MINUTES) * SLOT_SNAP_MINUTES
    const max = 24 * 60 - SLOT_SNAP_MINUTES
    return Math.max(0, Math.min(max, snapped))
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverMinutes(minutesFromY(e.clientY - rect.top))
  }
  const handleMouseLeave = () => setHoverMinutes(null)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Defensive: if the click bubbled up from an event block that
    // forgot to stopPropagation, bail out so we don't dual-fire.
    if ((e.target as HTMLElement).closest('[data-event-block]')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const startMinutes = minutesFromY(e.clientY - rect.top)
    const endMinutes = Math.min(24 * 60, startMinutes + DEFAULT_EVENT_MINUTES)
    onSlotClick(startMinutes, endMinutes)
  }

  return (
    <div
      role="button"
      tabIndex={-1}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative border-l cursor-pointer"
      style={{
        borderColor: 'var(--border-soft)',
        height: HOUR_HEIGHT * 24,
        background: isToday ? 'var(--accent-today-tint)' : 'transparent',
      }}
      aria-label={`Add event on ${day.toDateString()}`}
    >
      {/* Hour grid lines + half-hour dashed lines. */}
      {HOURS.map((h) => (
        <div key={h}>
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: h * HOUR_HEIGHT,
              borderTop: '1px solid var(--border-soft)',
            }}
          />
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2,
              borderTop: '1px dashed var(--border-soft)',
              opacity: 0.6,
            }}
          />
        </div>
      ))}

      {/* Hover ghost — shows where a click would land. */}
      {hoverMinutes !== null && (
        <div
          className="absolute left-1 right-1 rounded-md pointer-events-none"
          style={{
            top: (hoverMinutes / 60) * HOUR_HEIGHT + 1,
            height: (DEFAULT_EVENT_MINUTES / 60) * HOUR_HEIGHT - 2,
            background: 'var(--accent-today-tint)',
            border: '1.5px dashed var(--accent-today)',
            zIndex: 1,
          }}
        >
          <div
            className="text-[10.5px] tabular-nums px-2 pt-1"
            style={{ color: 'var(--gold-dark)' }}
          >
            {formatMinutesAsClock(hoverMinutes)}
          </div>
        </div>
      )}

      {/* Current-time line — drawn only on today. */}
      {isToday && <NowLine now={now} />}

      {/* Event blocks. Each block opens a quick-look popover; the
          full editor opens from inside the popover. The wrapping span
          carries `data-event-block` so the parent slot-click handler
          can detect (and ignore) clicks that landed on an event. */}
      {events.map((e) => (
        <span key={e.id} data-event-block>
          <EventPreviewPopover deadline={e} onEdit={onEventClick} />
        </span>
      ))}
    </div>
  )
}
