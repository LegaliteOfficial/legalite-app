'use client'

/**
 * Personal dashboard — "Today's agenda".
 *
 * Two live cards, both wired to the GraphQL backend:
 *   - Tasks due today  — `useTasks`, filtered to not-done tasks due in
 *     today's window (overdue carry-over surfaced as a red pill).
 *   - Upcoming events   — `useCalendarEvents`, ongoing + future events
 *     sorted by start time.
 *
 * When both are empty the whole section collapses to a single calm line
 * rather than render two empty cards — a light day shouldn't fill the
 * dashboard with boxes of "nothing". Data is fetched here at the section
 * level so that collapse decision can see both lists at once.
 *
 * The task rows reuse the Linear-style status/priority glyphs from the
 * tasks route so the visual language stays consistent across the app.
 */

import { useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarBlank,
  CheckCircle,
  ListChecks,
  MapPin,
  Plus,
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { useTasks, type Task } from '@/hooks/use-tasks'
import { useCalendarEvents, EVENT_TYPES, type CalendarEvent } from '@/hooks/use-calendar'
import {
  AssigneeStack,
  PriorityIcon,
  StatusIcon,
  formatDue,
  normPriority,
  normStatus,
} from '../../tasks/_components/task-meta'

const MAX_PREVIEW = 4

// Event-type accent colours for the calendar card's time chips.
const EVENT_TYPE_COLOR: Record<string, string> = {
  meeting: '#2563EB',
  hearing: '#C0392B',
  deadline: '#C9972B',
  call: '#0F766E',
  appointment: '#7C3AED',
  task: '#216A43',
  other: '#8A8F99',
}

function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function AgendaSection() {
  const { data: tasks, isLoading: tasksLoading } = useTasks()
  const fromIso = useMemo(() => new Date(startOfToday()).toISOString(), [])
  const { data: events, isLoading: eventsLoading } = useCalendarEvents(fromIso)

  const { today, overdueCount } = useMemo(() => {
    const sot = startOfToday()
    const sotTomorrow = sot + 86400000
    const live = (tasks ?? []).filter((t) => normStatus(t.status) !== 'Done')
    const today = live
      .filter((t) => {
        if (!t.due_date) return false
        const ts = new Date(t.due_date).getTime()
        return Number.isFinite(ts) && ts >= sot && ts < sotTomorrow
      })
      .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
    const overdueCount = live.filter((t) => {
      if (!t.due_date) return false
      const ts = new Date(t.due_date).getTime()
      return Number.isFinite(ts) && ts < sot
    }).length
    return { today, overdueCount }
  }, [tasks])

  const upcoming = useMemo(() => {
    const now = Date.now()
    return (events ?? [])
      .filter((e) => {
        const end = new Date(e.end_time || e.start_time).getTime()
        return Number.isFinite(end) && end >= now
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [events])

  const isLoading = tasksLoading || eventsLoading
  const bothEmpty = !isLoading && today.length === 0 && upcoming.length === 0

  return (
    <section>
      <h2
        className="font-heading text-lg font-semibold tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        Today’s agenda
      </h2>

      {bothEmpty ? (
        <AllClear overdueCount={overdueCount} />
      ) : (
        <div className="grid grid-cols-2 gap-4 mt-4 items-start">
          <TasksDueTodayCard
            today={today}
            overdueCount={overdueCount}
            isLoading={isLoading}
          />
          <UpcomingEventsCard upcoming={upcoming} isLoading={isLoading} />
        </div>
      )}
    </section>
  )
}

// ── Both-empty collapse ────────────────────────────────────────────────────

function AllClear({ overdueCount }: { overdueCount: number }) {
  const hasOverdue = overdueCount > 0
  return (
    <Card padding="none" className="overflow-hidden mt-4">
      <div className="flex items-center gap-3 px-5 py-4">
        <span
          className="inline-flex items-center justify-center h-9 w-9 rounded-xl shrink-0"
          style={{
            background: hasOverdue
              ? 'rgba(192,57,43,0.10)'
              : 'var(--accent-today-tint)',
          }}
        >
          <CheckCircle
            size={18}
            weight="fill"
            style={{ color: hasOverdue ? '#C0392B' : 'var(--gold-dark)' }}
          />
        </span>
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {hasOverdue ? 'Nothing scheduled today' : 'You’re all clear today'}
          </p>
          <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
            No tasks due and no events scheduled.
          </p>
        </div>
        {hasOverdue && (
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{ background: 'rgba(192,57,43,0.10)', color: '#C0392B' }}
          >
            {overdueCount} overdue
            <ArrowRight size={12} strokeWidth={2} />
          </Link>
        )}
      </div>
    </Card>
  )
}

// ── Tasks due today ────────────────────────────────────────────────────────

function TasksDueTodayCard({
  today,
  overdueCount,
  isLoading,
}: {
  today: Task[]
  overdueCount: number
  isLoading: boolean
}) {
  const preview = today.slice(0, MAX_PREVIEW)
  const overflow = today.length - preview.length

  return (
    <Card padding="none" className="overflow-hidden">
      <CardHead
        Icon={ListChecks}
        label="Tasks due today"
        count={today.length}
        href="/tasks"
        accent={today.length > 0}
        rightSlot={
          overdueCount > 0 ? (
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(192,57,43,0.10)', color: '#C0392B' }}
            >
              {overdueCount} overdue
            </Link>
          ) : null
        }
      />

      {isLoading ? (
        <Loading rows={2} />
      ) : today.length === 0 ? (
        <Empty
          message={
            overdueCount > 0
              ? 'Nothing due today — but you have overdue tasks.'
              : 'No tasks due today. You’re all clear.'
          }
          href="/tasks"
          cta="Add a task"
        />
      ) : (
        <ul className="px-2 pb-2">
          {preview.map((t) => {
            const due = formatDue(t.due_date)
            return (
              <li key={t.id}>
                <Link
                  href="/tasks"
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--surface-overlay)]"
                >
                  <StatusIcon status={normStatus(t.status)} size={15} />
                  <PriorityIcon priority={normPriority(t.priority)} size={14} />
                  <span
                    className="flex-1 truncate text-[13px] font-medium"
                    style={{ color: 'var(--text-primary)' }}
                    title={t.title}
                  >
                    {t.title}
                  </span>
                  {due && (
                    <span
                      className="text-[11.5px] tabular-nums shrink-0"
                      style={{ color: due.overdue ? '#C0392B' : 'var(--text-muted)' }}
                    >
                      {dueTime(t.due_date)}
                    </span>
                  )}
                  <AssigneeStack assignees={t.assignees} max={2} />
                </Link>
              </li>
            )
          })}
          {overflow > 0 && <MoreRow href="/tasks" count={overflow} />}
        </ul>
      )}
    </Card>
  )
}

// ── Upcoming calendar events ───────────────────────────────────────────────

function UpcomingEventsCard({
  upcoming,
  isLoading,
}: {
  upcoming: CalendarEvent[]
  isLoading: boolean
}) {
  const preview = upcoming.slice(0, MAX_PREVIEW)
  const overflow = upcoming.length - preview.length

  return (
    <Card padding="none" className="overflow-hidden">
      <CardHead
        Icon={CalendarBlank}
        label="Upcoming events"
        count={upcoming.length}
        href="/calendar"
        accent={upcoming.length > 0}
      />

      {isLoading ? (
        <Loading rows={2} />
      ) : upcoming.length === 0 ? (
        <Empty message="No upcoming events." href="/calendar" cta="Schedule one" />
      ) : (
        <ul className="px-2 pb-2">
          {preview.map((e) => {
            const color = EVENT_TYPE_COLOR[e.event_type] ?? EVENT_TYPE_COLOR.other
            const typeLabel =
              EVENT_TYPES.find((t) => t.value === e.event_type)?.label ?? 'Event'
            const sub = e.location || e.case_title || e.client_name || typeLabel
            return (
              <li key={e.id}>
                <Link
                  href="/calendar"
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--surface-overlay)]"
                >
                  <TimeChip iso={e.start_time} allDay={e.all_day} color={color} />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] font-medium truncate"
                      style={{ color: 'var(--text-primary)' }}
                      title={e.title}
                    >
                      {e.title}
                    </p>
                    <p
                      className="text-[11.5px] truncate flex items-center gap-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {e.location && <MapPin size={10} strokeWidth={1.75} />}
                      {sub}
                    </p>
                  </div>
                  <AssigneeStack
                    assignees={e.attendees.map((a) => ({
                      id: a.id,
                      name: a.name,
                      member_id: a.member_id ?? a.id,
                      task_id: '',
                      professional_title: a.professional_title ?? null,
                      avatar_url: a.avatar_url ?? null,
                    }))}
                    max={2}
                  />
                </Link>
              </li>
            )
          })}
          {overflow > 0 && <MoreRow href="/calendar" count={overflow} />}
        </ul>
      )}
    </Card>
  )
}

// ── Shared bits ─────────────────────────────────────────────────────────────

function CardHead({
  Icon,
  label,
  count,
  href,
  accent,
  rightSlot,
}: {
  Icon: typeof ListChecks
  label: string
  count: number
  href: string
  accent: boolean
  rightSlot?: React.ReactNode
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 border-b"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <span
        className="inline-flex items-center justify-center h-9 w-9 rounded-xl shrink-0"
        style={{ background: 'var(--accent-today-tint)' }}
      >
        <Icon size={16} strokeWidth={1.75} style={{ color: 'var(--gold-dark)' }} />
      </span>
      <div className="flex items-baseline gap-2 flex-1 min-w-0">
        <span
          className="font-heading text-[22px] font-semibold leading-none tabular-nums"
          style={{ color: accent ? 'var(--accent-today)' : 'var(--text-primary)' }}
        >
          {count}
        </span>
        <span
          className="text-[12.5px] font-medium uppercase tracking-wider truncate"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
      </div>
      {rightSlot}
      <Link
        href={href}
        aria-label={`Open ${label}`}
        className="inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors hover:bg-[var(--surface-overlay)] shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowRight size={15} strokeWidth={1.75} />
      </Link>
    </div>
  )
}

function TimeChip({ iso, allDay, color }: { iso: string; allDay: boolean; color: string }) {
  const d = new Date(iso)
  const sot = startOfToday()
  const ts = d.getTime()
  const dayDiff = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - sot) / 86400000,
  )
  const dayLabel =
    dayDiff === 0
      ? 'Today'
      : dayDiff === 1
        ? 'Tmrw'
        : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const timeLabel = allDay
    ? 'All day'
    : d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
  return (
    <span
      className="flex flex-col items-center justify-center h-10 w-12 rounded-lg shrink-0 border"
      style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-card)' }}
      aria-hidden={!Number.isFinite(ts)}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
        {dayLabel}
      </span>
      <span className="text-[10.5px] tabular-nums leading-tight" style={{ color: 'var(--text-secondary)' }}>
        {timeLabel}
      </span>
    </span>
  )
}

function MoreRow({ href, count }: { href: string; count: number }) {
  return (
    <li className="px-2 pt-1">
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-[11.5px] font-medium hover:underline underline-offset-2"
        style={{ color: 'var(--text-muted)' }}
      >
        +{count} more
        <ArrowRight size={11} strokeWidth={2} />
      </Link>
    </li>
  )
}

function Empty({ message, href, cta }: { message: string; href: string; cta: string }) {
  return (
    <div className="px-4 py-5">
      <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {message}
      </p>
      <Link
        href={href}
        className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium"
        style={{ color: 'var(--gold-dark)' }}
      >
        <Plus size={13} strokeWidth={2} />
        {cta}
      </Link>
    </div>
  )
}

function Loading({ rows }: { rows: number }) {
  return (
    <div className="px-4 py-4 space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-8 rounded-lg animate-pulse"
          style={{ background: 'var(--surface-sunken)' }}
        />
      ))}
    </div>
  )
}

function dueTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
}
