'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export interface Column<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  emptyDescription?: string
  pageSize?: number
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  emptyMessage = 'No records found',
  emptyDescription,
  pageSize = 10,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const paged = data.slice(page * pageSize, (page + 1) * pageSize)

  if (data.length === 0) {
    return (
      <div
        className="rounded-2xl border px-6 py-16 text-center"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border-soft)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: 'var(--surface-sunken)' }}
        >
          <Inbox size={18} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
        </div>
        <p className="text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
          {emptyMessage}
        </p>
        {emptyDescription && (
          <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {emptyDescription}
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <Table>
        <TableHeader>
          <TableRow
            className="border-b hover:bg-transparent"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className="h-10 px-5 text-[10.5px] uppercase tracking-[0.08em] font-medium"
                style={{
                  color: 'var(--text-muted)',
                  width: col.width,
                  textAlign: col.align ?? 'left',
                }}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((row, i) => (
            <TableRow
              key={row.id ?? i}
              className="border-b transition-colors duration-100"
              style={{ borderColor: 'var(--border-soft)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-overlay)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className="px-5 py-3 text-[13px]"
                  style={{
                    color: 'var(--text-primary)',
                    textAlign: col.align ?? 'left',
                  }}
                >
                  {col.render
                    ? col.render(row)
                    : String(
                        (row as Record<string, unknown>)[col.key] ?? '—',
                      )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data.length > pageSize && (
        <div
          className="flex items-center justify-between px-5 py-2.5 border-t"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          <p className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
            Showing {page * pageSize + 1}&ndash;{Math.min((page + 1) * pageSize, data.length)} of {data.length}
          </p>
          <div className="flex items-center gap-0.5">
            <PageButton
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              ariaLabel="Previous page"
            >
              <ChevronLeft size={13} strokeWidth={1.75} />
            </PageButton>
            {Array.from({ length: totalPages }, (_, i) => (
              <PageButton
                key={i}
                active={i === page}
                onClick={() => setPage(i)}
                ariaLabel={`Page ${i + 1}`}
              >
                {i + 1}
              </PageButton>
            ))}
            <PageButton
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              ariaLabel="Next page"
            >
              <ChevronRight size={13} strokeWidth={1.75} />
            </PageButton>
          </div>
        </div>
      )}
    </div>
  )
}

function PageButton({
  children,
  active,
  disabled,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-md text-[12px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: active ? 'var(--surface-sunken)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) e.currentTarget.style.background = 'var(--surface-overlay)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}
