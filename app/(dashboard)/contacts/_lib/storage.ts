/**
 * localStorage round-trip for the user's column visibility preference.
 * SSR-safe (returns the default set when window is absent) so the
 * page renders consistently before hydration.
 */

import { STORAGE_KEY_COLUMNS } from '../_constants'
import { COLUMNS } from './columns'
import type { ColumnId } from '../_types'

function defaultVisible(): Set<ColumnId> {
  return new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id))
}

export function loadVisibleColumns(): Set<ColumnId> {
  if (typeof window === 'undefined') return defaultVisible()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_COLUMNS)
    if (!raw) return defaultVisible()
    const parsed = JSON.parse(raw) as ColumnId[]
    const known = new Set(COLUMNS.map((c) => c.id))
    return new Set(
      parsed.filter((id): id is ColumnId => known.has(id as ColumnId)),
    )
  } catch {
    return defaultVisible()
  }
}

export function saveVisibleColumns(visible: Set<ColumnId>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      STORAGE_KEY_COLUMNS,
      JSON.stringify(Array.from(visible)),
    )
  } catch {
    /* localStorage full or disabled — non-critical */
  }
}
