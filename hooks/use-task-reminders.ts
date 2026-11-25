'use client'

/**
 * useTaskReminders
 * ----------------
 * Surfaces an in-app toast when a reminder set on a task comes due.
 * Reads the tasks (and their reminders) from the tasks API, so it covers
 * every task the member can see.
 *
 *   - Mounts at the dashboard layout via PriorityRemindersBoot.
 *   - Scans whenever the task list changes and every five minutes.
 *   - Remembers reminders already shown in localStorage so a toast does
 *     not repeat on reload. The key includes the reminder time, so a
 *     rescheduled task earns a fresh reminder.
 */

import { useEffect } from 'react'
import { useQuery } from '@apollo/client/react'
import { toast } from 'sonner'
import { TasksQueryDoc } from '@/lib/graphql/tasks'
import { useAuthStore } from '@/stores/auth.store'
import type { TasksQuery } from '@/types/generated/graphql'

type ApiTask = TasksQuery['tasks'][number]

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
const SEEN_STORAGE_KEY = 'll:task-reminders-seen'
const POLL_INTERVAL_MS = 5 * 60 * 1000
/** Reminders more than this late are not shown (the moment has passed). */
const STALE_AFTER_MS = 6 * 60 * 60 * 1000

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
    // Keep the list bounded.
    window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...seen].slice(-500)))
  } catch {
    /* quota / disabled storage */
  }
}

/** Toast each reminder whose time has arrived and has not been shown yet. */
function runScan(tasks: readonly ApiTask[]): number {
  const seen = loadSeen()
  const now = Date.now()
  let fired = 0
  for (const t of tasks) {
    if (t.status === 'Done' || !t.due_date) continue
    const due = new Date(t.due_date)
    if (Number.isNaN(due.getTime()) || due.getTime() < now) continue
    for (const r of t.reminders ?? []) {
      const at = new Date(r.remind_at).getTime()
      if (Number.isNaN(at) || at > now || now - at > STALE_AFTER_MS) continue
      const key = `${t.id}:${r.id}:${r.remind_at}`
      if (seen.has(key)) continue

      const minsLeft = Math.max(0, Math.floor((due.getTime() - now) / 60_000))
      const urgent = minsLeft <= 30 || t.priority === 'High'
      ;(urgent ? toast.error : toast.warning)(`Task due in ${formatLeadTime(minsLeft)}: ${t.title}.`, {
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
  const signedIn = useAuthStore((s) => Boolean(s.token && s.activeMembership))
  const { data } = useQuery(TasksQueryDoc, {
    skip: DEV_BYPASS || !signedIn,
    pollInterval: POLL_INTERVAL_MS,
    fetchPolicy: 'cache-and-network',
  })
  const tasks = data?.tasks

  useEffect(() => {
    if (!tasks) return
    const scan = () => runScan(tasks)
    const handle = window.setTimeout(scan, 0)
    // Reminders come due between refetches, so scan on a timer too.
    const interval = window.setInterval(scan, 60 * 1000)
    return () => {
      window.clearTimeout(handle)
      window.clearInterval(interval)
    }
  }, [tasks])
}
