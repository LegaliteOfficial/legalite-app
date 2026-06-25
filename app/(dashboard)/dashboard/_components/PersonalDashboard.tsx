'use client'

import Link from 'next/link'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { PrioritiesPanel } from '@/components/shared/PrioritiesPanel'
import { useAuthStore } from '@/stores/auth.store'
import { QUICK_ACTIONS } from '../_constants'
import { AgendaSection } from './AgendaSection'

/**
 * Personal tab body.
 *
 * Layout is two zones:
 *   1. "Today's agenda" hero — full width, tasks + events side by side.
 *      This is the daily driver, so it leads and gets the most room.
 *   2. A balanced two-column row below it — the user's priorities on
 *      one side, a utility rail (quick actions + billable nudge) on the
 *      other. Splitting the lower zone keeps the page short and stops
 *      the sparse cards from stretching across empty full width.
 */
export function PersonalDashboard() {
  // Falls back to the same dev sentinel PriorityButton uses so the
  // panel surfaces flags set under DEV_BYPASS where there's no real
  // user in the auth store.
  const userId = useAuthStore((s) => s.user?.id) ?? 'dev-user'

  return (
    <div className="space-y-6">
      <AgendaSection />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <PrioritiesPanel scope="user" userId={userId} />

        <div className="space-y-6">
          <QuickActionsCard />
          <BillableProgressCard />
        </div>
      </div>
    </div>
  )
}

/**
 * Quick actions — personal day-to-day shortcuts (kept on Personal, not
 * Firm). A 2x2 grid keeps the four shortcuts compact in the rail.
 */
function QuickActionsCard() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <CardTitle className="text-base">Quick actions</CardTitle>
      </div>
      <div className="px-2.5 pb-2.5 grid grid-cols-2 gap-1">
        {QUICK_ACTIONS.map(({ label, Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors hover:bg-[var(--surface-overlay)]"
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
  )
}

/**
 * Billable-progress nudge. Compact in the rail; surfaces utilisation
 * once matters are populated.
 */
function BillableProgressCard() {
  return (
    <Card variant="default" padding="lg">
      <CardTitle className="text-base">Track your billable progress</CardTitle>
      <CardDescription className="mt-1">
        Set a personal hourly target — we&rsquo;ll surface utilisation here once
        matters are populated.
      </CardDescription>
      <Link
        href="/settings"
        className="mt-4 inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors hover:opacity-90"
        style={{ background: 'var(--navy)', color: 'white' }}
      >
        Set target
      </Link>
    </Card>
  )
}
