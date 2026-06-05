'use client'

/**
 * useTaskReminders
 * ----------------
 * Walks every task with a reminder offset configured and surfaces
 * a toast when the due date crosses into the lead-time window
 * (15 min / 1 hr / 1 day / 3 days before, per the user's pick).
 *
 * Mirrors the priority-reminder hook's contract:
 *   - Mounts at the dashboard layout via PriorityRemindersBoot.
 *   - Scans on mount, every 10 minutes, and on any tasks-store
 *     change (so a freshly-saved task gets evaluated immediately).
 *   - Persists "already-shown" reminders in localStorage so the
 *     same toast doesn't repeat on every reload. The dedup key
 *     includes the due timestamp so a rescheduled task earns
 *     fresh reminders.
 */

import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  REMINDER_OFFSET_MINUTES,
  useTasksLocalStore,
  type LocalTask,
} from '@/stores/tasks-local.store'

const SEEN_STORAGE_KEY = 'll:task-reminders-seen'

/**
 * Poll cadence in ms. Shorter than the priority reminder's 15-min
 * window because task lead times are tighter (15-min minimum).
 */
const POLL_INTERVAL_MS = 5 * 60 * 1000

function loadSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(SEEN_STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function persistSeen(seen: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...seen]))
  } catch {
    /* quota / disabled storage — silently ignore */
  }
}

/** Whole-minute count until the target (negative if past). */
function minutesUntil(target: Date): number {
  return Math.floor((target.getTime() - Date.now()) / 60_000)
}

/**
 * One pass over the in-memory task list. Toasts each
 * (task, offset) pair that:
 *   1. Has a parseable due date
 *   2. Has a non-`none` reminder offset
 *   3. Is in 0..offset minutes from due time, AND we haven't
 *      already shown that pair (within this hearing).
 *   4. Isn't already in Done status (no point reminding about
 *      finished work).
 */
function runScan(tasks: LocalTask[]): number {
  const seen = loadSeen()
  let fired = 0
  for (const t of tasks) {
    if (t.status === 'Done') continue
    if (!t.due_at) continue
    const offsetMinutes = REMINDER_OFFSET_MINUTES[t.reminder_offset]
    if (offsetMinutes == null) continue
    const due = new Date(t.due_at)
    if (Number.isNaN(due.getTime())) continue
    const minsLeft = minutesUntil(due)
    if (minsLeft < 0) continue
    if (minsLeft > offsetMinutes) continue

    const key = `${t.id}:${due.toISOString().slice(0, 16)}:${t.reminder_offset}`
    if (seen.has(key)) continue

    const human = formatLeadTime(minsLeft)
    const isUrgent = minsLeft <= 30 || t.priority === 'High'
    const fn = isUrgent ? toast.error : toast.warning
    fn(`Task due in ${human} — ${t.title}.`, {
      description: due.toLocaleString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      duration: 8000,
    })
    seen.add(key)
    fired += 1
  }
  if (fired > 0) persistSeen(seen)
  return fired
}

/** Pretty "1 hr 15 min" / "2 days 3 hr" / "10 min" labels. */
function formatLeadTime(minutes: number): string {
  if (minutes <= 0) return 'now'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  if (hours < 24) return rem ? `${hours} hr ${rem} min` : `${hours} hr`
  const days = Math.floor(hours / 24)
  const hRem = hours % 24
  return hRem ? `${days} day${days === 1 ? '' : 's'} ${hRem} hr` : `${days} day${days === 1 ? '' : 's'}`
}

export function useTaskReminders() {
  useEffect(() => {
    const scan = () => {
      const tasks = Object.values(useTasksLocalStore.getState().tasks)
      runScan(tasks)
    }
    const handle = window.setTimeout(scan, 0)
    const interval = window.setInterval(scan, POLL_INTERVAL_MS)
    // Re-scan immediately when the store changes (new task added,
    // due date edited, reminder offset changed) so the toast fires
    // without waiting for the next poll tick.
    const unsubscribe = useTasksLocalStore.subscribe(scan)
    return () => {
      window.clearTimeout(handle)
      window.clearInterval(interval)
      unsubscribe()
    }
  }, [])
}
