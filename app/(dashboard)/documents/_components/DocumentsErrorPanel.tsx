'use client'

import { Button } from '@/components/ui/button'

export function DocumentsErrorPanel() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
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
            Failed to load documents
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    </div>
  )
}
