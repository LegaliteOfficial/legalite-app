/**
 * Contacts list — static configuration.
 *
 * Kept narrow: the column registry lives in `_lib/columns.tsx` because
 * it carries JSX render functions. Everything here is plain data the
 * page reads at module-load time.
 */

import { Buildings, UserCircle } from '@phosphor-icons/react'
import type { ComponentType } from 'react'
import type { TypeFilter } from './_types'

/**
 * Colour palette for the contact-type pills. Sky tint identifies
 * people; violet identifies companies. Keep in sync with the row-
 * avatar tints in the `name` column renderer.
 */
export const TYPE_BADGE_PEOPLE = '#0EA5E9' // sky
export const TYPE_BADGE_COMPANIES = '#8B5CF6' // violet

interface TypeFilterDef {
  id: TypeFilter
  label: string
  Icon: ComponentType<{ size?: number; strokeWidth?: number }> | null
  color: string | null
}

export const TYPE_FILTERS: readonly TypeFilterDef[] = [
  { id: 'all', label: 'All', Icon: null, color: null },
  { id: 'people', label: 'People', Icon: UserCircle, color: TYPE_BADGE_PEOPLE },
  {
    id: 'companies',
    label: 'Companies',
    Icon: Buildings,
    color: TYPE_BADGE_COMPANIES,
  },
] as const

export const PAGE_SIZES = [25, 50, 100] as const

export const STORAGE_KEY_COLUMNS = 'll:contacts:visible-cols'
