'use client'

/**
 * Calendar Feeds page
 * -------------------
 * Lets the user subscribe to or download their LegaLite calendar
 * as an .ics feed from third-party apps (Apple Calendar, Outlook,
 * Google Calendar, Fantastical, etc.).
 *
 * Three feeds are surfaced — matching the standard practice-
 * management pattern:
 *
 *   1. Your calendar  — events the signed-in user owns.
 *   2. Firm           — events from across the whole firm. Useful
 *                       for paralegals / partners who want the
 *                       full schedule in one feed.
 *   3. All visible    — every feed the user currently has ticked
 *                       in the calendar layers (when those ship).
 *                       Today this is equivalent to "all events
 *                       this user can read".
 *
 * Subscribe URL (`webcal://`) and one-shot download (`.ics` file)
 * are exposed for each. The subscribe URL is a stable, signed URL
 * that the backend will serve once the integrations release ships;
 * for now the URL is stubbed to a deterministic placeholder so the
 * user sees the right pattern and can copy/save it in their tooling.
 * The download buttons work end-to-end today: the .ics file is
 * generated client-side from the in-memory deadlines and saved
 * via a Blob URL.
 *
 * Sharing / Settings / New Calendar tabs are not implemented yet
 * — clicking them surfaces a "coming soon" toast that points at
 * the right downstream surface, mirroring the More menu pattern.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar as CalendarIcon, Copy, Download, Rss } from 'lucide-react'
import { toast } from 'sonner'
import { useDeadlines } from '@/hooks/use-deadlines'
import { useAuthStore } from '@/stores/auth.store'
import { buildICalendar, downloadIcs } from '@/lib/calendar/ical'

/**
 * Tabs surfaced at the top of every calendar-settings sub-page.
 * `route` is null when the tab is not yet implemented — clicking
 * those toasts instead of navigating.
 */
const CALENDAR_TABS = [
  { key: 'calendar', label: 'Calendar', route: '/calendar' as string | null },
  { key: 'feeds', label: 'Feeds', route: '/calendar/feeds' as string | null },
  { key: 'sharing', label: 'Sharing', route: null as string | null },
  { key: 'settings', label: 'Settings', route: null as string | null },
  { key: 'new', label: 'New Calendar', route: null as string | null },
] as const

type TabKey = (typeof CALENDAR_TABS)[number]['key']

export default function CalendarFeedsPage() {
  const { data: deadlines } = useDeadlines()
  const user = useAuthStore((s) => s.user)

  // The subscribe URL needs to point at THIS dev server (or the
  // deployed app's host) so the OS calendar client can actually
  // fetch the .ics. `webcal://` is the de-facto scheme for "one
  // click subscribe" — macOS / Apple Calendar maps it to the
  // built-in handler, Outlook hands to its own subscriber, etc.
  // We compute the host on the client because Next renders this
  // route from any deployment without a hard-coded baseUrl.
  // Empty string on the server pass — replaced on hydration.
  const [feedHost, setFeedHost] = useState('')
  useEffect(() => {
    setFeedHost(window.location.host)
  }, [])

  // URL follows the API route shape: `/api/calendar/feeds/[scope]`.
  // Only `your` is exposed today — Firm / All-visible feeds get
  // added back when the calendar-layers feature ships, since they
  // only make sense once events are partitioned across layers.
  // While `feedHost` is empty (SSR / first paint) the URL falls
  // back to a placeholder so subscribers don't see a broken link
  // mid-hydration; we toast a hint in that window if clicked.
  const hostReady = feedHost.length > 0
  const yourFeedUrl = hostReady
    ? `webcal://${feedHost}/api/calendar/feeds/your`
    : 'webcal://…/api/calendar/feeds/your'

  /** Copy a feed URL to the clipboard and toast-confirm. */
  const copyUrl = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(
        `${label} feed URL copied. Becomes live once the integrations release ships.`,
      )
    } catch {
      // Older Safari / non-secure context — surface the URL so
      // the user can copy it manually.
      toast.info(`Copy this URL manually: ${url}`)
    }
  }

  /**
   * Build an .ics document from the current deadline list and
   * trigger a browser download. The Firm and All-visible feeds
   * use the same dataset today; once a `scope` parameter lands on
   * useDeadlines() this can pass `scope='firm'` etc.
   */
  const download = (
    filename: string,
    calendarName: string,
    description: string,
  ) => {
    const ics = buildICalendar(deadlines ?? [], {
      calendarName,
      description,
    })
    downloadIcs(filename, ics)
    toast.success(`${calendarName} downloaded as ${filename}.`)
  }

  /**
   * Handler for the tab nav. Working tabs use a regular <Link>;
   * unimplemented tabs render a button that toasts a context-
   * appropriate hint instead of navigating.
   */
  const onUnavailableTab = (label: string) => {
    if (label === 'Sharing') {
      toast.info('Calendar sharing ships with team workspaces.')
    } else if (label === 'Settings') {
      toast.info('Calendar settings open from Settings → Calendar.')
    } else if (label === 'New Calendar') {
      toast.info('Multiple calendars ship with the matter-team workspace.')
    }
  }

  const activeTab: TabKey = 'feeds'

  return (
    <div
      className="flex-1 flex flex-col overflow-y-auto"
      style={{ background: 'var(--surface-card)' }}
    >
      {/* ─── Tab nav ───────────────────────────────────────────── */}
      {/* Horizontal tabs matching the reference layout: Calendar /
          Feeds / Sharing / Settings / New Calendar. The active tab
          gets a gold underline + bold heading colour; the others
          are muted and either link to the working route or toast. */}
      <div
        className="flex items-center gap-1 px-6 pt-6 border-b shrink-0"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        {CALENDAR_TABS.map((tab) => {
          const isActive = tab.key === activeTab
          const baseClasses =
            'inline-flex items-center px-3 pb-3 pt-1 text-[14px] font-medium cursor-pointer transition-colors border-b-2 -mb-px'
          const style: React.CSSProperties = {
            color: isActive
              ? 'var(--text-primary)'
              : 'var(--text-secondary)',
            borderColor: isActive ? 'var(--gold)' : 'transparent',
            fontFamily: isActive
              ? 'var(--font-heading, "Playfair Display", serif)'
              : undefined,
            fontWeight: isActive ? 600 : 500,
          }
          if (tab.route) {
            return (
              <Link
                key={tab.key}
                href={tab.route}
                className={baseClasses}
                style={style}
              >
                {tab.label}
              </Link>
            )
          }
          return (
            <button
              key={tab.key}
              type="button"
              className={baseClasses}
              style={style}
              onClick={() => onUnavailableTab(tab.label)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ─── Intro paragraph ──────────────────────────────────── */}
      <div className="px-6 pt-6 pb-2 max-w-3xl">
        <p
          className="text-[14px] leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          Calendar feeds let you view your LegaLite calendar events
          from third-party applications such as Apple Calendar,
          Outlook, or Google Calendar.
        </p>
      </div>

      {/* ─── Feed rows ────────────────────────────────────────── */}
      {/* Only "Your calendar" is surfaced today. Firm / All-visible
          rows will return once the calendar-layers feature ships
          and there's a meaningful partition of events to feed. */}
      <div className="px-6 py-4 max-w-3xl space-y-1">
        <FeedRow
          title="Your calendar"
          description="Events you own (created by you, or assigned to you)."
          subscribeUrl={yourFeedUrl}
          subscribeReady={hostReady}
          onCopy={() => copyUrl(yourFeedUrl, 'Your calendar')}
          onDownload={() =>
            download(
              'legalite-your-calendar.ics',
              'LegaLite — Your calendar',
              `Events owned by ${user?.name ?? 'this user'}`,
            )
          }
        />
      </div>

      {/* ─── Footnote ─────────────────────────────────────────── */}
      <div className="px-6 pb-8 max-w-3xl">
        <p
          className="text-[12.5px] leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Clicking a subscribe URL hands the link to your operating
          system, which opens the local calendar app (Calendar.app on
          macOS, Outlook on Windows, etc.) and offers to subscribe.
          Subscribed calendars pull fresh events automatically every
          few minutes. The download links one-shot a snapshot you can
          import once.
        </p>
      </div>
    </div>
  )
}

/**
 * One feed row — title, short blurb, then a stacked pair of
 * action links: a subscribe URL with a copy button, and a
 * download button that triggers the .ics blob. The visual layout
 * deliberately leaves room on the right for a future "Edit feed"
 * action without rewriting the row.
 */
function FeedRow({
  title,
  description,
  subscribeUrl,
  subscribeReady,
  onCopy,
  onDownload,
}: {
  title: string
  description: string
  subscribeUrl: string
  /**
   * False during SSR / first paint (before `window.location.host`
   * is available). When false the link click toasts a hint instead
   * of trying to navigate to a placeholder host that can't resolve.
   */
  subscribeReady: boolean
  onCopy: () => void
  onDownload: () => void
}) {
  return (
    <div
      className="py-5 border-t"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3
            className="text-[15px] font-semibold leading-tight"
            style={{
              color: 'var(--text-primary)',
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            {title}
          </h3>
          <p
            className="text-[13px] mt-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Subscribe URL row — readable, monospace, with a copy
          button at the end. Title-cased icon labels match the rest
          of the app's "icon + label" convention. */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Rss
          size={14}
          strokeWidth={1.75}
          style={{ color: 'var(--text-muted)' }}
          aria-hidden
        />
        <a
          href={subscribeUrl}
          className="text-[13px] truncate underline underline-offset-2"
          style={{
            color: 'var(--gold-dark)',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, monospace',
            maxWidth: 360,
          }}
          onClick={(e) => {
            // Pre-hydration the URL points at a placeholder host
            // ("…/api/calendar/feeds/your") that can't resolve.
            // Block the navigation and toast a hint instead. Once
            // `window.location.host` is captured into state, the
            // link goes live and the browser hands `webcal://` to
            // the OS calendar handler (Calendar.app, Outlook, …).
            if (!subscribeReady) {
              e.preventDefault()
              toast.info('Loading feed URL — try again in a moment.')
            }
            // Otherwise: do NOT preventDefault. The browser will
            // launch the registered handler for `webcal://`, which
            // opens the local calendar app with a "Subscribe to
            // this calendar?" prompt. Calendar then fetches the
            // URL (webcal:// → http(s)://) and renders the events.
          }}
        >
          {subscribeUrl}
        </a>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] cursor-pointer"
          style={{
            background: 'var(--surface-sunken)',
            color: 'var(--text-secondary)',
          }}
          aria-label="Copy subscribe URL"
        >
          <Copy size={12} strokeWidth={1.75} />
          Copy
        </button>
      </div>

      {/* Download row — fully working today; .ics is generated
          client-side from the cached deadlines. */}
      <div className="mt-2 flex items-center gap-2">
        <CalendarIcon
          size={14}
          strokeWidth={1.75}
          style={{ color: 'var(--text-muted)' }}
          aria-hidden
        />
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-1.5 text-[13px] underline underline-offset-2 cursor-pointer"
          style={{ color: 'var(--gold-dark)' }}
        >
          <Download size={13} strokeWidth={1.75} />
          Download {title} as .ics
        </button>
      </div>
    </div>
  )
}
