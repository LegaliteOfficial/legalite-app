'use client'

/**
 * usePriorityReminders
 * --------------------
 * Walks every prioritised case at app load (and on a slow poll
 * thereafter) and surfaces a toast when a tracked hearing date is
 * within the priority level's lead-time window.
 *
 *   - High   priority: 5 days + 2 days before the hearing
 *   - Medium priority: 3 days before
 *   - Low    priority: 1 day before
 *
 * Each (case_id, days_before) pair fires AT MOST ONCE per
 * lead-time-per-hearing — tracked in localStorage so the same
 * reminder doesn't spam the user every reload. The dedup key
 * includes the hearing date itself so a rescheduled hearing
 * earns fresh reminders.
 *
 * The hook is fire-and-forget; mount it at the dashboard layout
 * level and it does its work in the background.
 */

import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  REMINDER_DAYS_BEFORE,
  usePriorityStore,
  type PriorityRecord,
} from '@/stores/priority.store'
import { PRIORITY_STYLE } from '@/components/shared/PriorityButton'

/** Storage key for the "already shown" set. JSON string array. */
const SEEN_STORAGE_KEY = 'll:priority-reminders-seen'

/**
 * How often to re-scan in milliseconds. 15 minutes is short enough
 * that a user crossing midnight into a new lead-time window gets
 * pinged within an acceptable lag, but long enough that we don't
 * thrash the toast system for a stable list of priorities.
 */
const POLL_INTERVAL_MS = 15 * 60 * 1000

function loadSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(SEEN_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function persistSeen(seen: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      SEEN_STORAGE_KEY,
      JSON.stringify(Array.from(seen)),
    )
  } catch {
    // Quota / disabled storage — silently ignore. Worst case is a
    // reminder repeats on next reload.
  }
}

/**
 * Whole-day delta between now and a future date. Returns the
 * floored count of 24h windows so "1.4 days from now" → 1.
 * Negative when the target has passed.
 */
function daysUntil(target: Date): number {
  const ms = target.getTime() - Date.now()
  return Math.floor(ms / (24 * 60 * 60 * 1000))
}

/**
 * Pull the next-hearing date out of a priority record's opaque
 * metadata. Returns null when missing or unparseable.
 */
function nextHearingDate(record: PriorityRecord): Date | null {
  const raw = record.metadata?.next_court_date
  if (raw == null) return null
  const d = new Date(String(raw))
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Scan once. Toasts each (record, lead-time) pair that:
 *   1. Is for a case (clients / invoices don't have hearing dates)
 *   2. Has a parseable next_court_date in the future
 *   3. Has days-until exactly matching one of the lead times for
 *      its priority level
 *   4. Hasn't already been shown to this user (dedup via localStorage)
 */
function runScan(records: PriorityRecord[]): number {
  const seen = loadSeen()
  let fired = 0

  for (const r of records) {
    if (r.entityType !== 'case') continue
    const hearing = nextHearingDate(r)
    if (!hearing) continue
    const left = daysUntil(hearing)
    if (left < 0) continue
    const windows = REMINDER_DAYS_BEFORE[r.level]
    for (const d of windows) {
      if (left !== d) continue
      // Include the hearing date in the key so a rescheduled
      // hearing earns fresh reminders.
      const key = `${r.entityType}:${r.entityId}:${hearing.toISOString().slice(0, 10)}:${d}`
      if (seen.has(key)) continue
      const style = PRIORITY_STYLE[r.level]
      const dayLabel = d === 1 ? '1 day' : `${d} days`
      const isUrgent = r.level === 'high' && d <= 2
      const fn = isUrgent ? toast.error : toast.warning
      fn(
        `${style.label} priority — ${r.label} hearing in ${dayLabel}.`,
        {
          description:
            hearing.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }),
          duration: 8000,
        },
      )
      seen.add(key)
      fired += 1
    }
  }

  if (fired > 0) persistSeen(seen)
  return fired
}

export function usePriorityReminders() {
  // Mount-only effect. Each timer callback reads the live records
  // map straight from the Zustand store via `getState()` rather
  // than closing over a hook-derived array — that avoids any
  // selector-identity churn from re-running the effect on every
  // unrelated render of the layout.
  useEffect(() => {
    const scan = () => {
      const records = Object.values(usePriorityStore.getState().records)
      runScan(records)
    }
    // Initial scan on mount. Wrap in a microtask so the toast
    // system has time to mount on first paint.
    const handle = window.setTimeout(scan, 0)

    // Slow poll so a long-running tab eventually crosses into a
    // new lead-time window without a refresh.
    const interval = window.setInterval(scan, POLL_INTERVAL_MS)

    // Also re-scan immediately when a priority is toggled so a
    // freshly-flagged case in its lead-time window gets a toast
    // without the user waiting for the next poll.
    const unsubscribe = usePriorityStore.subscribe(scan)

    return () => {
      window.clearTimeout(handle)
      window.clearInterval(interval)
      unsubscribe()
    }
  }, [])
}
