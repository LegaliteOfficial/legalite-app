/**
 * GET /api/calendar/feeds/[scope]
 * --------------------------------
 * Serves the user's LegaLite calendar as a valid RFC 5545 .ics
 * feed. This is the URL that `webcal://…` subscribe links point
 * at — when the user clicks the subscribe link on the Feeds page
 * the OS opens its calendar app (Calendar.app, Outlook, etc.),
 * which then fetches this route and renders the events live.
 *
 * `scope` is currently a single value — `your`, the signed-in
 * user's own events. Firm-wide and all-visible-layers feeds will
 * come back once the calendar-layers feature ships and there's a
 * meaningful partition of events to serve. The path param is kept
 * (rather than collapsed to a non-parametric route) so adding
 * scopes back later is a one-line change to the SCOPES tuple.
 *
 * The route returns `text/calendar; charset=utf-8` with a generous
 * cache window so calendar clients (Apple Calendar polls every
 * 15min by default) don't hammer the API. CORS is open so
 * subscribed clients fetching from outside the browser origin
 * don't get blocked.
 *
 * In `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` mode the route serves the
 * shared dev sample deadlines (same records the grid renders).
 * When the GraphQL backend lands, swap the `loadDeadlines` impl
 * to read from there using the request's auth token / cookie.
 */

import { NextResponse } from 'next/server'
import { buildICalendar } from '@/lib/calendar/ical'
import {
  DEV_SAMPLE_DEADLINES,
  type DevDeadline,
} from '@/lib/calendar/dev-data'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

/**
 * Scopes the feed accepts. The path param is validated against
 * this list — unknown scopes return 404 so misspellings don't
 * silently return an empty feed. Add new scopes here once the
 * Feeds UI surfaces them.
 */
const SCOPES = ['your'] as const
type Scope = (typeof SCOPES)[number]

interface ScopeMeta {
  /** Human-readable name surfaced inside subscriber's calendar UI. */
  calendarName: string
  /** Caption shown under the calendar name in clients that render it. */
  description: string
}

const SCOPE_META: Record<Scope, ScopeMeta> = {
  your: {
    calendarName: 'LegaLite — Your calendar',
    description: 'Events you own',
  },
}

/**
 * Pluggable loader. Today it returns the dev sample. When the
 * GraphQL backend is wired up, replace this with a call that
 * reads the request's auth cookie / token and queries the live
 * deadlines table. Keeping the contract simple (Scope → list)
 * means the rest of the route handler doesn't change.
 */
async function loadDeadlines(_scope: Scope): Promise<DevDeadline[]> {
  if (DEV_BYPASS) {
    // The dev sample has no notion of ownership, so today the
    // 'your' scope returns the full sample list. When the
    // GraphQL backend lands, the request's auth context will
    // narrow this to the signed-in user's events.
    return DEV_SAMPLE_DEADLINES
  }
  // TODO(integrations-release): authenticate via the request
  // (cookie / Authorization header), then call the existing
  // GraphQL `deadlines` query with the appropriate scope filter.
  // Returning an empty list in non-dev mode is safe — the feed
  // is just empty, no error.
  return []
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ scope: string }> },
) {
  // Next.js 16 typed `params` as a Promise — the official guide
  // in `node_modules/next/dist/docs/` documents this break from
  // pre-16 sync params. Awaiting is required.
  const { scope: rawScope } = await params
  if (!SCOPES.includes(rawScope as Scope)) {
    return new NextResponse('Unknown calendar scope', { status: 404 })
  }
  const scope = rawScope as Scope
  const meta = SCOPE_META[scope]
  const deadlines = await loadDeadlines(scope)

  const ics = buildICalendar(deadlines, {
    calendarName: meta.calendarName,
    description: meta.description,
  })

  return new NextResponse(ics, {
    status: 200,
    headers: {
      // Per RFC 5545 §8.1 — text/calendar is the registered MIME.
      // The charset hint avoids latin-1 fallback on older clients.
      'Content-Type': 'text/calendar; charset=utf-8',
      // Hint to the OS calendar app to save the file under this
      // name if the user downloads rather than subscribes.
      'Content-Disposition': `inline; filename="legalite-${scope}.ics"`,
      // 5 minutes feels right — short enough that newly-added
      // deadlines surface quickly, long enough that a calendar
      // client polling every 15 minutes hits cache the second
      // poll inside the same window.
      'Cache-Control': 'public, max-age=300, must-revalidate',
      // Allow subscribed clients (running outside this browser
      // origin) to fetch the feed. iCalendar feeds are public
      // once the URL is known; gating happens on the URL itself.
      'Access-Control-Allow-Origin': '*',
    },
  })
}
