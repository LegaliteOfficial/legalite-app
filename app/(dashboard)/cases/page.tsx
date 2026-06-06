'use client'

/**
 * Cases list view — composition root only.
 *
 * State + derived data lives in _hooks; rendering chunks live in
 * _components; pure helpers (columns, filters, export, storage) in
 * _lib; static types/constants in _types and _constants.
 */

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { CaseForm } from '@/components/shared/CaseForm'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { TagSettingsDialog } from '@/components/shared/TagSettingsDialog'
import { useCases } from '@/hooks/use-cases'
import { useUIStore } from '@/stores/ui.store'

import { CasesPageTabs } from './_components/CasesPageTabs'
import { CasesTable } from './_components/CasesTable'
import { CasesToolbar } from './_components/CasesToolbar'
import { EmptyState } from './_components/EmptyState'
import { ErrorPanel } from './_components/ErrorPanel'
import { FilterDrawer } from './_components/FilterDrawer'
import { PaginationFooter } from './_components/PaginationFooter'
import { StagesPlaceholder } from './_components/StagesPlaceholder'
import { useCasesFiltering } from './_hooks/use-cases-filtering'
import { useCasesPageState } from './_hooks/use-cases-page-state'
import { exportToCsv } from './_lib/export'

export default function CasesPage() {
  const { data: cases, isLoading, error } = useCases()
  const router = useRouter()
  const { openModal } = useUIStore()

  const state = useCasesPageState()
  const all = cases ?? []
  const { pageRows, sorted, statusCounts, totalPages, safePage, start, end } =
    useCasesFiltering(all, state)

  if (isLoading) return <PageSkeleton />
  if (error) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5">
          <ErrorPanel onRetry={() => window.location.reload()} />
        </div>
      </div>
    )
  }

  return (
    // Outer page chrome is a flex column filling the dashboard <main>.
    // The table card grows to fill remaining height (flex-1 min-h-0).
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-5 flex flex-col flex-1 min-h-0">
        <CasesPageTabs
          activeTab={state.activeTab}
          onTabChange={state.setActiveTab}
          onManageTags={() => state.setTagsDialogOpen(true)}
          onNewCase={() => router.push('/cases/new')}
        />

        {state.activeTab === 'stages' ? (
          <StagesPlaceholder />
        ) : (
          <>
            <CasesToolbar
              statusFilter={state.statusFilter}
              onStatusChange={state.setStatusFilter}
              statusCounts={statusCounts}
              search={state.search}
              onSearchChange={state.setSearch}
              visibleColumns={state.visibleColumns}
              onColumnsChange={state.setVisibleColumns}
              activeFilterCount={state.activeFilterCount}
              onOpenFilters={() => state.setFiltersOpen(true)}
            />

            <div
              className="mt-4 rounded-2xl border overflow-hidden flex flex-col flex-1 min-h-0"
              style={{
                background: 'var(--surface-card)',
                borderColor: 'var(--border-soft)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              {sorted.length === 0 ? (
                <EmptyState
                  hasFilters={state.hasFiltersActive}
                  onClearFilters={state.clearFilters}
                />
              ) : (
                <CasesTable
                  rows={pageRows}
                  columns={state.orderedVisibleColumns}
                  sortBy={state.sortBy}
                  sortDir={state.sortDir}
                  onSort={state.handleSort}
                  expandRows={state.expandRows}
                  onRowClick={(id) => router.push(`/cases/${id}`)}
                  onEdit={(id) => openModal({ type: 'editCase', id })}
                  onDelete={(id, name) =>
                    openModal({
                      type: 'confirmDelete',
                      entity: 'case',
                      id,
                      name,
                    })
                  }
                />
              )}
              <PaginationFooter
                page={safePage}
                totalPages={totalPages}
                start={start}
                end={end}
                total={sorted.length}
                pageSize={state.pageSize}
                expandRows={state.expandRows}
                canExport={sorted.length > 0}
                onPageChange={state.setPage}
                onPageSizeChange={state.setPageSize}
                onExpandRowsChange={state.setExpandRows}
                onExport={() => {
                  exportToCsv(sorted, Array.from(state.visibleColumns))
                  toast.success(
                    `Exported ${sorted.length} case${sorted.length === 1 ? '' : 's'} to CSV.`,
                  )
                }}
              />
            </div>
          </>
        )}

        <CaseForm />
        <DeleteDialog />
        <FilterDrawer
          open={state.filtersOpen}
          onOpenChange={state.setFiltersOpen}
          value={state.filters}
          onApply={state.setFilters}
          cases={all}
        />
        <TagSettingsDialog
          open={state.tagsDialogOpen}
          onOpenChange={state.setTagsDialogOpen}
        />
      </div>
    </div>
  )
}
