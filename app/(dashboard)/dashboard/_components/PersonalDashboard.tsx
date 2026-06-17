'use client'

import Link from 'next/link'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { PrioritiesPanel } from '@/components/shared/PrioritiesPanel'
import { useAuthStore } from '@/stores/auth.store'
import { QUICK_ACTIONS } from '../_constants'
import { AgendaSection } from './AgendaSection'

/**
 * Personal tab body: today's agenda + the current user's priorities +
 * Quick actions + a billable-progress nag tile.
 */
export function PersonalDashboard() {
  // Falls back to the same dev sentinel PriorityButton uses so the
  // panel surfaces flags set under DEV_BYPASS where there's no real
  // user in the auth store.
  const userId = useAuthStore((s) => s.user?.id) ?? 'dev-user'

  return (
    <div className="space-y-6">
      <AgendaSection />
      <PrioritiesPanel scope="user" userId={userId} />

      {/* Quick actions live on the Personal tab (not Firm) because
          they're personal day-to-day shortcuts. */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 pt-5 pb-3">
          <CardTitle className="text-base">Quick actions</CardTitle>
        </div>
        <div className="px-3 pb-3 grid grid-cols-2 gap-1">
          {QUICK_ACTIONS.map(({ label, Icon, href }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors hover:bg-[var(--surface-overlay)]"
              style={{ color: 'var(--text-primary)' }}
            >
              <Icon
                size={15}
                strokeWidth={1.75}
                style={{ color: 'var(--text-muted)' }}
              />
              {label}
            </Link>
          ))}
        </div>
      </Card>

      <Card variant="default" padding="lg">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <CardTitle className="text-base">
              Track your billable progress
            </CardTitle>
            <CardDescription className="mt-1">
              Set a personal hourly target — we&rsquo;ll surface utilisation
              here once matters are populated.
            </CardDescription>
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors hover:opacity-90 shrink-0"
            style={{ background: 'var(--navy)', color: 'white' }}
          >
            Set target
          </Link>
        </div>
      </Card>
    </div>
  )
}
