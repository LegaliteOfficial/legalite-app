'use client'

import { CaretDown, Columns } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ColumnId } from '../_types'
import { COLUMNS } from '../_lib/columns'

export function ColumnsPicker({
  visible,
  onChange,
}: {
  visible: Set<ColumnId>
  onChange: (next: Set<ColumnId>) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        // Base UI List.Trigger always renders its own <button>. We use the
        // `render` prop (NOT `asChild` — that's a Radix-ism) so it composes
        // with our Button rather than wrapping it.
        render={
          <Button variant="outline" size="sm">
            <Columns size={13} strokeWidth={1.75} />
            Columns
            <CaretDown size={12} strokeWidth={1.75} />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <div
          className="px-2 py-1.5 text-[10.5px] uppercase tracking-wider font-semibold"
          style={{ color: 'var(--text-muted)' }}
        >
          Visible columns
        </div>
        <DropdownMenuSeparator />
        {COLUMNS.map((col) => {
          const checked = visible.has(col.id)
          return (
            <DropdownMenuItem
              key={col.id}
              // Base UI's List.Item fires `onClick`. `closeOnClick={false}`
              // keeps the menu open so the user can toggle several columns
              // in one go without re-opening.
              closeOnClick={false}
              onClick={() => {
                const next = new Set(visible)
                if (checked) next.delete(col.id)
                else next.add(col.id)
                onChange(next)
              }}
              className="cursor-pointer"
            >
              <span
                className="inline-flex h-3.5 w-3.5 mr-2 items-center justify-center rounded-sm border"
                style={{
                  borderColor: checked ? 'var(--gold)' : 'var(--border-default)',
                  background: checked ? 'var(--gold)' : 'transparent',
                }}
              >
                {checked && (
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6.5L5 9.5L10 3.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              {col.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
