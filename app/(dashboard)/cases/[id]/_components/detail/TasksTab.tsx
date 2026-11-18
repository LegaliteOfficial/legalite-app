'use client'

/**
 * Tasks linked to the case, grouped by what needs doing first: overdue,
 * upcoming, undated, then done (collapsed). Ticking the box completes or
 * reopens a task in place; clicking the row opens it in the composer.
 */

import { useMemo, useState } from 'react'
import { CaretDown, CheckCircle, Circle, ListChecks, Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { TaskComposerDialog } from '@/components/shared/TaskComposerDialog'
import { useUpdateTask, type Task } from '@/hooks/use-tasks'
import { cn } from '@/lib/utils'
import { daysUntil } from '../../_lib/case-details'
import { Avatar, DueBadge, Panel } from './primitives'

const PRIORITY_DOT: Record<string, string> = { High: '#D92D20', Medium: '#C9972B', Low: '#98A2B3' }

export function isDone(t: Task) {
  return t.status === 'Done'
}

export function splitTasks(tasks: Task[]) {
  const open = tasks.filter((t) => !isDone(t))
  const byDue = (a: Task, b: Task) => (a.due_date ?? '').localeCompare(b.due_date ?? '')
  return {
    overdue: open.filter((t) => (daysUntil(t.due_date) ?? 0) < 0 && t.due_date).sort(byDue),
    upcoming: open.filter((t) => t.due_date && (daysUntil(t.due_date) ?? 0) >= 0).sort(byDue),
    undated: open.filter((t) => !t.due_date),
    done: tasks.filter(isDone).sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
  }
}

export function TasksTab({ caseId, tasks }: { caseId: string; tasks: Task[] }) {
  const [composer, setComposer] = useState<{ open: boolean; editing: Task | null }>({ open: false, editing: null })
  const [showDone, setShowDone] = useState(false)
  const groups = useMemo(() => splitTasks(tasks), [tasks])
  const openCount = tasks.length - groups.done.length

  return (
    <>
      <Panel
        title="Tasks"
        icon={<ListChecks size={15} weight="duotone" />}
        count={openCount}
        action={
          <Button size="sm" variant="outline" onClick={() => setComposer({ open: true, editing: null })}>
            <Plus size={13} weight="bold" /> New task
          </Button>
        }
      >
        {tasks.length === 0 ? (
          <EmptyTasks onAdd={() => setComposer({ open: true, editing: null })} />
        ) : (
          <div className="space-y-5">
            <TaskGroup label="Overdue" tone="#B42318" tasks={groups.overdue} onOpen={(t) => setComposer({ open: true, editing: t })} />
            <TaskGroup label="Upcoming" tasks={groups.upcoming} onOpen={(t) => setComposer({ open: true, editing: t })} />
            <TaskGroup label="No due date" tasks={groups.undated} onOpen={(t) => setComposer({ open: true, editing: t })} />
            {groups.done.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowDone((v) => !v)}
                  className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--text-muted)' }}
                  aria-expanded={showDone}
                >
                  <CaretDown size={11} className={cn('transition-transform', !showDone && '-rotate-90')} />
                  Completed ({groups.done.length})
                </button>
                {showDone && <TaskList tasks={groups.done} onOpen={(t) => setComposer({ open: true, editing: t })} />}
              </div>
            )}
            {openCount === 0 && (
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                All tasks on this case are done.
              </p>
            )}
          </div>
        )}
      </Panel>
      <TaskComposerDialog
        open={composer.open}
        onOpenChange={(open) => setComposer((c) => ({ ...c, open }))}
        editing={composer.editing}
        defaultCaseId={caseId}
      />
    </>
  )
}

function EmptyTasks({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center" style={{ borderColor: 'var(--border-soft)' }}>
      <ListChecks size={28} weight="duotone" style={{ color: 'var(--gold)' }} />
      <p className="mt-2 text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>No tasks yet</p>
      <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        Track filings, research and follow-ups for this case, with owners and due dates.
      </p>
      <Button size="sm" className="mt-4" onClick={onAdd}>
        <Plus size={13} weight="bold" /> Add the first task
      </Button>
    </div>
  )
}

function TaskGroup({ label, tasks, onOpen, tone }: { label: string; tasks: Task[]; onOpen: (t: Task) => void; tone?: string }) {
  if (tasks.length === 0) return null
  return (
    <div>
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: tone ?? 'var(--text-muted)' }}>
        {label} ({tasks.length})
      </p>
      <TaskList tasks={tasks} onOpen={onOpen} />
    </div>
  )
}

export function TaskList({ tasks, onOpen, compact }: { tasks: Task[]; onOpen?: (t: Task) => void; compact?: boolean }) {
  return (
    <ul className="divide-y rounded-xl border" style={{ borderColor: 'var(--border-soft)' }}>
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} onOpen={onOpen} compact={compact} />
      ))}
    </ul>
  )
}

function TaskRow({ task, onOpen, compact }: { task: Task; onOpen?: (t: Task) => void; compact?: boolean }) {
  const update = useUpdateTask()
  const [pending, setPending] = useState(false)
  const done = isDone(task)

  const toggle = async () => {
    setPending(true)
    try {
      await update.mutateAsync({ id: task.id, data: { status: done ? 'Pending' : 'Done' } })
      toast.success(done ? 'Task reopened.' : 'Task completed.')
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Unable to update the task.')
    } finally {
      setPending(false)
    }
  }

  return (
    <li className="flex items-center gap-3 px-3 py-2.5" style={{ borderColor: 'var(--border-soft)' }}>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={pending}
        aria-label={done ? 'Reopen task' : 'Complete task'}
        className="shrink-0 transition-transform hover:scale-110 disabled:opacity-50"
        style={{ color: done ? '#12B76A' : 'var(--text-muted)' }}
      >
        {done ? <CheckCircle size={20} weight="fill" /> : <Circle size={20} />}
      </button>
      <button type="button" onClick={() => onOpen?.(task)} className="min-w-0 flex-1 text-left" disabled={!onOpen}>
        <span className="flex items-center gap-2">
          {task.priority && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: PRIORITY_DOT[task.priority] ?? '#98A2B3' }} title={`${task.priority} priority`} />}
          <span className={cn('truncate text-[13.5px]', done && 'line-through')} style={{ color: done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
            {task.title}
          </span>
        </span>
        {!compact && task.notes && (
          <span className="mt-0.5 block truncate text-[12px]" style={{ color: 'var(--text-muted)' }}>{task.notes}</span>
        )}
      </button>
      {task.assignees.length > 0 && (
        <span className="hidden -space-x-1.5 sm:flex" title={task.assignees.map((a) => a.name).join(', ')}>
          {task.assignees.slice(0, 3).map((a) => (
            <span key={a.id} className="rounded-full ring-2 ring-white">
              <Avatar name={a.name} src={a.avatar_url} size={22} />
            </span>
          ))}
        </span>
      )}
      <DueBadge date={task.due_date} done={done} />
    </li>
  )
}
