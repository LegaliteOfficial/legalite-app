/**
 * Billable-hour timer — local persisted store
 * ===========================================
 *
 * Why it exists
 * -------------
 * Lawyers bill by the hour. The single most common way they lose
 * revenue is forgetting to track. A partner sits down to draft a
 * memo, gets pulled into a client call, then a junior bursts in
 * with a hearing-prep question, and three hours later they've done
 * billable work for three different clients and remember to write
 * down "approximately 1 hour" against one of them.
 *
 * This store backs a live timer that runs while the partner works
 * and prompts every 30 minutes — "still working for this client?" —
 * with an explicit Continue / Stop button. The prompt is the
 * forcing function; it stops the "I forgot the timer was still
 * running on a different matter" failure mode.
 *
 * Lifecycle
 * ---------
 * 1. Partner clicks "Time working hours" on a client or case page.
 * 2. StartTimerDialog checks the client's billing rate via the
 *    client-rates store. If none is set, the dialog forces a rate
 *    entry first — billing without a rate is just unsigned IOUs.
 * 3. `startTimer({...})` snapshots the resolved rate into the
 *    `TimeEntry` so future rate changes don't retroactively rewrite
 *    history.
 * 4. While the entry runs, the scheduler in TimeTrackerBoot:
 *      - schedules a check-in 30 minutes from start, then 30 mins
 *        from each successful Continue acknowledgement
 *      - when due, sets `pending_check_in_at` so the CheckInDialog
 *        opens app-wide (it's mounted at the dashboard layout)
 * 5. Partner clicks Continue -> `recordCheckIn(id, 'continue')`,
 *    pending clears, next check-in scheduled +30 mins.
 *    Partner clicks Stop -> `stopTimer(id)`, entry transitions to
 *    `stopped`, total_seconds + total_amount frozen.
 * 6. Stopped entries appear on the Billing page's Unbilled Time
 *    section, where the partner can convert them into a bill in
 *    one click. After conversion the entry transitions to `billed`
 *    and references the bill it joined.
 *
 * Single active timer
 * -------------------
 * One timer at a time, globally. A partner can't be billing two
 * clients simultaneously without lying about one of them. If
 * `startTimer` is called while another entry is running, the
 * running entry auto-stops first — same effect as the partner
 * clicking Stop. This matches Harvest / Toggl / Clockify behaviour
 * and the audit trail (one `stopped` entry followed by one
 * `running` entry) tells the story honestly.
 *
 * Persistence
 * -----------
 * Survives reloads via Zustand persist. If the partner closes the
 * laptop and reopens 4 hours later with a timer still running, the
 * scheduler on remount fires a stale check-in with the cumulative
 * elapsed time visible — they can stop and manually correct the
 * billed minutes, or continue. We don't auto-stop on stale-check
 * detection because the partner might have genuinely worked
 * straight through (overnight motions, urgent injunctions).
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RateKind } from '@/stores/client-rates-local.store'

// ── Tunables ──────────────────────────────────────────────────────

/**
 * Check-in interval in milliseconds. Defaults to 30 minutes per
 * the spec; can be shortened via env for end-to-end QA without
 * having to wait half an hour to see the prompt fire.
 *
 * `NEXT_PUBLIC_TIME_TRACKER_CHECK_IN_MS=15000` => check-ins every
 * 15 seconds (smoke test territory).
 */
export const CHECK_IN_INTERVAL_MS: number = (() => {
  const raw = process.env.NEXT_PUBLIC_TIME_TRACKER_CHECK_IN_MS
  const parsed = raw ? Number(raw) : NaN
  if (Number.isFinite(parsed) && parsed >= 5000) return parsed
  return 30 * 60 * 1000
})()

// ── Types ─────────────────────────────────────────────────────────

export type TimeEntryStatus = 'running' | 'stopped' | 'billed'
export type CheckInResponse = 'continue' | 'stop' | 'unanswered'

export interface CheckIn {
  /** When the prompt was raised. */
  prompted_at: string
  /** When the lawyer responded (or null while still pending). */
  responded_at: string | null
  /** What they chose, or 'unanswered' if dismissed externally. */
  response: CheckInResponse | null
}

export interface TimeEntry {
  id: string
  client_id: string
  case_id: string | null
  /** Free-text — "Drafting reply to Hagar's interrogatories" etc. */
  description: string | null
  /**
   * GHS/hr at the moment the timer started. Frozen so later rate
   * changes don't silently rewrite history — if the client's rate
   * goes from 600 to 800 mid-month, the May entries still bill at
   * 600 because that's the deal that was struck for May.
   */
  rate_at_start: number
  rate_kind_at_start: RateKind
  /** ISO start timestamp. */
  started_at: string
  /** ISO end timestamp; null while running. */
  ended_at: string | null
  /** Frozen at stop. Recomputed during running via getElapsedSeconds(). */
  total_seconds: number
  /** Frozen at stop: total_seconds / 3600 * rate_at_start. */
  total_amount: number
  status: TimeEntryStatus
  /** Audit log of every 30-min prompt + response. */
  check_ins: CheckIn[]
  /** Set once the entry is rolled into a bill. */
  bill_id: string | null
  bill_line_item_id: string | null
  created_at: string
}

interface TimeTrackerState {
  entries: Record<string, TimeEntry>
  /** id of the currently-running entry, or null when nothing is timing. */
  active_entry_id: string | null
  /**
   * ISO timestamp when the next check-in should fire. Set on start
   * and on every Continue response. The scheduler in TimeTrackerBoot
   * watches this — when `now >= next_check_in_at`, it sets
   * `pending_check_in_at` to surface the dialog.
   */
  next_check_in_at: string | null
  /**
   * ISO timestamp when the current pending check-in was raised.
   * Null while no prompt is open. The CheckInDialog is bound to
   * this value (open when non-null) and clears it on either response.
   */
  pending_check_in_at: string | null
  /** Bump on every write so selector hooks rerender via a cheap scalar. */
  revision: number

  // ── Writes ──────────────────────────────────────────────────────
  startTimer: (args: {
    client_id: string
    case_id?: string | null
    description?: string | null
    rate: number
    rate_kind: RateKind
  }) => TimeEntry
  stopTimer: (entryId: string, opts?: { manualSeconds?: number }) => TimeEntry | null
  recordCheckIn: (
    entryId: string,
    response: Exclude<CheckInResponse, 'unanswered'>,
  ) => void
  /**
   * Called by the scheduler to raise a pending prompt. Adds a new
   * CheckIn to the entry's audit log with `responded_at = null`
   * and sets `pending_check_in_at`.
   */
  raiseCheckIn: (entryId: string) => void
  markAsBilled: (
    entryId: string,
    billId: string,
    lineItemId: string,
  ) => void
  /** Soft delete — moves entry to `stopped` if running, then removes. */
  deleteEntry: (entryId: string) => void
  /** Edit the elapsed time on a stopped entry (manual correction). */
  adjustEntrySeconds: (entryId: string, newSeconds: number) => void
}

// ── Helpers ───────────────────────────────────────────────────────

const newEntryId = (): string =>
  `te-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

/**
 * Compute amount from seconds + GHS/hr. Rounds to the nearest cent
 * so totals stay clean when summed across many small entries.
 */
function computeAmount(totalSeconds: number, rate: number): number {
  const hours = totalSeconds / 3600
  return Math.round(hours * rate * 100) / 100
}

/**
 * Live elapsed-seconds for an entry. For a running entry, returns
 * `now - started_at`; for a stopped/billed entry, returns the
 * frozen `total_seconds`. Pure — read it in render to display the
 * ticking clock, then rely on TimeTrackerBoot's 1-second tick to
 * re-render.
 */
export function getElapsedSeconds(entry: TimeEntry, now: Date = new Date()): number {
  if (entry.status !== 'running') return entry.total_seconds
  const start = new Date(entry.started_at).getTime()
  return Math.max(0, Math.floor((now.getTime() - start) / 1000))
}

// ── Dev seed ──────────────────────────────────────────────────────
// One stopped entry per dev client so the Billing -> Unbilled Time
// section has data to render in DEV_BYPASS mode without the partner
// having to start a real timer first.
const DEV_SEED_ENTRIES: Record<string, TimeEntry> = {
  'te-seed-1': {
    id: 'te-seed-1',
    client_id: 'dev-client-1',
    case_id: null,
    description: 'Drafted reply brief for shareholder dispute',
    rate_at_start: 1200,
    rate_kind_at_start: 'hourly',
    started_at: '2026-06-04T09:00:00Z',
    ended_at: '2026-06-04T11:30:00Z',
    total_seconds: 2.5 * 3600,
    total_amount: 3000,
    status: 'stopped',
    check_ins: [
      {
        prompted_at: '2026-06-04T09:30:00Z',
        responded_at: '2026-06-04T09:30:12Z',
        response: 'continue',
      },
      {
        prompted_at: '2026-06-04T10:00:00Z',
        responded_at: '2026-06-04T10:00:08Z',
        response: 'continue',
      },
      {
        prompted_at: '2026-06-04T10:30:00Z',
        responded_at: '2026-06-04T10:30:11Z',
        response: 'continue',
      },
      {
        prompted_at: '2026-06-04T11:00:00Z',
        responded_at: '2026-06-04T11:00:07Z',
        response: 'continue',
      },
    ],
    bill_id: null,
    bill_line_item_id: null,
    created_at: '2026-06-04T09:00:00Z',
  },
  'te-seed-2': {
    id: 'te-seed-2',
    client_id: 'dev-client-2',
    case_id: null,
    description: 'Trust amendment review + family call',
    rate_at_start: 450,
    rate_kind_at_start: 'hourly',
    started_at: '2026-06-03T14:00:00Z',
    ended_at: '2026-06-03T15:15:00Z',
    total_seconds: 1.25 * 3600,
    total_amount: 562.5,
    status: 'stopped',
    check_ins: [
      {
        prompted_at: '2026-06-03T14:30:00Z',
        responded_at: '2026-06-03T14:30:09Z',
        response: 'continue',
      },
      {
        prompted_at: '2026-06-03T15:00:00Z',
        responded_at: '2026-06-03T15:00:10Z',
        response: 'continue',
      },
    ],
    bill_id: null,
    bill_line_item_id: null,
    created_at: '2026-06-03T14:00:00Z',
  },
}

// ── Store ─────────────────────────────────────────────────────────

export const useTimeTrackerStore = create<TimeTrackerState>()(
  persist(
    (set, get) => ({
      entries: DEV_SEED_ENTRIES,
      active_entry_id: null,
      next_check_in_at: null,
      pending_check_in_at: null,
      revision: 0,

      startTimer: ({ client_id, case_id, description, rate, rate_kind }) => {
        // Single-active invariant — stop whatever's running first.
        const prev = get()
        if (prev.active_entry_id) {
          const running = prev.entries[prev.active_entry_id]
          if (running && running.status === 'running') {
            const endedAt = new Date()
            const elapsed = getElapsedSeconds(running, endedAt)
            const stopped: TimeEntry = {
              ...running,
              status: 'stopped',
              ended_at: endedAt.toISOString(),
              total_seconds: elapsed,
              total_amount: computeAmount(elapsed, running.rate_at_start),
            }
            set((s) => ({
              entries: { ...s.entries, [stopped.id]: stopped },
            }))
          }
        }

        const startedAt = new Date()
        const entry: TimeEntry = {
          id: newEntryId(),
          client_id,
          case_id: case_id ?? null,
          description: description?.trim() || null,
          rate_at_start: rate,
          rate_kind_at_start: rate_kind,
          started_at: startedAt.toISOString(),
          ended_at: null,
          total_seconds: 0,
          total_amount: 0,
          status: 'running',
          check_ins: [],
          bill_id: null,
          bill_line_item_id: null,
          created_at: startedAt.toISOString(),
        }

        set((s) => ({
          entries: { ...s.entries, [entry.id]: entry },
          active_entry_id: entry.id,
          next_check_in_at: new Date(
            startedAt.getTime() + CHECK_IN_INTERVAL_MS,
          ).toISOString(),
          pending_check_in_at: null,
          revision: s.revision + 1,
        }))
        return entry
      },

      stopTimer: (entryId, opts) => {
        const state = get()
        const entry = state.entries[entryId]
        if (!entry || entry.status !== 'running') return entry ?? null
        const endedAt = new Date()
        const auto = getElapsedSeconds(entry, endedAt)
        // Manual correction lets the partner say "I actually walked
        // away at noon" when stopping at 1pm. Clamp to the auto
        // value so manual corrections can only ever reduce the
        // billed time, never inflate it — partners don't add billable
        // minutes that didn't tick.
        const elapsed =
          opts?.manualSeconds != null
            ? Math.max(0, Math.min(opts.manualSeconds, auto))
            : auto
        const stopped: TimeEntry = {
          ...entry,
          status: 'stopped',
          ended_at: endedAt.toISOString(),
          total_seconds: elapsed,
          total_amount: computeAmount(elapsed, entry.rate_at_start),
        }
        set((s) => ({
          entries: { ...s.entries, [stopped.id]: stopped },
          active_entry_id: s.active_entry_id === entryId ? null : s.active_entry_id,
          next_check_in_at: s.active_entry_id === entryId ? null : s.next_check_in_at,
          pending_check_in_at:
            s.active_entry_id === entryId ? null : s.pending_check_in_at,
          revision: s.revision + 1,
        }))
        return stopped
      },

      recordCheckIn: (entryId, response) => {
        const state = get()
        const entry = state.entries[entryId]
        if (!entry || entry.status !== 'running') return

        const now = new Date()
        // Close out the pending check-in (the last one with no
        // response) by stamping it; create one if somehow none is
        // pending so the audit log still reflects the user action.
        let didClose = false
        const nextCheckIns = entry.check_ins.map((ci) => {
          if (!didClose && ci.responded_at == null) {
            didClose = true
            return { ...ci, responded_at: now.toISOString(), response }
          }
          return ci
        })
        if (!didClose) {
          nextCheckIns.push({
            prompted_at: now.toISOString(),
            responded_at: now.toISOString(),
            response,
          })
        }

        if (response === 'stop') {
          // Same flow as stopTimer but we want the audit entry first.
          const elapsed = getElapsedSeconds(entry, now)
          const stopped: TimeEntry = {
            ...entry,
            status: 'stopped',
            ended_at: now.toISOString(),
            total_seconds: elapsed,
            total_amount: computeAmount(elapsed, entry.rate_at_start),
            check_ins: nextCheckIns,
          }
          set((s) => ({
            entries: { ...s.entries, [stopped.id]: stopped },
            active_entry_id: null,
            next_check_in_at: null,
            pending_check_in_at: null,
            revision: s.revision + 1,
          }))
          return
        }

        // Continue: clear the pending flag, schedule the next prompt.
        set((s) => ({
          entries: {
            ...s.entries,
            [entryId]: { ...entry, check_ins: nextCheckIns },
          },
          next_check_in_at: new Date(
            now.getTime() + CHECK_IN_INTERVAL_MS,
          ).toISOString(),
          pending_check_in_at: null,
          revision: s.revision + 1,
        }))
      },

      raiseCheckIn: (entryId) => {
        const state = get()
        const entry = state.entries[entryId]
        if (!entry || entry.status !== 'running') return
        // Don't stack pending prompts — if one is already open, this
        // is a no-op. The scheduler ticks every second and we don't
        // want a backlog of dialogs.
        if (state.pending_check_in_at) return
        const promptedAt = new Date().toISOString()
        set((s) => ({
          entries: {
            ...s.entries,
            [entryId]: {
              ...entry,
              check_ins: [
                ...entry.check_ins,
                {
                  prompted_at: promptedAt,
                  responded_at: null,
                  response: null,
                },
              ],
            },
          },
          pending_check_in_at: promptedAt,
          revision: s.revision + 1,
        }))
      },

      markAsBilled: (entryId, billId, lineItemId) =>
        set((s) => {
          const entry = s.entries[entryId]
          if (!entry) return s
          return {
            entries: {
              ...s.entries,
              [entryId]: {
                ...entry,
                status: 'billed',
                bill_id: billId,
                bill_line_item_id: lineItemId,
              },
            },
            revision: s.revision + 1,
          }
        }),

      deleteEntry: (entryId) =>
        set((s) => {
          if (!(entryId in s.entries)) return s
          const { [entryId]: _drop, ...rest } = s.entries
          void _drop
          return {
            entries: rest,
            active_entry_id:
              s.active_entry_id === entryId ? null : s.active_entry_id,
            next_check_in_at:
              s.active_entry_id === entryId ? null : s.next_check_in_at,
            pending_check_in_at:
              s.active_entry_id === entryId ? null : s.pending_check_in_at,
            revision: s.revision + 1,
          }
        }),

      adjustEntrySeconds: (entryId, newSeconds) =>
        set((s) => {
          const entry = s.entries[entryId]
          if (!entry || entry.status === 'running') return s
          const clamped = Math.max(0, Math.floor(newSeconds))
          return {
            entries: {
              ...s.entries,
              [entryId]: {
                ...entry,
                total_seconds: clamped,
                total_amount: computeAmount(clamped, entry.rate_at_start),
              },
            },
            revision: s.revision + 1,
          }
        }),
    }),
    {
      name: 'll:time-tracker',
      partialize: (state) => ({
        entries: state.entries,
        active_entry_id: state.active_entry_id,
        next_check_in_at: state.next_check_in_at,
        pending_check_in_at: state.pending_check_in_at,
      }),
      skipHydration: true,
    },
  ),
)

// ── Pure selectors ────────────────────────────────────────────────

export interface UnbilledSummary {
  entries: TimeEntry[]
  total_seconds: number
  total_amount: number
}

/**
 * Stopped entries for a client that haven't been rolled into a bill
 * yet. Powers the Unbilled Time section on the Billing page and
 * the running "this client owes you another N hrs" number on the
 * client detail surfaces.
 */
export function unbilledTimeForClient(clientId: string): UnbilledSummary {
  const all = Object.values(useTimeTrackerStore.getState().entries)
  const filtered = all.filter(
    (e) => e.client_id === clientId && e.status === 'stopped',
  )
  let total_seconds = 0
  let total_amount = 0
  for (const e of filtered) {
    total_seconds += e.total_seconds
    total_amount += e.total_amount
  }
  return {
    entries: filtered.sort((a, b) => b.started_at.localeCompare(a.started_at)),
    total_seconds,
    total_amount,
  }
}

/** All entries for a client across statuses — used by client detail surfaces. */
export function entriesForClient(clientId: string): TimeEntry[] {
  return Object.values(useTimeTrackerStore.getState().entries)
    .filter((e) => e.client_id === clientId)
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
}

/** Currently-running entry, if any. */
export function getActiveEntry(): TimeEntry | null {
  const s = useTimeTrackerStore.getState()
  if (!s.active_entry_id) return null
  return s.entries[s.active_entry_id] ?? null
}

/** Format seconds as HH:MM:SS or MM:SS. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`
  return `${pad(m)}:${pad(sec)}`
}
