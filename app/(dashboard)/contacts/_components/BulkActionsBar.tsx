'use client'

import { Trash, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

/**
 * Bulk-actions strip — replaces the type-filter pills row whenever one
 * or more contacts are selected. Carries the destructive Delete action
 * + selection count + clear affordance. Deletion is intentionally a
 * two-step (select → delete) rather than per-row.
 */
export function BulkActionsBar({
  count,
  onDelete,
  onClearSelection,
}: {
  count: number
  onDelete: () => void
  onClearSelection: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        onClick={onDelete}
        className="text-white"
        style={{ background: '#C0392B' }}
      >
        <Trash size={13} strokeWidth={1.75} />
        Delete contact{count === 1 ? '' : 's'}
      </Button>
      <span
        className="text-[13px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {count} selected
      </span>
      <button
        type="button"
        onClick={onClearSelection}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium cursor-pointer"
        style={{ color: 'var(--text-muted)' }}
      >
        <span
          className="inline-flex items-center justify-center h-4 w-4 rounded-full"
          style={{
            background: 'var(--surface-sunken)',
            color: 'var(--text-muted)',
          }}
        >
          <X size={11} strokeWidth={2} />
        </span>
        Clear selection
      </button>
    </div>
  )
}
