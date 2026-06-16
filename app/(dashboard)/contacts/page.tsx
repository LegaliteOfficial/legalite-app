'use client'

/**
 * Contacts list — composition root only.
 *
 * State + derivations live in `_hooks/use-contacts-page-state`; data
 * shapes in `_types`; static config + the column registry in
 * `_constants` and `_lib/columns`; CSV export in `_lib/export`. The
 * page itself wires the state into the toolbar, table, and footer.
 */

import { useRouter } from 'next/navigation'
import { Plus, Tag } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { ClientForm } from '@/components/shared/ClientForm'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { TagSettingsDialog } from '@/components/shared/TagSettingsDialog'
import { useUIStore } from '@/stores/ui.store'
import { ConflictsPanel } from './_components/ConflictsPanel'
import { ContactsTable } from './_components/ContactsTable'
import { ContactsToolbar } from './_components/ContactsToolbar'
import { EmptyState } from './_components/EmptyState'
import { ErrorPanel } from './_components/ErrorPanel'
import { PaginationFooter } from './_components/PaginationFooter'
import { TabButton } from './_components/TabButton'
import { useContactsPageState } from './_hooks/use-contacts-page-state'
import { exportToCsv } from './_lib/export'

export default function ContactsPage() {
  const router = useRouter()
  const { openModal } = useUIStore()
  const state = useContactsPageState()

  if (state.isLoading) return <PageSkeleton />
  if (state.error) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5">
          <ErrorPanel onRetry={() => window.location.reload()} />
        </div>
      </div>
    )
  }

  const onConflictsTab = () => {
    state.setActiveTab('conflicts')
    toast.info('Conflict checks engine is coming next.')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-5 flex flex-col flex-1 min-h-0">
        {/* Top row: Contacts / Conflict checks tabs */}
        <div
          className="flex items-end justify-between border-b"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          <div className="flex gap-1">
            <TabButton
              active={state.activeTab === 'contacts'}
              onClick={() => state.setActiveTab('contacts')}
            >
              Contacts
            </TabButton>
            <TabButton
              active={state.activeTab === 'conflicts'}
              onClick={onConflictsTab}
            >
              Conflict checks
            </TabButton>
          </div>
        </div>

        {state.activeTab === 'conflicts' ? (
          <ConflictsPanel />
        ) : (
          <>
            {/* Page header */}
            <div className="flex items-center justify-between mt-5">
              <h1
                className="text-[20px] font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Contacts
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => state.setTagsDialogOpen(true)}
                >
                  <Tag size={13} strokeWidth={1.75} />
                  Manage tags
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/contacts/new')}
                >
                  <Plus size={13} strokeWidth={2} />
                  New contact
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push('/contacts/new?type=company')}
                >
                  <Plus size={13} strokeWidth={2} />
                  New company
                </Button>
              </div>
            </div>

            <ContactsToolbar
              typeFilter={state.typeFilter}
              setTypeFilter={state.setTypeFilter}
              typeCounts={state.typeCounts}
              search={state.search}
              setSearch={state.setSearch}
              visibleColumns={state.visibleColumns}
              setVisibleColumns={state.setVisibleColumns}
              contactRoleFilter={state.contactRoleFilter}
              contactTagsFilter={state.contactTagsFilter}
              setContactRoleFilter={state.setContactRoleFilter}
              setContactTagsFilter={state.setContactTagsFilter}
              selectedCount={state.selected.size}
              onClearSelection={state.clearSelection}
              onDeleteSelected={() => {
                // Local-only delete against dev sample data — the real
                // backend mutation will be one bulk call once the
                // contacts API supports it.
                const n = state.selected.size
                state.clearSelection()
                toast.success(
                  `Deleted ${n} contact${n === 1 ? '' : 's'}.`,
                )
              }}
            />

            <div
              className="mt-4 rounded-2xl border overflow-hidden flex flex-col flex-1 min-h-0"
              style={{
                background: 'var(--surface-card)',
                borderColor: 'var(--border-soft)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              {state.contactCount === 0 ? (
                <EmptyState
                  hasFilters={state.hasFiltersActive}
                  onClearFilters={state.clearAllFilters}
                  onNewPerson={() => router.push('/contacts/new')}
                />
              ) : (
                <ContactsTable
                  rows={state.pageRows}
                  expanded={state.expandRows}
                  orderedColumns={state.orderedVisibleColumns}
                  selected={state.selected}
                  allOnPageSelected={state.allOnPageSelected}
                  onToggleSelectAll={state.toggleSelectAll}
                  onToggleRow={state.toggleRow}
                  sortBy={state.sortBy}
                  sortDir={state.sortDir}
                  onSort={state.handleSort}
                  onEditRow={(row) =>
                    openModal({ type: 'editClient', id: row.id })
                  }
                  onBillRow={(row) =>
                    toast.info(
                      `Bill for ${row.full_name} — opens once the billing screen ships.`,
                    )
                  }
                />
              )}

              <PaginationFooter
                page={state.page}
                totalPages={state.totalPages}
                start={state.start}
                end={state.end}
                totalCount={state.contactCount}
                pageSize={state.pageSize}
                onPageSize={state.setPageSize}
                expanded={state.expandRows}
                onExpanded={state.setExpandRows}
                onFirst={() => state.setPage(0)}
                onPrev={() => state.setPage(Math.max(0, state.page - 1))}
                onNext={() =>
                  state.setPage(Math.min(state.totalPages - 1, state.page + 1))
                }
                onLast={() => state.setPage(state.totalPages - 1)}
                exportDisabled={state.contactCount === 0}
                onExport={() => {
                  exportToCsv(
                    state.sortedAll,
                    Array.from(state.visibleColumns),
                  )
                  toast.success(
                    `Exported ${state.contactCount} contact${
                      state.contactCount === 1 ? '' : 's'
                    } to CSV.`,
                  )
                }}
              />
            </div>
          </>
        )}

        <ClientForm />
        <DeleteDialog />
        <TagSettingsDialog
          open={state.tagsDialogOpen}
          onOpenChange={state.setTagsDialogOpen}
        />
      </div>
    </div>
  )
}
