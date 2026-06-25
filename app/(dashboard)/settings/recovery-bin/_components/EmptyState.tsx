'use client'

import { TrashSimple } from '@phosphor-icons/react'

export function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="py-16 px-5 text-center">
      <div
        className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(13,27,42,0.06)' }}
      >
        <TrashSimple size={28} strokeWidth={1.5} style={{ color: 'var(--navy)' }} />
      </div>
      <h3
        className="font-heading text-lg font-bold mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {filtered ? 'Nothing matches' : 'Recovery bin is empty'}
      </h3>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {filtered
          ? 'No deleted items match the current filter.'
          : 'Deleted cases, clients, tasks, and documents will appear here.'}
      </p>
    </div>
  )
}
