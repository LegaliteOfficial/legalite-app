/**
 * Tasks-local store
 * -----------------
 * Persisted (localStorage) source-of-truth for the Tasks page while
 * the backend's task table is still skinny. Holds task records,
 * the firm's shared label palette, and a "seen reminders" set used
 * by the task reminder hook for dedup.
 *
 * When the backend ships:
 *   - `tasks`  becomes a cache of the server's response, the
 *     mutations call the GraphQL CreateTask / UpdateTask / DeleteTask,
 *     and `persist` is dropped.
 *   - `labelPalette` may stay client-only (per-user UI preference)
 *     or move to a firm-settings table.
 *   - `seenReminders` stays client-only — it's pure UX bookkeeping
 *     that doesn't need to round-trip.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ──────────────────────────────────────────────────────────────

export type TaskStatus = 'Pending' | 'In Progress' | 'Done'
export type TaskPriority = 'High' | 'Medium' | 'Low'

/**
 * Lead-time offsets the reminder hook understands. `null` means
 * "no reminder configured" — the task still shows on the board,
 * we just don't toast for it.
 */
export type ReminderOffsetKey = 'none' | '15m' | '1h' | '1d' | '3d'

export const REMINDER_OFFSET_OPTIONS: {
  key: ReminderOffsetKey
  label: string
  minutes: number | null
}[] = [
  { key: 'none', label: 'No reminder', minutes: null },
  { key: '15m', label: '15 minutes before', minutes: 15 },
  { key: '1h', label: '1 hour before', minutes: 60 },
  { key: '1d', label: '1 day before', minutes: 24 * 60 },
  { key: '3d', label: '3 days before', minutes: 3 * 24 * 60 },
]

/** Map from key → minutes for fast lookup during the reminder scan. */
export const REMINDER_OFFSET_MINUTES: Record<ReminderOffsetKey, number | null> =
  REMINDER_OFFSET_OPTIONS.reduce(
    (acc, opt) => ({ ...acc, [opt.key]: opt.minutes }),
    {} as Record<ReminderOffsetKey, number | null>,
  )

/**
 * A user-defined label. Colour is one of a fixed-but-extensible set
 * so the chip palette stays tasteful. New labels created via the
 * composer pick a deterministic colour based on a hash of their
 * name — that way the same label gets the same colour every time
 * even if the user retypes it.
 */
export interface TaskLabel {
  id: string
  name: string
  color: string
}

export interface LocalTask {
  id: string
  title: string
  notes: string | null
  status: TaskStatus
  priority: TaskPriority
  /** ISO timestamp; `null` when no due date is set. */
  due_at: string | null
  reminder_offset: ReminderOffsetKey
  labels: TaskLabel[]
  /** Optional linked case id — surfaces the case title on the card. */
  case_id: string | null
  created_at: string
  updated_at: string
}

// ── Label colour palette ───────────────────────────────────────────────

/**
 * Tints chosen to read clearly on the kanban card background while
 * staying within the LegaLite gold / navy / cream world. Adding
 * more is safe — the deterministic colour helper uses the array
 * length to mod.
 */
export const LABEL_COLORS = [
  '#C9972B', // gold
  '#0D1B2A', // navy
  '#2E7D4F', // green
  '#2563EB', // blue
  '#7B1F23', // burgundy
  '#3A4A5D', // slate
  '#7C3AED', // purple
  '#0F766E', // teal
  '#C0392B', // red
  '#9333EA', // violet
] as const

/**
 * Deterministic colour for a label name. Hashes the lowercased name
 * to an index into LABEL_COLORS so the same label always renders
 * with the same fill across reloads / users / cards.
 */
export function colorForLabelName(name: string): string {
  const normalised = name.trim().toLowerCase()
  let h = 0
  for (let i = 0; i < normalised.length; i++) {
    h = (h * 31 + normalised.charCodeAt(i)) >>> 0
  }
  return LABEL_COLORS[h % LABEL_COLORS.length]
}

// ── Dev seed ──────────────────────────────────────────────────────────

const DEV_SEED_LABELS: TaskLabel[] = [
  { id: 'lbl-research', name: 'Research', color: colorForLabelName('Research') },
  { id: 'lbl-draft', name: 'Draft', color: colorForLabelName('Draft') },
  { id: 'lbl-court', name: 'Court', color: colorForLabelName('Court') },
  { id: 'lbl-billing', name: 'Billing', color: colorForLabelName('Billing') },
  { id: 'lbl-followup', name: 'Follow-up', color: colorForLabelName('Follow-up') },
]

function isoOffsetDays(days: number, hour = 9, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const DEV_SEED_TASKS: LocalTask[] = [
  {
    id: 'task-dev-1',
    title: 'Draft Mensah affidavit',
    notes: 'Reference Section 32 of the Revenue Authority Act in para 4.',
    status: 'In Progress',
    priority: 'High',
    due_at: isoOffsetDays(2, 17, 0),
    reminder_offset: '1d',
    labels: [
      DEV_SEED_LABELS[1], // Draft
      DEV_SEED_LABELS[0], // Research
    ],
    case_id: 'dev-1',
    created_at: isoOffsetDays(-3),
    updated_at: isoOffsetDays(-1, 14, 30),
  },
  {
    id: 'task-dev-2',
    title: 'Call Owusu family re. probate hearing prep',
    notes: null,
    status: 'Pending',
    priority: 'Medium',
    due_at: isoOffsetDays(4, 10, 0),
    reminder_offset: '1d',
    labels: [DEV_SEED_LABELS[4]],
    case_id: 'dev-2',
    created_at: isoOffsetDays(-2),
    updated_at: isoOffsetDays(-2),
  },
  {
    id: 'task-dev-3',
    title: 'Issue May invoices to all retainer clients',
    notes: 'Use the new template variant; double-check the GHS conversion column.',
    status: 'Pending',
    priority: 'Low',
    due_at: isoOffsetDays(6, 12, 0),
    reminder_offset: '3d',
    labels: [DEV_SEED_LABELS[3]],
    case_id: null,
    created_at: isoOffsetDays(-1),
    updated_at: isoOffsetDays(-1),
  },
  {
    id: 'task-dev-4',
    title: 'File AccraTech disclosure schedule',
    notes: null,
    status: 'Done',
    priority: 'Medium',
    due_at: isoOffsetDays(-1, 16, 0),
    reminder_offset: 'none',
    labels: [DEV_SEED_LABELS[2]],
    case_id: 'dev-3',
    created_at: isoOffsetDays(-5),
    updated_at: isoOffsetDays(-1, 17, 30),
  },
]

// ── Store ──────────────────────────────────────────────────────────────

interface TasksLocalStore {
  /** Keyed by task id for cheap mutate-in-place updates. */
  tasks: Record<string, LocalTask>
  /** Shared label palette — what the composer's chip autocompletes against. */
  labels: TaskLabel[]
  /**
   * Monotonic bump used as a re-render trigger for subscribers that
   * derive a list from `tasks`. Mirrors the pattern from
   * `priority.store.ts` — selecting a primitive is stable across
   * SSR / CSR; selecting the records map would trip React's
   * `getServerSnapshot` warning.
   */
  revision: number

  // ── CRUD ────────────────────────────────────────────────────────
  createTask: (
    input: Omit<LocalTask, 'id' | 'created_at' | 'updated_at'>,
  ) => LocalTask
  updateTask: (
    id: string,
    patch: Partial<Omit<LocalTask, 'id' | 'created_at'>>,
  ) => LocalTask | null
  deleteTask: (id: string) => void
  /** Convenience used by the kanban's click-to-cycle status pill. */
  setStatus: (id: string, status: TaskStatus) => void

  // ── Labels ──────────────────────────────────────────────────────
  /**
   * Ensure a label exists in the palette and return its record.
   * Idempotent: if a label with the same case-insensitive name is
   * already there, returns the existing record so two cards that
   * both type "Research" end up with the same id.
   */
  ensureLabel: (name: string) => TaskLabel

  // ── Lifecycle ───────────────────────────────────────────────────
  /** Wipe and reset to the dev seed — convenience for QA. */
  reseedDev: () => void
}

const SEEDED_INITIAL: Pick<TasksLocalStore, 'tasks' | 'labels' | 'revision'> = {
  tasks: Object.fromEntries(DEV_SEED_TASKS.map((t) => [t.id, t])),
  labels: DEV_SEED_LABELS,
  revision: 0,
}

export const useTasksLocalStore = create<TasksLocalStore>()(
  persist(
    (set, get) => ({
      ...SEEDED_INITIAL,

      createTask: (input) => {
        const now = new Date().toISOString()
        const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const next: LocalTask = {
          ...input,
          id,
          created_at: now,
          updated_at: now,
        }
        set((s) => ({
          tasks: { ...s.tasks, [id]: next },
          revision: s.revision + 1,
        }))
        return next
      },

      updateTask: (id, patch) => {
        const existing = get().tasks[id]
        if (!existing) return null
        const next: LocalTask = {
          ...existing,
          ...patch,
          updated_at: new Date().toISOString(),
        }
        set((s) => ({
          tasks: { ...s.tasks, [id]: next },
          revision: s.revision + 1,
        }))
        return next
      },

      deleteTask: (id) => {
        set((s) => {
          const next = { ...s.tasks }
          delete next[id]
          return { tasks: next, revision: s.revision + 1 }
        })
      },

      setStatus: (id, status) => {
        const existing = get().tasks[id]
        if (!existing || existing.status === status) return
        set((s) => ({
          tasks: {
            ...s.tasks,
            [id]: {
              ...existing,
              status,
              updated_at: new Date().toISOString(),
            },
          },
          revision: s.revision + 1,
        }))
      },

      ensureLabel: (name) => {
        const normalised = name.trim()
        if (!normalised) {
          // Defensive: composer should already filter empties.
          return { id: 'lbl-empty', name: '', color: LABEL_COLORS[0] }
        }
        const existing = get().labels.find(
          (l) => l.name.toLowerCase() === normalised.toLowerCase(),
        )
        if (existing) return existing
        const fresh: TaskLabel = {
          id: `lbl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: normalised,
          color: colorForLabelName(normalised),
        }
        set((s) => ({
          labels: [...s.labels, fresh],
          revision: s.revision + 1,
        }))
        return fresh
      },

      reseedDev: () => set({ ...SEEDED_INITIAL, revision: get().revision + 1 }),
    }),
    {
      name: 'll:tasks-local',
      // `revision` is omitted so it resets to 0 each load — we bump
      // it in `onRehydrateStorage` so subscribers re-render with
      // the hydrated tasks.
      partialize: (state) => ({ tasks: state.tasks, labels: state.labels }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) state.revision = state.revision + 1
      },
    },
  ),
)
