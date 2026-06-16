'use client'
import { useRouter } from 'next/navigation'
import { Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ClientForm } from '@/components/shared/ClientForm'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { StartTimerDialog } from '@/components/shared/StartTimerDialog'
import { useUIStore } from '@/stores/ui.store'

import { ClientDetailsDialog } from './_components/ClientDetailsDialog'
import { ClientsFilterBar } from './_components/ClientsFilterBar'
import { ClientsTabNav } from './_components/ClientsTabNav'
import { ClientsTable } from './_components/ClientsTable'
import { ErrorPanel } from './_components/ErrorPanel'
import { ManageAssigneesDialog } from './_components/ManageAssigneesDialog'
import { useClientsPageState } from './_hooks/use-clients-page-state'

export default function ClientsPage() {
  const router = useRouter()
  const { openModal } = useUIStore()
  const state = useClientsPageState()

  if (state.isLoading) return <PageSkeleton />
  if (state.error) {
    return (
      <div
        className="flex-1 overflow-y-auto"
        style={{ background: 'var(--surface-card)' }}
      >
        <div className="px-6 py-5">
          <ErrorPanel onRetry={() => window.location.reload()} />
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: 'var(--surface-card)' }}
    >
      <div className="px-6 py-6">
        {/* Title + primary action */}
        <div className="flex items-center justify-between">
          <h1
            className="text-[26px] font-semibold leading-tight tracking-tight"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            Clients
          </h1>
          <Button
            onClick={() => openModal({ type: 'addClient' })}
            size="lg"
            className="rounded-lg"
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          >
            <Plus size={14} strokeWidth={2.25} />
            Add a client
          </Button>
        </div>

        <ClientsTabNav active={state.tab} onChange={state.setTab} />

        <ClientsFilterBar
          allFirmMembers={state.allFirmMembers}
          assignedToFilter={state.assignedToFilter}
          statusFilter={state.statusFilter}
          createdOnFilter={state.createdOnFilter}
          setCreatedOnFilter={state.setCreatedOnFilter}
          setAssignedToFilter={state.setAssignedToFilter}
          setStatusFilter={state.setStatusFilter}
          toggleAssignedTo={state.toggleAssignedTo}
          toggleClientStatus={state.toggleClientStatus}
          search={state.search}
          setSearch={state.setSearch}
          searchOpen={state.searchOpen}
          setSearchOpen={state.setSearchOpen}
          visibleColumns={state.visibleColumns}
          toggleColumn={state.toggleColumn}
        />

        <ClientsTable
          rows={state.filteredAndSorted}
          primaryCaseByClient={state.primaryCaseByClient}
          assigneesByClient={state.assigneesByClient}
          selected={state.selected}
          allSelected={state.allSelected}
          someSelected={state.someSelected}
          showColumn={state.showColumn}
          visibleColumns={state.visibleColumns}
          sort={state.sort}
          toggleSort={state.toggleSort}
          toggleAll={state.toggleAll}
          toggleOne={state.toggleOne}
          onManageRow={(c) => state.setManageClient(c)}
          onViewRow={(c) => state.setViewClient(c)}
          onEditRow={(c) => openModal({ type: 'editClient', id: c.id })}
          // Pre-fill the new-case form with this client selected. The
          // /cases/new page reads the ?client= query param and seeds
          // the client_ids array.
          onAssignCaseRow={(c) => router.push(`/cases/new?client=${c.id}`)}
          onStartTimerRow={(c) => state.setTimerClientId(c.id)}
          onDeleteRow={(c) =>
            openModal({
              type: 'confirmDelete',
              entity: 'client',
              id: c.id,
              name: c.full_name,
            })
          }
          search={state.search}
          tab={state.tab}
          assignedToCount={state.assignedToFilter.size}
          statusFilterCount={state.statusFilter.size}
          createdOnFilter={state.createdOnFilter}
        />

        <ClientForm />
        <DeleteDialog />
        {/*
         * Billable-hour timer entry point — opened by the "Time
         * working hours" item in the row action menu. The dialog
         * walks through the rate gate when needed before starting the
         * timer; the 30-min check-ins + floating active-timer widget
         * live in TimeTrackerBoot at the dashboard layout level so
         * they survive navigation.
         */}
        <StartTimerDialog
          open={state.timerClientId !== null}
          onOpenChange={(o) => !o && state.setTimerClientId(null)}
          clientId={state.timerClientId}
        />

        <ClientDetailsDialog
          client={state.viewClient}
          primaryCase={
            state.viewClient
              ? state.primaryCaseByClient.get(state.viewClient.id)
              : undefined
          }
          assignees={
            state.viewClient
              ? state.assigneesByClient.get(state.viewClient.id) ?? []
              : []
          }
          onOpenChange={(o) => !o && state.setViewClient(null)}
          onEdit={() => {
            if (state.viewClient) {
              const id = state.viewClient.id
              state.setViewClient(null)
              openModal({ type: 'editClient', id })
            }
          }}
        />

        <ManageAssigneesDialog
          client={state.manageClient}
          allMembers={state.allFirmMembers}
          current={
            state.manageClient
              ? state.assigneesByClient.get(state.manageClient.id) ?? []
              : []
          }
          onOpenChange={(o) => !o && state.setManageClient(null)}
          onSave={(next) => {
            if (state.manageClient) {
              state.setClientAssignees(state.manageClient.id, next)
              toast.success(
                `Assignees updated for ${state.manageClient.full_name}.`,
              )
              state.setManageClient(null)
            }
          }}
        />
      </div>
    </div>
  )
}
