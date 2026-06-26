'use client'

import Link from 'next/link'
import { CaretRight, Trash } from '@phosphor-icons/react'
import { RETENTION_DAYS } from '@/stores/recovery-bin-local.store'

/**
 * Breadcrumb + page intro + a destructive "Empty bin" action that only
 * appears when there is something to empty.
 */
export function RecoveryBinHeader({
  binCount,
  onEmptyBin,
}: {
  binCount: number
  onEmptyBin: () => void
}) {
  return (
    <>
      <div
        className="flex items-center gap-2 text-sm mb-5"
        style={{ color: 'var(--text-primary)' }}
      >
        <Link
          href="/settings"
          className="hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
        >
          Settings
        </Link>
        <CaretRight size={14} strokeWidth={2.25} style={{ color: 'var(--text-muted)' }} />
        <span className="font-bold">Recovery bin</span>
      </div>

      <div className="flex items-start justify-between mb-8 gap-6 flex-wrap">
        <div className="max-w-2xl">
          <div
            className="text-[10px] font-bold tracking-[3px] uppercase mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            System
          </div>
          <h1
            className="font-heading text-3xl font-extrabold mb-3 leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Recovery bin
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Recently deleted cases, clients, tasks, and documents land here.
            Restore anything within {RETENTION_DAYS} days of deletion — after
            that it is permanently removed.
          </p>
        </div>
        {binCount > 0 && (
          <button
            type="button"
            onClick={onEmptyBin}
            className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold border transition-colors shrink-0 hover:bg-black/[0.02]"
            style={{ borderColor: 'var(--border)', color: '#B91C1C' }}
          >
            <Trash size={14} strokeWidth={2} /> Empty bin
          </button>
        )}
      </div>
    </>
  )
}
