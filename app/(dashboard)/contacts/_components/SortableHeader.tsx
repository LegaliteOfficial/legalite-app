'use client'

import { CaretDown, CaretUp, CaretUpDown } from '@phosphor-icons/react'
import type { ColumnDef, SortDir } from '../_types'

/**
 * Column header that toggles sort order on click. The caret reflects
 * the current direction; non-sortable columns just render the label.
 */
export function SortableHeader({
  col,
  active,
  dir,
  onSort,
}: {
  col: ColumnDef
  active: boolean
  dir: SortDir
  onSort: () => void
}) {
  const justify = col.align === 'right' ? 'justify-end' : 'justify-start'
  if (!col.sortable) {
    return (
      <span
        className={`inline-flex items-center gap-1 ${justify} w-full`}
        style={{ textAlign: col.align ?? 'left' }}
      >
        <span className="truncate">{col.label}</span>
      </span>
    )
  }
  const Icon = active ? (dir === 'asc' ? CaretUp : CaretDown) : CaretUpDown
  return (
    <button
      type="button"
      onClick={onSort}
      className={`inline-flex items-center gap-1.5 ${justify} w-full transition-colors cursor-pointer`}
      style={{
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      }}
      aria-label={`Sort by ${col.label}${active ? ` (${dir})` : ''}`}
    >
      <span className="truncate">{col.label}</span>
      <Icon
        size={12}
        strokeWidth={2}
        style={{ opacity: active ? 1 : 0.5, flexShrink: 0 }}
      />
    </button>
  )
}
