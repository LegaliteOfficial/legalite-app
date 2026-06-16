'use client'

import { ArrowsDownUp } from '@phosphor-icons/react'
import type { SortDir } from '../_types'

/**
 * Sortable column header. Renders the label + an up/down arrow; the
 * icon's opacity bumps when the column is the active sort, and rotates
 * 180° between asc/desc.
 */
export function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
}) {
  return (
    <th
      className="px-4 py-3 font-medium cursor-pointer select-none"
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <ArrowsDownUp
          size={12}
          strokeWidth={1.75}
          style={{
            color: active ? 'var(--text-primary)' : 'var(--text-subtle)',
            transform:
              active && dir === 'desc' ? 'rotate(180deg)' : undefined,
            transition: 'transform 120ms ease',
          }}
        />
      </span>
    </th>
  )
}
