'use client'

import Link from 'next/link'
import { CalendarDots } from '@phosphor-icons/react'
import { Card, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PrioritiesPanel } from '@/components/shared/PrioritiesPanel'
import type { DashboardStats } from '@/types'
import { FirmOverview } from './FirmOverview'

/**
 * Firm tab body: utilisation overview at the top, then a two-third
 * "Upcoming court dates" panel + a one-third firm-wide priorities
 * panel underneath.
 */
export function FirmDashboard({
  stats,
  isLoading,
}: {
  stats: DashboardStats | undefined
  isLoading: boolean
}) {
  return (
    <div className="space-y-6">
      <FirmOverview />

      <div className="grid grid-cols-3 gap-4">
        <Card padding="none" className="col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDots
                size={15}
                strokeWidth={1.75}
                style={{ color: 'var(--text-secondary)' }}
              />
              <CardTitle className="text-base">Upcoming court dates</CardTitle>
            </div>
            <Link
              href="/deadline"
              className="text-[12.5px] font-medium hover:underline underline-offset-2"
              style={{ color: 'var(--text-muted)' }}
            >
              View all
            </Link>
          </div>
          <div className="px-3 pb-3">
            {isLoading ? (
              <div className="px-3 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !stats?.upcoming_dates?.length ? (
              <p
                className="px-3 pb-4 text-[13px]"
                style={{ color: 'var(--text-muted)' }}
              >
                No upcoming dates. Add cases to track them.
              </p>
            ) : (
              <ul className="flex flex-col">
                {stats.upcoming_dates.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--surface-overlay)]"
                  >
                    <div className="min-w-0">
                      <div
                        className="text-[13.5px] font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {item.title}
                      </div>
                      <div
                        className="text-[12px] truncate"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {item.client_name} · {item.court ?? 'No court'}
                      </div>
                    </div>
                    <div
                      className="text-[12.5px] font-medium tabular-nums shrink-0"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {new Date(item.next_court_date).toLocaleDateString(
                        undefined,
                        {
                          month: 'short',
                          day: 'numeric',
                        },
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Firm-wide priorities — aggregate of every prioritised case /
            client across the firm. Click-through goes to the entity's
            detail page. */}
        <PrioritiesPanel scope="firm" />
      </div>
    </div>
  )
}
