'use client'

import Link from 'next/link'
import { FolderLock, Plus } from '@phosphor-icons/react'

export function EmptyState() {
  return (
    <div className="py-16 px-5 text-center">
      <div
        className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(13,27,42,0.06)' }}
      >
        <FolderLock
          size={28}
          strokeWidth={1.5}
          style={{ color: 'var(--navy)' }}
        />
      </div>
      <h3
        className="font-heading text-lg font-bold mb-1"
        style={{ color: 'var(--navy)' }}
      >
        No Roles Found
      </h3>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        Keep roles organised to manage user access across the firm.
      </p>
      <Link
        href="/settings/roles/new"
        className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: 'var(--gold)' }}
      >
        <Plus size={14} strokeWidth={2.5} /> Create role
      </Link>
    </div>
  )
}
