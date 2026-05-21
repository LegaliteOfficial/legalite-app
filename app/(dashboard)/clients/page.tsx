'use client'

import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
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
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5">
          <ErrorPanel onRetry={() => window.location.reload()} />
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
        <span className="font-mono text-[12px] tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {row.client_code ?? '—'}
        </span>
      ),
    },
    {
      key: 'full_name',
      header: 'Name',
      render: (row) => (
        <span className="font-medium text-[13.5px]" style={{ color: 'var(--text-primary)' }}>
          {row.full_name}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => (
        <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {row.phone || '—'}
        </span>
      ),
    },
    {
      key: 'ghana_card',
      header: 'Ghana Card',
      render: (row) => (
        <span className="font-mono text-[12px] tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {row.ghana_card || '—'}
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
            className="inline-flex items-center justify-center h-[18px] min-w-[20px] px-1.5 rounded-full text-[11px] font-medium tabular-nums"
            style={{
              background: 'var(--surface-sunken)',
              color: count > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
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
      width: '110px',
      render: (row) => <StatusBadge status={row.status ?? 'Active'} />,
    },
    {
      key: 'updated_at',
      header: '',
      width: '88px',
      align: 'right',
      render: (row) => (
        <div className="flex gap-0.5 justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openModal({ type: 'editClient', id: row.id })}
            aria-label="Edit client"
          >
            <Pencil size={13} style={{ color: 'var(--text-muted)' }} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openModal({ type: 'confirmDelete', entity: 'client', id: row.id, name: row.full_name })}
            aria-label="Delete client"
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
          title="Clients"
          description={`${clientList.length} registered client${clientList.length !== 1 ? 's' : ''}`}
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
                  placeholder="Search clients…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-[13px] rounded-lg"
                  style={{ borderColor: 'var(--border-default)', background: 'var(--surface-card)' }}
                />
              </div>
              <Button onClick={() => openModal({ type: 'addClient' })} size="lg" className="rounded-lg">
                <Plus size={14} strokeWidth={2} />
                Add client
              </Button>
            </>
          }
        />

        <div className="mt-6">
          <DataTable
            columns={columns}
            data={filtered}
            emptyMessage={search.trim() ? `No clients matching "${search}"` : 'No clients yet'}
            emptyDescription={
              search.trim()
                ? 'Try adjusting your search terms.'
                : 'Click "Add client" to register your first one.'
            }
          />
        </div>

        <ClientForm />
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
        Unable to load clients
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
