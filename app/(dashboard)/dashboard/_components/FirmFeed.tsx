'use client'

import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardStats } from '@/types'

/**
 * Activity tab body — live stream of every member action across the
 * firm. Filtering lands in the next pass.
 */
export function FirmFeed({
  activity,
  isLoading,
}: {
  activity: DashboardStats['recent_activity'] | undefined
  isLoading: boolean
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-6 pt-5 pb-4">
        <CardTitle className="text-base">Activity across the firm</CardTitle>
        <CardDescription className="mt-1">
          Live stream of every member action. Filtering lands in the next pass.
        </CardDescription>
      </div>
      <div className="px-3 pb-3">
        {isLoading ? (
          <div className="px-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !activity?.length ? (
          <p
            className="px-3 pb-4 text-[13px]"
            style={{ color: 'var(--text-muted)' }}
          >
            No activity yet. As members work, their actions will appear here.
          </p>
        ) : (
          <ul className="flex flex-col">
            {activity.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--surface-overlay)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded shrink-0"
                    style={{
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {item.type}
                  </span>
                  <span
                    className="text-[13.5px] truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.title}
                  </span>
                </div>
                <span
                  className="text-[12px] tabular-nums shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {new Date(item.created_at).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
