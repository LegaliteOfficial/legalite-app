'use client'

import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import type { ColumnDef, SortDir } from '../_types'

/**
 * Renders a column header with a tri-state sort affordance — the
 * up/down chevron pair when inactive, a single up or down chevron when
 * this column drives the sort. Non-sortable columns just render the
 * label so screen readers / keyboard users don't land on a no-op control.
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

  const Icon = active ? (dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown

  return (
    <button
      type="button"
      onClick={onSort}
      className={`inline-flex items-center gap-1.5 ${justify} w-full transition-colors cursor-pointer`}
      style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = active
          ? 'var(--text-primary)'
          : 'var(--text-muted)'
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
