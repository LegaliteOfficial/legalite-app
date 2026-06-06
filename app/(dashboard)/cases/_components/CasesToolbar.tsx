'use client'

import { ChevronDown, Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { STATUS_FILTERS } from '../_constants'
import type { ColumnId, StatusFilter } from '../_types'
import { ColumnsPicker } from './ColumnsPicker'

/**
 * Below the Cases/Stages tabs: status pills on the left, search +
 * columns picker + filters button on the right.
 */
export function CasesToolbar({
  statusFilter,
  onStatusChange,
  statusCounts,
  search,
  onSearchChange,
  visibleColumns,
  onColumnsChange,
  activeFilterCount,
  onOpenFilters,
}: {
  statusFilter: StatusFilter
  onStatusChange: (s: StatusFilter) => void
  statusCounts: Record<StatusFilter, number>
  search: string
  onSearchChange: (s: string) => void
  visibleColumns: Set<ColumnId>
  onColumnsChange: (next: Set<ColumnId>) => void
  activeFilterCount: number
  onOpenFilters: () => void
}) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-1">
        {STATUS_FILTERS.map((s) => {
          const isActive = statusFilter === s
          return (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors"
              style={{
                background: isActive ? 'var(--surface-sunken)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = 'var(--surface-overlay)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              {s}
              <span
                className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 rounded-full text-[10.5px] font-medium tabular-nums"
                style={{
                  background: isActive
                    ? 'var(--surface-card)'
                    : 'var(--surface-sunken)',
                  color: 'var(--text-muted)',
                }}
              >
                {statusCounts[s] ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-64">
          <Search
            size={13}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-subtle)' }}
          />
          <Input
            placeholder="Search cases…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-[13px] rounded-lg"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
            }}
          />
        </div>

        <ColumnsPicker visible={visibleColumns} onChange={onColumnsChange} />

        <Button variant="outline" size="sm" onClick={onOpenFilters}>
          <Filter size={13} strokeWidth={1.75} />
          Filters
          {activeFilterCount > 0 && (
            <span
              className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 rounded-full text-[10.5px] font-semibold tabular-nums"
              style={{ background: 'var(--gold)', color: 'var(--navy)' }}
            >
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={12} strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  )
}
