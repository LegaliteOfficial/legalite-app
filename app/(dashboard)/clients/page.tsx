'use client'

import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { ClientForm } from '@/components/shared/ClientForm'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useClients } from '@/hooks/use-clients'
import { useCases } from '@/hooks/use-cases'
import { useUIStore } from '@/stores/ui.store'
import type { Client } from '@/types'

export default function ClientsPage() {
  const { data: clients, isLoading, error } = useClients()
  const { data: cases } = useCases()
  const { openModal } = useUIStore()
  const [search, setSearch] = useState('')

  if (isLoading) return <PageSkeleton />
  if (error) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div
          className="text-center rounded-2xl border px-12 py-10"
          style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--navy)' }}>
            Unable to load clients
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Please check your connection and try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const clientList = clients ?? []
  const filtered = search.trim()
    ? clientList.filter((c) => {
        const q = search.toLowerCase()
        return (
          c.full_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.client_code?.toLowerCase().includes(q) ||
          c.ghana_card?.toLowerCase().includes(q)
        )
      })
    : clientList

  const caseCountMap: Record<string, number> = {}
  for (const cs of cases ?? []) {
    if (cs.client_id) {
      caseCountMap[cs.client_id] = (caseCountMap[cs.client_id] ?? 0) + 1
    }
  }

  const columns: Column<Client>[] = [
    {
      key: 'client_code',
      header: 'Client ID',
      width: '120px',
      render: (row) => (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium tracking-wide"
          style={{ background: 'rgba(13,27,42,0.05)', color: 'var(--navy)' }}
        >
          {row.client_code ?? '\u2014'}
        </span>
      ),
    },
    {
      key: 'full_name',
      header: 'Full Name',
      render: (row) => (
        <span className="font-medium text-[13px]" style={{ color: 'var(--navy)' }}>
          {row.full_name}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => (
        <span className="text-[13px] text-gray-500">
          {row.phone || '\u2014'}
        </span>
      ),
    },
    {
      key: 'ghana_card',
      header: 'Ghana Card',
      render: (row) => (
        <span className="text-[12px] font-mono text-gray-500 tracking-wide">
          {row.ghana_card || '\u2014'}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Cases',
      align: 'center',
      width: '80px',
      render: (row) => {
        const count = caseCountMap[row.id] ?? 0
        return (
          <span
            className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full text-[11px] font-bold"
            style={{
              background: count > 0 ? 'rgba(201,151,43,0.1)' : 'rgba(13,27,42,0.04)',
              color: count > 0 ? 'var(--gold)' : 'rgba(13,27,42,0.3)',
            }}
          >
            {count}
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
      key: 'updated_at',
      header: '',
      width: '80px',
      align: 'right',
      render: (row) => (
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-lg"
            onClick={() => openModal({ type: 'editClient', id: row.id })}
          >
            <Pencil size={13} style={{ color: 'var(--navy)' }} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-lg hover:bg-red-50"
            onClick={() => openModal({ type: 'confirmDelete', entity: 'client', id: row.id, name: row.full_name })}
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
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'rgba(201,151,43,0.1)' }}
          >
            <Users size={18} style={{ color: 'var(--gold)' }} />
          </div>
          <div>
            <h2
              className="font-heading text-lg font-bold leading-tight"
              style={{ color: 'var(--navy)' }}
            >
              Client Directory
            </h2>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {filtered.length} registered client{filtered.length !== 1 ? 's' : ''}
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
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-[13px] rounded-xl border-gray-200 bg-white/70 placeholder:text-gray-300 focus:ring-1"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>
          <Button
            onClick={() => openModal({ type: 'addClient' })}
            className="h-9 px-4 rounded-xl text-[13px] font-semibold shadow-sm"
            style={{ background: 'var(--gold)', color: '#fff' }}
          >
            <Plus size={15} className="mr-1.5" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage={
          search.trim()
            ? `No clients matching "${search}"`
            : 'No clients yet'
        }
        emptyDescription={
          search.trim()
            ? 'Try adjusting your search terms.'
            : 'Click "+ Add Client" to register your first client.'
        }
      />

      <ClientForm />
      <DeleteDialog />
    </div>
  )
}
