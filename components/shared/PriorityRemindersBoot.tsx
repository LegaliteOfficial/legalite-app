'use client'

/**
 * PriorityRemindersBoot
 * ---------------------
 * Tiny client wrapper that boots up all the persisted client
 * stores + their reminder scans at the dashboard layout level:
 *
 *   1. Manually rehydrates `usePriorityStore` from localStorage
 *      after mount. The store is configured with `skipHydration`
 *      so SSR and the first CSR render both see an empty state —
 *      avoiding React's "getServerSnapshot should be cached"
 *      warning from a mid-render SSR-to-CSR state mismatch.
 *   2. Manually rehydrates `useTasksLocalStore` for the same reason.
 *   3. Mounts `usePriorityReminders` so flagged-case hearing
 *      reminders fire app-wide.
 *   4. Mounts `useTaskReminders` so configured task reminders
 *      fire app-wide.
 *
 * Lives in its own component so the dashboard layout can stay a
 * server component while still kicking off these client effects.
 */

import { useEffect } from 'react'
import { usePriorityReminders } from '@/hooks/use-priority-reminders'
import { useTaskReminders } from '@/hooks/use-task-reminders'
import { usePriorityStore } from '@/stores/priority.store'
import { useTasksLocalStore } from '@/stores/tasks-local.store'

export function PriorityRemindersBoot() {
  // Manual hydration — fires once on mount, then the persist
  // middleware takes over for subsequent localStorage writes.
  useEffect(() => {
    void usePriorityStore.persist.rehydrate()
    void useTasksLocalStore.persist.rehydrate()
  }, [])

  usePriorityReminders()
  useTaskReminders()
  return null
}
