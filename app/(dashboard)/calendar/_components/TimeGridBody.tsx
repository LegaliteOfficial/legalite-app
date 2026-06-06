'use client'

import { forwardRef } from 'react'
import type { Deadline } from '@/hooks/use-deadlines'
import { HOUR_HEIGHT, HOURS, type SlotPrefill } from '../_constants'
import { formatHourLabel, sameDay } from '../_lib/date'
import { DayColumn } from './DayColumn'

/**
 * Scrolling time-grid body for the Day / Work-week / Week views. Left
 * rail of hour labels, then one DayColumn per visible day.
 *
 * The scroller is forwarded as a ref so the page hook can auto-scroll
 * to "now" on first mount.
 */
export const TimeGridBody = forwardRef<HTMLDivElement, {
  visibleDays: Date[]
  now: Date
  eventsByDay: Map<number, Deadline[]>
  onSlotClick: (day: Date, slot: { startMinutes: number; endMinutes: number }) => void
  onEventClick: (deadline: Deadline) => void
}>(function TimeGridBody(
  { visibleDays, now, eventsByDay, onSlotClick, onEventClick },
  ref,
) {
  return (
    <div className="flex-1 overflow-y-auto" ref={ref}>
      <div
        className="grid relative"
        style={{ gridTemplateColumns: `64px repeat(${visibleDays.length}, 1fr)` }}
      >
        {/* Hour-label column — left rail. */}
        <div className="relative" style={{ height: HOUR_HEIGHT * 24 }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 px-2 text-[11.5px] tabular-nums"
              style={{ top: h * HOUR_HEIGHT, color: 'var(--text-muted)' }}
            >
              {h === 0 ? '' : formatHourLabel(h)}
            </div>
          ))}
        </div>

        {visibleDays.map((day, idx) => (
          <DayColumn
            key={day.toISOString()}
            day={day}
            isToday={sameDay(day, now)}
            events={eventsByDay.get(idx) ?? []}
            now={now}
            onSlotClick={(startMinutes, endMinutes) =>
              onSlotClick(day, { startMinutes, endMinutes })
            }
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  )
})

// Re-export SlotPrefill purely so importers can grab everything from
// this module without reaching into _constants.
export type { SlotPrefill }
