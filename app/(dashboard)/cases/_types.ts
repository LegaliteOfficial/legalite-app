/**
 * Shared types for the cases list view. Kept at the route root so the
 * page, hooks, lib, and components folders all read from a single source
 * of truth.
 */

export type ColumnId =
  | 'client'
  | 'responsible'
  | 'originating'
  | 'practice_area'
  | 'case_stage'
  | 'open_date'
  | 'close_date'
  | 'pending_date'
  | 'notifications'
  | 'title'
  | 'case_code'
  | 'court'
  | 'suit_number'
  | 'next_date'
  | 'status'

export type SortDir = 'asc' | 'desc'

export type CasesTab = 'cases' | 'stages'

export const STATUS_FILTERS = ['All', 'Open', 'Pending', 'Closed'] as const
export type StatusFilter = (typeof STATUS_FILTERS)[number]

export const PAGE_SIZES = [25, 50, 100] as const
export type PageSize = (typeof PAGE_SIZES)[number]

/**
 * Filter state for the side drawer. Mirrors the reference panel
 * field-for-field. Empty string / undefined means "no constraint".
 *
 * Fields whose backing data we don't have yet (responsible_staff, tags,
 * admin_view, billable_status, permissions, blocked_users,
 * status_date_*) render in the UI for visual fidelity but pass through
 * to filtered() as no-ops until the matching backend columns ship.
 */
export interface CaseFilters {
  client?: string
  responsible_lawyer?: string
  originating_lawyer?: string
  responsible_staff?: string
  notifications?: string
  tags?: string
  admin_view?: string
  billable_status?: string
  last_activity_from?: string
  last_activity_to?: string
  permissions?: string
  practice_area?: string
  blocked_users?: string
  status_date_from?: string
  status_date_to?: string
}

export const EMPTY_FILTERS: CaseFilters = {}

import type { Case } from '@/types'

export interface ColumnDef {
  id: ColumnId
  label: string
  defaultVisible: boolean
  /** Minimum width so the header stays on one line and the whole table
   *  overflows horizontally instead of stacking heading text. */
  minWidth: number
  align?: 'left' | 'right'
  /** Whether the column header gets a clickable sort affordance. */
  sortable?: boolean
  /** Comparable value for in-memory sorts. Use for dates (ISO timestamps)
   *  so sorts respect chronology, not the user-facing string. */
  sortValue?: (row: Case) => string | number | null
  render: (row: Case, expanded: boolean) => React.ReactNode
  /** Plain-text export getter for the CSV pipeline. Required when render
   *  returns JSX. */
  csv?: (row: Case) => string
}

export interface OptionGroup {
  label: string
  options: readonly string[]
}
