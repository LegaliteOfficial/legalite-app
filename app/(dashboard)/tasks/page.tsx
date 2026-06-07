'use client'

/**
 * Tasks — Linear-inspired work board.
 *
 * Firm-shared tasks backed by the GraphQL `tasks` query. Two views:
 *   - List  — dense, grouped rows (by status / priority / assignee) with
 *             the signature status + priority glyphs, inline status cycle.
 *   - Board — three-lane kanban.
 *
 * Plus a toolbar (search, priority + assignee filters, group-by) and a
 * progress strip. Tasks are assigned to firm members; assignees are
 * emailed on assignment and reminders fire as emails before the due date.
 */

import { useEffect, useMemo, useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useTasks, useUpdateTask, useDeleteTask, type Task } from '@/hooks/use-tasks'
import { TaskComposerDialog } from '@/components/shared/TaskComposerDialog'
import {
  TaskToolbar,
  type AssigneeOption,
  type GroupBy,
  type TaskView,
} from './_components/TaskToolbar'
import { TaskListView, type TaskGroup } from './_components/TaskListView'
import { TaskBoardView } from './_components/TaskBoardView'
import {
  PRIORITIES,
  PRIORITY_META,
  PriorityIcon,
  STATUSES,
  STATUS_META,
  StatusIcon,
  normPriority,
  normStatus,
  type TaskPriority,
  type TaskStatus,
} from './_components/task-meta'

const VIEW_KEY = 'll:tasks-view'

export default function TasksPage() {
  const { data: tasks, isLoading } = useTasks()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const allTasks = useMemo(() => tasks ?? [], [tasks])

  // ── View + filter state ─────────────────────────────────────────
  const [view, setView] = useState<TaskView>('list')
  const [groupBy, setGroupBy] = useState<GroupBy>('status')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Set<TaskPriority>>(new Set())
  const [assigneeFilter, setAssigneeFilter] = useState<Set<string>>(new Set())

  // Persist the view choice across visits.
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(VIEW_KEY) : null
    if (saved === 'list' || saved === 'board') setView(saved)
  }, [])
  const changeView = (v: TaskView) => {
    setView(v)
    try {
      window.localStorage.setItem(VIEW_KEY, v)
    } catch {}
  }

  const togglePriority = (p: TaskPriority) =>
    setPriorityFilter((prev) => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  const toggleAssignee = (id: string) =>
    setAssigneeFilter((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const clearFilters = () => {
    setPriorityFilter(new Set())
    setAssigneeFilter(new Set())
  }

  // ── Composer ────────────────────────────────────────────────────
  const [composer, setComposer] = useState<{
    open: boolean
    editing: Task | null
    defaultStatus: TaskStatus
  }>({ open: false, editing: null, defaultStatus: 'Pending' })
  const openCreate = (defaultStatus: TaskStatus) =>
    setComposer({ open: true, editing: null, defaultStatus })
  const openEdit = (task: Task) =>
    setComposer({ open: true, editing: task, defaultStatus: normStatus(task.status) })
  const closeComposer = () => setComposer((s) => ({ ...s, open: false }))

  // ── Assignee options (from tasks) ───────────────────────────────
  const assigneeOptions = useMemo<AssigneeOption[]>(() => {
    const byId = new Map<string, string>()
    for (const t of allTasks) for (const a of t.assignees) byId.set(a.member_id, a.name)
    return Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }, [allTasks])

  // ── Funnel ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allTasks.filter((t) => {
      if (q && !`${t.title} ${t.notes ?? ''} ${t.case_title ?? ''}`.toLowerCase().includes(q))
        return false
      if (priorityFilter.size && !priorityFilter.has(normPriority(t.priority))) return false
      if (assigneeFilter.size && !t.assignees.some((a) => assigneeFilter.has(a.member_id)))
        return false
      return true
    })
  }, [allTasks, search, priorityFilter, assigneeFilter])

  const sortTasks = (list: Task[]) =>
    [...list].sort((a, b) => {
      const dp = PRIORITY_META[normPriority(a.priority)].rank - PRIORITY_META[normPriority(b.priority)].rank
      if (dp !== 0) return dp
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return b.updated_at.localeCompare(a.updated_at)
    })

  // ── Grouping (list view) ────────────────────────────────────────
  const groups = useMemo<TaskGroup[]>(() => {
    if (groupBy === 'status') {
      return STATUSES.map((s) => ({
        id: `status:${s}`,
        label: STATUS_META[s].label,
        color: STATUS_META[s].color,
        glyph: <StatusIcon status={s} size={15} />,
        addDefaultStatus: s,
        tasks: sortTasks(filtered.filter((t) => normStatus(t.status) === s)),
      }))
    }
    if (groupBy === 'priority') {
      return PRIORITIES.map((p) => ({
        id: `priority:${p}`,
        label: `${PRIORITY_META[p].label} priority`,
        color: PRIORITY_META[p].color,
        glyph: <PriorityIcon priority={p} size={15} />,
        tasks: sortTasks(filtered.filter((t) => normPriority(t.priority) === p)),
      }))
    }
    // assignee
    const out: TaskGroup[] = assigneeOptions.map((a) => ({
      id: `assignee:${a.id}`,
      label: a.name,
      color: '#8A8F99',
      tasks: sortTasks(filtered.filter((t) => t.assignees.some((x) => x.member_id === a.id))),
    }))
    const unassigned = sortTasks(filtered.filter((t) => t.assignees.length === 0))
    if (unassigned.length)
      out.push({ id: 'assignee:none', label: 'Unassigned', color: '#B5B9C1', tasks: unassigned })
    return out.filter((g) => g.tasks.length > 0)
  }, [groupBy, filtered, assigneeOptions])

  // ── Progress strip ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = allTasks.length
    let done = 0
    let inProgress = 0
    let overdue = 0
    const now = Date.now()
    for (const t of allTasks) {
      const s = normStatus(t.status)
      if (s === 'Done') done++
      else if (s === 'In Progress') inProgress++
      if (s !== 'Done' && t.due_date && new Date(t.due_date).getTime() < now) overdue++
    }
    return { total, done, inProgress, overdue, pct: total ? Math.round((done / total) * 100) : 0 }
  }, [allTasks])

  const activeFilterCount = priorityFilter.size + assigneeFilter.size

  // ── Handlers ────────────────────────────────────────────────────
  const handleDelete = async (task: Task) => {
    if (!confirm(`Delete "${task.title}"?`)) return
    try {
      await deleteTask.mutateAsync(task.id)
      toast.success(`Deleted "${task.title}".`)
    } catch (err) {
      toast.error(err instanceof Error ? `Couldn't delete: ${err.message}` : 'Delete failed.')
    }
  }
  const handleCycleStatus = async (task: Task) => {
    const next = STATUS_META[normStatus(task.status)].next
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status: next } })
    } catch (err) {
      toast.error(err instanceof Error ? `Couldn't update: ${err.message}` : 'Update failed.')
    }
  }

  const hasTasks = allTasks.length > 0
  const nothingMatches = hasTasks && filtered.length === 0

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--surface-card)' }}>
      <div className="px-6 py-6 max-w-[1200px] mx-auto">
        {/* ─── Header ───────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-[26px] font-semibold leading-tight tracking-tight"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading, "Playfair Display", serif)' }}
            >
              Tasks
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {isLoading
                ? 'Loading tasks…'
                : !hasTasks
                  ? 'No tasks yet — assign your first one to the team.'
                  : `${stats.total} total · ${stats.inProgress} in progress · ${stats.done} done`}
            </p>
          </div>
          <Button
            onClick={() => openCreate('Pending')}
            size="lg"
            className="rounded-lg shrink-0"
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          >
            <Plus size={14} strokeWidth={2.25} />
            Add task
          </Button>
        </div>

        {/* ─── Progress strip ───────────────────────────────────── */}
        {hasTasks && (
          <div className="mt-4 flex items-center gap-3">
            <div
              className="h-1.5 flex-1 rounded-full overflow-hidden"
              style={{ background: 'var(--surface-sunken)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${stats.pct}%`, background: 'var(--gold)' }}
              />
            </div>
            <span className="text-[12px] tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
              {stats.pct}% complete
            </span>
            {stats.overdue > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{ background: 'rgba(192,57,43,0.10)', color: '#C0392B' }}
              >
                {stats.overdue} overdue
              </span>
            )}
          </div>
        )}

        {/* ─── Toolbar ──────────────────────────────────────────── */}
        <div className="mt-5">
          <TaskToolbar
            view={view}
            onViewChange={changeView}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            search={search}
            onSearchChange={setSearch}
            priorityFilter={priorityFilter}
            onTogglePriority={togglePriority}
            assigneeOptions={assigneeOptions}
            assigneeFilter={assigneeFilter}
            onToggleAssignee={toggleAssignee}
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
          />
        </div>

        {/* ─── Content ──────────────────────────────────────────── */}
        <div className="mt-4">
          {isLoading ? (
            <div
              className="rounded-xl border p-10 text-center text-[13px]"
              style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}
            >
              Loading tasks…
            </div>
          ) : !hasTasks ? (
            <EmptyState onAdd={() => openCreate('Pending')} />
          ) : nothingMatches ? (
            <div
              className="rounded-xl border p-10 text-center"
              style={{ borderColor: 'var(--border-soft)' }}
            >
              <p className="text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
                No tasks match your filters
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  clearFilters()
                }}
                className="mt-2 text-[12.5px] cursor-pointer"
                style={{ color: 'var(--gold-dark)' }}
              >
                Clear search & filters
              </button>
            </div>
          ) : view === 'list' ? (
            <TaskListView
              groups={groups}
              onCycleStatus={handleCycleStatus}
              onEdit={openEdit}
              onDelete={handleDelete}
              onAdd={(g) => openCreate(g.addDefaultStatus ?? 'Pending')}
            />
          ) : (
            <TaskBoardView
              tasks={sortTasks(filtered)}
              onCycleStatus={handleCycleStatus}
              onEdit={openEdit}
              onDelete={handleDelete}
              onAdd={(s) => openCreate(s)}
            />
          )}
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

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="rounded-xl border border-dashed p-12 flex flex-col items-center text-center"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <div
        className="inline-flex items-center justify-center h-12 w-12 rounded-2xl mb-3"
        style={{ background: 'var(--accent-today-tint)' }}
      >
        <StatusIcon status="In Progress" size={22} />
      </div>
      <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        Start your firm’s task board
      </p>
      <p className="text-[13px] mt-1 max-w-[360px]" style={{ color: 'var(--text-muted)' }}>
        Create a task, assign it to teammates, and set email reminders so nothing slips
        before a deadline.
      </p>
      <Button
        onClick={onAdd}
        size="lg"
        className="mt-4 rounded-lg"
        style={{ background: 'var(--gold)', color: 'var(--navy)' }}
      >
        <Plus size={14} strokeWidth={2.25} />
        Add your first task
      </Button>
    </div>
  )
}
