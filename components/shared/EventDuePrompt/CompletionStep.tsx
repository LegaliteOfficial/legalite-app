'use client'

/**
 * CompletionStep — "Yes it took place → record what happened".
 *
 * Notes are required per the PRD. Attachments are noted as future work
 * in the placeholder — no wiring today because it needs a corresponding
 * `entity_type='event_outcome'` allow-list entry on the backend
 * attachments module.
 */

import { useState } from 'react'
import { CaretLeft } from '@phosphor-icons/react'
import type { CalendarEvent } from '@/hooks/use-calendar'
import type { useDueEventMutations } from '@/hooks/use-due-events'

export function CompletionStep({
  event,
  mutations,
  onBack,
}: {
  event: CalendarEvent
  mutations: ReturnType<typeof useDueEventMutations>
  onBack: () => void
}) {
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = notes.trim().length > 0 && !submitting

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    await mutations.complete(event, {
      event_id: event.id,
      notes: notes.trim(),
    })
    // Store handles queue advancement — no local reset needed. The
    // component unmounts as the current event changes.
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
        Record what happened
      </h3>

      <label
        className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: 'var(--text-muted)' }}
      >
        Outcome / notes <span style={{ color: '#C0392B' }}>*</span>
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        maxLength={2000}
        autoFocus
        placeholder="Brief summary — who attended, decisions, next steps…"
        disabled={submitting}
        className="w-full rounded-lg border px-3 py-2 text-[13px] leading-relaxed outline-none resize-none disabled:opacity-60"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
        }}
      />
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
          Attachments coming soon.
        </span>
        <span
          className="text-[10.5px] tabular-nums"
          style={{ color: 'var(--text-muted)' }}
        >
          {notes.length}/2000
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
          className="inline-flex items-center h-9 px-4 rounded-lg text-[12.5px] font-semibold transition-colors disabled:opacity-60"
          style={{ background: 'var(--gold)', color: 'var(--navy)' }}
        >
          {submitting ? 'Saving…' : 'Save outcome'}
        </button>
      </div>
    </div>
  )
}
