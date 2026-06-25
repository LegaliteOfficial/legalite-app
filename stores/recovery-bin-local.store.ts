/**
 * Recovery bin — local persisted store
 * ====================================
 *
 * What it stores
 * --------------
 * Recently deleted records the firm can still get back: cases,
 * clients, tasks, and documents. Deleting from those screens is meant
 * to feel safe — the record drops out of the working view but lands
 * here for a retention window before it's gone for good. A partner who
 * archives the wrong matter on a Friday has until the window closes to
 * undo it without calling support.
 *
 * Shape
 * -----
 * Each DeletedItem is a lightweight tombstone — enough to identify the
 * record and put it back, not the full record:
 *   - `kind`       — which screen it came from: case / client / task /
 *                    document. Drives the type filter and restore route.
 *   - `title`      — the record's display name.
 *   - `subtitle`   — one line of context (client name, file type, the
 *                    case a task belonged to) so two same-named items
 *                    are still tellable apart.
 *   - `deletedAt`  — when it was deleted; drives the expiry countdown.
 *   - `deletedBy`  — who deleted it, for the audit-minded.
 *
 * Retention
 * ---------
 * Items older than RETENTION_DAYS are treated as expired: they stop
 * showing and `purgeExpired` clears them out. The countdown shown in
 * the UI is derived, never stored, so it stays correct across reloads.
 *
 * Local persistence
 * -----------------
 * Same pattern as the other -local stores: persist with
 * skipHydration, manual rehydrate on first mount. When the backend
 * adds a `deleted_records` table the read API stays the same; the real
 * delete flows route their tombstone through `recordDeletion`, and
 * restore/purge become GraphQL mutations.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DeletedKind = 'case' | 'client' | 'task' | 'document'

/** Days a deleted item is kept before it's permanently purged. */
export const RETENTION_DAYS = 30

export interface DeletedItem {
  id: string
  kind: DeletedKind
  title: string
  subtitle: string | null
  deletedAt: string
  deletedBy: string
}

interface RecoveryBinStore {
  items: Record<string, DeletedItem>
  /** Bumps on every write — selector hooks rerender via this scalar. */
  revision: number

  /** Push a tombstone into the bin when a record is deleted. */
  recordDeletion: (input: Omit<DeletedItem, 'deletedAt'> & {
    deletedAt?: string
  }) => DeletedItem
  /** Take an item out of the bin (caller re-creates the real record). */
  restoreItem: (id: string) => DeletedItem | null
  /** Permanently remove one item. */
  purgeItem: (id: string) => void
  /** Empty the bin entirely. */
  purgeAll: () => void
  /** Drop everything past the retention window. */
  purgeExpired: () => void
}

// ── Helpers ───────────────────────────────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000

const isExpired = (item: DeletedItem): boolean =>
  Date.now() - new Date(item.deletedAt).getTime() > RETENTION_DAYS * DAY_MS

/** Whole days left before an item is auto-purged (0 once expired). */
export function daysLeft(item: DeletedItem): number {
  const elapsed = Date.now() - new Date(item.deletedAt).getTime()
  return Math.max(0, RETENTION_DAYS - Math.floor(elapsed / DAY_MS))
}

// ── Dev seed ──────────────────────────────────────────────────────
// A spread of deleted records with staggered dates so the expiry
// countdown shows a range (fresh, mid-window, about to lapse) under
// DEV_BYPASS. Dates are relative to "now" so the demo never goes stale.
const daysAgo = (n: number): string =>
  new Date(Date.now() - n * DAY_MS).toISOString()

const DEV_SEED_ITEMS: Record<string, DeletedItem> = {
  'del-seed-1': {
    id: 'del-seed-1',
    kind: 'case',
    title: 'Mensah v. Adjei — Land dispute',
    subtitle: 'Client: Kwame Mensah',
    deletedAt: daysAgo(1),
    deletedBy: 'Ama Owusu',
  },
  'del-seed-2': {
    id: 'del-seed-2',
    kind: 'client',
    title: 'Golden Tulip Hotels Ltd',
    subtitle: 'Corporate client — 3 open matters',
    deletedAt: daysAgo(3),
    deletedBy: 'Kofi Dell',
  },
  'del-seed-3': {
    id: 'del-seed-3',
    kind: 'task',
    title: 'File defence at High Court registry',
    subtitle: 'Case: Republic v. Asante',
    deletedAt: daysAgo(6),
    deletedBy: 'Ama Owusu',
  },
  'del-seed-4': {
    id: 'del-seed-4',
    kind: 'document',
    title: 'Tenancy agreement (draft v2).docx',
    subtitle: 'Word document — 48 KB',
    deletedAt: daysAgo(12),
    deletedBy: 'Yaw Boateng',
  },
  'del-seed-5': {
    id: 'del-seed-5',
    kind: 'document',
    title: 'Witness statement — E. Tetteh.pdf',
    subtitle: 'PDF — 220 KB',
    deletedAt: daysAgo(27),
    deletedBy: 'Kofi Dell',
  },
}

export const useRecoveryBinStore = create<RecoveryBinStore>()(
  persist(
    (set, get) => ({
      items: DEV_SEED_ITEMS,
      revision: 0,

      recordDeletion: (input) => {
        const item: DeletedItem = {
          ...input,
          deletedAt: input.deletedAt ?? new Date().toISOString(),
        }
        set((prev) => ({
          items: { ...prev.items, [item.id]: item },
          revision: prev.revision + 1,
        }))
        return item
      },

      restoreItem: (id) => {
        const item = get().items[id] ?? null
        if (!item) return null
        set((prev) => {
          const { [id]: _drop, ...rest } = prev.items
          void _drop
          return { items: rest, revision: prev.revision + 1 }
        })
        return item
      },

      purgeItem: (id) =>
        set((prev) => {
          if (!(id in prev.items)) return prev
          const { [id]: _drop, ...rest } = prev.items
          void _drop
          return { items: rest, revision: prev.revision + 1 }
        }),

      purgeAll: () => set({ items: {}, revision: get().revision + 1 }),

      purgeExpired: () =>
        set((prev) => {
          const kept: Record<string, DeletedItem> = {}
          let changed = false
          for (const [id, item] of Object.entries(prev.items)) {
            if (isExpired(item)) changed = true
            else kept[id] = item
          }
          return changed
            ? { items: kept, revision: prev.revision + 1 }
            : prev
        }),
    }),
    {
      name: 'll:recovery-bin',
      partialize: (state) => ({ items: state.items }),
      skipHydration: true,
    },
  ),
)

// ── Selectors ─────────────────────────────────────────────────────

/** Non-expired items, most recently deleted first. */
export function listRecoverableItems(): DeletedItem[] {
  return Object.values(useRecoveryBinStore.getState().items)
    .filter((it) => !isExpired(it))
    .sort(
      (a, b) =>
        new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
    )
}
