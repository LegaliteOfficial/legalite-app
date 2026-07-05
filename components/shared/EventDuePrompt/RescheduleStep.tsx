'use client'

/**
 * RescheduleStep — "No → pick a new date & time".
 *
 * Defaults to +1 day at the same clock-time as the original event, so
 * the common case ("bump it a day") is a single click. Notes are
 * optional per the design.
 */

import { useState } from 'react'
import { CaretLeft } from '@phosphor-icons/react'
import type { CalendarEvent } from '@/hooks/use-calendar'
import type { useDueEventMutations } from '@/hooks/use-due-events'

export function RescheduleStep({
  event,
  mutations,
  onBack,
}: {
  event: CalendarEvent
  mutations: ReturnType<typeof useDueEventMutations>
  onBack: () => void
}) {
  const defaults = useSameTimeNextDayDefaults(event)
  const [date, setDate] = useState(defaults.date)
  const [startTime, setStartTime] = useState(defaults.startTime)
  const [endTime, setEndTime] = useState(defaults.endTime)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const valid = date && startTime && endTime && startTime < endTime
  const canSubmit = valid && !submitting

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    const newStart = new Date(`${date}T${startTime}:00`).toISOString()
    const newEnd = new Date(`${date}T${endTime}:00`).toISOString()
    await mutations.reschedule(event, {
      event_id: event.id,
      new_start_time: newStart,
      new_end_time: newEnd,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div className="px-5 py-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[11.5px] font-medium mb-2"
        style={{ color: 'var(--text-muted)' }}
      >
        <CaretLeft size={11} strokeWidth={2} /> Back
      </button>

      <h3
        className="text-[14px] font-semibold mb-3"
        style={{ color: 'var(--text-primary)' }}
      >
        Reschedule this event
      </h3>

      <div className="grid gap-2.5">
        <label className="block">
          <span
            className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            New date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-9 rounded-lg border px-3 text-[13px] outline-none"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
              colorScheme: 'light',
            }}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Starts
            </span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full h-9 rounded-lg border px-3 text-[13px] tabular-nums outline-none"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
                colorScheme: 'light',
              }}
            />
          </label>
          <label className="block">
            <span
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Ends
            </span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full h-9 rounded-lg border px-3 text-[13px] tabular-nums outline-none"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
                colorScheme: 'light',
              }}
            />
          </label>
        </div>
        <label className="block">
          <span
            className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Notes (optional)
          </span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Postponed at judge's request"
            className="w-full h-9 rounded-lg border px-3 text-[13px] outline-none"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
            }}
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="inline-flex items-center h-9 px-3 rounded-lg text-[12.5px] font-medium disabled:opacity-60"
          style={{ color: 'var(--text-muted)' }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="inline-flex items-center h-9 px-4 rounded-lg text-[12.5px] font-semibold transition-colors disabled:opacity-60"
          style={{ background: 'var(--gold)', color: 'var(--navy)' }}
        >
          {submitting ? 'Rescheduling…' : 'Reschedule'}
        </button>
      </div>
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────

/**
 * Preserve the original clock-time but shift to tomorrow (relative to
 * NOW so we skip weekends of the past). Common case is "bump one
 * business day" — this makes it one-click.
 */
function useSameTimeNextDayDefaults(event: CalendarEvent) {
  const start = new Date(event.start_time)
  const end = new Date(event.end_time)

  // Base is tomorrow relative to NOW so backdated events don't propose
  // another past date.
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(start.getHours(), start.getMinutes(), 0, 0)

  const duration = end.getTime() - start.getTime()
  const tomorrowEnd = new Date(tomorrow.getTime() + duration)

  return {
    date: toDateInput(tomorrow),
    startTime: toTimeInput(tomorrow),
    endTime: toTimeInput(tomorrowEnd),
  }
}

function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toTimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
