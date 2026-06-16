'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import type { Deadline } from '@/hooks/use-deadlines'
import { DEFAULT_EVENT_MINUTES, HOUR_HEIGHT } from '../_constants'

/**
 * Event block positioned by start-minute and `DEFAULT_EVENT_MINUTES`
 * duration. Renders title + short time label. Gold-tinted to match
 * the reference's highlighted-today style.
 *
 * Receives standard button props so it can be composed as a popover
 * trigger via Base UI's `render` prop. The caller supplies the click
 * handler; this component only deals with positioning + visuals.
 */
export const EventBlock = forwardRef<
  HTMLButtonElement,
  { deadline: Deadline } & ButtonHTMLAttributes<HTMLButtonElement>
>(function EventBlock({ deadline, onClick, ...rest }, ref) {
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
      ref={ref}
      type="button"
      // stopPropagation so clicking the event doesn't ALSO fire the
      // parent day-column's slot-click handler.
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
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
      {...rest}
    >
      <div className="text-[11.5px] font-semibold truncate">{deadline.title}</div>
      <div className="text-[10.5px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {startLabel}
      </div>
    </button>
  )
})
