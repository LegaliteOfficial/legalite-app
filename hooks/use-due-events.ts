'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client/react'
import { toast } from 'sonner'
import {
  AcknowledgeEventDueMutationDoc,
  CancelEventOccurrenceMutationDoc,
  CompleteEventMutationDoc,
  PendingDueEventsQueryDoc,
  RescheduleEventMutationDoc,
} from '@/lib/graphql/calendar'
import type {
  AcknowledgeEventDueInput,
  CalendarEventFieldsFragment,
  CancelEventOccurrenceInput,
  CompleteEventInput,

  RescheduleEventInput,
} from '@/types/generated/graphql'
import { useDueEventsStore } from '@/stores/due-events.store'
import type { CalendarEvent } from './use-calendar'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

/**
 * Cooldown between visibility-triggered fetches. Tabbing in/out shouldn't
 * spam the server — Chrome/Safari fire `visibilitychange` on every
 * flicker, so we gate refetches to at most once per 30 s from that path.
 * The mount fetch + the post-mutation fetch bypass this cooldown.
 */
const VISIBILITY_COOLDOWN_MS = 30_000

/**
 * Debounce for the visibility handler itself — if the tab rapidly
 * flickers (window switching, screen off/on) we want a single fetch
 * decision, not one per event.
 */
const VISIBILITY_DEBOUNCE_MS = 300

/**
 * The one hook that talks to the network for the Event Due Workflow.
 *
 * Fires `pendingDueEvents` exactly THREE ways:
 *   1. On mount (initial catch-up).
 *   2. On `visibilitychange` → visible, respecting the 30 s cooldown.
 *   3. Explicitly after a successful outcome mutation, to catch the
 *      next event without waiting for a natural trigger.
 *
 * Never on a setInterval. Never on `focus` (redundant with
 * visibilitychange in modern browsers, and doubles the call rate for
 * no user-visible benefit).
 */
export function useDueEventsBoot() {
  const setQueue = useDueEventsStore((s) => s.setQueue)
  const markFetched = useDueEventsStore((s) => s.markFetched)
  const getLastFetchedAt = useCallback(
    () => useDueEventsStore.getState().lastFetchedAt,
    [],
  )
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // network-only + useLazyQuery → we control every network hit. The cache
  // still receives the response so Apollo's normalized store stays fresh.
  // Apollo v4 dropped onCompleted/onError from useLazyQuery options —
  // handle the response through the returned promise instead.
  const [runPendingQuery] = useLazyQuery(PendingDueEventsQueryDoc, {
    fetchPolicy: 'network-only',
  })

  const fetchNow = useCallback(async () => {
    if (DEV_BYPASS) return
    try {
      const { data } = await runPendingQuery({ variables: { limit: 20 } })
      if (!data) return
      const events = (data.pendingDueEvents ?? []) as CalendarEvent[]
      setQueue(events)
      markFetched()
    } catch (err) {
      // Silent — we don't want to toast every network hiccup on a
      // background poll. Errors surface loud on the mutations themselves.
      // eslint-disable-next-line no-console
      console.warn(
        '[due-events] pending fetch failed:',
        err instanceof Error ? err.message : err,
      )
    }
  }, [markFetched, runPendingQuery, setQueue])

  // Mount fetch.
  useEffect(() => {
    fetchNow()
  }, [fetchNow])

  // Visibility handler — debounced + cooldown-gated.
  useEffect(() => {
    if (DEV_BYPASS) return
    if (typeof document === 'undefined') return

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        const elapsed = Date.now() - getLastFetchedAt()
        if (elapsed < VISIBILITY_COOLDOWN_MS) return
        fetchNow()
      }, VISIBILITY_DEBOUNCE_MS)
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [fetchNow, getLastFetchedAt])

  return { refetch: fetchNow }
}

/**
 * The mutation trio for the prompt flow. Each one:
 *   1. Optimistically dismisses the event from the local queue (instant UI).
 *   2. Fires the mutation.
 *   3. On success — triggers a background refetch via the passed
 *      `refetch()` so the next pending event surfaces without a stale
 *      window.
 *   4. On failure — restores the event to the queue + toasts.
 *
 * Split from the boot hook so components can consume just the mutations
 * without pulling in the polling machinery.
 */
export function useDueEventMutations(refetch: () => void) {
  const dismiss = useDueEventsStore((s) => s.dismiss)
  const restore = useDueEventsStore((s) => s.restore)

  const [ackMutate] = useMutation(AcknowledgeEventDueMutationDoc)
  const [completeMutate] = useMutation(CompleteEventMutationDoc)
  const [rescheduleMutate] = useMutation(RescheduleEventMutationDoc)
  const [cancelMutate] = useMutation(CancelEventOccurrenceMutationDoc)

  /**
   * Wraps a mutation call with the optimistic-dismiss + restore-on-error
   * pattern. All four handlers reuse this so the failure path stays
   * identical. `event` is passed through so we can restore it verbatim
   * (with attendees, reminders, etc.) if the mutation fails.
   */
  const runOptimistic = useCallback(
    async (
      event: CalendarEvent,
      op: () => Promise<unknown>,
      { errorLabel }: { errorLabel: string },
    ) => {
      dismiss(event.id)
      try {
        await op()
        // Prime the pump — pull the next event immediately so we don't
        // wait for the visibility trigger.
        refetch()
      } catch (err) {
        restore(event)
        toast.error(
          err instanceof Error
            ? `${errorLabel}: ${err.message}`
            : errorLabel,
        )
      }
    },
    [dismiss, refetch, restore],
  )

  return {
    /** Yes / No / Close → just record acknowledgement, no outcome. */
    acknowledge: (event: CalendarEvent, input: AcknowledgeEventDueInput) =>
      runOptimistic(
        event,
        () => ackMutate({ variables: { input } }),
        { errorLabel: "Couldn't record your answer" },
      ),
    /** Yes → outcome. Also self-acknowledges server-side. */
    complete: (event: CalendarEvent, input: CompleteEventInput) =>
      runOptimistic(
        event,
        () => completeMutate({ variables: { input } }),
        { errorLabel: "Couldn't mark this event as completed" },
      ),
    /** No → new date/time. Also self-acknowledges server-side. */
    reschedule: (event: CalendarEvent, input: RescheduleEventInput) =>
      runOptimistic(
        event,
        () => rescheduleMutate({ variables: { input } }),
        { errorLabel: "Couldn't reschedule this event" },
      ),
    /** No → cancel with reason. Also self-acknowledges server-side. */
    cancel: (event: CalendarEvent, input: CancelEventOccurrenceInput) =>
      runOptimistic(
        event,
        () => cancelMutate({ variables: { input } }),
        { errorLabel: "Couldn't cancel this event" },
      ),
  }
}

// Re-exports so the fragment type is importable alongside the hook.
export type { CalendarEventFieldsFragment }
