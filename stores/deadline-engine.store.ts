/**
 * Deadline engine — UI state
 * ==========================
 *
 * View state for the /deadline page lives here rather than in the page
 * component so each section subscribes only to the slice it reads.
 * Toggling the scope re-renders the sections that query the feed, not
 * the page shell; picking a diary day re-renders the list, not the
 * category card. Server data stays in Apollo — nothing here is fetched.
 */

import { create } from 'zustand'
import type { Deadline } from '@/hooks/use-deadlines'
import type { AttentionItem, AttentionKind, AttentionScope } from '@/hooks/use-attention-feed'

/** Day key used for list focus: start-of-day epoch, or -1 for past due. */
export type DayFocus = number | null
export const PAST_DUE_FOCUS = -1

interface DeadlineEngineState {
  scope: AttentionScope
  showSnoozed: boolean
  kindFilter: AttentionKind | null
  focusDay: DayFocus
  /** Item currently being mutated — its row dims and its actions disable. */
  busyKey: string | null
  /**
   * Bumped by "Try again" on a failed section. Feeds the suspense query
   * key so a retry starts a fresh request instead of re-reading the
   * cached error.
   */
  retryNonce: number

  form: { open: boolean; deadline: Deadline | null; key: number }
  pendingDelete: AttentionItem | null

  setScope: (scope: AttentionScope) => void
  toggleShowSnoozed: () => void
  setKindFilter: (kind: AttentionKind | null) => void
  setFocusDay: (day: DayFocus) => void
  setBusyKey: (key: string | null) => void
  retry: () => void
  openCreate: () => void
  openEdit: (deadline: Deadline) => void
  closeForm: () => void
  setPendingDelete: (item: AttentionItem | null) => void
  /** Clears filters on leaving the page; scope is kept as a preference. */
  resetView: () => void
}

export const useDeadlineEngineStore = create<DeadlineEngineState>((set) => ({
  scope: 'mine',
  showSnoozed: false,
  kindFilter: null,
  focusDay: null,
  busyKey: null,
  retryNonce: 0,
  form: { open: false, deadline: null, key: 0 },
  pendingDelete: null,

  setScope: (scope) => set({ scope }),
  toggleShowSnoozed: () => set((s) => ({ showSnoozed: !s.showSnoozed })),
  setKindFilter: (kindFilter) => set({ kindFilter }),
  setFocusDay: (focusDay) => set({ focusDay }),
  setBusyKey: (busyKey) => set({ busyKey }),
  retry: () => set((s) => ({ retryNonce: s.retryNonce + 1 })),
  // A fresh `key` remounts the dialog so its form seeds from `deadline`.
  openCreate: () => set((s) => ({ form: { open: true, deadline: null, key: s.form.key + 1 } })),
  openEdit: (deadline) => set((s) => ({ form: { open: true, deadline, key: s.form.key + 1 } })),
  closeForm: () => set((s) => ({ form: { ...s.form, open: false } })),
  setPendingDelete: (pendingDelete) => set({ pendingDelete }),
  resetView: () =>
    set({ kindFilter: null, focusDay: null, showSnoozed: false, busyKey: null, pendingDelete: null }),
}))
