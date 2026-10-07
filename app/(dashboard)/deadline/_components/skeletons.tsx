/**
 * Suspense fallbacks for the Deadline engine sections. Each mirrors the
 * footprint of the section it stands in for so nothing shifts when the
 * data lands. They double as the server/hydration render (see
 * `useAttentionFeedQuery`), so they must stay free of client-only values.
 */

import { Skeleton } from '@/components/ui/skeleton'

const surface = {
  background: 'var(--surface-card)',
  borderColor: 'var(--border-default)',
}

export function HeaderSummarySkeleton() {
  return <Skeleton className="mt-2 h-4 w-56" />
}

export function DocketBriefSkeleton() {
  return (
    <div
      className="grid overflow-hidden rounded-2xl border lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
      style={{ ...surface, background: 'var(--cream-white)' }}
      aria-busy
      aria-label="Loading your docket"
    >
      <div className="px-7 py-6">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-3 h-6 w-48" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <div className="mt-6 flex gap-4 rounded-xl border p-4" style={surface}>
          <Skeleton className="h-[86px] w-[68px] rounded-lg" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="mt-4 h-8 w-40" />
          </div>
        </div>
      </div>
      <div className="border-t px-7 py-6 lg:border-l lg:border-t-0" style={{ borderColor: 'var(--border-soft)' }}>
        <Skeleton className="h-4 w-40" />
        <div className="mt-6 grid grid-cols-7 gap-1">
          {Array.from({ length: 14 }, (_, i) => (
            <Skeleton key={i} className="h-[54px] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function AttentionListSkeleton() {
  return (
    <div aria-busy aria-label="Loading items">
      <Skeleton className="mb-3 h-4 w-32" />
      <div className="overflow-hidden rounded-xl border" style={surface}>
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3"
            style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)' }}
          >
            <Skeleton className="h-[62px] w-[52px] rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-2xl border p-5" style={surface} aria-busy>
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-3.5 w-full" />
      ))}
    </div>
  )
}
