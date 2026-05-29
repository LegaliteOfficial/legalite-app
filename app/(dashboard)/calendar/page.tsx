'use client'

/**
 * Calendar page
 * -------------
 * Full-screen weekly grid mirroring the Microsoft Teams calendar
 * layout the user shared. Sticky header with the page title +
 * meeting-action buttons (Join with an ID / Meet now / New meeting),
 * a date toolbar (Today / prev-week / next-week / current-month
 * label / view-mode pill), and a 7-column × 24-row grid of half-hour
 * slots. Today's column highlights in a subtle tint, the current-
 * time line draws a thin coloured rule across all columns, and
 * existing Deadlines surface as event blocks positioned by their
 * `due_date`.
 *
 * Events: backed by the existing `useDeadlines()` hook. Each event
 * spans 60 minutes today (Deadline only carries a single timestamp
 * — when the schema gains an `end_at` column the block height will
 * key off duration). Clicking a block toasts a stub until the
 * event-detail modal ships.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Briefcase,
  Calendar as CalendarIcon,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MoreHorizontal,
  Plus,
  Rss,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCases } from '@/hooks/use-cases'
import {
  useCreateDeadline,
  useDeadlines,
  useDeleteDeadline,
  useUpdateDeadline,
} from '@/hooks/use-deadlines'
import type { Deadline } from '@/hooks/use-deadlines'
import { useAuthStore } from '@/stores/auth.store'

// ── Constants ──────────────────────────────────────────────────────────

/**
 * Pixels per hour for the grid. Picked to match the Teams reference
 * — each hour row is comfortably tall enough to drop multi-line
 * event labels into without crowding the grid lines.
 */
const HOUR_HEIGHT = 56

/** Hours rendered in the day column (0–23). */
const HOURS = Array.from({ length: 24 }, (_, i) => i)

/**
 * Granularity used when snapping a click in the grid to a start
 * time. 15 minutes feels precise enough that most meetings land on
 * the right slot without manual fiddling, and matches the snap
 * behaviour Google Calendar / Outlook use.
 */
const SLOT_SNAP_MINUTES = 15

/** Default event duration when the user opens the dialog from a slot click. */
const DEFAULT_EVENT_MINUTES = 60

/**
 * View modes surfaced in the toolbar dropdown. Each one controls
 * how many day columns the grid renders and what range the prev/
 * next chevrons step by:
 *   - Day        → 1 column, single day; chevrons step by 1 day
 *   - Work week  → 5 columns, Monday–Friday; chevrons step by 1 week
 *   - Week       → 7 columns, Sunday–Saturday; chevrons step by 1 week
 *   - Month      → 6 rows × 7 cols of day cells covering the anchor's
 *                  month (plus the leading/trailing days needed to
 *                  fill the grid); chevrons step by 1 month and the
 *                  hourly time-gutter is hidden
 */
const VIEW_MODES = ['Day', 'Work week', 'Week', 'Month'] as const
type ViewMode = (typeof VIEW_MODES)[number]

/**
 * Categorical filter applied to the events surfaced in the grid.
 * Today the only categorical column we have on a Deadline is
 * `priority`, so the Event Types dropdown maps 1:1 to that —
 * unticking a row removes events at that priority from the grid.
 * When the schema gains a richer `event_type` column the dropdown
 * can swap its option list without touching the consumer code.
 */
const EVENT_TYPE_OPTIONS = [
  { key: 'High', label: 'High priority', dotVar: '--accent-danger' },
  { key: 'Medium', label: 'Medium priority', dotVar: '--accent-today' },
  { key: 'Low', label: 'Low priority', dotVar: '--text-muted' },
] as const
type EventTypeKey = (typeof EVENT_TYPE_OPTIONS)[number]['key']

// ── Date helpers ───────────────────────────────────────────────────────

/**
 * Anchor a Date to the Sunday that starts its week. Matches the
 * screenshot, which begins the row at Sunday and runs through
 * Saturday.
 */
function startOfWeek(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  out.setDate(out.getDate() - out.getDay())
  return out
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatHourLabel(h: number): string {
  if (h === 0) return '12 am'
  if (h === 12) return '12 pm'
  return h < 12 ? `${h} am` : `${h - 12} pm`
}

/**
 * Step a Date forward (or backward) by whole calendar months,
 * clamping the day-of-month to the last day of the target month
 * so e.g. (31 Jan + 1 month) lands on 28/29 Feb rather than 3 Mar.
 * Used by the prev/next chevrons when the active view is 'Month'.
 */
function addMonths(d: Date, n: number): Date {
  const out = new Date(d)
  const day = out.getDate()
  out.setDate(1)
  out.setMonth(out.getMonth() + n)
  const lastDay = new Date(
    out.getFullYear(),
    out.getMonth() + 1,
    0,
  ).getDate()
  out.setDate(Math.min(day, lastDay))
  return out
}

/**
 * Build the 42 (6 weeks × 7 days) day cells that fill a month view
 * grid. Starts on the Sunday on-or-before the 1st of `anchor`'s
 * month and runs forward 42 days so the bottom row tail-bleeds into
 * the following month. This matches every mainstream calendar
 * grid — fixed 6-row height avoids the layout jump months get when
 * they need 5 vs 6 rows.
 */
function monthGridDays(anchor: Date): Date[] {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const gridStart = startOfWeek(firstOfMonth)
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

// ── Page component ─────────────────────────────────────────────────────

export default function CalendarPage() {
  const { data: deadlines } = useDeadlines()
  const router = useRouter()

  // Anchor date — the focus is on the week that contains this date.
  // Clicking Today resets here; the chevrons shift by ±7 days.
  const [anchor, setAnchor] = useState<Date>(() => new Date())
  const [view, setView] = useState<ViewMode>('Week')

  // ── Event dialog state ───────────────────────────────────────────
  // The dialog handles both create AND edit. `editing` carries the
  // existing Deadline when we're editing it (click on a block);
  // `prefill` carries the day + start/end times when we're creating
  // from a slot click. They're mutually exclusive — exactly one is
  // set whenever `open` is true. Reset on close so re-opening from
  // the top button doesn't reuse stale state.
  const [eventDialog, setEventDialog] = useState<{
    open: boolean
    prefill: { date: Date; startMinutes: number; endMinutes: number } | null
    editing: Deadline | null
  }>({ open: false, prefill: null, editing: null })

  const openCreateDialog = (
    prefill?: { date: Date; startMinutes: number; endMinutes: number },
  ) =>
    setEventDialog({
      open: true,
      prefill: prefill ?? null,
      editing: null,
    })

  const openEditDialog = (deadline: Deadline) =>
    setEventDialog({ open: true, prefill: null, editing: deadline })

  // Only flip `open` on close; keep `editing`/`prefill` until the
  // next open call so the dialog doesn't flash "New event" during
  // the close animation (Radix keeps the node mounted briefly to
  // animate out, and any state read during that window would
  // otherwise see editing=null and render the create mode title).
  // openCreate/openEdit each reset the slots they care about, so
  // staleness can't leak into a subsequent open.
  const closeEventDialog = () =>
    setEventDialog((s) => ({ ...s, open: false }))

  // Standalone reminder composer — invoked from the "Set reminder"
  // button in the header. Smaller than the full event dialog: no
  // start/end window, no participants, no description — just
  // "what to remind me about, when, and how to notify me".
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)

  // ── Event-type filter ───────────────────────────────────────────
  // Tracks which categorical buckets the user wants to see in the
  // grid. Defaults to everything on so the calendar isn't
  // mysteriously empty on first load. Stored as a Set for cheap
  // membership checks while bucketing events.
  const [visibleTypes, setVisibleTypes] = useState<Set<EventTypeKey>>(
    () => new Set(EVENT_TYPE_OPTIONS.map((o) => o.key)),
  )
  const toggleType = (key: EventTypeKey) =>
    setVisibleTypes((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  // ── Days visible in the grid ─────────────────────────────────────
  // Derived from the active view + anchor. Picking 1/5/7/42 cells
  // and the right start-of-range here is enough to power the whole
  // grid; everything downstream just iterates `visibleDays`.
  const visibleDays = useMemo(() => {
    if (view === 'Day') return [anchor]
    if (view === 'Work week') {
      // Monday is index 1 in JS `getDay()` (0 = Sunday). Anchor on
      // the Monday of the anchor's week so Saturday/Sunday users
      // still land in the same Mon–Fri view.
      const anchorDow = anchor.getDay()
      // Days to subtract to land on Monday. Sunday → 6, Mon → 0,
      // Tue → 1, … Sat → 5.
      const back = (anchorDow + 6) % 7
      const monday = addDays(anchor, -back)
      monday.setHours(0, 0, 0, 0)
      return Array.from({ length: 5 }, (_, i) => addDays(monday, i))
    }
    if (view === 'Month') return monthGridDays(anchor)
    // Default: full week (Sun–Sat).
    const weekStart = startOfWeek(anchor)
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [anchor, view])

  // Move the anchor one "page" forward or backward — the meaning of
  // a page is view-dependent. Day = 1 day, Work-week / Week = 7 days,
  // Month = a full calendar month (addMonths clamps day-of-month).
  const stepAnchor = (direction: -1 | 1) => {
    setAnchor((d) => {
      if (view === 'Day') return addDays(d, direction)
      if (view === 'Month') return addMonths(d, direction)
      return addDays(d, direction * 7)
    })
  }
  const stepLabel =
    view === 'Day'
      ? { prev: 'Previous day', next: 'Next day' }
      : view === 'Month'
        ? { prev: 'Previous month', next: 'Next month' }
        : { prev: 'Previous week', next: 'Next week' }

  // ── Current time line ────────────────────────────────────────────
  // Re-renders every 60s so the "now" line crawls down the grid.
  // Pinned to the minute boundary instead of polling per-frame.
  const [now, setNow] = useState<Date>(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  // Auto-scroll to put the current time near the top of the viewport
  // when the page first loads. Saves users from scrolling past the
  // empty pre-dawn hours every time they open the page.
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!scrollerRef.current) return
    const minutes = now.getHours() * 60 + now.getMinutes()
    // Position the current time about 80px down from the top so the
    // user sees an hour of context above the now-line.
    const target = (minutes / 60) * HOUR_HEIGHT - 80
    scrollerRef.current.scrollTop = Math.max(target, 0)
    // Intentionally run once on mount; subsequent now-ticks shouldn't
    // hijack the scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Slot deadlines into the visible range, keyed by column index.
  // Works for Day (1 column), Work week (5), Week (7) and Month (42).
  // Events whose priority isn't currently ticked in the Event Types
  // filter are dropped here — the bucketed map is the single source
  // of truth for both the time grid and the month grid downstream.
  const eventsByDay = useMemo(() => {
    const map = new Map<number, Deadline[]>()
    for (let i = 0; i < visibleDays.length; i++) map.set(i, [])
    for (const d of deadlines ?? []) {
      if (!visibleTypes.has(d.priority as EventTypeKey)) continue
      const due = new Date(d.due_date)
      for (let i = 0; i < visibleDays.length; i++) {
        if (sameDay(due, visibleDays[i])) {
          map.get(i)!.push(d)
          break
        }
      }
    }
    return map
  }, [deadlines, visibleDays, visibleTypes])

  // Month label for the toolbar — shows the month(s) the visible
  // range falls in. If the range spans two months we show both
  // (e.g. "Apr / May 2026"). For the Month view we always show
  // the anchor month (and ignore the leading/trailing grid days
  // that bleed in from neighbouring months — those are visually
  // dimmed in the grid itself).
  const monthLabel = useMemo(() => {
    if (view === 'Month') {
      return `${anchor.toLocaleString('default', { month: 'long' })} ${anchor.getFullYear()}`
    }
    const first = visibleDays[0]
    const last = visibleDays[visibleDays.length - 1]
    const startMonth = first.toLocaleString('default', { month: 'long' })
    const endMonth = last.toLocaleString('default', { month: 'long' })
    const year = last.getFullYear()
    if (startMonth === endMonth) {
      return `${startMonth} ${year}`
    }
    return `${startMonth} / ${endMonth} ${year}`
  }, [visibleDays, view, anchor])

  return (
    // Root background is a single, page-wide `--surface-card` so the
    // header / toolbar / day-header / grid body all sit on the same
    // surface. No mixed surfaces, no transparent body — matches the
    // "deep white" the rest of the app uses for primary content.
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: 'var(--surface-card)' }}
    >
      {/* ─── Sticky title row ────────────────────────────────────── */}
      <header
        className="flex items-center justify-between gap-4 px-6 py-3.5 border-b shrink-0"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <h1
          className="text-[20px] font-semibold leading-tight tracking-tight inline-flex items-center gap-2.5"
          style={{
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-heading, "Playfair Display", serif)',
          }}
        >
          <span
            className="inline-flex items-center justify-center h-7 w-7 rounded-md"
            style={{
              background: 'var(--accent-today-tint-strong)',
              color: 'var(--accent-today)',
            }}
            aria-hidden
          >
            <CalendarIcon size={14} strokeWidth={2} />
          </span>
          Calendar
        </h1>

        {/* Header actions — Set reminder (the law-firm equivalent
            of "Meet now" — a one-shot ping to follow up on a
            deadline) · New event (primary gold; the everyday
            calendar add). */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReminderDialogOpen(true)}
          >
            <Bell size={13} strokeWidth={1.75} />
            Set reminder
          </Button>
          <button
            type="button"
            // No prefill — the dialog defaults to "today + next
            // round hour". Used when the user wants to add an event
            // without first picking a slot in the grid.
            onClick={() => openCreateDialog()}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer whitespace-nowrap"
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
              boxShadow:
                '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--gold-dark)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--gold)'
            }}
          >
            <Plus size={14} strokeWidth={2.25} />
            New event
          </button>
        </div>
      </header>

      {/* ─── Date toolbar ────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between gap-3 px-6 py-3 border-b shrink-0"
        style={{
          borderColor: 'var(--border-soft)',
          background: 'var(--surface-card)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* Today resets the anchor to today's date. */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAnchor(new Date())}
          >
            <CalendarIcon size={13} strokeWidth={1.75} />
            Today
          </Button>
          <div className="inline-flex items-center">
            <button
              type="button"
              onClick={() => stepAnchor(-1)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-l-lg border cursor-pointer"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-secondary)',
              }}
              aria-label={stepLabel.prev}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-card)'
              }}
            >
              <ChevronLeft size={14} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => stepAnchor(1)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-r-lg border border-l-0 cursor-pointer"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-secondary)',
              }}
              aria-label={stepLabel.next}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-card)'
              }}
            >
              <ChevronRight size={14} strokeWidth={1.75} />
            </button>
          </div>
          <MonthPickerPopover
            anchorDate={anchor}
            label={monthLabel}
            onSelect={(d) => setAnchor(d)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-[12px] mr-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Synced
          </span>

          {/* View-mode dropdown — Day / Work week / Week / Month. */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] font-medium cursor-pointer"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <ViewIcon mode={view} />
                  {view}
                  <ChevronDown size={13} strokeWidth={1.75} />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-40">
              {VIEW_MODES.map((m) => (
                <DropdownMenuItem
                  key={m}
                  onClick={() => setView(m)}
                  className="text-[13px] cursor-pointer"
                >
                  <ViewIcon mode={m} />
                  {m}
                  {view === m && (
                    <Check
                      size={12}
                      strokeWidth={2}
                      className="ml-auto"
                      style={{ color: 'var(--text-muted)' }}
                    />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Event Types filter — multi-select dropdown. The badge
              shows how many buckets are hidden so users can tell at
              a glance whether they're looking at a filtered view. */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] font-medium cursor-pointer"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                  }}
                  aria-label="Filter by event type"
                >
                  <Filter size={13} strokeWidth={1.75} />
                  Event Types
                  {visibleTypes.size < EVENT_TYPE_OPTIONS.length && (
                    <span
                      className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10.5px] font-semibold"
                      style={{
                        background: 'var(--accent-today-tint-strong)',
                        color: 'var(--accent-today)',
                      }}
                      aria-label={`${EVENT_TYPE_OPTIONS.length - visibleTypes.size} hidden`}
                    >
                      {EVENT_TYPE_OPTIONS.length - visibleTypes.size}
                    </span>
                  )}
                  <ChevronDown size={13} strokeWidth={1.75} />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              {EVENT_TYPE_OPTIONS.map((opt) => {
                const active = visibleTypes.has(opt.key)
                return (
                  <DropdownMenuItem
                    key={opt.key}
                    onClick={(e) => {
                      // Keep the menu open as the user toggles
                      // multiple types — otherwise they'd have to
                      // re-open the menu between each click.
                      e.preventDefault?.()
                      toggleType(opt.key)
                    }}
                    className="text-[13px] cursor-pointer"
                  >
                    <span
                      aria-hidden
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: `var(${opt.dotVar})` }}
                    />
                    {opt.label}
                    {active && (
                      <Check
                        size={12}
                        strokeWidth={2}
                        className="ml-auto"
                        style={{ color: 'var(--text-muted)' }}
                      />
                    )}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More menu — calendar-management entry points. Print
              wires straight to the browser print dialog; the rest
              are placeholders that surface a "coming soon" toast
              until the calendar-sync / sharing backends ship. */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] font-medium cursor-pointer"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                  }}
                  aria-label="More calendar actions"
                >
                  <MoreHorizontal size={13} strokeWidth={1.75} />
                  More
                  <ChevronDown size={13} strokeWidth={1.75} />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() =>
                  toast.info(
                    'Multiple calendars ship with the matter-team workspace.',
                  )
                }
                className="text-[13px] cursor-pointer"
              >
                <CalendarPlus size={13} strokeWidth={1.75} />
                Add new calendar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  toast.info('Calendar settings open from Settings → Calendar.')
                }
                className="text-[13px] cursor-pointer"
              >
                <Settings size={13} strokeWidth={1.75} />
                Calendar settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/calendar/feeds')}
                className="text-[13px] cursor-pointer"
              >
                <Rss size={13} strokeWidth={1.75} />
                Calendar feeds
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ─── Day-header row ──────────────────────────────────────── */}
      {/* Day / Work-week / Week share a single layout: a header row
          with one cell per visible day plus the hour-label gutter,
          and a scrolling time-grid body below it. The Month view
          uses a separate header (weekday names, no gutter) + body
          (6×7 grid of day cells), rendered further down. */}
      {view !== 'Month' && (
      <div
        className="grid border-b shrink-0"
        style={{
          // Column count tracks the active view: Day = 1, Work week
          // = 5, Week = 7. The 64-px hour-label gutter stays fixed.
          gridTemplateColumns: `64px repeat(${visibleDays.length}, 1fr)`,
          borderColor: 'var(--border-soft)',
        }}
      >
        {/* Gutter cell over the hour-label column. */}
        <div />
        {visibleDays.map((d) => {
          const isToday = sameDay(d, now)
          return (
            <div
              key={d.toISOString()}
              className="px-4 py-3 border-l"
              style={{ borderColor: 'var(--border-soft)' }}
            >
              <div
                className="text-[22px] font-semibold tabular-nums leading-tight"
                style={{
                  color: isToday
                    ? 'var(--accent-today)'
                    : 'var(--text-primary)',
                }}
              >
                {d.getDate()}
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{
                  color: isToday
                    ? 'var(--accent-today)'
                    : 'var(--text-muted)',
                }}
              >
                {d.toLocaleDateString('en-GB', { weekday: 'long' })}
              </div>
              {/* Underline accent on today — thin gold bar over the
                  active column. */}
              {isToday && (
                <span
                  aria-hidden
                  className="block h-[2px] mt-2 rounded-full"
                  style={{
                    background: 'var(--accent-today)',
                    maxWidth: 80,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
      )}

      {/* ─── Scrolling time-grid body (Day / Work week / Week) ──── */}
      {view !== 'Month' && (
      <div className="flex-1 overflow-y-auto" ref={scrollerRef}>
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `64px repeat(${visibleDays.length}, 1fr)`,
          }}
        >
          {/* Hour-label column — left rail. Each hour cell is
              `HOUR_HEIGHT` tall. */}
          <div className="relative" style={{ height: HOUR_HEIGHT * 24 }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 px-2 text-[11.5px] tabular-nums"
                style={{
                  top: h * HOUR_HEIGHT,
                  color: 'var(--text-muted)',
                }}
              >
                {h === 0 ? '' : formatHourLabel(h)}
              </div>
            ))}
          </div>

          {/* Day columns — count varies by view (1/5/7). */}
          {visibleDays.map((day, idx) => {
            const isToday = sameDay(day, now)
            const dayEvents = eventsByDay.get(idx) ?? []
            return (
              <DayColumn
                key={day.toISOString()}
                day={day}
                isToday={isToday}
                events={dayEvents}
                now={now}
                onSlotClick={(startMinutes, endMinutes) =>
                  openCreateDialog({ date: day, startMinutes, endMinutes })
                }
                onEventClick={openEditDialog}
              />
            )
          })}
        </div>
      </div>
      )}

      {/* ─── Month grid body ───────────────────────────────────── */}
      {/* Month view replaces the hourly time-grid with a 6×7 grid
          of day cells. The weekday-header row is rendered inside
          the same flex column so the grid scales to fill remaining
          height (no internal scroll — the whole month fits). */}
      {view === 'Month' && (
        <MonthGrid
          days={visibleDays}
          anchorMonth={anchor.getMonth()}
          today={now}
          eventsByDay={eventsByDay}
          onDayClick={(day) => openCreateDialog({ date: day, startMinutes: 9 * 60, endMinutes: 10 * 60 })}
          onEventClick={openEditDialog}
        />
      )}

      {/* Event dialog — handles both create (slot click / top button)
          and edit (clicking an existing event block). */}
      <EventDialog
        open={eventDialog.open}
        onOpenChange={(o) => (o ? null : closeEventDialog())}
        prefill={eventDialog.prefill}
        editing={eventDialog.editing}
      />

      {/* Reminder dialog — opens from the header's "Set reminder"
          button. Slim composer that creates a deadline configured
          to fire a notification at the chosen time. */}
      <ReminderDialog
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
      />
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────

/**
 * Horizontal rule + left dot showing the current time on today's
 * column. Positioned absolutely against the day column's top so it
 * lands at `(hours + minutes/60) * HOUR_HEIGHT` pixels.
 */
function NowLine({ now }: { now: Date }) {
  const top = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none"
      style={{ top, zIndex: 2 }}
      aria-hidden
    >
      <span
        className="absolute -left-1 -top-1 inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: 'var(--now-line)' }}
      />
      <span
        className="block"
        style={{
          borderTop: '2px solid var(--now-line)',
        }}
      />
    </div>
  )
}

/**
 * Event block positioned by start-minute and `DEFAULT_EVENT_MINUTES`
 * duration. Renders the title + a short time stamp; the orange-
 * tinted border matches the Teams "highlighted today" event style.
 */
function EventBlock({
  deadline,
  onClick,
}: {
  deadline: Deadline
  onClick: () => void
}) {
  const start = new Date(deadline.due_date)
  const top =
    (start.getHours() + start.getMinutes() / 60) * HOUR_HEIGHT
  const height = (DEFAULT_EVENT_MINUTES / 60) * HOUR_HEIGHT - 2
  const startLabel = start
    .toLocaleTimeString('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
  return (
    <button
      type="button"
      // `stopPropagation` so clicking the event doesn't ALSO fire
      // the parent day-column's slot-click handler and pop a New
      // Event dialog underneath the event we're trying to edit.
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="absolute left-1 right-1 rounded-md text-left px-2 py-1.5 cursor-pointer transition-colors"
      style={{
        top: top + 1,
        height,
        background: 'var(--accent-today-tint-strong)',
        border: '1px solid var(--accent-today)',
        color: 'var(--text-primary)',
        zIndex: 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--gold-muted)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background =
          'var(--accent-today-tint-strong)'
      }}
      title={deadline.title}
    >
      <div className="text-[11.5px] font-semibold truncate">
        {deadline.title}
      </div>
      <div
        className="text-[10.5px] tabular-nums"
        style={{ color: 'var(--text-muted)' }}
      >
        {startLabel}
      </div>
    </button>
  )
}

// ── Month-picker popover ───────────────────────────────────────────────

/**
 * The trigger renders the current month label (e.g. "May 2026").
 * Clicking opens a popover with a 7-column calendar grid. Picking a
 * day in the grid calls `onSelect(date)` so the parent can shift
 * the week view to that date. The popover also includes prev/next
 * chevrons that walk the viewedMonth ±1 without committing — only
 * clicking a day commits.
 *
 * Highlight rules in the grid:
 *   - The day matching today gets a filled violet circle so the
 *     user can find "now" at a glance even when browsing future
 *     months.
 *   - Every day in the week containing `anchorDate` gets a violet
 *     row tint so the user sees which week is currently active in
 *     the main calendar.
 *   - Days outside the viewed month render in a muted colour so the
 *     grid edges (last week of prior month / first week of next)
 *     read as overflow, not active rows.
 */
function MonthPickerPopover({
  anchorDate,
  label,
  onSelect,
}: {
  anchorDate: Date
  label: string
  onSelect: (d: Date) => void
}) {
  const [open, setOpen] = useState(false)
  // The grid inside the popover scrolls month-by-month independent
  // of the main calendar's anchor. We seed it with the anchor's
  // month so the picker opens on the same page the user is viewing.
  const [viewedMonth, setViewedMonth] = useState(
    () => new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1),
  )
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Click-outside closes — same pattern as the contact-list popovers.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // Resync the picker month whenever the popover opens — covers the
  // case where the user navigated the main calendar (Today / chevrons)
  // while the picker was closed.
  useEffect(() => {
    if (!open) return
    setViewedMonth(
      new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1),
    )
  }, [open, anchorDate])

  // Compute the 6-row × 7-col grid of days. We start at the Sunday
  // on/before the 1st of the viewed month and walk 42 days forward.
  const days = useMemo(() => {
    const first = new Date(
      viewedMonth.getFullYear(),
      viewedMonth.getMonth(),
      1,
    )
    const gridStart = addDays(first, -first.getDay())
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  }, [viewedMonth])

  const today = new Date()
  const anchorWeekStart = startOfWeek(anchorDate)
  const anchorWeekEnd = addDays(anchorWeekStart, 6)

  const monthHeader = viewedMonth.toLocaleDateString('default', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[14px] font-semibold cursor-pointer transition-colors"
        style={{
          color: open ? 'var(--accent-today)' : 'var(--text-primary)',
          background: open
            ? 'var(--accent-today-tint-strong)'
            : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (open) return
          e.currentTarget.style.background = 'var(--surface-sunken)'
        }}
        onMouseLeave={(e) => {
          if (open) return
          e.currentTarget.style.background = 'transparent'
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {label}
        <ChevronDown size={13} strokeWidth={1.75} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-xl border p-4"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 320,
          }}
          role="dialog"
          aria-label="Pick a date"
        >
          {/* Header — month label + prev/next chevrons. */}
          <div className="flex items-center justify-between mb-3">
            <div
              className="text-[14px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {monthHeader}
            </div>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setViewedMonth(
                    new Date(
                      viewedMonth.getFullYear(),
                      viewedMonth.getMonth() - 1,
                      1,
                    ),
                  )
                }
                className="inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-sunken)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
                aria-label="Previous month"
              >
                <ChevronLeft size={14} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setViewedMonth(
                    new Date(
                      viewedMonth.getFullYear(),
                      viewedMonth.getMonth() + 1,
                      1,
                    ),
                  )
                }
                className="inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-sunken)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
                aria-label="Next month"
              >
                <ChevronRight size={14} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Weekday headers — S M T W T F S. */}
          <div
            className="grid grid-cols-7 gap-0.5 mb-1 text-[11px] font-semibold text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid — 6 rows × 7 cols. */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((d, i) => {
              const inMonth = d.getMonth() === viewedMonth.getMonth()
              const isToday = sameDay(d, today)
              const inAnchorWeek = d >= anchorWeekStart && d <= anchorWeekEnd
              const isAnchor = sameDay(d, anchorDate)

              // Row-level tint for the selected week — applied as
              // a background on every cell in that week so the
              // highlight reads as a continuous pill.
              const weekBg = inAnchorWeek
                ? 'var(--accent-today-tint-strong)'
                : 'transparent'

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSelect(d)
                    setOpen(false)
                  }}
                  className="relative h-9 inline-flex items-center justify-center text-[12.5px] tabular-nums cursor-pointer transition-colors"
                  style={{
                    color: inMonth
                      ? 'var(--text-primary)'
                      : 'var(--text-subtle)',
                    background: weekBg,
                    // Pill rounding on the left/right edges of the
                    // selected week so the strip reads as a single
                    // band instead of seven adjacent rectangles.
                    borderTopLeftRadius:
                      inAnchorWeek && d.getDay() === 0 ? 999 : 6,
                    borderBottomLeftRadius:
                      inAnchorWeek && d.getDay() === 0 ? 999 : 6,
                    borderTopRightRadius:
                      inAnchorWeek && d.getDay() === 6 ? 999 : 6,
                    borderBottomRightRadius:
                      inAnchorWeek && d.getDay() === 6 ? 999 : 6,
                  }}
                  onMouseEnter={(e) => {
                    if (inAnchorWeek) return
                    e.currentTarget.style.background =
                      'var(--surface-sunken)'
                  }}
                  onMouseLeave={(e) => {
                    if (inAnchorWeek) return
                    e.currentTarget.style.background = 'transparent'
                  }}
                  aria-pressed={isAnchor}
                  aria-current={isToday ? 'date' : undefined}
                >
                  {/* Today gets a filled circle so it's findable in
                      any month context. */}
                  {isToday && (
                    <span
                      aria-hidden
                      className="absolute inset-0 m-auto inline-block h-7 w-7 rounded-full"
                      style={{ background: 'var(--accent-today)' }}
                    />
                  )}
                  <span
                    className="relative"
                    style={{
                      // Today's number stays navy on the gold circle
                      // (matches our brand pairing — gold pills always
                      // pair with navy text in this app).
                      color: isToday
                        ? 'var(--navy)'
                        : inMonth
                          ? 'var(--text-primary)'
                          : 'var(--text-subtle)',
                      fontWeight: isToday ? 700 : 500,
                    }}
                  >
                    {d.getDate()}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


/**
 * 14×14 inline-SVG icon used by the view-mode dropdown (trigger +
 * each menu item).
 *   - Day        → a single tall pane
 *   - Work week  → 5 vertical bars
 *   - Week       → 7 vertical bars
 *   - Month      → a 3-row × 4-col dot matrix, suggesting a month
 *     grid; deliberately different from the vertical-bar shape so
 *     the Month menu item is recognisable at a glance.
 *
 * Inline SVG so we don't drag in extra lucide icons; the widths are
 * derived from the column count, no magic numbers.
 */
function ViewIcon({ mode }: { mode: ViewMode }) {
  if (mode === 'Month') {
    // 4 cols × 3 rows of small filled rects inside the frame.
    const cols = 4
    const rows = 3
    const cellW = 2
    const cellH = 2
    const gapX = 1
    const gapY = 1
    const startX = (14 - (cols * cellW + (cols - 1) * gapX)) / 2
    const startY = (14 - (rows * cellH + (rows - 1) * gapY)) / 2
    return (
      <span
        className="inline-flex items-center justify-center h-4 w-4 shrink-0"
        aria-hidden
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect
            x="1"
            y="2.5"
            width="12"
            height="9"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          {Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (_, c) => (
              <rect
                key={`${r}-${c}`}
                x={startX + c * (cellW + gapX)}
                y={startY + r * (cellH + gapY)}
                width={cellW}
                height={cellH}
                fill="currentColor"
                opacity={0.45}
                rx={0.5}
              />
            )),
          )}
        </svg>
      </span>
    )
  }
  // Column counts per non-month view — drives the bar widths.
  const cols = mode === 'Day' ? 1 : mode === 'Work week' ? 5 : 7
  // Pad each bar inside a 14-wide area, leaving a 1px gutter
  // around the icon for the frame line.
  const gap = 1
  const pad = 1
  const innerWidth = 14 - pad * 2
  const totalGap = gap * (cols - 1)
  const barWidth = (innerWidth - totalGap) / cols
  return (
    <span
      className="inline-flex items-center justify-center h-4 w-4 shrink-0"
      aria-hidden
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect
          x="1"
          y="2.5"
          width="12"
          height="9"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        {Array.from({ length: cols }, (_, i) => (
          <rect
            key={i}
            x={pad + i * (barWidth + gap)}
            y={4.5}
            width={barWidth}
            height={5}
            fill="currentColor"
            opacity={0.35}
          />
        ))}
      </svg>
    </span>
  )
}

// ── Month grid ─────────────────────────────────────────────────────────

/**
 * Month view body. Renders a weekday-name header row above a
 * 6 × 7 grid of day cells covering `days` (42 cells starting on
 * Sunday). Each cell shows:
 *   - The day number, dimmed if the cell belongs to a neighbouring
 *     month (leading / trailing days that fill the grid).
 *   - Up to three event chips coloured by priority, in due-date
 *     order. Anything beyond the cap surfaces as a "+N more" pill.
 *   - A faint gold tint + bold gold date number on today's cell.
 *
 * The cell body is itself a click target — clicking empty space
 * opens the New Event dialog with that day pre-filled at 9 AM.
 * Event chips stop the click bubble so opening an event doesn't
 * also pop the new-event dialog underneath.
 */
function MonthGrid({
  days,
  anchorMonth,
  today,
  eventsByDay,
  onDayClick,
  onEventClick,
}: {
  days: Date[]
  anchorMonth: number
  today: Date
  eventsByDay: Map<number, Deadline[]>
  onDayClick: (day: Date) => void
  onEventClick: (deadline: Deadline) => void
}) {
  // Sunday-first weekday names matching the calendar's week start.
  const weekdayLabels = useMemo(
    () => days.slice(0, 7).map((d) => d.toLocaleDateString('en-GB', { weekday: 'short' })),
    [days],
  )

  // Cap shown per cell so dense days don't blow out cell height.
  const CHIPS_PER_CELL = 3

  // Priority → swatch colour mapping. Falls back to muted for any
  // unexpected value so a future priority string never crashes the
  // render.
  const priorityColor = (p: Deadline['priority']): string => {
    if (p === 'High') return 'var(--accent-danger, #B53A2B)'
    if (p === 'Medium') return 'var(--accent-today, #C9972B)'
    return 'var(--text-muted, #8C8378)'
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Weekday header — fixed row above the grid. */}
      <div
        className="grid border-b shrink-0"
        style={{
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderColor: 'var(--border-soft)',
        }}
      >
        {weekdayLabels.map((label, i) => (
          <div
            key={i}
            className="px-3 py-2 text-[11.5px] font-medium uppercase tracking-wide border-l"
            style={{
              color: 'var(--text-muted)',
              borderColor: 'var(--border-soft)',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 6 × 7 day grid. `flex-1` so the grid stretches to fill the
          remaining viewport — every row gets an equal share. */}
      <div
        className="grid flex-1"
        style={{
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: 'repeat(6, 1fr)',
        }}
      >
        {days.map((day, idx) => {
          const isInAnchorMonth = day.getMonth() === anchorMonth
          const isToday = sameDay(day, today)
          const cellEvents = eventsByDay.get(idx) ?? []
          const visibleChips = cellEvents.slice(0, CHIPS_PER_CELL)
          const overflow = cellEvents.length - visibleChips.length
          return (
            // Cell is a div+role="button" rather than a <button>
            // because it contains nested <button> elements (the
            // event chips), and a <button> can't legally contain
            // another <button> in HTML. The div is still clickable
            // and keyboard-activatable via role + tabIndex.
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={0}
              onClick={() => onDayClick(day)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onDayClick(day)
                }
              }}
              className="text-left border-l border-t p-2 flex flex-col gap-1.5 cursor-pointer transition-colors min-h-0 overflow-hidden"
              style={{
                borderColor: 'var(--border-soft)',
                background: isToday
                  ? 'var(--accent-today-tint)'
                  : 'transparent',
                opacity: isInAnchorMonth ? 1 : 0.55,
              }}
              onMouseEnter={(e) => {
                if (!isToday) {
                  e.currentTarget.style.background = 'var(--surface-sunken)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isToday) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
              aria-label={`Add event on ${day.toDateString()}`}
            >
              <div
                className="text-[13px] font-semibold tabular-nums leading-none"
                style={{
                  color: isToday
                    ? 'var(--accent-today)'
                    : 'var(--text-primary)',
                }}
              >
                {day.getDate()}
              </div>

              {/* Event chips — bordered pill with a coloured dot.
                  Stop propagation so the cell's onDayClick doesn't
                  also fire (which would open the create dialog
                  under the edit dialog). */}
              <div className="flex flex-col gap-1 min-h-0 overflow-hidden">
                {visibleChips.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(ev)
                    }}
                    className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-left cursor-pointer"
                    style={{
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-soft)',
                    }}
                    title={ev.title}
                  >
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: priorityColor(ev.priority) }}
                    />
                    <span
                      className="text-[11px] truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {ev.title}
                    </span>
                  </button>
                ))}
                {overflow > 0 && (
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    +{overflow} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Day column with slot-click ─────────────────────────────────────────

/**
 * One day column in the grid. Renders the hour / half-hour grid
 * lines, the now-line if today, and each event block — but the
 * column itself is also a click target. The user can:
 *
 *   - Click anywhere empty → opens the New Event dialog pre-filled
 *     with this day + the time the cursor is over (snapped to the
 *     nearest 15 minutes). Default duration is `DEFAULT_EVENT_MINUTES`.
 *   - Hover anywhere empty → a faint ghost block appears at the
 *     cursor showing the start/end times that would land if they
 *     click. Functions as a non-committal preview.
 *
 * Existing event blocks call `stopPropagation` on their own clicks
 * so opening an event doesn't accidentally pop the new-event
 * dialog underneath.
 */
function DayColumn({
  day,
  isToday,
  events,
  now,
  onSlotClick,
  onEventClick,
}: {
  day: Date
  isToday: boolean
  events: Deadline[]
  now: Date
  onSlotClick: (startMinutes: number, endMinutes: number) => void
  onEventClick: (deadline: Deadline) => void
}) {
  // Tracks the cursor's minute-of-day while hovering inside the
  // column. Null means "not hovering" → preview not rendered.
  const [hoverMinutes, setHoverMinutes] = useState<number | null>(null)

  /**
   * Convert a mouse Y position (relative to the column's top) into
   * a minute-of-day, snapped to `SLOT_SNAP_MINUTES`. Clamps to the
   * legal [0, 24*60 - SLOT_SNAP_MINUTES] range so a click on the
   * very last pixel of the column doesn't spill past midnight.
   */
  const minutesFromY = (yPx: number): number => {
    const raw = (yPx / HOUR_HEIGHT) * 60
    const snapped =
      Math.round(raw / SLOT_SNAP_MINUTES) * SLOT_SNAP_MINUTES
    const max = 24 * 60 - SLOT_SNAP_MINUTES
    return Math.max(0, Math.min(max, snapped))
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    setHoverMinutes(minutesFromY(y))
  }
  const handleMouseLeave = () => setHoverMinutes(null)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Defensive: if the click bubbled up from an event block that
    // forgot to stopPropagation, bail out so we don't dual-fire.
    if ((e.target as HTMLElement).closest('[data-event-block]')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const startMinutes = minutesFromY(y)
    const endMinutes = Math.min(
      24 * 60,
      startMinutes + DEFAULT_EVENT_MINUTES,
    )
    onSlotClick(startMinutes, endMinutes)
  }

  return (
    <div
      role="button"
      tabIndex={-1}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative border-l cursor-pointer"
      style={{
        borderColor: 'var(--border-soft)',
        height: HOUR_HEIGHT * 24,
        background: isToday ? 'var(--accent-today-tint)' : 'transparent',
      }}
      aria-label={`Add event on ${day.toDateString()}`}
    >
      {/* Hour grid lines + half-hour dashed lines. */}
      {HOURS.map((h) => (
        <div key={h}>
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: h * HOUR_HEIGHT,
              borderTop: '1px solid var(--border-soft)',
            }}
          />
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2,
              borderTop: '1px dashed var(--border-soft)',
              opacity: 0.6,
            }}
          />
        </div>
      ))}

      {/* Hover ghost preview — only when the cursor is inside an
          empty area. Shown at the snapped minute with the default
          duration so the user can see exactly where their click
          will land. `pointer-events-none` keeps it from stealing
          the mouseleave when the cursor passes over it. */}
      {hoverMinutes !== null && (
        <div
          className="absolute left-1 right-1 rounded-md pointer-events-none"
          style={{
            top: (hoverMinutes / 60) * HOUR_HEIGHT + 1,
            height:
              (DEFAULT_EVENT_MINUTES / 60) * HOUR_HEIGHT - 2,
            background: 'var(--accent-today-tint)',
            border: '1.5px dashed var(--accent-today)',
            zIndex: 1,
          }}
        >
          <div
            className="text-[10.5px] tabular-nums px-2 pt-1"
            style={{ color: 'var(--gold-dark)' }}
          >
            {formatMinutesAsClock(hoverMinutes)}
          </div>
        </div>
      )}

      {/* Current-time line — drawn only on today's column. */}
      {isToday && <NowLine now={now} />}

      {/* Event blocks. */}
      {events.map((e) => (
        <span key={e.id} data-event-block>
          <EventBlock deadline={e} onClick={() => onEventClick(e)} />
        </span>
      ))}
    </div>
  )
}

/** Format a minute-of-day (0..1439) as a 12-hour clock string. */
function formatMinutesAsClock(m: number): string {
  const h = Math.floor(m / 60)
  const mm = m % 60
  const hr12 = ((h + 11) % 12) + 1
  const ampm = h < 12 ? 'am' : 'pm'
  return `${hr12}:${mm.toString().padStart(2, '0')} ${ampm}`
}

// ── New-event dialog ───────────────────────────────────────────────────

/**
 * Stub list of firm users for the participants picker. Same pattern
 * as the contact-notes NotificationsPicker — the current signed-in
 * user gets folded in at render time via `useAuthStore`, and a
 * future `useFirmUsers` hook will replace this constant without
 * touching the picker UI.
 */
const STUB_FIRM_USERS = [
  'Akosua Boateng',
  'Kwame Asante',
  'Yaw Mensah',
  'Ama Owusu',
  'Esi Annan',
  'Adwoa Hayford',
  'Kojo Bediako',
  'Fafali Mensah',
] as const

/**
 * New-event dialog. Composes a full event record (title, date,
 * start, end, linked case, description, participants) and persists
 * via `useCreateDeadline` — Deadline is the closest schema we have
 * to a calendar event today. Fields the Deadline table doesn't
 * carry (end time, participants, description-richtext) are held
 * in local state until the matching columns ship; saving still
 * works because the required fields (title, due_date) are present.
 */
// ── Reminders ──────────────────────────────────────────────────────────

/**
 * Each reminder is a small struct held in local form state. The
 * backend (`Deadline.reminder_days`) only persists ONE numeric
 * offset today; the rest live in form state until the schema
 * supports a one-to-many reminders table with channel + recipients.
 * Keeping the full structure here means the migration day is a
 * 30-minute change, not a redesign.
 */
type ReminderChannel = 'push' | 'email'
interface Reminder {
  id: string
  /** Offset key — drives the dropdown choice; resolved to minutes. */
  offset: ReminderOffsetKey
  channel: ReminderChannel
  /** Comma-separated email list. Only meaningful when channel === 'email'. */
  emails: string
}

const REMINDER_OFFSETS = [
  { key: '5m' as const, label: '5 minutes before', minutes: 5 },
  { key: '15m' as const, label: '15 minutes before', minutes: 15 },
  { key: '30m' as const, label: '30 minutes before', minutes: 30 },
  { key: '1h' as const, label: '1 hour before', minutes: 60 },
  { key: '2h' as const, label: '2 hours before', minutes: 120 },
  { key: '1d' as const, label: '1 day before', minutes: 24 * 60 },
  { key: '2d' as const, label: '2 days before', minutes: 48 * 60 },
  { key: '1w' as const, label: '1 week before', minutes: 7 * 24 * 60 },
]
type ReminderOffsetKey = (typeof REMINDER_OFFSETS)[number]['key']

/** Resolve an offset key to its minute value. */
function offsetMinutes(key: ReminderOffsetKey): number {
  return (
    REMINDER_OFFSETS.find((o) => o.key === key)?.minutes ?? 15
  )
}

/** Pick the nearest offset key for a given day count (for edit prefill). */
function daysToOffsetKey(days: number | null | undefined): ReminderOffsetKey {
  if (days == null) return '15m'
  if (days >= 7) return '1w'
  if (days >= 2) return '2d'
  if (days >= 1) return '1d'
  // Sub-day reminders were stored as `0` in the legacy column.
  // Default to 15 minutes before; the user can adjust.
  return '15m'
}

function newReminderId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `rem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Strict-ish email parser. Splits a comma-separated string into
 * trimmed entries, drops blanks. Each entry is validated against a
 * minimal RFC-light regex — strict enough to catch typos, loose
 * enough not to reject legitimate addresses.
 */
function parseEmails(raw: string): { valid: string[]; invalid: string[] } {
  const EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/
  const valid: string[] = []
  const invalid: string[] = []
  for (const piece of raw.split(/[,\n]/)) {
    const trimmed = piece.trim()
    if (!trimmed) continue
    if (EMAIL_RE.test(trimmed)) valid.push(trimmed)
    else invalid.push(trimmed)
  }
  return { valid, invalid }
}

// ── Event dialog (create + edit) ───────────────────────────────────────

/**
 * Combined create-and-edit dialog for calendar events.
 *
 *   - `editing != null`  → load that Deadline's values, swap the
 *     header to "Edit event", surface a Delete button, save through
 *     `useUpdateDeadline`.
 *   - `editing == null && prefill != null` → fresh event from a
 *     slot click, prefill date + times.
 *   - both null         → fresh event from the top-right button,
 *     defaults to today + next round hour.
 *
 * Reminders live in `reminders[]`. Today the schema only persists
 * the first reminder's offset (`reminder_days`); channel + email
 * recipients are kept in form state until the schema ships its
 * many-to-many reminders table. The Save handler shapes a sensible
 * toast either way so the user gets immediate feedback about what
 * the system is going to do.
 */
function EventDialog({
  open,
  onOpenChange,
  prefill,
  editing,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  prefill: { date: Date; startMinutes: number; endMinutes: number } | null
  editing: Deadline | null
}) {
  const { data: cases } = useCases()
  const createMutation = useCreateDeadline()
  const updateMutation = useUpdateDeadline()
  const deleteMutation = useDeleteDeadline()

  const mode: 'create' | 'edit' = editing ? 'edit' : 'create'

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [caseId, setCaseId] = useState('')
  const [description, setDescription] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Reset on every open. Edit mode hydrates from the Deadline;
  // create mode falls back to prefill or "today + next hour".
  useEffect(() => {
    if (!open) return

    if (editing) {
      const due = new Date(editing.due_date)
      const isoDate = `${due.getFullYear()}-${String(
        due.getMonth() + 1,
      ).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`
      setTitle(editing.title)
      setDescription(editing.description ?? '')
      setCaseId(editing.case_id ?? '')
      setDate(isoDate)
      setStartTime(
        `${String(due.getHours()).padStart(2, '0')}:${String(
          due.getMinutes(),
        ).padStart(2, '0')}`,
      )
      const end = new Date(due.getTime() + DEFAULT_EVENT_MINUTES * 60 * 1000)
      setEndTime(
        `${String(end.getHours()).padStart(2, '0')}:${String(
          end.getMinutes(),
        ).padStart(2, '0')}`,
      )
      setParticipants([])
      // Seed with the persisted reminder offset; channel + emails
      // aren't on the schema yet so we default to push.
      setReminders([
        {
          id: newReminderId(),
          offset: daysToOffsetKey(editing.reminder_days),
          channel: 'push',
          emails: '',
        },
      ])
      return
    }

    setTitle('')
    setDescription('')
    setCaseId('')
    setParticipants([])
    setReminders([])

    if (prefill) {
      setDate(prefill.date.toISOString().slice(0, 10))
      setStartTime(minutesToHHMM(prefill.startMinutes))
      setEndTime(minutesToHHMM(prefill.endMinutes))
    } else {
      const now = new Date()
      now.setMinutes(0, 0, 0)
      now.setHours(now.getHours() + 1)
      setDate(now.toISOString().slice(0, 10))
      setStartTime(now.toTimeString().slice(0, 5))
      const end = new Date(now.getTime() + 60 * 60 * 1000)
      setEndTime(end.toTimeString().slice(0, 5))
    }
  }, [open, prefill, editing])

  const canSave = title.trim().length > 0 && !submitting && !deleting

  /**
   * Sanity-check the reminders. Every email-channel reminder must
   * carry at least one syntactically valid address; mixed valid /
   * invalid lists are reported so the user can fix typos before
   * we send. Returns a flat warning string or null if everything
   * checks out.
   */
  const validateReminders = (): string | null => {
    for (const r of reminders) {
      if (r.channel !== 'email') continue
      const { valid, invalid } = parseEmails(r.emails)
      if (valid.length === 0) {
        return 'Email reminders need at least one valid recipient address.'
      }
      if (invalid.length > 0) {
        return `These email addresses look wrong: ${invalid.join(', ')}.`
      }
    }
    return null
  }

  const handleSave = async () => {
    if (!canSave) return
    const reminderError = validateReminders()
    if (reminderError) {
      toast.error(reminderError)
      return
    }
    setSubmitting(true)
    try {
      const dueDate = new Date(`${date}T${startTime}:00`).toISOString()
      // Persist the first reminder's offset as the deadline's
      // reminder_days (rounded up to at least 1 day so the column's
      // semantics — "days before due date" — stay coherent).
      // Future-proofing: the rest of the rich reminder array is
      // already in form state, ready for the schema migration.
      const persistedReminderDays = reminders.length
        ? Math.max(1, Math.round(offsetMinutes(reminders[0].offset) / 1440))
        : null

      if (mode === 'edit' && editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          data: {
            title: title.trim(),
            description: description.trim() || null,
            due_date: dueDate,
            case_id: caseId || null,
            reminder_days: persistedReminderDays,
          },
        })
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate,
          priority: 'Medium',
          status: 'Pending',
          case_id: caseId || null,
          reminder_days: persistedReminderDays,
        })
      }

      // Tailor the success toast to what the user actually set up.
      const reminderSummary = summariseReminders(reminders)
      const participantSummary =
        participants.length > 0
          ? `${participants.length} participant${
              participants.length === 1 ? '' : 's'
            } notified`
          : null
      const tail = [participantSummary, reminderSummary]
        .filter(Boolean)
        .join(' · ')
      toast.success(
        mode === 'edit'
          ? `Event updated${tail ? '. ' + tail : '.'}`
          : `Event saved${tail ? '. ' + tail : '.'}`,
      )
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `${mode === 'edit' ? 'Update' : 'Save'} failed: ${err.message}`
          : 'Save failed. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editing) return
    if (!confirm(`Delete "${editing.title}"?`)) return
    setDeleting(true)
    try {
      await deleteMutation.mutateAsync(editing.id)
      toast.success('Event deleted.')
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Delete failed: ${err.message}`
          : 'Delete failed. Please try again.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[640px] p-0 overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle
            className="text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {mode === 'edit' ? 'Edit event' : 'New event'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 max-h-[70vh] overflow-y-auto space-y-4">
          {/* Title — required. */}
          <div>
            <Label
              htmlFor="event-title"
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Title *
            </Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is this event about?"
              autoFocus
              className="h-10 text-[13px]"
            />
          </div>

          {/* Date + start + end. */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label
                className="text-[12px] font-semibold mb-1.5 block"
                style={{ color: 'var(--text-primary)' }}
              >
                Date
              </Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-[13px]"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  colorScheme: 'light',
                }}
              />
            </div>
            <div>
              <Label
                className="text-[12px] font-semibold mb-1.5 block"
                style={{ color: 'var(--text-primary)' }}
              >
                Start
              </Label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-[13px] tabular-nums"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  colorScheme: 'light',
                }}
              />
            </div>
            <div>
              <Label
                className="text-[12px] font-semibold mb-1.5 block"
                style={{ color: 'var(--text-primary)' }}
              >
                End
              </Label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-[13px] tabular-nums"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  colorScheme: 'light',
                }}
              />
            </div>
          </div>

          {/* Linked case — optional. Pulls from useCases so any of
              the firm's cases can be attached. */}
          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block inline-flex items-center gap-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              <Briefcase size={11} strokeWidth={1.75} />
              Linked case
            </Label>
            <div className="relative">
              <select
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: caseId
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  colorScheme: 'light',
                }}
              >
                <option value="">No linked case</option>
                {(cases ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                    {c.client_name ? ` — ${c.client_name}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                strokeWidth={1.75}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          {/* Participants — multi-select dropdown. */}
          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block inline-flex items-center gap-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              <Users size={11} strokeWidth={1.75} />
              Participants
            </Label>
            <ParticipantsPicker
              value={participants}
              onChange={setParticipants}
            />
          </div>

          {/* Description — optional, free text. */}
          <div>
            <Label
              htmlFor="event-description"
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Description
            </Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Agenda, notes, dial-in info…"
              className="text-[13px]"
            />
          </div>

          {/* Reminders — multiple, with per-row channel + email
              recipients. */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--border-soft)' }}>
            <Label
              className="text-[12px] font-semibold mb-1.5 block inline-flex items-center gap-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              <Bell size={11} strokeWidth={1.75} />
              Reminders
            </Label>
            <div className="space-y-2.5">
              {reminders.map((r) => (
                <RemindersRow
                  key={r.id}
                  reminder={r}
                  onChange={(patch) =>
                    setReminders((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, ...patch } : x,
                      ),
                    )
                  }
                  onRemove={() =>
                    setReminders((prev) =>
                      prev.filter((x) => x.id !== r.id),
                    )
                  }
                />
              ))}
              {reminders.length === 0 && (
                <p
                  className="text-[12px] py-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No reminders set. Add one to be notified before this
                  event.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setReminders((prev) => [
                  ...prev,
                  {
                    id: newReminderId(),
                    // Default new reminders to "15 minutes before, push" —
                    // the common case for upcoming meetings.
                    offset: '15m',
                    channel: 'push',
                    emails: '',
                  },
                ])
              }
              className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium cursor-pointer"
              style={{ color: 'var(--gold-dark)' }}
            >
              <Plus size={13} strokeWidth={2} />
              Add reminder
            </button>
          </div>
        </div>

        <DialogFooter
          className="px-6 py-4 border-t flex sm:flex-row sm:justify-between gap-2 items-center"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--gold)',
                color: 'var(--navy)',
                boxShadow:
                  '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
              }}
              onMouseEnter={(e) => {
                if (!canSave) return
                e.currentTarget.style.background = 'var(--gold-dark)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--gold)'
              }}
            >
              {submitting
                ? mode === 'edit'
                  ? 'Saving…'
                  : 'Saving…'
                : mode === 'edit'
                  ? 'Save changes'
                  : 'Save event'}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={submitting || deleting}
              className="inline-flex items-center h-9 px-3 rounded-lg text-[13px] font-medium cursor-pointer transition-colors disabled:opacity-50"
              style={{
                color: 'var(--text-muted)',
                background: 'transparent',
              }}
            >
              Cancel
            </button>
          </div>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting || deleting}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12.5px] font-medium cursor-pointer transition-colors disabled:opacity-50"
              style={{
                color: '#C0392B',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(192,57,43,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {deleting ? 'Deleting…' : 'Delete event'}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Format minute-of-day (0..1439) as `HH:MM` for <input type="time">. */
function minutesToHHMM(m: number): string {
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${h.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
}

/**
 * Compact summary of the configured reminders, used in the success
 * toast. Examples:
 *   - 1 push reminder
 *   - 1 push + 1 email reminder
 *   - 3 reminders (2 push, 1 email to 4 addresses)
 */
function summariseReminders(reminders: Reminder[]): string | null {
  if (reminders.length === 0) return null
  let push = 0
  let email = 0
  let totalEmails = 0
  for (const r of reminders) {
    if (r.channel === 'email') {
      email++
      totalEmails += parseEmails(r.emails).valid.length
    } else {
      push++
    }
  }
  if (email === 0) {
    return `${push} push reminder${push === 1 ? '' : 's'} set`
  }
  if (push === 0) {
    return `${email} email reminder${
      email === 1 ? '' : 's'
    } to ${totalEmails} recipient${totalEmails === 1 ? '' : 's'}`
  }
  return `${push} push + ${email} email reminder${
    email === 1 ? '' : 's'
  } (to ${totalEmails} recipient${totalEmails === 1 ? '' : 's'})`
}

// ── Reminder row ──────────────────────────────────────────────────────

/**
 * One row in the Reminders section. Renders:
 *   - Offset dropdown (5 minutes before / 15 minutes / 30 minutes /
 *     1 hour / 2 hours / 1 day / 2 days / 1 week)
 *   - Channel segmented control: Push · Email
 *   - When channel === 'email': a recipients input below, captioned
 *     "Comma-separated email addresses"
 *   - Remove (×) button on the right
 *
 * Parent owns the array; this component only edits its own
 * `reminder` via `onChange(patch)`. Keeps state colocated and the
 * row reusable elsewhere.
 */
function RemindersRow({
  reminder,
  onChange,
  onRemove,
}: {
  reminder: Reminder
  onChange: (patch: Partial<Reminder>) => void
  onRemove: () => void
}) {
  return (
    <div
      className="rounded-lg border p-2.5 space-y-2"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
      }}
    >
      {/* Top row: offset · channel · remove. */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Offset dropdown. */}
        <div className="relative" style={{ minWidth: 160 }}>
          <select
            value={reminder.offset}
            onChange={(e) =>
              onChange({ offset: e.target.value as ReminderOffsetKey })
            }
            className="w-full h-9 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
              colorScheme: 'light',
            }}
          >
            {REMINDER_OFFSETS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            strokeWidth={1.75}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
        </div>

        {/* Channel segmented control. Two pills inside a bordered
            wrapper — active pill picks up the gold tint, inactive
            pill stays muted. */}
        <div
          className="inline-flex rounded-lg border overflow-hidden h-9"
          style={{ borderColor: 'var(--border-default)' }}
          role="radiogroup"
          aria-label="Reminder channel"
        >
          {(['push', 'email'] as const).map((channel) => {
            const active = reminder.channel === channel
            return (
              <button
                key={channel}
                type="button"
                onClick={() => onChange({ channel })}
                className="px-3 text-[12.5px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 capitalize"
                style={{
                  background: active
                    ? 'var(--accent-today-tint-strong)'
                    : 'var(--surface-card)',
                  color: active
                    ? 'var(--gold-dark)'
                    : 'var(--text-muted)',
                }}
                role="radio"
                aria-checked={active}
              >
                {channel === 'push' ? (
                  <Bell size={11} strokeWidth={1.75} />
                ) : (
                  <Users size={11} strokeWidth={1.75} />
                )}
                {channel}
              </button>
            )
          })}
        </div>

        {/* Remove button — pushed to the right. */}
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-sunken)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          aria-label="Remove reminder"
        >
          <X size={13} strokeWidth={1.75} />
        </button>
      </div>

      {/* Email recipients — only when channel === 'email'. */}
      {reminder.channel === 'email' && (
        <div>
          <Input
            value={reminder.emails}
            onChange={(e) => onChange({ emails: e.target.value })}
            placeholder="recipient@firm.com, partner@example.com"
            className="h-9 text-[13px]"
          />
          <p
            className="mt-1 text-[11px]"
            style={{ color: 'var(--text-muted)' }}
          >
            Comma-separated email addresses. We&rsquo;ll send the
            reminder to each one at the scheduled time.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Participants picker ───────────────────────────────────────────────

/**
 * Multi-select dropdown that lets the user pick which firm users
 * are participants in the event. Same shape as the contact-notes
 * NotificationsPicker — chips on the trigger, listbox with check
 * boxes + a search input, click-outside dismisses.
 *
 * Source: signed-in user (always first, marked `(you)`) + a stub
 * roster. Once a real `useFirmUsers` hook exists, swap the stub
 * for the live list without changing this component.
 */
function ParticipantsPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const currentUserName = useAuthStore((s) => s.user?.name) || 'You'
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const allOptions = useMemo(() => {
    const set = new Set<string>()
    set.add(currentUserName)
    for (const u of STUB_FIRM_USERS) set.add(u)
    for (const v of value) set.add(v)
    return Array.from(set)
  }, [currentUserName, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allOptions
    return allOptions.filter((o) => o.toLowerCase().includes(q))
  }, [allOptions, query])

  const toggle = (name: string) => {
    onChange(
      value.includes(name)
        ? value.filter((v) => v !== name)
        : [...value, name],
    )
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((v) => !v)
          }
        }}
        className="w-full flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-2 min-h-[40px] text-left cursor-pointer"
        style={{
          borderColor: open ? 'var(--gold)' : 'var(--border-default)',
          background: 'var(--surface-card)',
          boxShadow: open ? '0 0 0 2px rgba(201,151,43,0.16)' : 'none',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value.length === 0 ? (
          <span
            className="text-[13px] px-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Add participants…
          </span>
        ) : (
          value.map((u) => (
            <span
              key={u}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium"
              style={{
                background: 'rgba(14,165,233,0.15)',
                color: '#0369A1',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {u}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggle(u)
                }}
                className="cursor-pointer"
                aria-label={`Remove ${u} from participants`}
              >
                <X size={11} strokeWidth={2} />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          size={13}
          strokeWidth={1.75}
          className="ml-auto"
          style={{ color: 'var(--text-muted)' }}
        />
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border overflow-hidden"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
          }}
          role="listbox"
        >
          <div
            className="px-3 py-2 border-b"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search firm users…"
              className="w-full h-8 text-[13px] bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
              autoFocus
            />
          </div>
          <ul className="max-h-[220px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li
                className="px-3 py-3 text-[12.5px]"
                style={{ color: 'var(--text-muted)' }}
              >
                No firm users match &ldquo;{query}&rdquo;.
              </li>
            ) : (
              filtered.map((name) => {
                const checked = value.includes(name)
                return (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => toggle(name)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] cursor-pointer transition-colors"
                      style={{
                        color: 'var(--text-primary)',
                        background: checked
                          ? 'rgba(201,151,43,0.08)'
                          : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (checked) return
                        e.currentTarget.style.background =
                          'var(--surface-sunken)'
                      }}
                      onMouseLeave={(e) => {
                        if (checked) return
                        e.currentTarget.style.background = 'transparent'
                      }}
                      role="option"
                      aria-selected={checked}
                    >
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-sm border"
                        style={{
                          borderColor: checked
                            ? 'var(--gold)'
                            : 'var(--border-default)',
                          background: checked ? 'var(--gold)' : 'transparent',
                        }}
                        aria-hidden
                      >
                        {checked && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6.5L5 9.5L10 3.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="flex-1 truncate">
                        {name}
                        {name === currentUserName && (
                          <span
                            className="ml-2 text-[11.5px]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            (you)
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Reminder dialog ────────────────────────────────────────────────────

/**
 * Lightweight "Set a reminder" composer. Opens from the calendar
 * header's bell button and creates a Deadline that fires a
 * notification at the chosen time. Intentionally smaller than the
 * full event dialog — a reminder is a single moment in time with
 * a channel attached, not a window with participants and a
 * description.
 *
 * Fields:
 *   - Title         (required, "What should we remind you about?")
 *   - When          (date + time, defaults to today + next round hour)
 *   - Linked case   (optional, mirrors EventDialog's case picker)
 *   - Notify via    (Push / Email — segmented control)
 *   - Email list    (only when Email selected, comma-separated)
 *
 * On save the dialog calls `useCreateDeadline` with `reminder_days = 0`
 * so the notification fires at the due-date itself (rather than N
 * days before, which is how scheduled deadlines use the column).
 */
function ReminderDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const createMutation = useCreateDeadline()
  const { data: cases } = useCases()

  // Form state. Reset to fresh defaults every time the dialog
  // opens so re-opening doesn't carry over the last entry.
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [caseId, setCaseId] = useState<string>('')
  const [channel, setChannel] = useState<'push' | 'email'>('push')
  const [emails, setEmails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Compute the "next round hour from now" once per open so the
  // default doesn't drift while the dialog sits open.
  useEffect(() => {
    if (!open) return
    const now = new Date()
    // Snap to the next hour — minutes/seconds reset.
    const target = new Date(now)
    target.setHours(now.getHours() + 1, 0, 0, 0)
    setTitle('')
    setDate(toDateInput(target))
    setTime(toTimeInput(target))
    setCaseId('')
    setChannel('push')
    setEmails('')
    setSubmitting(false)
  }, [open])

  const canSave = title.trim().length > 0 && date.length > 0 && time.length > 0

  const handleSave = async () => {
    if (!canSave) return

    // Email-channel reminders need at least one valid recipient.
    let validEmails: string[] = []
    if (channel === 'email') {
      const { valid, invalid } = parseEmails(emails)
      if (invalid.length > 0) {
        toast.error(
          `These email addresses look wrong: ${invalid.join(', ')}.`,
        )
        return
      }
      if (valid.length === 0) {
        toast.error('Add at least one email recipient for an email reminder.')
        return
      }
      validEmails = valid
    }

    setSubmitting(true)
    try {
      const dueDate = new Date(`${date}T${time}:00`).toISOString()
      await createMutation.mutateAsync({
        title: title.trim(),
        // Stash the channel + recipients in the description field
        // until the schema gains dedicated reminder columns. The
        // notification worker will read it back; the UI shows
        // description verbatim, which is acceptable for a stub.
        description:
          channel === 'email'
            ? `Reminder via email → ${validEmails.join(', ')}`
            : 'Reminder via push notification',
        due_date: dueDate,
        priority: 'Medium',
        status: 'Pending',
        case_id: caseId || null,
        // reminder_days = 0 means "fire at the due date itself",
        // which is what we want for a one-shot reminder. Scheduled
        // deadlines use 1+ to fire N days before due.
        reminder_days: 0,
      })

      // Friendly confirmation — render the time in the local
      // tongue so the user can verify we got the moment right.
      const when = new Date(dueDate).toLocaleString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      const channelSummary =
        channel === 'email'
          ? `email to ${validEmails.length} recipient${validEmails.length === 1 ? '' : 's'}`
          : 'push notification'
      toast.success(`Reminder set for ${when} — ${channelSummary}.`)
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Couldn't set the reminder: ${err.message}`
          : 'Couldn\'t set the reminder. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            Set a reminder
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Title */}
          <div className="grid gap-1.5">
            <Label htmlFor="rem-title" className="text-[13px]">
              What should we remind you about?{' '}
              <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </Label>
            <Input
              id="rem-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Call client about discovery responses"
              autoFocus
            />
          </div>

          {/* When */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="rem-date" className="text-[13px]">
                Date
              </Label>
              <Input
                id="rem-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rem-time" className="text-[13px]">
                Time
              </Label>
              <Input
                id="rem-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Optional linked case */}
          <div className="grid gap-1.5">
            <Label
              htmlFor="rem-case"
              className="text-[13px] inline-flex items-center gap-1.5"
            >
              <Briefcase size={12} strokeWidth={1.75} />
              Linked case (optional)
            </Label>
            <select
              id="rem-case"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="h-9 rounded-md border px-2 text-[13px] bg-transparent"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <option value="">No linked case</option>
              {(cases ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Channel — segmented control */}
          <div className="grid gap-1.5">
            <Label className="text-[13px]">Notify me via</Label>
            <div
              className="inline-flex rounded-md p-0.5 self-start"
              style={{
                background: 'var(--surface-sunken)',
              }}
              role="radiogroup"
              aria-label="Reminder channel"
            >
              {(['push', 'email'] as const).map((c) => {
                const active = channel === c
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setChannel(c)}
                    className="inline-flex items-center gap-1.5 h-7 px-3 rounded text-[12.5px] font-medium cursor-pointer"
                    style={{
                      background: active
                        ? 'var(--accent-today-tint-strong)'
                        : 'transparent',
                      color: active
                        ? 'var(--accent-today)'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {c === 'push' ? (
                      <Bell size={12} strokeWidth={1.75} />
                    ) : (
                      <Users size={12} strokeWidth={1.75} />
                    )}
                    {c === 'push' ? 'Push' : 'Email'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Email recipients — only when channel is Email. */}
          {channel === 'email' && (
            <div className="grid gap-1.5">
              <Label htmlFor="rem-emails" className="text-[13px]">
                Send to
              </Label>
              <Input
                id="rem-emails"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="recipient@firm.com, partner@example.com"
              />
              <p
                className="text-[11.5px]"
                style={{ color: 'var(--text-muted)' }}
              >
                Comma-separated. We'll email each recipient at the
                reminder time.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || submitting}
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
            }}
          >
            {submitting ? 'Setting…' : 'Set reminder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * `<input type="date">` wants a YYYY-MM-DD string in local time.
 * Building it from `.toISOString().slice(0, 10)` would give UTC,
 * which is off-by-one for users west of UTC near midnight.
 */
function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * `<input type="time">` wants HH:MM in 24-hour local time.
 */
function toTimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Suppress unused-import lint hints for icons reserved for the
// next event-related screen (a dedicated event detail view that
// surfaces Clock for duration, etc.). Kept here so the imports
// don't churn in the diff every time we touch the file.
void Clock
