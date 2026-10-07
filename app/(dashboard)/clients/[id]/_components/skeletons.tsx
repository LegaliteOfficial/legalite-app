/**
 * Suspense fallbacks for the client profile sections. Each mirrors the
 * footprint of its section so nothing shifts when data lands. They also
 * serve as the server/hydration render, so they hold no client-only values.
 */

import { Skeleton } from '@/components/ui/skeleton'

const surface = { background: 'var(--surface-card)', borderColor: 'var(--border-default)' }

export function ProfileHeaderSkeleton() {
  return (
    <div className="rounded-2xl border px-7 py-6" style={{ ...surface, background: 'var(--cream-white)' }} aria-busy aria-label="Loading client">
      <div className="flex items-center gap-5">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-3.5 w-80 max-w-full" />
        </div>
        <Skeleton className="hidden h-9 w-64 sm:block" />
      </div>
    </div>
  )
}

export function SectionSkeleton({ rows = 3, label }: { rows?: number; label: string }) {
  return (
    <div className="rounded-2xl border" style={surface} aria-busy aria-label={label}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
        <Skeleton className="h-4 w-36" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderTop: i ? '1px solid var(--border-soft)' : 'none' }}>
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function SideCardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3.5 rounded-2xl border p-5" style={surface} aria-busy>
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-3.5 w-full" />
        </div>
      ))}
    </div>
  )
}
