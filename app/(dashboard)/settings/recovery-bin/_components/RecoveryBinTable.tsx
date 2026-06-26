'use client'

import { ArrowCounterClockwise, Trash } from '@phosphor-icons/react'
import {
  daysLeft,
  type DeletedItem,
} from '@/stores/recovery-bin-local.store'
import { KIND_ICON, KIND_LABEL } from '../_constants'

/** "today" / "yesterday" / "N days ago" from an ISO timestamp. */
function deletedAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

export function RecoveryBinTable({
  rows,
  onRestore,
  onPurge,
}: {
  rows: DeletedItem[]
  onRestore: (item: DeletedItem) => void
  onPurge: (item: DeletedItem) => void
}) {
  return (
    <>
      <div
        className="grid grid-cols-[1fr_110px_140px_110px_150px] gap-4 px-5 py-3 border-b text-[11px] font-bold uppercase tracking-wider"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        <span>Item</span>
        <span>Type</span>
        <span>Deleted</span>
        <span>Expires in</span>
        <span className="text-right">Actions</span>
      </div>
      <ul>
        {rows.map((item, i) => {
          const Icon = KIND_ICON[item.kind]
          const left = daysLeft(item)
          const urgent = left <= 5
          return (
            <li
              key={item.id}
              className="grid grid-cols-[1fr_110px_140px_110px_150px] gap-4 px-5 py-4 items-center"
              style={{
                borderBottom:
                  i === rows.length - 1 ? 'none' : '1px solid var(--border)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(13,27,42,0.06)' }}
                >
                  <Icon size={17} strokeWidth={1.75} style={{ color: 'var(--navy)' }} />
                </span>
                <div className="min-w-0">
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p
                      className="text-[13px] mt-0.5 leading-snug truncate"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {KIND_LABEL[item.kind]}
              </span>

              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span>{deletedAgo(item.deletedAt)}</span>
                <span className="block text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  by {item.deletedBy}
                </span>
              </div>

              <span
                className="inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[12px] font-semibold"
                style={
                  urgent
                    ? { background: 'rgba(185,28,28,0.10)', color: '#B91C1C' }
                    : { background: 'rgba(13,27,42,0.06)', color: 'var(--text-secondary)' }
                }
              >
                {left === 1 ? '1 day' : `${left} days`}
              </span>

              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => onRestore(item)}
                  className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[13px] font-semibold transition-colors hover:bg-black/[0.02]"
                  style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
                >
                  <ArrowCounterClockwise size={14} strokeWidth={2} /> Restore
                </button>
                <button
                  type="button"
                  onClick={() => onPurge(item)}
                  aria-label={`Delete “${item.title}” permanently`}
                  className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center transition-colors hover:bg-[rgba(185,28,28,0.08)]"
                  style={{ color: '#B91C1C' }}
                >
                  <Trash size={15} strokeWidth={2} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
