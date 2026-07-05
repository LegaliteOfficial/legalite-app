'use client'

/**
 * CancelStep — "No → cancel with a reason".
 *
 * Distinct from setting `status='cancelled'` up-front on the event
 * drawer. This path is post-hoc: the event was scheduled but didn't
 * happen, and the firm wants a reason on file. Reason is required per
 * the PRD.
 */

import { useState } from 'react'
import { CaretLeft } from '@phosphor-icons/react'
import type { CalendarEvent } from '@/hooks/use-calendar'
import type { useDueEventMutations } from '@/hooks/use-due-events'

export function CancelStep({
  event,
  mutations,
  onBack,
}: {
  event: CalendarEvent
  mutations: ReturnType<typeof useDueEventMutations>
  onBack: () => void
}) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = reason.trim().length > 0 && !submitting

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    await mutations.cancel(event, {
      event_id: event.id,
      reason: reason.trim(),
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
        Cancel this event
      </h3>

      <label
        className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: 'var(--text-muted)' }}
      >
        Reason <span style={{ color: '#C0392B' }}>*</span>
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        maxLength={500}
        autoFocus
        placeholder="e.g. Matter settled out of court"
        disabled={submitting}
        className="w-full rounded-lg border px-3 py-2 text-[13px] leading-relaxed outline-none resize-none disabled:opacity-60"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
        }}
      />
      <div className="mt-1 flex items-center justify-end">
        <span
          className="text-[10.5px] tabular-nums"
          style={{ color: 'var(--text-muted)' }}
        >
          {reason.length}/500
        </span>
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
          className="inline-flex items-center h-9 px-4 rounded-lg text-[12.5px] font-semibold text-white transition-colors disabled:opacity-60"
          style={{ background: '#C0392B' }}
        >
          {submitting ? 'Cancelling…' : 'Confirm cancellation'}
        </button>
      </div>
    </div>
  )
}
