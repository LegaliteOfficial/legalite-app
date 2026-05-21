'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function PageSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <div className="flex items-end justify-between gap-6 mb-7">
          <div className="space-y-2">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-soft)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
            <Skeleton className="h-4 w-full max-w-[300px]" />
          </div>
          <div className="px-5 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="py-3 border-b last:border-b-0" style={{ borderColor: 'var(--border-soft)' }}>
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
