/**
 * Pull the comparable value for a row given a sort key. Falls back to
 * empty string so undefined fields sort consistently rather than
 * crashing the comparator.
 */

import type { Case, Client } from '@/types'
import type { SortKey } from '../_types'

export function sortValue(
  c: Client,
  key: SortKey,
  primaryByClient: Map<string, Case>,
): string {
  if (key === 'phone') return (c.phone ?? '').toLowerCase()
  if (key === 'email') return (c.email ?? '').toLowerCase()
  if (key === 'status') {
    const pc = primaryByClient.get(c.id)
    return (pc?.status ?? 'zzz').toLowerCase()
  }
  // 'assigned' — today we sort by user_id; once real assignment data
  // lands this picks up the leading assignee name.
  return (c.user_id ?? '').toLowerCase()
}
