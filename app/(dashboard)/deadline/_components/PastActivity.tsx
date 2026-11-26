'use client'

/**
 * Past activity: calendar events that have already happened and tasks
 * that are finished, newest first. The attention list above only covers
 * what is still open, so without this section the page had no way back
 * to earlier schedules. Reads the calendar and task lists directly; the
 * "Mine" scope keeps rows the user created.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, ClockCounterClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useCalendarEvents } from '@/hooks/use-calendar'
import { useTasks } from '@/hooks/use-tasks'
import { useAuthStore } from '@/stores/auth.store'
import { useDeadlineEngineStore } from '@/stores/deadline-engine.store'
import { KIND_META } from '../_lib/attention-meta'
import { DateLeaf } from './DateLeaf'

const DAY_MS = 86_400_000
const LOOKBACK_DAYS = 180
const PAGE = 10

type PastRow = {
  key: string
  kind: 'event' | 'task'
  title: string
  context: string | null
  status: string
  at: number
  href: string
}

const OUTCOME_LABEL: Record<string, string> = {
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
}

export function PastActivity() {
  // Fixed for the life of the section so the query variables stay stable.
  const [range] = useState(() => {
    const now = Date.now()
    return {
      now,
      from: new Date(now - LOOKBACK_DAYS * DAY_MS).toISOString(),
      to: new Date(now).toISOString(),
    }
  })
  const scope = useDeadlineEngineStore((s) => s.scope)
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const { data: events, isLoading: eventsLoading } = useCalendarEvents(range.from, range.to)
  const { data: tasks, isLoading: tasksLoading } = useTasks()
  const [shown, setShown] = useState(PAGE)

  const rows = useMemo(() => {
    const mine = (owner: string | null | undefined) => scope !== 'mine' || !userId || owner === userId
    const out: PastRow[] = []
    for (const e of events ?? []) {
      const at = new Date(e.start_time).getTime()
      if (!Number.isFinite(at) || at >= range.now || !mine(e.created_by)) continue
      out.push({
        key: `event:${e.id}`,
        kind: 'event',
        title: e.title,
        context: e.case_title ?? e.client_name ?? e.location ?? null,
        status:
          (e.outcome_status && OUTCOME_LABEL[e.outcome_status]) ||
          (e.status === 'cancelled' ? 'Cancelled' : 'Held'),
        at,
        href: e.case_id ? `/cases/${e.case_id}` : '/calendar',
      })
    }
    for (const t of tasks ?? []) {
      // Open tasks past their due date are already in the list above.
      if (t.status !== 'Done' || !t.due_date || !mine(t.user_id)) continue
      const at = new Date(t.due_date).getTime()
      if (!Number.isFinite(at)) continue
      out.push({
        key: `task:${t.id}`,
        kind: 'task',
        title: t.title,
        context: t.case_title ?? t.client_name ?? null,
        status: 'Done',
        at,
        href: '/tasks',
      })
    }
    return out.sort((a, b) => b.at - a.at)
  }, [events, tasks, scope, userId, range.now])

  const loading = eventsLoading || tasksLoading

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="whitespace-nowrap font-heading text-[17px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Past schedule
        </h2>
        <span className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
          Events held and tasks finished in the last six months
        </span>
      </div>

      {loading ? (
        <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
          Loading your past schedule...
        </p>
      ) : rows.length === 0 ? (
        <div
          className="flex items-center gap-2 rounded-2xl border border-dashed px-5 py-6 text-[12.5px]"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
        >
          <ClockCounterClockwise size={16} />
          Nothing in the last six months yet.
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {rows.slice(0, shown).map((row) => {
              const meta = KIND_META[row.kind]
              return (
                <li
                  key={row.key}
                  className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                  style={{ borderColor: 'var(--border-default)', background: 'var(--surface-card)' }}
                >
                  <DateLeaf ts={row.at} tone="#8A8F99" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                        style={{ background: meta.tint, color: meta.color }}
                      >
                        <meta.Icon size={11} weight="bold" />
                        {meta.label}
                      </span>
                      <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                        {row.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[13.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {row.title}
                    </p>
                    {row.context && (
                      <p className="truncate text-[12px]" style={{ color: 'var(--text-muted)' }}>
                        {row.context}
                      </p>
                    )}
                  </div>
                  <span className="hidden text-[12px] sm:block" style={{ color: 'var(--text-muted)' }}>
                    {new Date(row.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Link
                    href={row.href}
                    aria-label="Open"
                    title="Open"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-overlay)]"
                  >
                    <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
                  </Link>
                </li>
              )
            })}
          </ul>
          {rows.length > shown && (
            <Button variant="outline" className="mt-3 rounded-lg" onClick={() => setShown((n) => n + PAGE)}>
              Show {Math.min(PAGE, rows.length - shown)} more of {rows.length - shown}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
