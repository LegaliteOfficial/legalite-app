/**
 * Expense catalog — local persisted store
 * =======================================
 *
 * What it stores
 * --------------
 * Reusable small-expense templates that lawyers add to bills without
 * retyping. The classic Ghana law office failure mode this fixes:
 * the partner spends 4 hours drafting a will, the firm spends 32
 * pages of A4 + 6 photocopies + a process-server fee + a notary
 * stamp — and none of that lands on the bill because typing each
 * sub-cedi item is more friction than it's worth. A catalog turns
 * "GHS 0.20 per sheet of paper" into a one-click line item.
 *
 * Shape
 * -----
 * Each ExpenseItem is the *template* (not a posted expense):
 *   - `name`          — what the partner sees in the picker.
 *                       "Paper (A4)", "Photocopy", "Court filing fee".
 *   - `unit_price`    — price per unit, in the firm's billing
 *                       currency. We don't store the currency on
 *                       the item — the firm currency is global, so
 *                       changing it re-prices the whole catalog.
 *                       (Legitimate edge case if a firm bills
 *                       different clients in different currencies,
 *                       but that's not the v1 use case.)
 *   - `unit_name`     — singular noun: "page", "copy", "trip",
 *                       "filing", "stamp". The BillComposer line
 *                       item description includes "(N {unit_name})"
 *                       so the client invoice reads clearly.
 *   - `category`      — free-form group label, used to bucket items
 *                       in the picker. Sample categories: Stationery,
 *                       Court costs, Travel, Disbursements.
 *   - `description`   — optional internal note that doesn't go on
 *                       the bill. Helpful when there are two
 *                       similar items ("Photocopy — colour vs B/W").
 *   - `active`        — soft delete. Inactive items don't show in
 *                       the picker but stay in the catalog so old
 *                       posted bills referencing them keep context.
 *
 * Local persistence
 * -----------------
 * Same pattern as the other -local stores: persist with
 * skipHydration, manual rehydrate on first mount. When the backend
 * adds an `expense_catalog` table the read API stays the same and
 * only the writes route through GraphQL mutations.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ExpenseItem {
  id: string
  name: string
  description: string | null
  category: string
  /** Price per unit in the firm's billing currency. */
  unit_price: number
  /** Singular noun — "page", "copy", "trip", "filing", "stamp". */
  unit_name: string
  /** Soft-delete flag — inactive items stay for posted-bill traceability. */
  active: boolean
  created_at: string
  updated_at: string
}

interface ExpenseCatalogStore {
  items: Record<string, ExpenseItem>
  /** Bumps on every write — selector hooks rerender via this scalar. */
  revision: number

  // ── Writes ──────────────────────────────────────────────────────
  /**
   * Insert or update. Pass an existing `id` to update; omit to
   * create. Returns the saved item with its id resolved.
   */
  upsertExpense: (
    input: Omit<ExpenseItem, 'id' | 'created_at' | 'updated_at'> & {
      id?: string
    },
  ) => ExpenseItem
  /** Hard delete — used for clearly-mistaken catalog entries. */
  deleteExpense: (id: string) => void
  /**
   * Soft delete — sets `active=false`. Prefer this over deleteExpense
   * for items the firm has historically used; it keeps the catalog
   * honest about what's been billed before.
   */
  setActive: (id: string, active: boolean) => void
}

// ── Helpers ───────────────────────────────────────────────────────
const newId = (): string =>
  `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

// ── Dev seed ──────────────────────────────────────────────────────
// Six items covering the most common Ghana law-office disbursements
// so the catalog has something to render under DEV_BYPASS. Prices
// are realistic 2026 Accra estimates — partners can edit them.
const DEV_NOW = '2026-05-15T09:00:00Z'
const DEV_SEED_ITEMS: Record<string, ExpenseItem> = {
  'exp-seed-1': {
    id: 'exp-seed-1',
    name: 'Paper (A4)',
    description: 'Standard 80gsm A4 sheet — drafts, briefs, file copies.',
    category: 'Stationery',
    unit_price: 0.2,
    unit_name: 'page',
    active: true,
    created_at: DEV_NOW,
    updated_at: DEV_NOW,
  },
  'exp-seed-2': {
    id: 'exp-seed-2',
    name: 'Photocopy (B/W)',
    description: 'Black-and-white photocopy for client + court bundles.',
    category: 'Stationery',
    unit_price: 0.5,
    unit_name: 'copy',
    active: true,
    created_at: DEV_NOW,
    updated_at: DEV_NOW,
  },
  'exp-seed-3': {
    id: 'exp-seed-3',
    name: 'Photocopy (colour)',
    description: 'Colour photocopy — exhibits, contracts with logos.',
    category: 'Stationery',
    unit_price: 2.0,
    unit_name: 'copy',
    active: true,
    created_at: DEV_NOW,
    updated_at: DEV_NOW,
  },
  'exp-seed-4': {
    id: 'exp-seed-4',
    name: 'Court filing fee',
    description: 'High Court / Court of Appeal filing fee per document.',
    category: 'Court costs',
    unit_price: 250,
    unit_name: 'filing',
    active: true,
    created_at: DEV_NOW,
    updated_at: DEV_NOW,
  },
  'exp-seed-5': {
    id: 'exp-seed-5',
    name: 'Process server fee',
    description: 'Process server appearance fee, per writ served.',
    category: 'Court costs',
    unit_price: 80,
    unit_name: 'service',
    active: true,
    created_at: DEV_NOW,
    updated_at: DEV_NOW,
  },
  'exp-seed-6': {
    id: 'exp-seed-6',
    name: 'Transport (in-town)',
    description: 'Taxi / ride-hail trip within Accra for court runs.',
    category: 'Travel',
    unit_price: 35,
    unit_name: 'trip',
    active: true,
    created_at: DEV_NOW,
    updated_at: DEV_NOW,
  },
}

export const useExpenseCatalogStore = create<ExpenseCatalogStore>()(
  persist(
    (set) => ({
      items: DEV_SEED_ITEMS,
      revision: 0,

      upsertExpense: (input) => {
        const now = new Date().toISOString()
        const id = input.id ?? newId()
        let saved: ExpenseItem | null = null
        set((prev) => {
          const existing = prev.items[id]
          const next: ExpenseItem = {
            ...input,
            id,
            created_at: existing?.created_at ?? now,
            updated_at: now,
          }
          saved = next
          return {
            items: { ...prev.items, [id]: next },
            revision: prev.revision + 1,
          }
        })
        // saved is set synchronously inside the set callback above.
        return saved!
      },

      deleteExpense: (id) =>
        set((prev) => {
          if (!(id in prev.items)) return prev
          const { [id]: _drop, ...rest } = prev.items
          void _drop
          return { items: rest, revision: prev.revision + 1 }
        }),

      setActive: (id, active) =>
        set((prev) => {
          const existing = prev.items[id]
          if (!existing) return prev
          return {
            items: {
              ...prev.items,
              [id]: {
                ...existing,
                active,
                updated_at: new Date().toISOString(),
              },
            },
            revision: prev.revision + 1,
          }
        }),
    }),
    {
      name: 'll:expense-catalog',
      partialize: (state) => ({ items: state.items }),
      skipHydration: true,
    },
  ),
)

// ── Selectors ─────────────────────────────────────────────────────

/** All active items sorted by category then name — drives the picker. */
export function listActiveExpenses(): ExpenseItem[] {
  return Object.values(useExpenseCatalogStore.getState().items)
    .filter((e) => e.active)
    .sort((a, b) => {
      const byCat = a.category.localeCompare(b.category)
      return byCat !== 0 ? byCat : a.name.localeCompare(b.name)
    })
}

/** All items (active + inactive) — drives the management dialog. */
export function listAllExpenses(): ExpenseItem[] {
  return Object.values(useExpenseCatalogStore.getState().items).sort(
    (a, b) => {
      const byCat = a.category.localeCompare(b.category)
      return byCat !== 0 ? byCat : a.name.localeCompare(b.name)
    },
  )
}

/** Unique category labels — used by the manage dialog's category picker. */
export function listExpenseCategories(): string[] {
  const set = new Set<string>()
  for (const e of Object.values(useExpenseCatalogStore.getState().items)) {
    set.add(e.category)
  }
  return Array.from(set).sort()
}
