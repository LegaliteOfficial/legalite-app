'use client'

/**
 * Attention feed — the data layer behind the Deadline engine.
 *
 * The backend's `attentionFeed` query aggregates everything the user has
 * to act on before a point in time (deadlines, tasks, calendar events,
 * hearings, case court dates, unpaid invoices) and the past events still
 * waiting on an outcome. Scoping, de-duplication and snoozes are applied
 * server side.
 *
 * Buckets are recomputed here against a ticking clock so an item rolls
 * from "today" into "overdue" without waiting for the next fetch.
 */

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import {
  AttentionFeedQueryDoc,
  CompleteAttentionItemMutationDoc,
  SnoozeAttentionItemMutationDoc,
  UnsnoozeAttentionItemMutationDoc,
} from '@/lib/graphql/attention'
import { DeadlineStatsQueryDoc, DeadlinesQueryDoc } from '@/lib/graphql/deadlines'
import { TasksQueryDoc } from '@/lib/graphql/tasks'
import { InvoicesQueryDoc } from '@/lib/graphql/invoices'
import { useDeadlines, type Deadline } from '@/hooks/use-deadlines'
import type { CalendarEvent } from '@/hooks/use-calendar'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export const HORIZON_DAYS = 30
const DAY_MS = 86_400_000
const REFRESH_MS = 60_000
/** Server data is re-pulled on this cadence; buckets tick every minute. */
const POLL_MS = 5 * 60_000

export type AttentionKind = 'deadline' | 'task' | 'event' | 'hearing' | 'court' | 'invoice'

export type AttentionBucket = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later'

export type AttentionPriority = 'High' | 'Medium' | 'Low'

export type AttentionScope = 'mine' | 'firm'

export interface AttentionItem {
  /** Unique across sources: `${kind}:${id}`. */
  key: string
  /** Source record id. */
  id: string
  kind: AttentionKind
  title: string
  /** Secondary line — case, client, location. */
  context: string | null
  /** Short source-specific label, e.g. "Court hearing" or "GHS 4,500". */
  detail: string | null
  /** Epoch ms of the moment the item is due / starts. */
  dueAt: number
  /** True when only the date is meaningful (no time of day). */
  allDay: boolean
  priority: AttentionPriority | null
  bucket: AttentionBucket
  href: string
  /** True when `completeAttentionItem` can close the item out. */
  completable: boolean
  /** ISO timestamp the item is hidden until, when snoozed. */
  snoozedUntil: string | null
  /** Deadline record for the edit dialog, when kind === 'deadline'. */
  deadline?: Deadline
}

export interface AttentionSummary {
  total: number
  overdue: number
  today: number
  tomorrow: number
  week: number
  later: number
  snoozed: number
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function bucketFor(dueAt: number, now: number): AttentionBucket {
  if (dueAt < now) return 'overdue'
  const sod = startOfDay(now)
  if (dueAt < sod + DAY_MS) return 'today'
  if (dueAt < sod + 2 * DAY_MS) return 'tomorrow'
  if (dueAt < sod + 7 * DAY_MS) return 'week'
  return 'later'
}

function hrefFor(kind: AttentionKind, caseId: string | null | undefined): string {
  switch (kind) {
    case 'task':
      return '/tasks'
    case 'invoice':
      return '/billing'
    case 'deadline':
      return caseId ? `/cases/${caseId}` : '/deadline'
    default:
      return caseId ? `/cases/${caseId}` : '/calendar'
  }
}

function normPriority(p: string | null | undefined): AttentionPriority | null {
  return p === 'High' || p === 'Medium' || p === 'Low' ? p : null
}

export interface AttentionFeedOptions {
  scope?: AttentionScope
  includeSnoozed?: boolean
}

export interface AttentionFeed {
  items: AttentionItem[]
  /** Past events still waiting for an outcome to be recorded. */
  awaitingOutcome: CalendarEvent[]
  /** Pending deadlines, used for browser notifications. */
  pendingDeadlines: Deadline[]
  /** Server-side counts; `snoozed` includes items not returned. */
  summary: AttentionSummary | null
  isLoading: boolean
  error: unknown
  /** Reference "now" the buckets were computed against. */
  now: number
}

export function useAttentionFeed({
  scope = 'mine',
  includeSnoozed = false,
}: AttentionFeedOptions = {}): AttentionFeed {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  const [tzOffset] = useState(() => new Date().getTimezoneOffset())

  const { data, previousData, loading, error } = useQuery(AttentionFeedQueryDoc, {
    variables: {
      input: {
        horizon_days: HORIZON_DAYS,
        tz_offset_minutes: tzOffset,
        scope,
        include_snoozed: includeSnoozed,
      },
    },
    pollInterval: POLL_MS,
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })

  // Full deadline records back the edit dialog and browser notifications.
  // In dev bypass they also stand in for the feed, which has no backend.
  const { data: deadlines } = useDeadlines('Pending')

  // Keep the previous result on screen while a scope / snooze toggle refetches.
  const feed = (data ?? previousData)?.attentionFeed

  const items = useMemo<AttentionItem[]>(() => {
    const byId = new Map((deadlines ?? []).map((d) => [d.id, d]))

    if (DEV_BYPASS) {
      return (deadlines ?? [])
        .map((d): AttentionItem => {
          const dueAt = new Date(d.due_date).getTime()
          return {
            key: `deadline:${d.id}`,
            id: d.id,
            kind: 'deadline',
            title: d.title,
            context: d.case_title,
            detail: d.description,
            dueAt,
            allDay: true,
            priority: d.priority,
            bucket: bucketFor(dueAt, now),
            href: hrefFor('deadline', d.case_id),
            completable: true,
            snoozedUntil: null,
            deadline: d,
          }
        })
        .filter((i) => Number.isFinite(i.dueAt))
        .sort((a, b) => a.dueAt - b.dueAt)
    }

    return (feed?.items ?? []).map((i): AttentionItem => {
      const kind = i.kind as AttentionKind
      const dueAt = new Date(i.due_at).getTime()
      return {
        key: i.key,
        id: i.id,
        kind,
        title: i.title,
        context: i.context ?? null,
        detail: i.detail ?? null,
        dueAt,
        allDay: i.all_day,
        priority: normPriority(i.priority),
        bucket: bucketFor(dueAt, now),
        href: hrefFor(kind, i.case_id),
        completable: i.completable,
        snoozedUntil: i.snoozed_until ?? null,
        deadline: kind === 'deadline' ? byId.get(i.id) : undefined,
      }
    })
  }, [feed, deadlines, now])

  return {
    items,
    awaitingOutcome: (feed?.awaiting_outcome ?? []) as CalendarEvent[],
    pendingDeadlines: deadlines ?? [],
    summary: feed?.summary ?? null,
    isLoading: DEV_BYPASS ? false : loading,
    error: DEV_BYPASS ? undefined : error,
    now,
  }
}

// ── Mutations ──────────────────────────────────────────────────────────────

type ItemRef = { kind: AttentionKind; id: string }

/** Marks a deadline or task Done, or an invoice Paid. */
export function useCompleteAttentionItem() {
  const [mutate, state] = useMutation(CompleteAttentionItemMutationDoc, {
    refetchQueries: [
      AttentionFeedQueryDoc,
      DeadlinesQueryDoc,
      DeadlineStatsQueryDoc,
      TasksQueryDoc,
      InvoicesQueryDoc,
      'DashboardStats',
    ],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (ref: ItemRef) => {
      if (DEV_BYPASS) return true
      const res = await mutate({ variables: { input: ref } })
      return res.data?.completeAttentionItem ?? false
    },
  }
}

/** Hides an item from the caller's feed until `until`. */
export function useSnoozeAttentionItem() {
  const [mutate, state] = useMutation(SnoozeAttentionItemMutationDoc, {
    refetchQueries: [AttentionFeedQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (ref: ItemRef & { until: Date }) => {
      if (DEV_BYPASS) return null
      const res = await mutate({
        variables: { input: { kind: ref.kind, id: ref.id, until: ref.until.toISOString() } },
      })
      return res.data?.snoozeAttentionItem ?? null
    },
  }
}

export function useUnsnoozeAttentionItem() {
  const [mutate, state] = useMutation(UnsnoozeAttentionItemMutationDoc, {
    refetchQueries: [AttentionFeedQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (ref: ItemRef) => {
      if (DEV_BYPASS) return true
      const res = await mutate({ variables: { input: ref } })
      return res.data?.unsnoozeAttentionItem ?? false
    },
  }
}

/** Preset snooze targets offered in the row menu. */
export function snoozePresets(now: number): { label: string; until: Date }[] {
  const tomorrow9 = new Date(startOfDay(now) + DAY_MS)
  tomorrow9.setHours(9)
  const nextMonday9 = new Date(startOfDay(now))
  const daysToMonday = (8 - nextMonday9.getDay()) % 7 || 7
  nextMonday9.setDate(nextMonday9.getDate() + daysToMonday)
  nextMonday9.setHours(9)
  return [
    { label: 'For 3 hours', until: new Date(now + 3 * 3_600_000) },
    { label: 'Until tomorrow, 09:00', until: tomorrow9 },
    { label: 'Until Monday, 09:00', until: nextMonday9 },
  ]
}
