'use client'

import { CalendarDots, Funnel, Users } from '@phosphor-icons/react'
import { ROLE_LABEL, type Assignee } from '@/hooks/use-client-assignees'
import { CLIENT_STATUSES, CREATED_ON_OPTIONS } from '../_constants'
import type {
  ClientStatusKey,
  ColumnKey,
  CreatedOnKey,
} from '../_types'
import { MultiSelectChip } from './chips/MultiSelectChip'
import { SingleSelectChip } from './chips/SingleSelectChip'
import { ColumnsDropdown } from './ColumnsDropdown'
import { SearchBox } from './SearchBox'

/**
 * Filter chips row underneath the tab nav — Assigned to / Status /
 * Created on chips on the left; collapsible search + Edit-columns
 * dropdown on the right. Each chip's selection narrows the table
 * (filters intersect, options within a single chip union).
 */
export function ClientsFilterBar({
  allFirmMembers,
  assignedToFilter,
  statusFilter,
  createdOnFilter,
  setCreatedOnFilter,
  setAssignedToFilter,
  setStatusFilter,
  toggleAssignedTo,
  toggleClientStatus,
  search,
  setSearch,
  searchOpen,
  setSearchOpen,
  visibleColumns,
  toggleColumn,
}: {
  allFirmMembers: Assignee[]
  assignedToFilter: Set<string>
  statusFilter: Set<ClientStatusKey>
  createdOnFilter: CreatedOnKey
  setCreatedOnFilter: (k: CreatedOnKey) => void
  setAssignedToFilter: (next: Set<string>) => void
  setStatusFilter: (next: Set<ClientStatusKey>) => void
  toggleAssignedTo: (id: string) => void
  toggleClientStatus: (status: ClientStatusKey) => void
  search: string
  setSearch: (v: string) => void
  searchOpen: boolean
  setSearchOpen: (v: boolean) => void
  visibleColumns: Set<ColumnKey>
  toggleColumn: (key: ColumnKey) => void
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <MultiSelectChip
          icon={<Users size={12} strokeWidth={1.75} />}
          label="Assigned to"
          activeCount={assignedToFilter.size}
          options={allFirmMembers.map((m) => ({
            key: m.id,
            label: m.name,
            meta: ROLE_LABEL[m.role],
            selected: assignedToFilter.has(m.id),
          }))}
          onToggle={toggleAssignedTo}
          onClear={() => setAssignedToFilter(new Set())}
          emptyLabel="No firm members on file yet."
        />

        {/* Distinct from the tab nav which uses CASE status — this is
            the CLIENT's own Active / Inactive status, so users can
            intersect "Active client" with "Open case". */}
        <MultiSelectChip
          icon={<Funnel size={12} strokeWidth={1.75} />}
          label="Status"
          activeCount={statusFilter.size}
          options={CLIENT_STATUSES.map((s) => ({
            key: s,
            label: s,
            selected: statusFilter.has(s),
          }))}
          onToggle={(key) => toggleClientStatus(key as ClientStatusKey)}
          onClear={() => setStatusFilter(new Set())}
        />

        <SingleSelectChip
          icon={<CalendarDots size={12} strokeWidth={1.75} />}
          label="Created on"
          valueLabel={
            CREATED_ON_OPTIONS.find((o) => o.key === createdOnFilter)?.label ??
            'All time'
          }
          isCustomised={createdOnFilter !== 'all'}
          options={CREATED_ON_OPTIONS.map((o) => ({
            key: o.key,
            label: o.label,
            selected: createdOnFilter === o.key,
          }))}
          onSelect={(key) => setCreatedOnFilter(key as CreatedOnKey)}
        />
      </div>

      <div className="flex items-center gap-2">
        <SearchBox
          open={searchOpen}
          value={search}
          onOpen={() => setSearchOpen(true)}
          onChange={setSearch}
          onBlur={() => setSearchOpen(false)}
        />
        <ColumnsDropdown
          visibleColumns={visibleColumns}
          toggleColumn={toggleColumn}
        />
      </div>
    </div>
  )
}
