'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        className="rounded-2xl border p-16 text-center"
        style={{
          background: 'var(--cream-white)',
          borderColor: 'var(--border)',
          boxShadow: '0 1px 3px rgba(13,27,42,0.04)',
        }}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: 'rgba(201,151,43,0.08)' }}
        >
          <Inbox size={22} style={{ color: 'var(--gold)' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--navy)' }}>
          {emptyMessage}
        </p>
        {emptyDescription && (
          <p className="mt-1 text-xs text-gray-400">{emptyDescription}</p>
        )}
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--cream-white)',
        borderColor: 'var(--border)',
        boxShadow: '0 1px 3px rgba(13,27,42,0.04), 0 8px 32px rgba(13,27,42,0.06)',
      }}
    >
      <Table>
        <TableHeader>
          <TableRow
            className="border-b hover:bg-transparent"
            style={{ borderColor: 'var(--border)', background: 'rgba(13,27,42,0.02)' }}
          >
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className="h-11 px-5 text-[10.5px] uppercase tracking-[0.08em] font-semibold"
                style={{
                  color: 'rgba(13,27,42,0.45)',
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
              className="border-b transition-all duration-150 group"
              style={{
                borderColor: 'rgba(13,27,42,0.06)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(201,151,43,0.025)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className="px-5 py-3.5 text-[13px]"
                  style={{
                    color: 'var(--navy)',
                    textAlign: col.align ?? 'left',
                  }}
                >
                  {col.render
                    ? col.render(row)
                    : String(
                        (row as Record<string, unknown>)[col.key] ?? '\u2014',
                      )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination footer */}
      {data.length > pageSize && (
        <div
          className="flex items-center justify-between px-5 py-2.5 border-t"
          style={{
            borderColor: 'var(--border)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <p className="text-[11px] text-gray-400">
            Showing {page * pageSize + 1}&ndash;{Math.min((page + 1) * pageSize, data.length)} of {data.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-[11px] font-medium"
                style={
                  i === page
                    ? {
                        background: 'var(--gold)',
                        color: '#fff',
                        borderRadius: '6px',
                      }
                    : { color: 'var(--navy)' }
                }
                onClick={() => setPage(i)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
