'use client'

import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { CaseForm } from '@/components/shared/CaseForm'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useCases } from '@/hooks/use-cases'
import { useUIStore } from '@/stores/ui.store'
import type { Case } from '@/types'

const STATUS_FILTERS = ['All', 'Active', 'Pending', 'Closed'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

export default function CasesPage() {
  const { data: cases, isLoading, error } = useCases()
  const { openModal } = useUIStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')

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

  const caseList = cases ?? []

  const statusFiltered =
    statusFilter === 'All'
      ? caseList
      : caseList.filter((c) => c.status === statusFilter)

  const filtered = search.trim()
    ? statusFiltered.filter((c) => {
        const q = search.toLowerCase()
        return (
          c.title?.toLowerCase().includes(q) ||
          c.client_name?.toLowerCase().includes(q) ||
          c.court?.toLowerCase().includes(q) ||
          c.suit_number?.toLowerCase().includes(q) ||
          c.case_code?.toLowerCase().includes(q)
        )
      })
    : statusFiltered

  const statusCounts: Record<string, number> = { All: caseList.length }
  for (const c of caseList) {
    const s = c.status ?? 'Active'
    statusCounts[s] = (statusCounts[s] ?? 0) + 1
  }

  const columns: Column<Case>[] = [
    {
      key: 'case_code',
      header: 'Case ID',
      width: '110px',
      render: (row) => (
        <span
          className="font-mono text-[12px] tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          {row.case_code ?? '—'}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <span className="font-medium text-[13.5px]" style={{ color: 'var(--text-primary)' }}>
          {row.title}
        </span>
      ),
    },
    {
      key: 'client_name',
      header: 'Client',
      render: (row) => (
        <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {row.client_name || '—'}
        </span>
      ),
    },
    {
      key: 'court',
      header: 'Court',
      render: (row) => (
        <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {row.court || '—'}
        </span>
      ),
    },
    {
      key: 'suit_number',
      header: 'Suit no.',
      render: (row) => (
        <span className="font-mono text-[12px] tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {row.suit_number || '—'}
        </span>
      ),
    },
    {
      key: 'next_court_date',
      header: 'Next date',
      render: (row) => {
        if (!row.next_court_date) {
          return <span style={{ color: 'var(--text-subtle)' }}>—</span>
        }
        const d = new Date(row.next_court_date)
        const isUpcoming =
          d.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 && d.getTime() > Date.now()
        return (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            {isUpcoming && (
              <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: '#C0392B' }} />
            )}
            {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (row) => <StatusBadge status={row.status ?? 'Active'} />,
    },
    {
      key: 'actions',
      header: '',
      width: '88px',
      align: 'right',
      render: (row) => (
        <div className="flex gap-0.5 justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openModal({ type: 'editCase', id: row.id })}
            aria-label="Edit case"
          >
            <Pencil size={13} style={{ color: 'var(--text-muted)' }} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openModal({ type: 'confirmDelete', entity: 'case', id: row.id, name: row.title })}
            aria-label="Delete case"
          >
            <Trash2 size={13} style={{ color: 'var(--text-muted)' }} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <PageHeader
          title="Cases"
          description={`${caseList.length} total case${caseList.length !== 1 ? 's' : ''}`}
          actions={
            <>
              <div className="relative w-56">
                <Search
                  size={14}
                  strokeWidth={1.75}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-subtle)' }}
                />
                <Input
                  placeholder="Search cases…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-[13px] rounded-lg"
                  style={{ borderColor: 'var(--border-default)', background: 'var(--surface-card)' }}
                />
              </div>
              <Button
                onClick={() => openModal({ type: 'addCase' })}
                size="lg"
                className="rounded-lg"
              >
                <Plus size={14} strokeWidth={2} />
                New case
              </Button>
            </>
          }
        />

        <div className="mt-6 flex items-center gap-1">
          {STATUS_FILTERS.map((s) => {
            const isActive = statusFilter === s
            const count = statusCounts[s] ?? 0
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors"
                style={{
                  background: isActive ? 'var(--surface-sunken)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--surface-overlay)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                {s}
                <span
                  className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 rounded-full text-[10.5px] font-medium tabular-nums"
                  style={{
                    background: isActive ? 'var(--surface-card)' : 'var(--surface-sunken)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={filtered}
            emptyMessage={
              search.trim() || statusFilter !== 'All'
                ? 'No cases found'
                : 'No cases yet'
            }
            emptyDescription={
              search.trim() || statusFilter !== 'All'
                ? 'Try adjusting your filters or search terms.'
                : 'Click "New case" to file your first one.'
            }
          />
        </div>

        <CaseForm />
        <DeleteDialog />
      </div>
    </div>
  )
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="rounded-2xl border px-10 py-12 text-center"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
        Unable to load cases
      </p>
      <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        Please check your connection and try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
        Retry
      </Button>
    </div>
  )
}
