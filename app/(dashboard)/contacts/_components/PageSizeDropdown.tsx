'use client'

import { CaretDown } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PAGE_SIZES } from '../_constants'

type PageSize = (typeof PAGE_SIZES)[number]

/**
 * "25/50/100 per page" dropdown. Sits next to the pagination footer.
 */
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
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-medium border cursor-pointer"
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
            onClick={() => onChange(size)}
            className="text-[12.5px]"
          >
            {size} per page
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
