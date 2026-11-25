/**
 * localStorage round-trip for the user's column visibility preference.
 * SSR-safe (returns the default set when window is absent) so the
 * page renders consistently before hydration.
 */

import { COLUMNS } from './columns'
import type { ColumnId } from '../_types'

function defaultVisible(): Set<ColumnId> {
  return new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id))
}

export const defaultVisibleColumns = defaultVisible

/** Reads the saved column list; unknown or unreadable data gives the defaults. */
export function parseVisibleColumns(raw: string): Set<ColumnId> {
  try {
    const parsed = JSON.parse(raw) as ColumnId[]
    const known = new Set(COLUMNS.map((c) => c.id))
    return new Set(
      parsed.filter((id): id is ColumnId => known.has(id as ColumnId)),
    )
  } catch {
    return defaultVisible()
  }
}

export function serializeVisibleColumns(visible: Set<ColumnId>): string {
  return JSON.stringify(Array.from(visible))
}
