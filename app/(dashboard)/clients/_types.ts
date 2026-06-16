/**
 * Clients list — shape types.
 *
 * Display types only — the row data is `Client` from `@/types`. These
 * are the keys the page tracks for sorting, filtering, and column
 * visibility.
 */

import type { CREATED_ON_OPTIONS, TABS, TOGGLEABLE_COLUMNS } from './_constants'

export type TabKey = (typeof TABS)[number]

export type SortKey = 'phone' | 'email' | 'status' | 'assigned'
export type SortDir = 'asc' | 'desc'

export interface SortState {
  key: SortKey | null
  dir: SortDir
}

export type ClientStatusKey = 'Active' | 'Inactive'

export type CreatedOnKey = (typeof CREATED_ON_OPTIONS)[number]['key']

export type ColumnKey = (typeof TOGGLEABLE_COLUMNS)[number]['key']
