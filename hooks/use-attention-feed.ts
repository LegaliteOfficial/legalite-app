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
 * Reads are suspense-based so each page section fetches for itself and
 * suspends inside its own <Suspense> boundary: a scope change re-renders
 * only the sections that read the feed, never the page shell. Sections
 * calling the hook with the same variables share one request and one
 * cache entry.
 *
 * The query is skipped until hydration: the Apollo client reads the auth
 * token from localStorage, so a server-side run would be unauthenticated.
 * The server and the hydration pass both render the section skeleton,
 * which is also the Suspense fallback, so the markup always matches.
 */

import { useEffect, useMemo, useState } from 'react'
import { skipToken, useMutation, useSuspenseQuery } from '@apollo/client/react'
import {
  AttentionFeedQueryDoc,
  CompleteAttentionItemMutationDoc,
  SnoozeAttentionItemMutationDoc,
  UnsnoozeAttentionItemMutationDoc,
} from '@/lib/graphql/attention'
import { DeadlineStatsQueryDoc, DeadlinesQueryDoc } from '@/lib/graphql/deadlines'
import { TasksQueryDoc } from '@/lib/graphql/tasks'
import { InvoicesQueryDoc } from '@/lib/graphql/invoices'
import { DEV_SAMPLE_DEADLINES } from '@/lib/calendar/dev-data'
import type { AttentionFeedQuery } from '@/types/generated/graphql'
import type { CalendarEvent } from '@/hooks/use-calendar'
import { useDeadlineEngineStore } from '@/stores/deadline-engine.store'
import { useHydrated } from '@/hooks/use-hydrated'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export const HORIZON_DAYS = 30
const DAY_MS = 86_400_000
const TICK_MS = 60_000

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
}

type FeedData = AttentionFeedQuery['attentionFeed']

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

// ── Clock + hydration ──────────────────────────────────────────────────────

export { useHydrated }

/**
 * Minute-resolution clock. Each section owns its own tick so the passage
 * of time re-renders the rows whose wording depends on it, not the page.
 */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [])
  return now
}

// ── Reads ──────────────────────────────────────────────────────────────────

/**
 * Raw feed for the current scope / snooze view. Suspends while loading;
 * `ready` is false until hydration (render the section skeleton then).
 */
export function useAttentionFeedQuery(): { feed: FeedData | undefined; ready: boolean } {
  const scope = useDeadlineEngineStore((s) => s.scope)
  const includeSnoozed = useDeadlineEngineStore((s) => s.showSnoozed)
  const retryNonce = useDeadlineEngineStore((s) => s.retryNonce)
  const hydrated = useHydrated()
  const [tzOffset] = useState(() => new Date().getTimezoneOffset())

  const { data } = useSuspenseQuery(
    AttentionFeedQueryDoc,
    hydrated && !DEV_BYPASS
      ? {
          variables: {
            input: {
              horizon_days: HORIZON_DAYS,
              tz_offset_minutes: tzOffset,
              scope,
              include_snoozed: includeSnoozed,
            },
          },
          queryKey: ['attention-feed', retryNonce],
        }
      : skipToken,
  )
  return { feed: data?.attentionFeed, ready: hydrated }
}

function mapFeedItems(feed: FeedData | undefined, now: number): AttentionItem[] {
  if (DEV_BYPASS) {
    // No backend in dev bypass: stand in with the shared sample deadlines.
    return DEV_SAMPLE_DEADLINES.filter((d) => d.status === 'Pending')
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
          priority: normPriority(d.priority),
          bucket: bucketFor(dueAt, now),
          href: hrefFor('deadline', d.case_id),
          completable: true,
          snoozedUntil: null,
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
    }
  })
}

export interface AttentionItems {
  /** Everything returned, including snoozed rows when they are shown. */
  items: AttentionItem[]
  /** Items that count as pressure — snoozed rows excluded. */
  activeItems: AttentionItem[]
  /** Active snoozes, including those hidden from `items`. */
  snoozedCount: number
  ready: boolean
  now: number
}

/** Feed items bucketed against a ticking clock. Suspends while loading. */
export function useAttentionItems(): AttentionItems {
  const { feed, ready } = useAttentionFeedQuery()
  const now = useNow()
  const items = useMemo(() => mapFeedItems(feed, now), [feed, now])
  const activeItems = useMemo(() => items.filter((i) => !i.snoozedUntil), [items])
  return { items, activeItems, snoozedCount: feed?.summary.snoozed ?? 0, ready, now }
}

/** Past events still waiting for an outcome. Suspends while loading. */
export function useAwaitingOutcome(): { events: CalendarEvent[]; ready: boolean } {
  const { feed, ready } = useAttentionFeedQuery()
  return { events: (feed?.awaiting_outcome ?? []) as CalendarEvent[], ready }
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
