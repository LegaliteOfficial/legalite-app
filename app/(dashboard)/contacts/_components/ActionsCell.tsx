'use client'

import { CaretDown, Receipt } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ContactRow } from '../_types'

/**
 * Per-row action cell — Edit as the primary click target, with a
 * chevron dropdown that surfaces secondary actions. Today the dropdown
 * carries a single "Bill" item; Delete lives on the bulk-actions
 * toolbar so deletion is intentional rather than one-click per row.
 */
export function ActionsCell({
  row,
  onEdit,
  onBill,
}: {
  row: ContactRow
  onEdit: () => void
  onBill: () => void
}) {
  return (
    // Stop click propagation at the wrapper so the parent <tr>'s
    // row-click navigation doesn't fire when users press Edit or open
    // the chevron menu.
    <div className="inline-flex" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 px-2.5 h-7 rounded-l-md border text-[12.5px] font-medium transition-colors cursor-pointer"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--surface-sunken)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--surface-card)'
        }}
      >
        Edit
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="inline-flex items-center justify-center h-7 w-7 rounded-r-md border border-l-0 cursor-pointer"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-muted)',
              }}
              aria-label={`More actions for ${row.full_name}`}
            >
              <CaretDown size={12} strokeWidth={1.75} />
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={onBill}
            className="cursor-pointer text-[12.5px]"
          >
            <Receipt size={12} strokeWidth={1.75} /> Bill
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
