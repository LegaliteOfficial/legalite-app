/**
 * CSV export of the currently-visible rows + columns. Triggers a
 * download client-side via a temporary blob URL — no backend touch.
 */

import { COLUMNS } from './columns'
import type { ColumnId, ContactRow } from '../_types'

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function exportToCsv(
  rows: ContactRow[],
  visibleColumnIds: ColumnId[],
) {
  const visibleColumns = COLUMNS.filter((c) => visibleColumnIds.includes(c.id))
  const header = visibleColumns.map((c) => csvEscape(c.label)).join(',')
  const body = rows
    .map((row) =>
      visibleColumns.map((c) => csvEscape(c.csv?.(row) ?? '')).join(','),
    )
    .join('\n')
  const csv = `${header}\n${body}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
