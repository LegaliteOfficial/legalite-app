'use client'

import { Button } from '@/components/ui/button'

export function DocumentsErrorPanel({
  what = 'documents',
  onRetry,
}: {
  /** Names the part that failed, so the other tabs are not implicated. */
  what?: string
  onRetry?: () => void
} = {}) {
  return (
    <div className="mt-4">
      <div>
        <div
          className="rounded-2xl border px-10 py-12 text-center"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-soft)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <p
            className="text-[14px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Could not load your {what}
          </p>
          <p
            className="mx-auto mt-1.5 max-w-sm text-[12.5px]"
            style={{ color: 'var(--text-muted)' }}
          >
            Templates and the editor still work, so you can keep drafting
            while this is unavailable.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (onRetry ? onRetry() : window.location.reload())}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    </div>
  )
}
