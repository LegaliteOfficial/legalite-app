'use client'

import type { Case } from '@/types'
import type { ColumnDef, ColumnId, SortDir } from '../_types'
import { SortableHeader } from './SortableHeader'
import { CasesTableRow } from './CasesTableRow'

/**
 * The scrollable table area inside the card. The thead is sticky so the
 * column headers stay visible while the user scrolls vertically; the
 * action column on the right is sticky horizontally so its buttons stay
 * reachable when the user scrolls a wide column set sideways.
 */
export function CasesTable({
  rows,
  columns,
  sortBy,
  sortDir,
  onSort,
  expandRows,
  onRowClick,
  onEdit,
  onDelete,
}: {
  rows: Case[]
  columns: ColumnDef[]
  sortBy: ColumnId | null
  sortDir: SortDir
  onSort: (id: ColumnId) => void
  expandRows: boolean
  onRowClick: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string, name: string) => void
}) {
  return (
    // overflow-auto on a flex-1 / min-h-0 container is required for the
    // sticky thead and sticky action column to actually clip inside the
    // card. min-h-0 cascades from every flex-column ancestor.
    <div className="overflow-auto flex-1 min-h-0">
      <table className="w-full" style={{ tableLayout: 'fixed' }}>
        <thead className="sticky top-0 z-10" style={{ background: 'var(--surface-sunken)' }}>
          <tr>
            {columns.map((col) => (
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
            <th
              className="px-3 py-2.5 text-right text-[11.5px] font-semibold"
              style={{
                color: 'var(--text-muted)',
                minWidth: 96,
                width: 96,
                position: 'sticky',
                right: 0,
                background: 'var(--surface-sunken)',
              }}
            >
              {/* Row actions header — intentionally blank */}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <CasesTableRow
              key={row.id}
              row={row}
              columns={columns}
              expandRows={expandRows}
              onRowClick={onRowClick}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
