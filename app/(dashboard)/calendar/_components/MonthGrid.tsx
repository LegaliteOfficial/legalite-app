'use client'

import { useMemo } from 'react'
import type { Deadline } from '@/hooks/use-deadlines'
import { sameDay } from '../_lib/date'

const CHIPS_PER_CELL = 3

/**
 * Month view body. Weekday-name header row above a 6 × 7 grid of day
 * cells. Each cell shows the day number, up to three event chips
 * coloured by priority, and a "+N more" pill for overflow. Today's
 * cell gets a faint gold tint + bold gold date.
 *
 * Empty space click → onDayClick(day) opens the new-event dialog at
 * 9 AM that day. Event chips stop the click bubble so opening an
 * event doesn't pop the create dialog underneath.
 */
export function MonthGrid({
  days,
  anchorMonth,
  today,
  eventsByDay,
  onDayClick,
  onEventClick,
}: {
  days: Date[]
  anchorMonth: number
  today: Date
  eventsByDay: Map<number, Deadline[]>
  onDayClick: (day: Date) => void
  onEventClick: (deadline: Deadline) => void
}) {
  // Sunday-first weekday names matching the week start.
  const weekdayLabels = useMemo(
    () => days.slice(0, 7).map((d) => d.toLocaleDateString('en-GB', { weekday: 'short' })),
    [days],
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Weekday header. */}
      <div
        className="grid border-b shrink-0"
        style={{
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderColor: 'var(--border-soft)',
        }}
      >
        {weekdayLabels.map((label, i) => (
          <div
            key={i}
            className="px-3 py-2 text-[11.5px] font-medium uppercase tracking-wide border-l"
            style={{
              color: 'var(--text-muted)',
              borderColor: 'var(--border-soft)',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 6 × 7 day grid. `flex-1` so every row gets an equal share of viewport. */}
      <div
        className="grid flex-1"
        style={{
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: 'repeat(6, 1fr)',
        }}
      >
        {days.map((day, idx) => (
          <MonthCell
            key={day.toISOString()}
            day={day}
            isInAnchorMonth={day.getMonth() === anchorMonth}
            isToday={sameDay(day, today)}
            cellEvents={eventsByDay.get(idx) ?? []}
            onDayClick={onDayClick}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  )
}

function MonthCell({
  day,
  isInAnchorMonth,
  isToday,
  cellEvents,
  onDayClick,
  onEventClick,
}: {
  day: Date
  isInAnchorMonth: boolean
  isToday: boolean
  cellEvents: Deadline[]
  onDayClick: (day: Date) => void
  onEventClick: (deadline: Deadline) => void
}) {
  const visibleChips = cellEvents.slice(0, CHIPS_PER_CELL)
  const overflow = cellEvents.length - visibleChips.length

  return (
    // Cell is a div+role="button" because it contains nested <button>
    // elements (the event chips), and a <button> can't legally contain
    // another <button> in HTML.
    <div
      role="button"
      tabIndex={0}
      onClick={() => onDayClick(day)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onDayClick(day)
        }
      }}
      className="text-left border-l border-t p-2 flex flex-col gap-1.5 cursor-pointer transition-colors min-h-0 overflow-hidden"
      style={{
        borderColor: 'var(--border-soft)',
        background: isToday ? 'var(--accent-today-tint)' : 'transparent',
        opacity: isInAnchorMonth ? 1 : 0.55,
      }}
      onMouseEnter={(e) => {
        if (!isToday) e.currentTarget.style.background = 'var(--surface-sunken)'
      }}
      onMouseLeave={(e) => {
        if (!isToday) e.currentTarget.style.background = 'transparent'
      }}
      aria-label={`Add event on ${day.toDateString()}`}
    >
      <div
        className="text-[13px] font-semibold tabular-nums leading-none"
        style={{ color: isToday ? 'var(--accent-today)' : 'var(--text-primary)' }}
      >
        {day.getDate()}
      </div>

      <div className="flex flex-col gap-1 min-h-0 overflow-hidden">
        {visibleChips.map((ev) => (
          <button
            key={ev.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEventClick(ev)
            }}
            className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-left cursor-pointer"
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-soft)',
            }}
            title={ev.title}
          >
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
              style={{ background: priorityColor(ev.priority) }}
            />
            <span className="text-[11px] truncate" style={{ color: 'var(--text-primary)' }}>
              {ev.title}
            </span>
          </button>
        ))}
        {overflow > 0 && (
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
            +{overflow} more
          </span>
        )}
      </div>
    </div>
  )
}

function priorityColor(p: Deadline['priority']): string {
  if (p === 'High')   return 'var(--accent-danger, #B53A2B)'
  if (p === 'Medium') return 'var(--accent-today, #C9972B)'
  return 'var(--text-muted, #8C8378)'
}
