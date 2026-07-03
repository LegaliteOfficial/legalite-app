/**
 * Performance — local persisted store
 * ===================================
 *
 * Captures the firm-performance signals the system can't infer on its
 * own: case outcomes (won / lost) and client movement (acquired /
 * lost), each attributed to a worker and stamped with a date. The
 * Performance page aggregates these per person and firm-wide over any
 * date range.
 *
 * Revenue and hours are deliberately NOT here — those are pulled from
 * billing and the time tracker once wired. This store owns only the
 * manually-recorded outcomes plus the roster they're attributed to.
 *
 * Local persistence mirrors the other -local stores (skipHydration +
 * manual rehydrate); writes route through a backend mutation later
 * without changing the read shape.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OutcomeType =
  | 'case_won'
  | 'case_lost'
  | 'client_acquired'
  | 'client_lost'
  // An important task an admin chose to credit toward performance.
  | 'key_task'

/** A measurable worker — lawyer, associate, paralegal, etc. */
export interface Worker {
  id: string
  name: string
  title: string
}

export interface OutcomeRecord {
  id: string
  workerId: string
  type: OutcomeType
  /** ISO date the outcome occurred — drives the period filter. */
  date: string
  /** The case, client, or task the outcome relates to. */
  label: string
  /** For `key_task`, the source task id it was added from (if any). */
  taskId?: string
  note: string
  created_at: string
}

interface PerformanceStore {
  workers: Record<string, Worker>
  outcomes: Record<string, OutcomeRecord>
  revision: number
  addOutcome: (
    input: Omit<OutcomeRecord, 'id' | 'created_at'>,
  ) => OutcomeRecord
  deleteOutcome: (id: string) => void
}

const newId = (): string =>
  `oc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

// ── Dev seed ──────────────────────────────────────────────────────
// A small Accra-firm roster plus a spread of outcomes across the last
// ~14 months so quarter / year / rolling filters all show variation.
const WORKERS: Record<string, Worker> = {
  'w-efua': { id: 'w-efua', name: 'Efua Mensah', title: 'Managing Partner' },
  'w-kofi': { id: 'w-kofi', name: 'Kofi Dell', title: 'Partner' },
  'w-ama': { id: 'w-ama', name: 'Ama Owusu', title: 'Senior Associate' },
  'w-yaw': { id: 'w-yaw', name: 'Yaw Boateng', title: 'Associate' },
  'w-adwoa': { id: 'w-adwoa', name: 'Adwoa Sarpong', title: 'Paralegal' },
}

const seed = (
  worker: string,
  type: OutcomeType,
  date: string,
  label: string,
  note = '',
): [string, OutcomeRecord] => {
  const id = `seed-${worker}-${type}-${date}`
  return [
    id,
    { id, workerId: worker, type, date: `${date}T09:00:00Z`, label, note, created_at: `${date}T09:00:00Z` },
  ]
}

const OUTCOMES: Record<string, OutcomeRecord> = Object.fromEntries([
  // 2025 (for year / rolling-12 filters)
  seed('w-kofi', 'case_won', '2025-09-12', 'Adjei v. GCB Bank'),
  seed('w-ama', 'client_acquired', '2025-10-03', 'Golden Tulip Hotels Ltd'),
  seed('w-yaw', 'case_lost', '2025-11-20', 'Republic v. Tetteh'),
  seed('w-efua', 'case_won', '2025-12-08', 'Sarkodie Estate probate'),
  // Q1 2026
  seed('w-efua', 'case_won', '2026-01-19', 'Mensah Holdings merger'),
  seed('w-kofi', 'case_won', '2026-01-28', 'Boateng land title'),
  seed('w-ama', 'client_acquired', '2026-02-05', 'Ridge Pharmaceuticals'),
  seed('w-yaw', 'case_won', '2026-02-22', 'Owusu tenancy dispute'),
  seed('w-kofi', 'case_lost', '2026-03-04', 'Asante v. SSNIT'),
  seed('w-ama', 'case_won', '2026-03-18', 'Quartey contract claim'),
  seed('w-efua', 'client_acquired', '2026-03-29', 'Volta River Authority'),
  // Q2 2026
  seed('w-ama', 'case_won', '2026-04-11', 'Darko shareholder action'),
  seed('w-kofi', 'client_acquired', '2026-04-23', 'Accra Brewery PLC'),
  seed('w-yaw', 'case_lost', '2026-05-09', 'Nkrumah defamation'),
  seed('w-efua', 'case_won', '2026-05-21', 'Tema Port concession'),
  seed('w-ama', 'case_won', '2026-06-02', 'Appiah injunction'),
  seed('w-kofi', 'client_lost', '2026-06-10', 'Standard Foods Ltd', 'Moved in-house'),
  seed('w-adwoa', 'client_acquired', '2026-06-15', 'Kotoka Logistics'),
  // Admin-credited key tasks
  seed('w-adwoa', 'key_task', '2026-05-16', 'File AccraTech disclosure schedule'),
  seed('w-ama', 'key_task', '2026-06-04', 'Issue May invoices to all retainer clients'),
])

export const usePerformanceStore = create<PerformanceStore>()(
  persist(
    (set) => ({
      workers: WORKERS,
      outcomes: OUTCOMES,
      revision: 0,
      addOutcome: (input) => {
        const id = newId()
        const record: OutcomeRecord = {
          ...input,
          id,
          created_at: new Date().toISOString(),
        }
        set((prev) => ({
          outcomes: { ...prev.outcomes, [id]: record },
          revision: prev.revision + 1,
        }))
        return record
      },
      deleteOutcome: (id) =>
        set((prev) => {
          if (!(id in prev.outcomes)) return prev
          const { [id]: _drop, ...rest } = prev.outcomes
          void _drop
          return { outcomes: rest, revision: prev.revision + 1 }
        }),
    }),
    {
      name: 'll:performance',
      // Roster is seeded config; only the recorded outcomes are user data.
      partialize: (state) => ({ outcomes: state.outcomes }),
      skipHydration: true,
    },
  ),
)

// ── Selectors ─────────────────────────────────────────────────────

export function listWorkers(): Worker[] {
  return Object.values(usePerformanceStore.getState().workers).sort((a, b) =>
    a.name.localeCompare(b.name),
  )
}

export function listOutcomes(): OutcomeRecord[] {
  return Object.values(usePerformanceStore.getState().outcomes)
}
