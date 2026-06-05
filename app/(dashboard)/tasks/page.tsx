'use client'

/**
 * Tasks page
 * ----------
 * Personal todo kanban — three lanes (Pending / In Progress / Done)
 * backed by `useTasksLocalStore`. Each card surfaces title +
 * priority pill + labels + due date + notes excerpt, plus the
 * shared PriorityButton for cross-app flagging.
 *
 * Card movement is click-to-cycle on the status pill (Pending →
 * In Progress → Done → Pending) so the kanban works without a
 * drag-and-drop library. Add Task lives at the top of each lane
 * so the new row lands in that lane by default.
 *
 * Why the page reads from `useTasksLocalStore` instead of the
 * legacy `useTasks` hook: the GraphQL backend's task table doesn't
 * carry the new `labels` / `reminder_offset` fields yet. The local
 * store owns the new fields in DEV_BYPASS and seeds the kanban
 * with a handful of dev tasks so the empty state isn't the first
 * thing every developer sees on /tasks.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  Briefcase,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Tag,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCases } from '@/hooks/use-cases'
import {
  REMINDER_OFFSET_OPTIONS,
  useTasksLocalStore,
  type LocalTask,
  type TaskPriority,
  type TaskStatus,
} from '@/stores/tasks-local.store'
import { TaskComposerDialog } from '@/components/shared/TaskComposerDialog'
import { PriorityButton } from '@/components/shared/PriorityButton'

// ── Lane definitions ───────────────────────────────────────────────────

const LANES: {
  key: TaskStatus
  label: string
  Icon: typeof Clock
  dot: string
  next: TaskStatus
}[] = [
  // `next` drives the click-to-cycle status pill: Pending → In
  // Progress → Done → Pending.
  {
    key: 'Pending',
    label: 'Pending',
    Icon: Clock,
    dot: '#C9972B',
    next: 'In Progress',
  },
  {
    key: 'In Progress',
    label: 'In progress',
    Icon: Loader2,
    dot: '#2563EB',
    next: 'Done',
  },
  {
    key: 'Done',
    label: 'Done',
    Icon: CheckCircle2,
    dot: '#2E7D4F',
    next: 'Pending',
  },
]

const PRIORITY_STYLE: Record<
  TaskPriority,
  { color: string; bg: string }
> = {
  High: {
    color: 'var(--accent-danger, #C0392B)',
    bg: 'rgba(192, 57, 43, 0.12)',
  },
  Medium: {
    color: 'var(--accent-today, #C9972B)',
    bg: 'var(--accent-today-tint, rgba(201, 151, 43, 0.12))',
  },
  Low: {
    color: 'var(--text-secondary, #6B7280)',
    bg: 'var(--surface-sunken, rgba(0,0,0,0.04))',
  },
}

// ── Page ───────────────────────────────────────────────────────────────

export default function TasksPage() {
  // Subscribe to the revision counter only (stable primitive). Read
  // the actual records via getState() inside useMemo — same SSR-safe
  // pattern as the priority store. See stores/priority.store.ts for
  // the full reasoning.
  const revision = useTasksLocalStore((s) => s.revision)
  const tasks = useMemo(
    () => Object.values(useTasksLocalStore.getState().tasks),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision],
  )
  const setStatus = useTasksLocalStore((s) => s.setStatus)
  const deleteTask = useTasksLocalStore((s) => s.deleteTask)

  const { data: cases } = useCases()
  const caseTitleById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of cases ?? []) map.set(c.id, c.title)
    return map
  }, [cases])

  // Hydrate the store once on mount. Mirrors the priority-store
  // approach; `skipHydration: true` keeps SSR and first CSR consistent.
  useEffect(() => {
    void useTasksLocalStore.persist.rehydrate()
  }, [])

  // Composer state. `editing` carries the LocalTask when we're
  // editing, `null` when creating; `defaultStatus` seeds the lane.
  const [composer, setComposer] = useState<{
    open: boolean
    editing: LocalTask | null
    defaultStatus: TaskStatus
  }>({ open: false, editing: null, defaultStatus: 'Pending' })

  const openCreate = (defaultStatus: TaskStatus) =>
    setComposer({ open: true, editing: null, defaultStatus })
  const openEdit = (task: LocalTask) =>
    setComposer({ open: true, editing: task, defaultStatus: task.status })
  const closeComposer = () =>
    setComposer((s) => ({ ...s, open: false }))

  // Bucket tasks by lane. Sort by priority then by due date so the
  // most urgent work bubbles to the top of each column.
  const grouped: Record<TaskStatus, LocalTask[]> = useMemo(() => {
    const out: Record<TaskStatus, LocalTask[]> = {
      Pending: [],
      'In Progress': [],
      Done: [],
    }
    for (const t of tasks) out[t.status].push(t)
    const pri = (p: TaskPriority) => (p === 'High' ? 0 : p === 'Medium' ? 1 : 2)
    for (const k of Object.keys(out) as TaskStatus[]) {
      out[k].sort((a, b) => {
        const dp = pri(a.priority) - pri(b.priority)
        if (dp !== 0) return dp
        // Earlier due dates first; null due dates sink to the bottom.
        if (a.due_at && b.due_at) return a.due_at.localeCompare(b.due_at)
        if (a.due_at) return -1
        if (b.due_at) return 1
        return b.updated_at.localeCompare(a.updated_at)
      })
    }
    return out
  }, [tasks])

  const pendingCount = grouped.Pending.length

  const handleDelete = (task: LocalTask) => {
    if (!confirm(`Delete "${task.title}"?`)) return
    deleteTask(task.id)
    toast.success(`Deleted "${task.title}".`)
  }

  const handleStatusCycle = (task: LocalTask) => {
    const lane = LANES.find((l) => l.key === task.status)
    if (!lane) return
    setStatus(task.id, lane.next)
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: 'var(--surface-card)' }}
    >
      <div className="px-6 py-6">
        {/* ─── Title + primary action ──────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-[26px] font-semibold leading-tight tracking-tight"
              style={{
                color: 'var(--text-primary)',
                fontFamily:
                  'var(--font-heading, "Playfair Display", serif)',
              }}
            >
              Tasks
            </h1>
            <p
              className="text-[13px] mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {tasks.length === 0
                ? 'No tasks yet — add your first one below.'
                : `${pendingCount} pending · ${tasks.length} total`}
            </p>
          </div>
          <Button
            onClick={() => openCreate('Pending')}
            size="lg"
            className="rounded-lg"
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
            }}
          >
            <Plus size={14} strokeWidth={2.25} />
            Add task
          </Button>
        </div>

        {/* ─── Kanban ──────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {LANES.map((lane) => {
            const Icon = lane.Icon
            const laneTasks = grouped[lane.key]
            return (
              <div key={lane.key} className="flex flex-col">
                {/* Lane header */}
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-t-2xl border border-b-0"
                  style={{
                    background: 'var(--surface-card)',
                    borderColor: 'var(--border-soft)',
                  }}
                >
                  <span
                    aria-hidden
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: lane.dot }}
                  />
                  <Icon
                    size={13}
                    strokeWidth={1.75}
                    style={{ color: 'var(--text-secondary)' }}
                  />
                  <span
                    className="text-[12.5px] font-semibold tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {lane.label}
                  </span>
                  <span
                    className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 rounded-full text-[10.5px] font-medium tabular-nums"
                    style={{
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {laneTasks.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => openCreate(lane.key)}
                    aria-label={`Add task to ${lane.label}`}
                    className="ml-auto inline-flex items-center justify-center h-6 w-6 rounded-md cursor-pointer transition-colors hover:bg-[var(--surface-overlay)]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Plus size={13} strokeWidth={2} />
                  </button>
                </div>

                {/* Lane body */}
                <div
                  className="flex-1 rounded-b-2xl border p-2 space-y-2 min-h-[240px]"
                  style={{
                    background: 'var(--surface-sunken)',
                    borderColor: 'var(--border-soft)',
                  }}
                >
                  {laneTasks.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => openCreate(lane.key)}
                      className="w-full h-full min-h-[200px] rounded-lg border border-dashed flex items-center justify-center text-[12px] cursor-pointer"
                      style={{
                        borderColor: 'var(--border-soft)',
                        color: 'var(--text-muted)',
                        background: 'transparent',
                      }}
                    >
                      Click to add a {lane.label.toLowerCase()} task
                    </button>
                  ) : (
                    laneTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        caseTitle={
                          task.case_id
                            ? caseTitleById.get(task.case_id) ?? null
                            : null
                        }
                        onEdit={() => openEdit(task)}
                        onDelete={() => handleDelete(task)}
                        onCycleStatus={() => handleStatusCycle(task)}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <TaskComposerDialog
          open={composer.open}
          editing={composer.editing}
          defaultStatus={composer.defaultStatus}
          onOpenChange={(o) => (o ? null : closeComposer())}
        />
      </div>
    </div>
  )
}

// ── Task card ──────────────────────────────────────────────────────────

/**
 * Single task tile. Surfaces:
 *   - Status pill (click to cycle to the next lane)
 *   - Priority pill (matches the rest of the priority system)
 *   - Title + notes excerpt (line-clamped to 2 lines)
 *   - Label chips (deterministically coloured)
 *   - Due date + overdue flag
 *   - Linked-case ribbon, if any
 *   - Reminder bell if a reminder is configured
 *   - Hover row menu (Edit / Move / Delete) + PriorityButton
 */
function TaskCard({
  task,
  caseTitle,
  onEdit,
  onDelete,
  onCycleStatus,
}: {
  task: LocalTask
  caseTitle: string | null
  onEdit: () => void
  onDelete: () => void
  onCycleStatus: () => void
}) {
  const due = task.due_at ? new Date(task.due_at) : null
  const isOverdue =
    due && task.status !== 'Done' && due.getTime() < Date.now()
  const reminderLabel =
    REMINDER_OFFSET_OPTIONS.find((o) => o.key === task.reminder_offset)?.label ??
    'No reminder'
  const priStyle = PRIORITY_STYLE[task.priority]
  const laneStyle = LANES.find((l) => l.key === task.status)

  return (
    <div
      className="group rounded-xl border p-3 transition-shadow"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Row 1 — status pill + priority pill + spacer + row menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {laneStyle && (
            <button
              type="button"
              onClick={onCycleStatus}
              title={`Move to ${laneStyle.next}`}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer transition-opacity hover:opacity-80"
              style={{
                background: 'var(--surface-sunken)',
                color: 'var(--text-secondary)',
              }}
            >
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: laneStyle.dot }}
              />
              {laneStyle.label}
            </button>
          )}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ background: priStyle.bg, color: priStyle.color }}
          >
            <span
              aria-hidden
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: priStyle.color }}
            />
            {task.priority}
          </span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* PriorityButton is part of the cross-app priority system —
              flagging a task here surfaces it on the personal /
              firm dashboard panels alongside cases and clients. */}
          <PriorityButton
            entityType="case"
            entityId={`task:${task.id}`}
            label={task.title}
            metadata={{ task_status: task.status, due_at: task.due_at ?? null }}
          />
          <RowMenu onEdit={onEdit} onCycleStatus={onCycleStatus} onDelete={onDelete} />
        </div>
      </div>

      {/* Row 2 — title + notes excerpt */}
      <div className="mb-2">
        <button
          type="button"
          onClick={onEdit}
          className="block text-left cursor-pointer w-full"
        >
          <p
            className="text-[13.5px] font-semibold leading-snug"
            style={{ color: 'var(--text-primary)' }}
          >
            {task.title}
          </p>
          {task.notes && (
            <p
              className="text-[12px] mt-1 leading-snug line-clamp-2"
              style={{ color: 'var(--text-muted)' }}
            >
              {task.notes}
            </p>
          )}
        </button>
      </div>

      {/* Row 3 — labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-2">
          {task.labels.map((l) => (
            <span
              key={l.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium"
              style={{
                background: `${l.color}1F`,
                color: l.color,
              }}
            >
              <Tag size={9} strokeWidth={1.75} />
              {l.name}
            </span>
          ))}
        </div>
      )}

      {/* Row 4 — meta: due date + linked case + reminder */}
      <div
        className="flex items-center gap-2 flex-wrap text-[11.5px] tabular-nums"
        style={{ color: 'var(--text-muted)' }}
      >
        {due && (
          <span
            className="inline-flex items-center gap-1"
            style={{ color: isOverdue ? '#C0392B' : 'var(--text-muted)' }}
          >
            {isOverdue && <AlertTriangle size={10} strokeWidth={1.75} />}
            {due.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </span>
        )}
        {caseTitle && (
          <span className="inline-flex items-center gap-1 truncate max-w-[160px]">
            <Briefcase size={10} strokeWidth={1.75} />
            <span className="truncate">{caseTitle}</span>
          </span>
        )}
        {task.reminder_offset !== 'none' && (
          <span
            className="inline-flex items-center gap-1"
            title={reminderLabel}
          >
            <Bell size={10} strokeWidth={1.75} />
            {reminderLabel.replace(' before', '')}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Row menu ───────────────────────────────────────────────────────────

function RowMenu({
  onEdit,
  onCycleStatus,
  onDelete,
}: {
  onEdit: () => void
  onCycleStatus: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Task actions"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >
            <MoreHorizontal size={14} strokeWidth={2} />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={onEdit}
          className="text-[13px] cursor-pointer"
        >
          <Edit3 size={13} strokeWidth={1.75} />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onCycleStatus}
          className="text-[13px] cursor-pointer"
        >
          <RotateCcw size={13} strokeWidth={1.75} />
          Move to next status
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="text-[13px] cursor-pointer"
          style={{ color: 'var(--accent-danger)' }}
        >
          <Trash2 size={13} strokeWidth={1.75} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
