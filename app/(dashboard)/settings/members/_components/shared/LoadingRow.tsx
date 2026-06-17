'use client'

import { Spinner } from '@/components/shared/Spinner'

export function LoadingRow() {
  return (
    <div
      className="flex items-center justify-center gap-2 py-16"
      style={{ color: '#6B7280' }}
    >
      <Spinner size={16} /> <span className="text-sm">Loading…</span>
    </div>
  )
}
