'use client'

import { CaretLeft, CaretRight } from '@phosphor-icons/react'

/**
 * Bottom paging row. Prev/Next icon buttons + "M–N of T" label.
 */
export function PaginationFooter({
  total,
  start,
  end,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  total: number
  start: number
  end: number
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-4 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      <button
        type="button"
        disabled={!canPrev}
        onClick={onPrev}
        aria-label="Previous page"
        className="h-8 w-8 rounded-md border flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.02]"
        style={{ borderColor: 'var(--border)', background: 'white' }}
      >
        <CaretLeft size={14} strokeWidth={2} style={{ color: 'var(--navy)' }} />
      </button>
      <button
        type="button"
        disabled={!canNext}
        onClick={onNext}
        aria-label="Next page"
        className="h-8 w-8 rounded-md border flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.02]"
        style={{ borderColor: 'var(--border)', background: 'white' }}
      >
        <CaretRight
          size={14}
          strokeWidth={2}
          style={{ color: 'var(--navy)' }}
        />
      </button>
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {total === 0 ? 'No results found' : `${start}–${end} of ${total}`}
      </span>
    </div>
  )
}
