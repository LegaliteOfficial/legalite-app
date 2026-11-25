/**
 * Persistence helpers for column visibility. localStorage-backed so the
 * user's column choices survive refresh without a server round-trip.
 */

import type { ColumnId } from '../_types'
import { COLUMNS } from './columns'

const defaultVisibleSet = () =>
  new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id))

export const defaultVisibleColumns = defaultVisibleSet

/** Reads the saved column list; unknown or unreadable data gives the defaults. */
export function parseVisibleColumns(raw: string): Set<ColumnId> {
  try {
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

export function serializeVisibleColumns(visible: Set<ColumnId>): string {
  return JSON.stringify(Array.from(visible))
}
