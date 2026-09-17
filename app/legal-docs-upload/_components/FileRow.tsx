'use client'

import {
  CheckCircle,
  Clock,
  CopySimple,
  FilePdf,
  WarningCircle,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/shared/Spinner'
import type { UploadRow } from '../_hooks/use-bulk-upload-queue'

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STATUS_LABEL: Record<UploadRow['status'], string> = {
  uploading: 'Uploading…',
  queued: 'Queued',
  processing: 'Processing…',
  completed: 'Ingested',
  failed: 'Failed',
  rejected: 'Rejected',
  skipped: 'Skipped',
}

function StatusIcon({ status }: { status: UploadRow['status'] }) {
  switch (status) {
    case 'uploading':
    case 'processing':
      return <Spinner size={16} className="text-[var(--gold)]" />
    case 'queued':
      return <Clock size={16} weight="fill" style={{ color: 'var(--text-muted)' }} />
    case 'completed':
      return (
        <CheckCircle
          size={18}
          weight="fill"
          className="animate-in zoom-in-50 duration-300"
          style={{ color: '#16A34A' }}
        />
      )
    case 'failed':
    case 'rejected':
      return (
        <WarningCircle
          size={18}
          weight="fill"
          className="animate-in zoom-in-50 duration-300"
          style={{ color: '#DC2626' }}
        />
      )
    case 'skipped':
      return <CopySimple size={16} weight="fill" style={{ color: 'var(--gold)' }} />
  }
}

export function FileRow({ row }: { row: UploadRow }) {
  const isActive = row.status === 'uploading' || row.status === 'queued' || row.status === 'processing'
  const isError = row.status === 'failed' || row.status === 'rejected'
  const barColor = isError ? '#DC2626' : row.status === 'skipped' ? 'var(--gold)' : row.status === 'completed' ? '#16A34A' : 'var(--gold)'
  // Indeterminate stages (uploading / queued, no server progress yet)
  // still show forward motion so a large batch never looks frozen.
  const barWidth = row.status === 'completed' ? 100 : row.status === 'uploading' ? 15 : row.status === 'queued' ? 30 : row.progress

  return (
    <div
      className="animate-in fade-in slide-in-from-left-1 flex items-center gap-3 rounded-lg border px-3 py-2.5 duration-300"
      style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-card)' }}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ background: 'var(--surface-sunken)' }}>
        <FilePdf size={16} style={{ color: 'var(--text-muted)' }} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[13px] font-medium" style={{ color: 'var(--text-primary)' }} title={row.filename}>
            {row.filename}
          </p>
          <span className="shrink-0 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {formatSize(row.sizeBytes)}
          </span>
        </div>

        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-sunken)' }}>
          <div
            className={cn('h-full rounded-full transition-[width] duration-700 ease-out', isActive && 'animate-pulse')}
            style={{ width: `${barWidth}%`, background: barColor }}
          />
        </div>

        {row.message && (
          <p className="mt-1 truncate text-[11px]" style={{ color: isError ? '#DC2626' : 'var(--text-muted)' }} title={row.message}>
            {row.message}
          </p>
        )}
      </div>

      <div className="flex w-24 shrink-0 items-center justify-end gap-1.5 text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        <StatusIcon status={row.status} />
        {STATUS_LABEL[row.status]}
      </div>
    </div>
  )
}
