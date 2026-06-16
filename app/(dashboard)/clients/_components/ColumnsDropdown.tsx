'use client'

import { Check, GearSix } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TOGGLEABLE_COLUMNS } from '../_constants'
import type { ColumnKey } from '../_types'

/**
 * Edit-columns dropdown. Each row toggles a column's visibility in
 * place (menu stays open via preventDefault) so the user can hide
 * several columns without re-opening. Badge counts how many are
 * currently hidden so the affordance previews state when closed.
 */
export function ColumnsDropdown({
  visibleColumns,
  toggleColumn,
}: {
  visibleColumns: Set<ColumnKey>
  toggleColumn: (key: ColumnKey) => void
}) {
  const hiddenCount = TOGGLEABLE_COLUMNS.length - visibleColumns.size
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] font-medium cursor-pointer"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
            }}
          >
            <GearSix size={13} strokeWidth={1.75} />
            Edit columns
            {hiddenCount > 0 && (
              <span
                className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10.5px] font-semibold"
                style={{
                  background: 'var(--accent-today-tint-strong)',
                  color: 'var(--accent-today)',
                }}
                aria-label={`${hiddenCount} hidden`}
              >
                {hiddenCount}
              </span>
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        {TOGGLEABLE_COLUMNS.map((col) => {
          const visible = visibleColumns.has(col.key)
          return (
            <DropdownMenuItem
              key={col.key}
              onClick={(e) => {
                e.preventDefault?.()
                toggleColumn(col.key)
              }}
              className="text-[13px] cursor-pointer"
            >
              {col.label}
              {visible && (
                <Check
                  size={12}
                  strokeWidth={2}
                  className="ml-auto"
                  style={{ color: 'var(--text-muted)' }}
                />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
