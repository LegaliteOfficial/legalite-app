'use client'

import { CaretDown } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PAGE_SIZES } from '../_constants'
import type { PageSize } from '../_types'

export function PageSizeDropdown({
  value,
  onChange,
}: {
  value: PageSize
  onChange: (v: PageSize) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-medium border"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-secondary)',
            }}
          >
            {value} <CaretDown size={11} strokeWidth={1.75} />
          </button>
        }
      />
      <DropdownMenuContent align="end">
        {PAGE_SIZES.map((size) => (
          <DropdownMenuItem
            key={size}
            onSelect={() => onChange(size)}
            className="text-[12.5px]"
          >
            {size} per page
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
