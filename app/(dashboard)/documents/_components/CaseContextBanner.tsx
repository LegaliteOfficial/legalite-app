'use client'

import { Briefcase, X } from '@phosphor-icons/react'

/**
 * Shown on the templates tab after "New draft" on a case: whatever the user
 * starts from here is linked to that case. Clearing it starts unlinked
 * drafts again (the case can still be chosen in the editor).
 */
export function CaseContextBanner({
  caseTitle,
  onClear,
}: {
  caseTitle: string
  onClear: () => void
}) {
  return (
    <div
      className="mb-4 flex items-center gap-3 rounded-xl border px-4 py-2.5"
      style={{ borderColor: 'var(--gold)', background: 'var(--accent-today-tint)' }}
    >
      <Briefcase size={16} className="shrink-0" style={{ color: 'var(--gold-dark)' }} />
      <p className="min-w-0 flex-1 text-[13px]" style={{ color: 'var(--text-primary)' }}>
        Drafting for <span className="font-semibold">{caseTitle}</span>. Choose a template or start a blank
        document; it will be saved to this case.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-sunken)]"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Stop drafting for this case"
      >
        <X size={14} />
      </button>
    </div>
  )
}
