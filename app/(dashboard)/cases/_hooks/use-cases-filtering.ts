'use client'

import { useMemo } from 'react'
import type { Case, CaseStatus } from '@/types'
import type { CasesPageState } from './use-cases-page-state'
import type { StatusFilter } from '../_types'
import { COLUMNS } from '../_lib/columns'
import { applyDrawerFilters } from '../_lib/filters'

/**
 * Derives the visible page rows + supporting metadata from the raw
 * case list. Read-only — only the page-state hook mutates state.
 *
 *  - statusCounts feeds the status pill counters
 *  - sorted is the full filtered+sorted set (used by CSV export)
 *  - pageRows is the slice the table renders
 */
export function useCasesFiltering(
  all: Case[],
  state: Pick<
    CasesPageState,
    | 'statusFilter'
    | 'search'
    | 'filters'
    | 'sortBy'
    | 'sortDir'
    | 'page'
    | 'pageSize'
  >,
) {
  const { statusFilter, search, filters, sortBy, sortDir, page, pageSize } = state

  const statusCounts = useMemo<Record<StatusFilter, number>>(() => {
    const counts: Record<StatusFilter, number> = {
      All: all.length,
      Open: 0,
      Pending: 0,
      Closed: 0,
    }
    for (const c of all) {
      const s = (c.status ?? 'Open') as CaseStatus
      counts[s] = (counts[s] ?? 0) + 1
    }
    return counts
  }, [all])

  const filtered = useMemo(() => {
    const byStatus =
      statusFilter === 'All'
        ? all
        : all.filter((c) => (c.status ?? 'Open') === statusFilter)
    const q = search.trim().toLowerCase()
    const bySearch = !q
      ? byStatus
      : byStatus.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.client_name?.toLowerCase().includes(q) ||
          c.case_code?.toLowerCase().includes(q) ||
          c.suit_number?.toLowerCase().includes(q) ||
          c.court?.toLowerCase().includes(q) ||
          c.assigned_lawyer?.toLowerCase().includes(q) ||
          c.originating_lawyer?.toLowerCase().includes(q) ||
          c.case_type?.toLowerCase().includes(q) ||
          c.case_stage?.toLowerCase().includes(q),
      )
    return applyDrawerFilters(bySearch, filters)
  }, [all, statusFilter, search, filters])

  // Sort after filtering, before pagination, so the user always sees a
  // sorted view across the full filtered set rather than per-page.
  const sorted = useMemo(() => {
    if (!sortBy) return filtered
    const col = COLUMNS.find((c) => c.id === sortBy)
    if (!col?.sortValue) return filtered
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      // Nulls always sort last regardless of direction.
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [filtered, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * pageSize
  const end = Math.min(start + pageSize, sorted.length)
  const pageRows = sorted.slice(start, end)

  return {
    statusCounts,
    sorted,
    pageRows,
    totalPages,
    safePage,
    start,
    end,
  }
}
