'use client'

import type { Assignee } from '@/hooks/use-client-assignees'
import type { Case, Client } from '@/types'
import type {
  ClientStatusKey,
  ColumnKey,
  CreatedOnKey,
  SortKey,
  SortState,
  TabKey,
} from '../_types'
import { ClientsTableRow } from './ClientsTableRow'
import { SelectAllCheckbox } from './SelectAllCheckbox'
import { SortHeader } from './SortHeader'

/**
 * Clients table card. Sticky header with sortable columns, body of
 * rows, empty-state cell when nothing matches the current filters.
 */
export function ClientsTable({
  rows,
  primaryCaseByClient,
  assigneesByClient,
  selected,
  allSelected,
  someSelected,
  showColumn,
  visibleColumns,
  sort,
  toggleSort,
  toggleAll,
  toggleOne,
  onManageRow,
  onViewRow,
  onEditRow,
  onAssignCaseRow,
  onStartTimerRow,
  onDeleteRow,
  // Empty-state inputs — used to pick the right message when zero rows.
  search,
  tab,
  assignedToCount,
  statusFilterCount,
  createdOnFilter,
}: {
  rows: Client[]
  primaryCaseByClient: Map<string, Case>
  assigneesByClient: Map<string, Assignee[]>
  selected: Set<string>
  allSelected: boolean
  someSelected: boolean
  showColumn: (key: ColumnKey) => boolean
  visibleColumns: Set<ColumnKey>
  sort: SortState
  toggleSort: (key: SortKey) => void
  toggleAll: () => void
  toggleOne: (id: string) => void
  onManageRow: (client: Client) => void
  onViewRow: (client: Client) => void
  onEditRow: (client: Client) => void
  onAssignCaseRow: (client: Client) => void
  onStartTimerRow: (client: Client) => void
  onDeleteRow: (client: Client) => void
  search: string
  tab: TabKey
  assignedToCount: number
  statusFilterCount: number
  createdOnFilter: CreatedOnKey
}) {
  // Always-visible columns are checkbox + Client + row menu (3); plus
  // however many toggleable columns are currently visible.
  const totalColSpan = 3 + visibleColumns.size

  const emptyMessage = search.trim()
    ? `No clients matching "${search}".`
    : tab === 'All' &&
        assignedToCount === 0 &&
        statusFilterCount === 0 &&
        createdOnFilter === 'all'
      ? 'No clients yet. Click "Add a client" to register your first one.'
      : 'No clients match the current filters.'

  return (
    <div
      className="mt-4 rounded-xl border overflow-hidden"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
      }}
    >
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr
            className="border-b"
            style={{
              background: 'var(--surface-sunken)',
              borderColor: 'var(--border-soft)',
              color: 'var(--text-secondary)',
            }}
          >
            <th className="w-10 px-4 py-3">
              <SelectAllCheckbox
                checked={allSelected}
                indeterminate={!allSelected && someSelected}
                onChange={toggleAll}
              />
            </th>
            <th className="px-4 py-3 font-medium">Client</th>
            {showColumn('phone') && (
              <SortHeader
                label="Phone number"
                active={sort.key === 'phone'}
                dir={sort.dir}
                onClick={() => toggleSort('phone')}
              />
            )}
            {showColumn('email') && (
              <SortHeader
                label="Email address"
                active={sort.key === 'email'}
                dir={sort.dir}
                onClick={() => toggleSort('email')}
              />
            )}
            {showColumn('status') && (
              <SortHeader
                label="Status"
                active={sort.key === 'status'}
                dir={sort.dir}
                onClick={() => toggleSort('status')}
              />
            )}
            {showColumn('assigned') && (
              <SortHeader
                label="Assigned to"
                active={sort.key === 'assigned'}
                dir={sort.dir}
                onClick={() => toggleSort('assigned')}
              />
            )}
            <th className="w-12 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={totalColSpan}
                className="px-6 py-16 text-center"
                style={{ color: 'var(--text-muted)' }}
              >
                {emptyMessage}
              </td>
            </tr>
          )}
          {rows.map((c) => (
            <ClientsTableRow
              key={c.id}
              client={c}
              primaryCase={primaryCaseByClient.get(c.id)}
              assignees={assigneesByClient.get(c.id) ?? []}
              selected={selected.has(c.id)}
              showColumn={showColumn}
              onToggleSelected={() => toggleOne(c.id)}
              onManageAssignees={() => onManageRow(c)}
              onView={() => onViewRow(c)}
              onEdit={() => onEditRow(c)}
              onAssignCase={() => onAssignCaseRow(c)}
              onStartTimer={() => onStartTimerRow(c)}
              onDelete={() => onDeleteRow(c)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
