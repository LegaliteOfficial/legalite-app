'use client'

import type { Deadline } from '@/hooks/use-deadlines'
import { DEFAULT_EVENT_MINUTES, HOUR_HEIGHT } from '../_constants'

/**
 * Event block positioned by start-minute and `DEFAULT_EVENT_MINUTES`
 * duration. Renders title + short time label. Gold-tinted to match
 * the reference's highlighted-today style.
 */
export function EventBlock({
  deadline,
  onClick,
}: {
  deadline: Deadline
  onClick: () => void
}) {
  const start = new Date(deadline.due_date)
  const top = (start.getHours() + start.getMinutes() / 60) * HOUR_HEIGHT
  const height = (DEFAULT_EVENT_MINUTES / 60) * HOUR_HEIGHT - 2
  const startLabel = start
    .toLocaleTimeString('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()

  return (
    <button
      type="button"
      // stopPropagation so clicking the event doesn't ALSO fire the
      // parent day-column's slot-click handler.
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="absolute left-1 right-1 rounded-md text-left px-2 py-1.5 cursor-pointer transition-colors"
      style={{
        top: top + 1,
        height,
        background: 'var(--accent-today-tint-strong)',
        border: '1px solid var(--accent-today)',
        color: 'var(--text-primary)',
        zIndex: 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--gold-muted)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--accent-today-tint-strong)'
      }}
      title={deadline.title}
    >
      <div className="text-[11.5px] font-semibold truncate">{deadline.title}</div>
      <div className="text-[10.5px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {startLabel}
      </div>
    </button>
  )
}
