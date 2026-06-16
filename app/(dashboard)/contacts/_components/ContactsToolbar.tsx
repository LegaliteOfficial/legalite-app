'use client'

import { MagnifyingGlass } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { TYPE_FILTERS } from '../_constants'
import type { ContactRoleFilter, ColumnId, TypeFilter } from '../_types'
import { BulkActionsBar } from './BulkActionsBar'
import { ColumnsPicker } from './ColumnsPicker'
import { FiltersPopover } from './FiltersPopover'

/**
 * Tools row above the table — type-filter pills (or the bulk-actions
 * strip when rows are selected), search input, columns picker, filters
 * popover.
 */
export function ContactsToolbar({
  typeFilter,
  setTypeFilter,
  typeCounts,
  search,
  setSearch,
  visibleColumns,
  setVisibleColumns,
  contactRoleFilter,
  contactTagsFilter,
  setContactRoleFilter,
  setContactTagsFilter,
  selectedCount,
  onClearSelection,
  onDeleteSelected,
}: {
  typeFilter: TypeFilter
  setTypeFilter: (v: TypeFilter) => void
  typeCounts: Record<TypeFilter, number>
  search: string
  setSearch: (v: string) => void
  visibleColumns: Set<ColumnId>
  setVisibleColumns: (next: Set<ColumnId>) => void
  contactRoleFilter: ContactRoleFilter
  contactTagsFilter: string[]
  setContactRoleFilter: (v: ContactRoleFilter) => void
  setContactTagsFilter: (v: string[]) => void
  selectedCount: number
  onClearSelection: () => void
  onDeleteSelected: () => void
}) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
      {selectedCount > 0 ? (
        <BulkActionsBar
          count={selectedCount}
          onClearSelection={onClearSelection}
          onDelete={onDeleteSelected}
        />
      ) : (
        <div className="flex items-center gap-1">
          {TYPE_FILTERS.map((t) => {
            const isActive = typeFilter === t.id
            const count = typeCounts[t.id]
            const TIcon = t.Icon
            return (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors"
                style={{
                  background: isActive
                    ? 'var(--surface-sunken)'
                    : 'transparent',
                  color: isActive
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = 'var(--surface-overlay)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                {TIcon && (
                  <span
                    className="inline-flex items-center justify-center h-5 w-5 rounded-md shrink-0"
                    style={{
                      background: `${t.color}26`,
                      color: t.color ?? 'var(--text-muted)',
                    }}
                    aria-hidden
                  >
                    <TIcon size={12} strokeWidth={2} />
                  </span>
                )}
                {t.label}
                <span
                  className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 rounded-full text-[10.5px] font-medium tabular-nums"
                  style={{
                    background: isActive
                      ? 'var(--surface-card)'
                      : 'var(--surface-sunken)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative w-64">
          <MagnifyingGlass
            size={13}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-subtle)' }}
          />
          <Input
            placeholder="Filter by keyword"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-[13px] rounded-lg"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
            }}
          />
        </div>

        <ColumnsPicker
          visible={visibleColumns}
          onChange={setVisibleColumns}
        />

        <FiltersPopover
          role={contactRoleFilter}
          tags={contactTagsFilter}
          onApply={(r, t) => {
            setContactRoleFilter(r)
            setContactTagsFilter(t)
          }}
          onClear={() => {
            setContactRoleFilter(null)
            setContactTagsFilter([])
          }}
        />
      </div>
    </div>
  )
}
