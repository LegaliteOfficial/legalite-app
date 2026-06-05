/**
 * Priority store
 * --------------
 * Lets users flag any entity (case, client, invoice, …) as High,
 * Medium, or Low priority. The flags drive:
 *
 *   - A "Your priorities" panel on the personal dashboard so the
 *     user can scan their own list of starred work at a glance.
 *   - A "Firm-wide priorities" panel on the firm dashboard that
 *     aggregates every user's priorities in the firm.
 *   - A reminder loop that walks high-priority cases and toasts
 *     the user when a tracked hearing date is within the level's
 *     lead-time window (5 days + 2 days for High, etc.).
 *
 * Keyed on a stable `entityType:entityId` composite so a case and
 * a client with the same id (or no id collision at all) don't step
 * on each other. Each record also carries:
 *
 *   - `label`     — human-readable name for the dashboard panels
 *                   (we don't want to re-fetch the entity just to
 *                   know what to render).
 *   - `userId`    — the user who set the priority. Drives the
 *                   personal-vs-firm split on the dashboard.
 *   - `updatedAt` — ISO timestamp; the panels sort newest first.
 *   - `metadata`  — opaque bag of extra fields specific to the
 *                   entity type (next_court_date for a case,
 *                   outstanding_amount for an invoice, etc.) used
 *                   by the reminder hook and the dashboard cards
 *                   without forcing a full entity lookup.
 *
 * Persisted to localStorage under `ll:priority` so flags survive
 * reloads. When the backend ships, swap the persist layer for a
 * real mutation; the API surface here doesn't change.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Entity types the priority button can target. New types add a
 * single string here plus a render branch in the dashboard cards;
 * the rest of the store stays generic.
 */
export type PriorityEntityType = 'case' | 'client' | 'invoice'

export type PriorityLevel = 'high' | 'medium' | 'low'

/**
 * Reminder lead-time windows per priority level. Tuned to the
 * user's "high = 5 days + 2 days" example. Add more levels here
 * and the reminder loop picks them up without changes elsewhere.
 */
export const REMINDER_DAYS_BEFORE: Record<PriorityLevel, number[]> = {
  high: [5, 2],
  medium: [3],
  low: [1],
}

export interface PriorityRecord {
  entityType: PriorityEntityType
  entityId: string
  level: PriorityLevel
  label: string
  userId: string
  updatedAt: string
  metadata?: Record<string, string | number | null | undefined>
}

/** Compose the storage key from (type, id). */
function keyOf(type: PriorityEntityType, id: string): string {
  return `${type}:${id}`
}

interface PriorityStore {
  /** Map of `entityType:entityId` -> PriorityRecord. */
  records: Record<string, PriorityRecord>
  /**
   * Monotonically-increasing counter bumped on every setter call.
   * Subscribers that derive lists from `records` watch this scalar
   * so they re-render on any change — including same-key level
   * updates — without selecting the full records object (which can
   * have identity churn under SSR/CSR hydration). Not persisted.
   */
  revision: number

  /** Flag (or re-flag) an entity at a level. Overwrites any prior level. */
  setPriority: (
    args: Omit<PriorityRecord, 'updatedAt'> & { updatedAt?: string },
  ) => void
  /** Clear a flag — used by the "No priority" option in the dropdown. */
  clearPriority: (entityType: PriorityEntityType, entityId: string) => void
  /** Read the current level for an entity (`undefined` = unprioritised). */
  getLevel: (
    entityType: PriorityEntityType,
    entityId: string,
  ) => PriorityLevel | undefined
  /** All records for a given user (drives the personal panel). */
  listForUser: (userId: string) => PriorityRecord[]
  /** Every record in the store (drives the firm panel). */
  listAll: () => PriorityRecord[]
  /** Wipe everything — convenience for dev / sign-out. */
  reset: () => void
}

export const usePriorityStore = create<PriorityStore>()(
  persist(
    (set, get) => ({
      records: {},
      revision: 0,

      setPriority: ({
        entityType,
        entityId,
        level,
        label,
        userId,
        metadata,
        updatedAt,
      }) =>
        set((state) => ({
          records: {
            ...state.records,
            [keyOf(entityType, entityId)]: {
              entityType,
              entityId,
              level,
              label,
              userId,
              metadata,
              updatedAt: updatedAt ?? new Date().toISOString(),
            },
          },
          revision: state.revision + 1,
        })),

      clearPriority: (entityType, entityId) =>
        set((state) => {
          const next = { ...state.records }
          delete next[keyOf(entityType, entityId)]
          return { records: next, revision: state.revision + 1 }
        }),

      getLevel: (entityType, entityId) =>
        get().records[keyOf(entityType, entityId)]?.level,

      listForUser: (userId) =>
        Object.values(get().records).filter((r) => r.userId === userId),

      listAll: () => Object.values(get().records),

      reset: () => set({ records: {}, revision: 0 }),
    }),
    {
      name: 'll:priority',
      // Only persist the raw records map; the action functions are
      // re-derived from the factory on every load. `revision` is
      // intentionally omitted so it resets to 0 on reload — that's
      // fine because the panels read records fresh on each render.
      partialize: (state) => ({ records: state.records }),
      // Skip auto-hydration so SSR and the first CSR render both
      // see the same empty initial state. PriorityRemindersBoot
      // calls `usePriorityStore.persist.rehydrate()` explicitly
      // after mount, which avoids React's "getServerSnapshot
      // should be cached" warning from a mid-render SSR-to-CSR
      // state mismatch.
      skipHydration: true,
      // Bump the in-memory `revision` counter after hydration so
      // every subscriber (`PrioritiesPanel` etc.) re-renders with
      // the loaded records. The persisted partial only includes
      // `records`, so without this nudge the revision selector
      // would stay at 0 and the panels would keep rendering empty.
      onRehydrateStorage: () => (state) => {
        if (state) state.revision = state.revision + 1
      },
    },
  ),
)

/**
 * Convenience hook — read the live priority level for an entity.
 * Pure subscription, no setters, so callers can use it in render
 * without triggering renders on unrelated entities' changes.
 *
 * (Today this is just a read; if perf becomes an issue we can
 * swap to selector-based subscriptions on the same store.)
 */
export function usePriorityLevel(
  entityType: PriorityEntityType,
  entityId: string,
): PriorityLevel | undefined {
  return usePriorityStore(
    (s) => s.records[keyOf(entityType, entityId)]?.level,
  )
}
