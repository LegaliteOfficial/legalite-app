import { create } from 'zustand'
import type { CalendarEvent } from '@/hooks/use-calendar'

/**
 * Due-events queue
 * ----------------
 * Local queue backing the "Event Due" prompt. Runs entirely from Zustand
 * — the network layer feeds this store, and the modal reads it. Two
 * design goals:
 *
 *   1. **Backend pressure**: keep this in memory so the modal can advance
 *      / dismiss without re-fetching. The GraphQL query is fired manually
 *      by the `EventDueBoot` hook only on app-open + tab visibility +
 *      after a resolved mutation (with a 30 s cooldown between visibility
 *      fetches). Everything else is a store-only mutation.
 *   2. **Never re-prompt the same event twice**: `sessionDismissed` holds
 *      IDs the user has already answered (or intentionally closed) in
 *      this browser session. Even if a stale query lands after the
 *      mutation, the filter strips those out so the prompt doesn't
 *      flicker back.
 *
 * The store is single-shot in memory — no persistence. If the user hard-
 * refreshes we intentionally re-ask (the backend's `due_acknowledged_at`
 * still gates the query, so already-answered events won't come back
 * either way).
 */

export type PromptStep = 'ask' | 'completion' | 'reschedule' | 'cancel'

interface DueEventsState {
  /** Current queue — server truth minus session-dismissed IDs. */
  queue: CalendarEvent[]
  /**
   * IDs the caller has answered / dismissed in this session. Prevents
   * flicker if a re-fetch lands before the mutation's cache write does.
   */
  sessionDismissed: Set<string>
  /** ID of the event currently shown in the prompt (top of queue). */
  currentEventId: string | null
  /** Which sub-form is showing. `null` = the initial "Did it happen?" ask. */
  step: PromptStep
  /**
   * Epoch-ms of the last successful `pendingDueEvents` response. Feeds
   * the visibility-change cooldown so tab-thrashing doesn't spam the
   * server.
   */
  lastFetchedAt: number

  // ── Actions ────────────────────────────────────────────────────────────
  /**
   * Replace the queue with a fresh server response. Filters out any IDs
   * already dismissed this session so the modal doesn't reappear.
   */
  setQueue: (events: CalendarEvent[]) => void
  /**
   * Remove one event from the queue AND remember its ID for the session.
   * Used both after a successful mutation and after the user closes the
   * prompt without answering.
   */
  dismiss: (eventId: string) => void
  /** Rewind to the "ask" step and advance to the next event, if any. */
  advance: () => void
  /** Move between prompt sub-forms — ask → completion / reschedule / cancel. */
  setStep: (step: PromptStep) => void
  /**
   * Rollback for a failed mutation: put an event back in the queue and
   * clear the session-dismiss flag so we ask again.
   */
  restore: (event: CalendarEvent) => void
  /** Record the last-fetch timestamp (called from the boot hook). */
  markFetched: () => void
}

export const useDueEventsStore = create<DueEventsState>((set, get) => ({
  queue: [],
  sessionDismissed: new Set<string>(),
  currentEventId: null,
  step: 'ask',
  lastFetchedAt: 0,

  setQueue: (events) => {
    const { sessionDismissed, currentEventId, step } = get()
    const filtered = events.filter((e) => !sessionDismissed.has(e.id))
    // Preserve the currently-showing event even if the fresh response
    // hasn't caught up yet — otherwise a mid-flow re-fetch would kick
    // the user out of the completion form.
    const inProgress = currentEventId && step !== 'ask'
    set({
      queue: filtered,
      currentEventId: inProgress
        ? currentEventId
        : filtered[0]?.id ?? null,
    })
  },

  dismiss: (eventId) => {
    const { queue, sessionDismissed } = get()
    const nextDismissed = new Set(sessionDismissed)
    nextDismissed.add(eventId)
    const nextQueue = queue.filter((e) => e.id !== eventId)
    set({
      queue: nextQueue,
      sessionDismissed: nextDismissed,
      currentEventId: nextQueue[0]?.id ?? null,
      step: 'ask',
    })
  },

  advance: () => {
    const { queue } = get()
    set({
      currentEventId: queue[0]?.id ?? null,
      step: 'ask',
    })
  },

  setStep: (step) => set({ step }),

  restore: (event) => {
    const { queue, sessionDismissed } = get()
    const nextDismissed = new Set(sessionDismissed)
    nextDismissed.delete(event.id)
    // De-dup on re-insert so a race doesn't stack the same event twice.
    const alreadyQueued = queue.some((e) => e.id === event.id)
    const nextQueue = alreadyQueued ? queue : [event, ...queue]
    set({
      queue: nextQueue,
      sessionDismissed: nextDismissed,
      currentEventId: nextQueue[0]?.id ?? null,
      step: 'ask',
    })
  },

  markFetched: () => set({ lastFetchedAt: Date.now() }),
}))

/** Selector: the event currently being asked about (or null). */
export const useCurrentDueEvent = (): CalendarEvent | null => {
  return useDueEventsStore((s) => {
    if (!s.currentEventId) return null
    return s.queue.find((e) => e.id === s.currentEventId) ?? null
  })
}
