import { Sidebar } from '@/components/layout/Sidebar'
import { APP_BACKGROUND } from '@/components/layout/app-background'
import { MobileNav } from '@/components/layout/MobileNav'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { NavigationProgress } from '@/components/shared/NavigationProgress'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { PriorityRemindersBoot } from '@/components/shared/PriorityRemindersBoot'
import { TimeTrackerBoot } from '@/components/shared/TimeTrackerBoot'
import { EventNoticeBanner } from '@/components/shared/EventNoticeBanner'
import { EventDuePrompt } from '@/components/shared/EventDuePrompt/EventDuePrompt'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      {/* Mount priority-reminder scanner once at the layout level
          so flagged-case hearing reminders fire anywhere inside
          the authenticated app, not just on the dashboard page. */}
      <PriorityRemindersBoot />
      {/* Billable-hour timer system. Runs the 30-min check-in
          scheduler, mounts the check-in dialog, and renders the
          floating active-timer widget. Lives at the layout level
          so a running timer follows the partner across pages. */}
      <TimeTrackerBoot />
      {/* Phones and tablets: a solid light app surface edge to edge.
          Desktop (lg+): the law-firm photo frames the floating panels. */}
      <div className="relative h-dvh overflow-hidden bg-[var(--surface-page)] lg:bg-transparent lg:p-3">
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block" style={APP_BACKGROUND} />
      {/* Global Event Due prompt — fetches pending events on mount +
          on tab visibility (30 s cooldown, debounced), portaled to the
          top-right so it floats over every route without blocking
          navigation. Renders nothing when the queue is empty. */}
      <EventDuePrompt />
        <div className="relative flex h-full overflow-hidden lg:gap-3">
          <NavigationProgress />
          {/* Desktop sidebar — hidden below lg, where the drawer takes over. */}
          <div className="hidden lg:block h-full shrink-0">
            <Sidebar />
          </div>
          {/* Styling lives in .app-main (globals.css): solid on phones,
              frosted + 110% zoom on desktop, where the pixel-baked design
              tokens read small. */}
          <main className="app-main flex min-w-0 flex-1 flex-col overflow-hidden lg:rounded-2xl">
            {/* App header (firm / back), only below lg. */}
            <MobileTopBar />
            {/* Global notice: prompts when a calendar event is now / imminent. */}
            <EventNoticeBanner />
            {children}
            {/* Bottom tabs, only below lg. */}
            <MobileTabBar />
          </main>
        </div>

        {/* Mobile nav drawer — mounted at the root, outside the zoomed
            <main>, so its fixed positioning tracks the viewport. */}
        <MobileNav />
      </div>
    </AuthGuard>
  )
}
