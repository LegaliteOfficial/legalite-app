'use client'

/**
 * PromptStep — the initial "Did this event take place?" ask.
 *
 * Two primary paths (Yes / No), one soft-close (X in the header handled
 * by the parent). The user's choice routes to a sub-form, not directly
 * to a mutation — the mutation runs after the sub-form collects the
 * required data (notes / new time / reason).
 */

import { Clock } from '@phosphor-icons/react'
import type { CalendarEvent } from '@/hooks/use-calendar'
import type { PromptStep as StepId } from '@/stores/due-events.store'

export function PromptStep({
  event,
  onStep,
}: {
  event: CalendarEvent
  onStep: (step: StepId) => void
}) {
  const startedAt = new Date(event.start_time)

  const timeLabel = startedAt
    .toLocaleTimeString('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()

  const dateLabel = friendlyDate(startedAt)

  return (
    <div className="px-5 py-4">
      <h2
        className="text-[15px] font-semibold leading-snug mb-1.5"
        style={{
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-heading, "Playfair Display", serif)',
        }}
      >
        {event.title}
      </h2>
      <p
        className="text-[12.5px] leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        Your scheduled event was due{' '}
        <span
          className="inline-flex items-center gap-1 font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          <Clock size={11} strokeWidth={1.75} />
          {dateLabel} at {timeLabel}
        </span>
        .
        {event.case_title && (
          <>
            {' '}
            <span style={{ color: 'var(--text-muted)' }}>
              — {event.case_title}
            </span>
          </>
        )}
      </p>

      <p
        className="mt-4 text-[13px] font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        Did this event take place?
      </p>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onStep('completion')}
          className="flex-1 inline-flex items-center justify-center h-9 rounded-lg text-[13px] font-semibold transition-colors"
          style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'var(--gold-dark)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--gold)')}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onStep('reschedule')}
          className="flex-1 inline-flex items-center justify-center h-9 rounded-lg text-[13px] font-semibold border transition-colors"
          style={{
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
            background: 'var(--surface-card)',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'var(--surface-overlay)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'var(--surface-card)')
          }
        >
          No
        </button>
      </div>

      {/* If user picked No, they're routed to the reschedule form by
          default. A small "Cancel event instead" link below gives the
          fallback path without cluttering the primary CTA row. */}
      <p
        className="mt-2 text-[11px] text-center"
        style={{ color: 'var(--text-muted)' }}
      >
        Not happening at all?{' '}
        <button
          type="button"
          onClick={() => onStep('cancel')}
          className="font-semibold underline underline-offset-2"
          style={{ color: 'var(--gold-dark)' }}
        >
          Cancel this event
        </button>
      </p>
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────

/**
 * "today", "yesterday", or "Mon, 8 Jun" for older events. Kept small so
 * the prompt reads like the copy in the mockup instead of a full date.
 */
function friendlyDate(d: Date): string {
  const now = new Date()
  const diff = daysDelta(d, now)
  if (diff === 0) return 'today'
  if (diff === -1) return 'yesterday'
  if (diff < -1 && diff > -7) {
    return d
      .toLocaleDateString('en-GB', { weekday: 'long' })
      .toLowerCase()
  }
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function daysDelta(a: Date, b: Date): number {
  const dayA = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const dayB = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((dayA.getTime() - dayB.getTime()) / 86_400_000)
}
