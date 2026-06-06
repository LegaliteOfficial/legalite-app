'use client'

import { Button } from '@/components/ui/button'

export function ErrorPanel({ onRetry }: { onRetry: () => void }) {
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
        Unable to load cases
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
