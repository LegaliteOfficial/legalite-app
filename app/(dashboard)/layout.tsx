import { Sidebar } from '@/components/layout/Sidebar'
import { APP_BACKGROUND } from '@/components/layout/app-background'
import { MobileNav } from '@/components/layout/MobileNav'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { NavigationProgress } from '@/components/shared/NavigationProgress'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { PriorityRemindersBoot } from '@/components/shared/PriorityRemindersBoot'
import { TimeTrackerBoot } from '@/components/shared/TimeTrackerBoot'
import { EventNoticeBanner } from '@/components/shared/EventNoticeBanner'

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
      <div className="h-screen overflow-hidden p-3" style={APP_BACKGROUND}>
        <div className="flex h-full overflow-hidden gap-3">
          <NavigationProgress />
          {/* Desktop sidebar — hidden below lg, where the drawer takes over. */}
          <div className="hidden lg:block h-full shrink-0">
            <Sidebar />
          </div>
          <main
            className="flex-1 flex flex-col overflow-hidden rounded-2xl"
            style={{
              background: 'rgba(244, 244, 245, 0.86)',
              backdropFilter: 'blur(6px)',
              // Bump the dashboard's pixel-baked design tokens (text-[11px],
              // text-[13px], icons, padding) by 10% in one place. Sidebar
              // isn't affected because it's a sibling, not a child.
              // `zoom` scales text + icons + spacing together so the
              // result stays balanced — `font-size: 110%` would only
              // affect rem-based text, which this codebase doesn't use.
              zoom: 1.1,
            }}
          >
            {/* Hamburger + wordmark, only below lg. */}
            <MobileTopBar />
            {/* Global notice: prompts when a calendar event is now / imminent. */}
            <EventNoticeBanner />
            {children}
          </main>
        </div>

        {/* Mobile nav drawer — mounted at the root, outside the zoomed
            <main>, so its fixed positioning tracks the viewport. */}
        <MobileNav />
      </div>
    </AuthGuard>
  )
}
