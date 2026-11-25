'use client'

import { useCallback, useMemo, useState } from 'react'
import type {
  CaseFilters,
  CasesTab,
  ColumnId,
  PageSize,
  SortDir,
  StatusFilter,
} from '../_types'
import { EMPTY_FILTERS } from '../_constants'
import { COLUMNS } from '../_lib/columns'
import { countActiveFilters } from '../_lib/filters'
import {
  defaultVisibleColumns,
  parseVisibleColumns,
  serializeVisibleColumns,
} from '../_lib/storage'
import { STORAGE_KEY_COLUMNS } from '../_constants'
import { usePersistedState } from '@/hooks/use-persisted-state'
import { useKeyedPage } from '@/hooks/use-keyed-page'

/**
 * Owns all UI state for the cases list view: tabs, status filter,
 * search, columns, pagination, sort, drawer open/close, and the
 * applied filter state. Returns a flat object so the page component
 * can pass slices into sub-components without prop-drilling concerns.
 */
export function useCasesPageState() {
  const [activeTab, setActiveTab] = useState<CasesTab>('cases')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Open')
  const [search, setSearch] = useState('')
  const [visibleColumns, setVisibleColumns] = usePersistedState<Set<ColumnId>>(
    STORAGE_KEY_COLUMNS,
    defaultVisibleColumns,
    parseVisibleColumns,
    serializeVisibleColumns,
  )
  const [expandRows, setExpandRows] = useState(false)
  const [pageSize, setPageSize] = useState<PageSize>(25)
  const [sortBy, setSortBy] = useState<ColumnId | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<CaseFilters>(EMPTY_FILTERS)
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false)

  // Back to page 0 whenever the working set changes, otherwise switching
  // filters can leave the user on a page that no longer exists.
  const [page, setPage] = useKeyedPage([statusFilter, search, pageSize, filters])

  /**
   * Tri-state sort click on the same column: asc → desc → none.
   * Switching columns always starts fresh in asc.
   */
  const handleSort = useCallback((id: ColumnId) => {
    if (sortBy !== id) {
      setSortBy(id)
      setSortDir('asc')
      return
    }
    if (sortDir === 'asc') {
      setSortDir('desc')
      return
    }
    setSortBy(null)
    setSortDir('asc')
  }, [sortBy, sortDir])

  const clearFilters = useCallback(() => {
    setSearch('')
    setStatusFilter('All')
  }, [])

  const orderedVisibleColumns = useMemo(
    () => COLUMNS.filter((c) => visibleColumns.has(c.id)),
    [visibleColumns],
  )

  const hasFiltersActive =
    statusFilter !== 'All' || search.trim().length > 0

  const activeFilterCount = countActiveFilters(filters)

  return {
    // tabs
    activeTab, setActiveTab,
    // primary filters
    statusFilter, setStatusFilter,
    search, setSearch,
    // columns
    visibleColumns, setVisibleColumns, orderedVisibleColumns,
    // pagination
    page, setPage,
    pageSize, setPageSize,
    // sort
    sortBy, sortDir, handleSort,
    // density
    expandRows, setExpandRows,
    // drawer
    filtersOpen, setFiltersOpen,
    filters, setFilters,
    activeFilterCount,
    // tags dialog
    tagsDialogOpen, setTagsDialogOpen,
    // derived
    hasFiltersActive,
    clearFilters,
  }
}

export type CasesPageState = ReturnType<typeof useCasesPageState>
