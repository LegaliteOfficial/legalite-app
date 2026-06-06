/**
 * CSV export of the visible/filtered case rows.
 *
 * Generates the CSV from the column registry rather than the row shape
 * directly so the export always matches what's visually shown — what
 * you see in the table is what you get in the file.
 */

import type { Case } from '@/types'
import type { ColumnId } from '../_types'
import { COLUMNS } from './columns'

export function exportToCsv(rows: Case[], visibleColumnIds: ColumnId[]) {
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
  link.download = `cases-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
