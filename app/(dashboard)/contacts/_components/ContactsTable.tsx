'use client'

import type { ColumnDef, ColumnId, ContactRow, SortDir } from '../_types'
import { ContactsTableRow } from './ContactsTableRow'
import { SortableHeader } from './SortableHeader'

/**
 * Scrollable contacts table. Sticky header keeps the column labels +
 * sort affordances pinned while the body scrolls.
 */
export function ContactsTable({
  rows,
  expanded,
  orderedColumns,
  sortBy,
  sortDir,
  onSort,
  onEditRow,
}: {
  rows: ContactRow[]
  expanded: boolean
  orderedColumns: ColumnDef[]
  sortBy: ColumnId | null
  sortDir: SortDir
  onSort: (id: ColumnId) => void
  onEditRow: (row: ContactRow) => void
}) {
  return (
    <div className="overflow-auto flex-1 min-h-0">
      <table className="w-full min-w-[760px]" style={{ tableLayout: 'fixed' }}>
        <thead
          className="sticky top-0 z-10"
          style={{ background: 'var(--surface-sunken)' }}
        >
          <tr>
            <th
              className="px-3 py-2.5 text-[11.5px] font-semibold whitespace-nowrap"
              style={{
                color: 'var(--text-muted)',
                minWidth: 110,
                width: 110,
              }}
            >
              Actions
            </th>
            {orderedColumns.map((col) => (
              <th
                key={col.id}
                className="px-3 py-2.5 text-[11.5px] font-semibold whitespace-nowrap"
                style={{
                  color: 'var(--text-muted)',
                  minWidth: col.minWidth,
                  width: col.minWidth,
                  textAlign: col.align ?? 'left',
                }}
              >
                <SortableHeader
                  col={col}
                  active={sortBy === col.id}
                  dir={sortDir}
                  onSort={() => onSort(col.id)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ContactsTableRow
              key={row.id}
              row={row}
              expanded={expanded}
              orderedColumns={orderedColumns}
              onEdit={() => onEditRow(row)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
