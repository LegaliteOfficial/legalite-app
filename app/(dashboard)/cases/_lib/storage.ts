/**
 * Persistence helpers for column visibility. localStorage-backed so the
 * user's column choices survive refresh without a server round-trip.
 */

import type { ColumnId } from '../_types'
import { STORAGE_KEY_COLUMNS } from '../_constants'
import { COLUMNS } from './columns'

const defaultVisibleSet = () =>
  new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id))

export function loadVisibleColumns(): Set<ColumnId> {
  if (typeof window === 'undefined') return defaultVisibleSet()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_COLUMNS)
    if (!raw) return defaultVisibleSet()
    const parsed = JSON.parse(raw) as ColumnId[]
    // Drop IDs that no longer exist in COLUMNS so the picker doesn't hold
    // stale entries after a schema change.
    const known = new Set(COLUMNS.map((c) => c.id))
    return new Set(
      parsed.filter((id): id is ColumnId => known.has(id as ColumnId)),
    )
  } catch {
    return defaultVisibleSet()
  }
}

export function persistVisibleColumns(visible: Set<ColumnId>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      STORAGE_KEY_COLUMNS,
      JSON.stringify(Array.from(visible)),
    )
  } catch {
    /* localStorage full or disabled — non-critical, drop silently */
  }
}
