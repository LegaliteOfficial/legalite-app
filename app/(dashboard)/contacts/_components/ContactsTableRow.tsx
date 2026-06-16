'use client'

import { useRouter } from 'next/navigation'
import type { ColumnDef, ContactRow } from '../_types'
import { ActionsCell } from './ActionsCell'

/**
 * One <tr> in the contacts table. Click navigates to the contact's
 * detail page; the checkbox + ActionsCell stop propagation so they
 * don't trigger that navigation.
 */
export function ContactsTableRow({
  row,
  expanded,
  selected,
  orderedColumns,
  onToggleSelected,
  onEdit,
  onBill,
}: {
  row: ContactRow
  expanded: boolean
  selected: boolean
  orderedColumns: ColumnDef[]
  onToggleSelected: () => void
  onEdit: () => void
  onBill: () => void
}) {
  const router = useRouter()
  const padY = expanded ? 'py-3.5' : 'py-2'
  return (
    <tr
      onClick={() => router.push(`/contacts/${row.id}`)}
      className="border-t group transition-colors cursor-pointer"
      style={{ borderColor: 'var(--border-soft)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-overlay)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <td className={`px-3 ${padY}`}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelected}
          aria-label={`Select ${row.full_name}`}
          className="cursor-pointer"
          style={{ accentColor: 'var(--gold)' }}
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      <td className={`px-3 ${padY}`}>
        <ActionsCell row={row} onEdit={onEdit} onBill={onBill} />
      </td>
      {orderedColumns.map((col) => (
        <td
          key={col.id}
          className={`px-3 ${padY} overflow-hidden whitespace-nowrap`}
          style={{
            textAlign: col.align ?? 'left',
            maxWidth: col.minWidth,
          }}
          title={col.csv?.(row)}
        >
          {col.render(row, expanded)}
        </td>
      ))}
    </tr>
  )
}
