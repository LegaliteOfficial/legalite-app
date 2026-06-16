'use client'

import {
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretLeft,
  CaretRight,
  DownloadSimple,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { PAGE_SIZES } from '../_constants'
import { ExpandRowsToggle } from './ExpandRowsToggle'
import { IconNav } from './IconNav'
import { PageSizeDropdown } from './PageSizeDropdown'

type PageSize = (typeof PAGE_SIZES)[number]

/**
 * Sticky footer under the contacts table — pagination on the left,
 * page-size / density / export on the right.
 */
export function PaginationFooter({
  page,
  totalPages,
  start,
  end,
  totalCount,
  pageSize,
  onPageSize,
  expanded,
  onExpanded,
  onFirst,
  onPrev,
  onNext,
  onLast,
  exportDisabled,
  onExport,
}: {
  page: number
  totalPages: number
  start: number
  end: number
  totalCount: number
  pageSize: PageSize
  onPageSize: (v: PageSize) => void
  expanded: boolean
  onExpanded: (v: boolean) => void
  onFirst: () => void
  onPrev: () => void
  onNext: () => void
  onLast: () => void
  exportDisabled: boolean
  onExport: () => void
}) {
  const atStart = page === 0
  const atEnd = page >= totalPages - 1
  return (
    <div
      className="flex items-center justify-between px-3 py-2.5 border-t"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="flex items-center gap-1">
        <IconNav onClick={onFirst} disabled={atStart} aria-label="First page">
          <CaretDoubleLeft size={14} strokeWidth={1.75} />
        </IconNav>
        <IconNav onClick={onPrev} disabled={atStart} aria-label="Previous page">
          <CaretLeft size={14} strokeWidth={1.75} />
        </IconNav>
        <IconNav onClick={onNext} disabled={atEnd} aria-label="Next page">
          <CaretRight size={14} strokeWidth={1.75} />
        </IconNav>
        <IconNav onClick={onLast} disabled={atEnd} aria-label="Last page">
          <CaretDoubleRight size={14} strokeWidth={1.75} />
        </IconNav>
        <span
          className="ml-2 text-[12px] tabular-nums"
          style={{ color: 'var(--text-muted)' }}
        >
          {totalCount === 0 ? '0–0 of 0' : `${start + 1}–${end} of ${totalCount}`}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <PageSizeDropdown value={pageSize} onChange={onPageSize} />
        <ExpandRowsToggle expanded={expanded} onChange={onExpanded} />
        <Button
          variant="outline"
          size="sm"
          disabled={exportDisabled}
          onClick={onExport}
        >
          <DownloadSimple size={13} strokeWidth={1.75} />
          Export
        </Button>
      </div>
    </div>
  )
}
