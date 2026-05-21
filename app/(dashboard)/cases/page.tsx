'use client'

import { Plus, Pencil, Trash2, Search, Scale } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
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
      <div className="flex-1 p-8 flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div
          className="text-center rounded-2xl border px-12 py-10"
          style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--navy)' }}>
            Unable to load cases
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Please check your connection and try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-xs">
            Retry
          </Button>
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
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium tracking-wide"
          style={{ background: 'rgba(13,27,42,0.05)', color: 'var(--navy)' }}
        >
          {row.case_code ?? '\u2014'}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <span className="font-medium text-[13px]" style={{ color: 'var(--navy)' }}>
          {row.title}
        </span>
      ),
    },
    {
      key: 'client_name',
      header: 'Client',
      render: (row) => (
        <span className="text-[13px] text-gray-500">
          {row.client_name || '\u2014'}
        </span>
      ),
    },
    {
      key: 'court',
      header: 'Court',
      render: (row) => (
        <span className="text-[13px] text-gray-500">
          {row.court || '\u2014'}
        </span>
      ),
    },
    {
      key: 'suit_number',
      header: 'Suit No.',
      render: (row) => (
        <span className="text-[12px] font-mono text-gray-500 tracking-wide">
          {row.suit_number || '\u2014'}
        </span>
      ),
    },
    {
      key: 'next_court_date',
      header: 'Next Date',
      render: (row) => {
        if (!row.next_court_date) return <span className="text-gray-400">{'\u2014'}</span>
        const d = new Date(row.next_court_date)
        const isUpcoming = d.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 && d.getTime() > Date.now()
        return (
          <span
            className="text-[12px] font-medium"
            style={{ color: isUpcoming ? '#C0392B' : 'var(--navy)' }}
          >
            {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (row) => <StatusBadge status={row.status ?? 'Active'} />,
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      align: 'right',
      render: (row) => (
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-lg"
            onClick={() => openModal({ type: 'editCase', id: row.id })}
          >
            <Pencil size={13} style={{ color: 'var(--navy)' }} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-lg hover:bg-red-50"
            onClick={() => openModal({ type: 'confirmDelete', entity: 'case', id: row.id, name: row.title })}
          >
            <Trash2 size={13} className="text-red-400" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8" style={{ background: 'var(--cream)' }}>
      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'rgba(201,151,43,0.1)' }}
          >
            <Scale size={18} style={{ color: 'var(--gold)' }} />
          </div>
          <div>
            <h2
              className="font-heading text-lg font-bold leading-tight"
              style={{ color: 'var(--navy)' }}
            >
              Case Management
            </h2>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {caseList.length} total case{caseList.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative w-52">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
            />
            <Input
              placeholder="Search cases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-[13px] rounded-xl border-gray-200 bg-white/70 placeholder:text-gray-300 focus:ring-1"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>
          <Button
            onClick={() => openModal({ type: 'addCase' })}
            className="h-9 px-4 rounded-xl text-[13px] font-semibold shadow-sm"
            style={{ background: 'var(--gold)', color: '#fff' }}
          >
            <Plus size={15} className="mr-1.5" />
            Open New Case
          </Button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1.5 mb-5">
        {STATUS_FILTERS.map((s) => {
          const isActive = statusFilter === s
          const count = statusCounts[s] ?? 0
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150"
              style={
                isActive
                  ? { background: 'var(--gold)', color: '#fff' }
                  : {
                      background: 'var(--cream-white)',
                      color: 'var(--navy)',
                      border: '1px solid var(--border)',
                    }
              }
            >
              {s}
              <span
                className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold"
                style={
                  isActive
                    ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                    : { background: 'rgba(13,27,42,0.06)', color: 'rgba(13,27,42,0.4)' }
                }
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
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
            : 'Click "+ Open New Case" to file your first case.'
        }
      />

      <CaseForm />
      <DeleteDialog />
    </div>
  )
}
