'use client'

/**
 * TimeTrackerBoot
 * ---------------
 * Boot component for the billable-hour timer system. Lives next to
 * PriorityRemindersBoot in the dashboard layout so all of this runs
 * exactly once for the authenticated app:
 *
 *   1. Rehydrate the time-tracker store from localStorage. Like the
 *      other local stores, it uses skipHydration so SSR + first
 *      CSR render align.
 *   2. Run a 1-second scheduler tick that checks whether the active
 *      entry is due for its 30-min check-in, and if so calls
 *      `raiseCheckIn` to surface the dialog.
 *   3. Mount the CheckInDialog so the prompt opens app-wide.
 *   4. Mount the ActiveTimerWidget so the running-timer indicator
 *      persists across navigations.
 *
 * Why a 1-second tick (and not setTimeout to the exact due time)?
 * Two reasons:
 *   - Browsers throttle background tabs aggressively. A long
 *     setTimeout in a backgrounded tab can fire seconds-to-minutes
 *     late; a 1-second poll catches the next opportunity as soon
 *     as the tab is foreground again.
 *   - Closing + reopening the laptop is a normal flow. On rehydrate
 *     the elapsed time may have leapfrogged past the due time —
 *     the poll naturally fires the prompt immediately on return,
 *     which is the desired behaviour.
 */

import { useEffect } from 'react'
import { useTimeTrackerStore } from '@/stores/time-tracker-local.store'
import { CheckInDialog } from '@/components/shared/CheckInDialog'
import { ActiveTimerWidget } from '@/components/shared/ActiveTimerWidget'
import { useLowBalanceAlerts } from '@/hooks/use-low-balance-alerts'

export function TimeTrackerBoot() {
  // Manual rehydrate — same pattern as PriorityRemindersBoot.
  useEffect(() => {
    void useTimeTrackerStore.persist.rehydrate()
  }, [])

  // Low-balance toast watcher. Fires when a client's
  //   trust + operating - outstanding - unbilled_time
  // dips to / below zero (or below the warning threshold). Mounted
  // here so the alert surfaces on whatever page the partner is on.
  useLowBalanceAlerts()

  // Scheduler tick. Reads state directly so it doesn't subscribe
  // to anything (no extra re-renders from the boot wrapper).
  useEffect(() => {
    const tick = () => {
      const s = useTimeTrackerStore.getState()
      if (!s.active_entry_id) return
      if (s.pending_check_in_at) return // already prompting
      if (!s.next_check_in_at) return
      if (new Date(s.next_check_in_at).getTime() <= Date.now()) {
        s.raiseCheckIn(s.active_entry_id)
      }
    }
    // Fire once immediately so a freshly-rehydrated stale timer
    // surfaces its prompt without a 1-second delay.
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <CheckInDialog />
      <ActiveTimerWidget />
    </>
  )
}
