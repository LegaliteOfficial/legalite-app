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
 * Sharing / Gear / New Calendar tabs are not implemented yet
 * — clicking them surfaces a "coming soon" toast that points at
 * the right downstream surface, mirroring the More menu pattern.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Calendar as CalendarIcon, Copy, DownloadSimple, RssSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useDeadlines } from '@/hooks/use-deadlines'
import { useCalendarFeed } from '@/hooks/use-calendar-feed'
import { errorMessage } from '@/lib/errors'
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

  const feed = useCalendarFeed()
  // The secret link is only known right after it is created; keep it for this
  // visit so it can be copied, then it is gone (only a hash is stored).
  const [newLink, setNewLink] = useState<string | null>(null)

  const createLink = async () => {
    try {
      setNewLink(await feed.createLink())
      toast.success('Subscribe link created. Copy it now; it will not be shown again.')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not create the subscribe link.'))
    }
  }
  const revokeLink = async () => {
    try {
      await feed.revokeLink()
      setNewLink(null)
      toast.success('Subscribe link turned off. Calendars using it will stop updating.')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not turn off the subscribe link.'))
    }
  }
  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Subscribe link copied.')
    } catch {
      toast.error('Could not copy the link. Select and copy it manually.')
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
          Feeds / Sharing / Gear / New Calendar. The active tab
          gets a gold underline + bold heading colour; the others
          are muted and either link to the working route or toast. */}
      <div
        className="flex items-center gap-1 overflow-x-auto px-6 pt-4 sm:pt-6 border-b shrink-0 scrollbar-none"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        {CALENDAR_TABS.map((tab) => {
          const isActive = tab.key === activeTab
          const baseClasses =
            'inline-flex shrink-0 items-center whitespace-nowrap px-3 pb-3 pt-1 text-[14px] font-medium cursor-pointer transition-colors border-b-2 -mb-px'
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
          title="Your deadlines"
          description="Deadlines you own, with the case they belong to."
          subscribe={
            <SubscribeLink
              loading={feed.isLoading}
              active={feed.status?.active ?? false}
              lastUsedAt={feed.status?.last_used_at ?? null}
              newLink={newLink}
              working={feed.isWorking}
              onCreate={() => void createLink()}
              onRevoke={() => void revokeLink()}
              onCopy={(u) => void copyLink(u)}
            />
          }
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
          The subscribe link is private to you: anyone who has it can
          read your deadlines, so do not share it. It stops working if you
          turn it off, replace it, or leave the firm. Calendar apps refresh
          a subscribed feed on their own schedule, often every few hours.
          The download is a one-time snapshot you can import once.
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
  subscribe,
  onDownload,
}: {
  title: string
  description: string
  subscribe: React.ReactNode
  onDownload: () => void
}) {
  return (
    <div className="py-5 border-t" style={{ borderColor: 'var(--border-soft)' }}>
      <div className="min-w-0">
        <h3
          className="text-[15px] font-semibold leading-tight"
          style={{
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-heading, "Playfair Display", serif)',
          }}
        >
          {title}
        </h3>
        <p className="text-[13px] mt-1.5" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      </div>

      <div className="mt-3">{subscribe}</div>

      <div className="mt-2 flex items-center gap-2">
        <CalendarIcon size={14} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} aria-hidden />
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-1.5 text-[13px] underline underline-offset-2 cursor-pointer"
          style={{ color: 'var(--gold-dark)' }}
        >
          <DownloadSimple size={13} strokeWidth={1.75} />
          Download {title} as .ics
        </button>
      </div>
    </div>
  )
}

function SubscribeLink({
  loading,
  active,
  lastUsedAt,
  newLink,
  working,
  onCreate,
  onRevoke,
  onCopy,
}: {
  loading: boolean
  active: boolean
  lastUsedAt: string | null
  newLink: string | null
  working: boolean
  onCreate: () => void
  onRevoke: () => void
  onCopy: (url: string) => void
}) {
  const btn = 'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] cursor-pointer disabled:opacity-60'
  const btnStyle = { background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }
  if (loading) {
    return <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Checking your subscribe link...</p>
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <RssSimple size={14} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} aria-hidden />
        {!active && (
          <>
            <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              No subscribe link yet.
            </span>
            <button type="button" className={btn} style={btnStyle} onClick={onCreate} disabled={working}>
              Create subscribe link
            </button>
          </>
        )}
        {active && (
          <>
            <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              Subscribe link is on
              {lastUsedAt ? ` (last used ${new Date(lastUsedAt).toLocaleDateString()})` : ' (not used yet)'}.
            </span>
            <button type="button" className={btn} style={btnStyle} onClick={onCreate} disabled={working}>
              Replace link
            </button>
            <button type="button" className={btn} style={btnStyle} onClick={onRevoke} disabled={working}>
              Turn off
            </button>
          </>
        )}
      </div>
      {newLink && (
        <div
          className="rounded-md border p-3"
          style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-sunken)' }}
        >
          <p className="text-[12px] mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Copy this link now. For security it is not shown again.
          </p>
          <div className="flex items-center gap-2">
            <code
              className="text-[12px] break-all flex-1"
              style={{ color: 'var(--text-primary)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
            >
              {newLink}
            </code>
            <button type="button" className={btn} style={btnStyle} onClick={() => onCopy(newLink)} aria-label="Copy subscribe link">
              <Copy size={12} strokeWidth={1.75} />
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
