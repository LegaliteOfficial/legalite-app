'use client'

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PageSize } from '../_types'
import { ExpandRowsToggle } from './ExpandRowsToggle'
import { IconNav } from './IconNav'
import { PageSizeDropdown } from './PageSizeDropdown'

/**
 * Card footer: page nav + row count on the left, page size +
 * expand-rows + export on the right.
 */
export function PaginationFooter({
  page,
  totalPages,
  start,
  end,
  total,
  pageSize,
  expandRows,
  canExport,
  onPageChange,
  onPageSizeChange,
  onExpandRowsChange,
  onExport,
}: {
  page: number
  totalPages: number
  start: number
  end: number
  total: number
  pageSize: PageSize
  expandRows: boolean
  canExport: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSize) => void
  onExpandRowsChange: (expanded: boolean) => void
  onExport: () => void
}) {
  const atFirst = page === 0
  const atLast = page >= totalPages - 1

  return (
    <div
      className="flex items-center justify-between px-3 py-2.5 border-t"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="flex items-center gap-1">
        <IconNav onClick={() => onPageChange(0)} disabled={atFirst} aria-label="First page">
          <ChevronsLeft size={14} strokeWidth={1.75} />
        </IconNav>
        <IconNav
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={atFirst}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
        </IconNav>
        <IconNav
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={atLast}
          aria-label="Next page"
        >
          <ChevronRight size={14} strokeWidth={1.75} />
        </IconNav>
        <IconNav
          onClick={() => onPageChange(totalPages - 1)}
          disabled={atLast}
          aria-label="Last page"
        >
          <ChevronsRight size={14} strokeWidth={1.75} />
        </IconNav>
        <span
          className="ml-2 text-[12px] tabular-nums"
          style={{ color: 'var(--text-muted)' }}
        >
          {total === 0 ? '0–0 of 0' : `${start + 1}–${end} of ${total}`}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <PageSizeDropdown value={pageSize} onChange={onPageSizeChange} />
        <ExpandRowsToggle expanded={expandRows} onChange={onExpandRowsChange} />
        <Button variant="outline" size="sm" disabled={!canExport} onClick={onExport}>
          <Download size={13} strokeWidth={1.75} />
          Export
        </Button>
      </div>
    </div>
  )
}
