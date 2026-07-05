import { Sidebar } from '@/components/layout/Sidebar'
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
      {/* Global Event Due prompt — fetches pending events on mount +
          on tab visibility (30 s cooldown, debounced), portaled to the
          top-right so it floats over every route without blocking
          navigation. Renders nothing when the queue is empty. */}
      <EventDuePrompt />
      <div
        className="h-screen overflow-hidden p-3"
        style={{
          backgroundImage:
            "linear-gradient(rgba(13,27,42,0.18), rgba(13,27,42,0.18)), url('/assets/images/law%20firm.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex h-full overflow-hidden gap-3">
          <NavigationProgress />
          <Sidebar />
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
            {/* Global notice: prompts when a calendar event is now / imminent. */}
            <EventNoticeBanner />
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
