'use client'

import { Spinner } from '@/components/shared/Spinner'

/**
 * Sticky action bar that slides up only when there are unsaved edits.
 * Keeps Save reachable no matter how far the form is scrolled.
 */
export function FirmSaveBar({
  visible,
  saving,
  onSave,
  onDiscard,
}: {
  visible: boolean
  saving: boolean
  onSave: () => void
  onDiscard: () => void
}) {
  if (!visible) return null
  return (
    <div className="sticky bottom-0 z-10 mt-8 -mx-6 px-6 pb-4 pt-3">
      <div
        className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3 shadow-lg"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
          boxShadow: '0 8px 30px rgba(13,27,42,0.12)',
        }}
      >
        <span className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          You have unsaved changes.
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="rounded-md border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-black/[0.02] disabled:opacity-50"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--gold)' }}
          >
            {saving && <Spinner size={14} />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
