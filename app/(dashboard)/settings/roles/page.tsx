'use client'

/**
 * Roles & permissions — composition root.
 *
 * Owns: nothing — the state hook owns tab/search/paging, and each
 * sub-component reads its own slice.
 */

import { Spinner } from '@/components/shared/Spinner'
import { EmptyState } from './_components/EmptyState'
import { PaginationFooter } from './_components/PaginationFooter'
import { RolesHeader } from './_components/RolesHeader'
import { RolesTable } from './_components/RolesTable'
import { RolesToolbar } from './_components/RolesToolbar'
import { useRolesPageState } from './_hooks/use-roles-page-state'

export default function RolesPage() {
  const state = useRolesPageState()

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ background: 'var(--surface-page)' }}
    >
      <RolesHeader />

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
          boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
        }}
      >
        <RolesToolbar
          activeTab={state.activeTab}
          onTabChange={state.changeTab}
          query={state.query}
          onQueryChange={state.changeQuery}
        />

        {state.isLoading ? (
          <div
            className="flex items-center justify-center gap-2 py-16"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Spinner size={16} />{' '}
            <span className="text-sm">Loading roles…</span>
          </div>
        ) : state.total === 0 ? (
          <EmptyState />
        ) : (
          <RolesTable rows={state.pageRoles} />
        )}

        <PaginationFooter
          total={state.total}
          start={state.start}
          end={state.end}
          canPrev={state.canPrev}
          canNext={state.canNext}
          onPrev={() => state.setPage(state.page - 1)}
          onNext={() => state.setPage(state.page + 1)}
        />
      </div>
    </div>
  )
}
