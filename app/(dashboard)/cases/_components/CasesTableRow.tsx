'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PriorityButton } from '@/components/shared/PriorityButton'
import type { Case } from '@/types'
import type { ColumnDef } from '../_types'

/**
 * One table row. Clicking anywhere on the row navigates to the detail
 * page; the sticky action cell on the right stops propagation so its
 * buttons don't trigger the navigation.
 */
export function CasesTableRow({
  row,
  columns,
  expandRows,
  onRowClick,
  onEdit,
  onDelete,
}: {
  row: Case
  columns: ColumnDef[]
  expandRows: boolean
  onRowClick: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string, name: string) => void
}) {
  const padding = expandRows ? 'py-3.5' : 'py-2'

  return (
    <tr
      onClick={() => onRowClick(row.id)}
      className="border-t group cursor-pointer"
      style={{ borderColor: 'var(--border-soft)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-overlay)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {columns.map((col) => (
        <td
          key={col.id}
          // Cells truncate with ellipsis when the value overflows; full
          // value surfaces in the title attribute for hover.
          className={`px-3 ${padding} overflow-hidden text-ellipsis whitespace-nowrap`}
          style={{
            textAlign: col.align ?? 'left',
            maxWidth: col.minWidth,
          }}
          title={col.csv?.(row)}
        >
          {col.render(row, expandRows)}
        </td>
      ))}
      <td
        className={`px-3 ${padding} text-right`}
        style={{
          position: 'sticky',
          right: 0,
          // Inherit row background so the sticky cell doesn't show stale
          // color when the rest of the row repaints on hover.
          background: 'inherit',
        }}
      >
        <div
          className="flex gap-0.5 justify-end items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Priority star is always visible — doubles as an at-a-glance
              flag indicator. */}
          <PriorityButton
            entityType="case"
            entityId={row.id}
            label={row.title}
            metadata={{
              next_court_date: row.next_court_date ?? null,
              case_code: row.case_code ?? null,
            }}
          />
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(row.id)}
              aria-label="Edit case"
            >
              <Pencil size={13} style={{ color: 'var(--text-muted)' }} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(row.id, row.title)}
              aria-label="Delete case"
            >
              <Trash2 size={13} style={{ color: 'var(--text-muted)' }} />
            </Button>
          </div>
        </div>
      </td>
    </tr>
  )
}
