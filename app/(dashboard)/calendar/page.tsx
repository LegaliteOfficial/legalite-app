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
import {
  Bell,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDeadlines } from '@/hooks/use-deadlines'
import type { Deadline } from '@/hooks/use-deadlines'

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
 * View modes surfaced in the toolbar dropdown. Each one controls
 * how many day columns the grid renders and what range the prev/
 * next chevrons step by:
 *   - Day        → 1 column, single day; chevrons step by 1 day
 *   - Work week  → 5 columns, Monday–Friday; chevrons step by 1 week
 *   - Week       → 7 columns, Sunday–Saturday; chevrons step by 1 week
 */
const VIEW_MODES = ['Day', 'Work week', 'Week'] as const
type ViewMode = (typeof VIEW_MODES)[number]

/** Default event duration when the deadline lacks an `end_at`. */
const DEFAULT_EVENT_MINUTES = 60

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

// ── Page component ─────────────────────────────────────────────────────

export default function CalendarPage() {
  const { data: deadlines } = useDeadlines()

  // Anchor date — the focus is on the week that contains this date.
  // Clicking Today resets here; the chevrons shift by ±7 days.
  const [anchor, setAnchor] = useState<Date>(() => new Date())
  const [view, setView] = useState<ViewMode>('Week')

  // ── Days visible in the grid ─────────────────────────────────────
  // Derived from the active view + anchor. Picking 1/5/7 columns
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
    // Default: full week (Sun–Sat).
    const weekStart = startOfWeek(anchor)
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [anchor, view])

  /** Days to step on each chevron click — 1 for Day, 7 for the weeks. */
  const stepDays = view === 'Day' ? 1 : 7

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
  // Works for Day (1 column), Work week (5 columns) and Week (7).
  const eventsByDay = useMemo(() => {
    const map = new Map<number, Deadline[]>()
    for (let i = 0; i < visibleDays.length; i++) map.set(i, [])
    for (const d of deadlines ?? []) {
      const due = new Date(d.due_date)
      for (let i = 0; i < visibleDays.length; i++) {
        if (sameDay(due, visibleDays[i])) {
          map.get(i)!.push(d)
          break
        }
      }
    }
    return map
  }, [deadlines, visibleDays])

  // Month label for the toolbar — shows the month(s) the visible
  // range falls in. If the range spans two months we show both
  // (e.g. "Apr / May 2026"), matching how Teams renders cross-month
  // weeks.
  const monthLabel = useMemo(() => {
    const first = visibleDays[0]
    const last = visibleDays[visibleDays.length - 1]
    const startMonth = first.toLocaleString('default', { month: 'long' })
    const endMonth = last.toLocaleString('default', { month: 'long' })
    const year = last.getFullYear()
    if (startMonth === endMonth) {
      return `${startMonth} ${year}`
    }
    return `${startMonth} / ${endMonth} ${year}`
  }, [visibleDays])

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
            onClick={() =>
              toast.info('Reminder composer ships with the deadlines screen.')
            }
          >
            <Bell size={13} strokeWidth={1.75} />
            Set reminder
          </Button>
          <button
            type="button"
            onClick={() =>
              toast.info('New event form ships with the events screen.')
            }
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
              onClick={() => setAnchor((d) => addDays(d, -stepDays))}
              className="inline-flex items-center justify-center h-9 w-9 rounded-l-lg border cursor-pointer"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-secondary)',
              }}
              aria-label={view === 'Day' ? 'Previous day' : 'Previous week'}
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
              onClick={() => setAnchor((d) => addDays(d, stepDays))}
              className="inline-flex items-center justify-center h-9 w-9 rounded-r-lg border border-l-0 cursor-pointer"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-secondary)',
              }}
              aria-label={view === 'Day' ? 'Next day' : 'Next week'}
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

        <div className="flex items-center gap-3">
          <span
            className="text-[12px]"
            style={{ color: 'var(--text-muted)' }}
          >
            Synced
          </span>
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
        </div>
      </div>

      {/* ─── Day-header row ──────────────────────────────────────── */}
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

      {/* ─── Scrolling grid body ─────────────────────────────────── */}
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
              <div
                key={day.toISOString()}
                className="relative border-l"
                style={{
                  borderColor: 'var(--border-soft)',
                  height: HOUR_HEIGHT * 24,
                  background: isToday
                    ? 'var(--accent-today-tint)'
                    : 'transparent',
                }}
              >
                {/* Hour grid lines + half-hour dashed lines. */}
                {HOURS.map((h) => (
                  <div key={h}>
                    <div
                      className="absolute left-0 right-0"
                      style={{
                        top: h * HOUR_HEIGHT,
                        borderTop: '1px solid var(--border-soft)',
                      }}
                    />
                    <div
                      className="absolute left-0 right-0"
                      style={{
                        top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                        borderTop: '1px dashed var(--border-soft)',
                        opacity: 0.6,
                      }}
                    />
                  </div>
                ))}

                {/* Current-time line — drawn only on today's column. */}
                {isToday && (
                  <NowLine now={now} />
                )}

                {/* Event blocks. */}
                {dayEvents.map((e) => (
                  <EventBlock key={e.id} deadline={e} />
                ))}
              </div>
            )
          })}
        </div>
      </div>
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
function EventBlock({ deadline }: { deadline: Deadline }) {
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
      onClick={() =>
        toast.info(
          `${deadline.title} — full event details ship with the comms module.`,
        )
      }
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
 * each menu item). Renders a single tall pane for Day, five panes
 * for Work week, and seven panes for Week — the visual matches what
 * Teams ships and keeps each view discoverable at a glance.
 *
 * Inline SVG so we don't drag in three more lucide icons; the
 * widths are derived from the column count, no magic numbers.
 */
function ViewIcon({ mode }: { mode: ViewMode }) {
  // Column counts per view — drives the bar widths in the icon.
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
