/**
 * Static option lists and persistence keys for the cases list view.
 * Re-exports the type unions from _types so consumers can import from
 * one place.
 */

export {
  STATUS_FILTERS,
  PAGE_SIZES,
  EMPTY_FILTERS,
} from './_types'
export type {
  StatusFilter,
  PageSize,
  CaseFilters,
} from './_types'

export const ADMIN_VIEW_OPTIONS = [
  'Cases I have full access to',
  'Cases I am restricted from',
] as const

export const BILLABLE_STATUS_OPTIONS = [
  'Billable case',
  'Non-billable case',
] as const

export const STORAGE_KEY_COLUMNS = 'll:cases:visible-cols'
