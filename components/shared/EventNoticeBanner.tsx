'use client'

/**
 * Global "you have an event now" banner.
 *
 * Mounted once in the dashboard layout so it shows on every page. It watches
 * the firm calendar and surfaces timed events that are happening now (or start
 * within the next few minutes), prompting the user with a link to the calendar.
 * Each event can be dismissed; dismissals persist (localStorage) so it doesn't
 * nag across navigations or refreshes.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, CalendarDots, X } from '@phosphor-icons/react'
import { useCalendarEvents, type CalendarEvent } from '@/hooks/use-calendar'

// How early (minutes before start) to begin prompting.
const LEAD_MINUTES = 10
// Re-evaluate "now" on this cadence, and re-fetch events less often.
const TICK_MS = 30_000
const REFETCH_MS = 5 * 60_000
const STORAGE_KEY = 'll:event-notice:dismissed'

interface ActiveNotice {
  event: CalendarEvent
  imminent: boolean // true = starting soon, false = already started
  startMs: number
}

export function EventNoticeBanner() {
  const { data: events, refetch } = useCalendarEvents()
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [dismissed, setDismissed] = useState<string[]>([])

  // Load persisted dismissals once on mount.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) setDismissed(JSON.parse(raw) as string[])
    } catch {
      /* ignore */
    }
  }, [])

  // Tick the clock so events become active/inactive at the right moment.
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), TICK_MS)
    return () => clearInterval(t)
  }, [])

  // Periodically pull fresh events (created in other sessions, etc.).
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch
  useEffect(() => {
    const t = setInterval(() => void refetchRef.current?.(), REFETCH_MS)
    return () => clearInterval(t)
  }, [])

  const notices = useMemo<ActiveNotice[]>(() => {
    const leadMs = LEAD_MINUTES * 60_000
    const out: ActiveNotice[] = []
    for (const e of events ?? []) {
      if (e.all_day || e.status === 'cancelled') continue
      const startMs = new Date(e.start_time).getTime()
      const endMs = new Date(e.end_time).getTime()
      if (Number.isNaN(startMs) || Number.isNaN(endMs)) continue
      // Active when we're inside [start − lead, end].
      if (nowMs >= startMs - leadMs && nowMs <= endMs) {
        out.push({ event: e, imminent: nowMs < startMs, startMs })
      }
    }
    return out
      .filter((n) => !dismissed.includes(n.event.id))
      .sort((a, b) => a.startMs - b.startMs)
  }, [events, nowMs, dismissed])

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id]
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  if (notices.length === 0) return null

  const primary = notices[0]
  const extra = notices.length - 1
  const e = primary.event
  const startMs = primary.startMs
  const when = primary.imminent
    ? `starts in ${Math.max(1, Math.round((startMs - nowMs) / 60_000))} min`
    : 'happening now'
  const timeLabel = new Date(e.start_time).toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <div
      className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b"
      style={{
        background: primary.imminent
          ? 'rgba(201,151,43,0.12)'
          : 'rgba(34,160,94,0.12)',
        borderColor: 'var(--border, rgba(13,27,42,0.08))',
      }}
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-flex items-center justify-center h-7 w-7 rounded-full shrink-0"
        style={{
          background: primary.imminent ? 'rgba(201,151,43,0.2)' : 'rgba(34,160,94,0.2)',
          color: primary.imminent ? 'var(--gold-dark, #B8860B)' : '#1B8A4C',
        }}
      >
        {primary.imminent ? (
          <CalendarDots size={15} strokeWidth={2} />
        ) : (
          <Bell size={15} strokeWidth={2} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-tight truncate" style={{ color: 'var(--navy, #0D1B2A)' }}>
          <span className="font-semibold">{e.title}</span>{' '}
          <span style={{ color: '#6B7280' }}>· {timeLabel} · {when}</span>
          {e.location ? <span style={{ color: '#6B7280' }}> · {e.location}</span> : null}
          {extra > 0 ? (
            <span className="font-medium" style={{ color: 'var(--gold-dark, #B8860B)' }}>
              {' '}
              +{extra} more
            </span>
          ) : null}
        </p>
      </div>

      <Link
        href="/calendar"
        className="text-[12.5px] font-semibold rounded-md px-3 py-1.5 shrink-0 transition-opacity hover:opacity-90"
        style={{ background: 'var(--navy, #0D1B2A)', color: 'white' }}
      >
        View
      </Link>
      <button
        type="button"
        onClick={() => dismiss(e.id)}
        aria-label="Dismiss notice"
        className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.06]"
        style={{ color: '#6B7280' }}
      >
        <X size={15} strokeWidth={2} />
      </button>
    </div>
  )
}
