/**
 * Pure helpers used by the filter drawer and the filtering hook.
 */

import type { Case } from '@/types'
import type { CaseFilters } from '../_types'

export function countActiveFilters(f: CaseFilters): number {
  return Object.values(f).filter((v) => v != null && v !== '').length
}

/**
 * Narrow the case list using the drawer's filter state. Only fields
 * backed by columns we already have (client, lawyers, practice_area,
 * last activity date) actually constrain results today. Other fields
 * are silently passed through — they'll start filtering once the
 * matching schema fields land.
 */
export function applyDrawerFilters(rows: Case[], f: CaseFilters): Case[] {
  return rows.filter((row) => {
    if (f.client && row.client_name !== f.client) return false
    if (f.responsible_lawyer && row.assigned_lawyer !== f.responsible_lawyer) return false
    if (f.originating_lawyer && row.originating_lawyer !== f.originating_lawyer) return false
    if (f.practice_area && row.case_type !== f.practice_area) return false
    if (f.last_activity_from) {
      const t = new Date(row.updated_at).getTime()
      const from = new Date(f.last_activity_from).getTime()
      if (Number.isFinite(from) && t < from) return false
    }
    if (f.last_activity_to) {
      const t = new Date(row.updated_at).getTime()
      // end-of-day so a single day picks up rows updated any time that day
      const to = new Date(f.last_activity_to).getTime() + 24 * 60 * 60 * 1000 - 1
      if (Number.isFinite(to) && t > to) return false
    }
    return true
  })
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
