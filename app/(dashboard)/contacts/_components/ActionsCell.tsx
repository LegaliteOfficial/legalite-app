'use client'

import type { ContactRow } from '../_types'

/**
 * Per-row action cell — Edit. Billing lives on the clients table
 * ("Create bill"), where the bill composer opens for that client.
 */
export function ActionsCell({
  row,
  onEdit,
}: {
  row: ContactRow
  onEdit: () => void
}) {
  return (
    // Stop click propagation so the parent <tr>'s row-click navigation
    // doesn't fire when users press Edit.
    <div className="inline-flex" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${row.full_name}`}
        className="inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[12.5px] font-medium transition-colors cursor-pointer hover:bg-[var(--surface-sunken)]"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
        }}
      >
        Edit
      </button>
    </div>
  )
}
