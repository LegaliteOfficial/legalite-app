'use client'

import { Plus, Pencil, Trash2, Clock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { TaskForm } from '@/components/shared/TaskForm'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useTasks } from '@/hooks/use-tasks'
import { useUIStore } from '@/stores/ui.store'
import type { Task } from '@/types'

const LANES = [
  { key: 'Pending' as const,     label: 'Pending',     Icon: Clock,         dot: '#C9972B' },
  { key: 'In Progress' as const, label: 'In progress', Icon: Loader2,       dot: '#2563EB' },
  { key: 'Done' as const,        label: 'Done',        Icon: CheckCircle2,  dot: '#2E7D4F' },
] as const

export default function TasksPage() {
  const { data: tasks, isLoading, error } = useTasks()
  const { openModal } = useUIStore()

  if (isLoading) return <PageSkeleton />
  if (error) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5">
          <ErrorPanel onRetry={() => window.location.reload()} />
        </div>
      </div>
    )
  }

  const taskList = tasks ?? []
  const grouped: Record<string, Task[]> = { Pending: [], 'In Progress': [], Done: [] }
  for (const t of taskList) {
    const status = t.status ?? 'Pending'
    if (grouped[status]) grouped[status].push(t)
    else grouped.Pending.push(t)
  }

  const pendingCount = grouped.Pending.length

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <PageHeader
          title="Tasks"
          description={`${pendingCount} pending`}
          actions={
            <Button onClick={() => openModal({ type: 'addTask' })} size="lg" className="rounded-lg">
              <Plus size={14} strokeWidth={2} />
              Add task
            </Button>
          }
        />

        <div className="mt-6 grid grid-cols-3 gap-4">
          {LANES.map((lane) => {
            const Icon = lane.Icon
            const laneTasks = grouped[lane.key]
            return (
              <div key={lane.key} className="flex flex-col">
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-t-2xl border border-b-0"
                  style={{
                    background: 'var(--surface-card)',
                    borderColor: 'var(--border-soft)',
                  }}
                >
                  <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: lane.dot }} />
                  <Icon size={13} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
                  <span
                    className="text-[11.5px] font-medium tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {lane.label}
                  </span>
                  <span
                    className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 rounded-full text-[10.5px] font-medium tabular-nums ml-auto"
                    style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}
                  >
                    {laneTasks.length}
                  </span>
                </div>

                <div
                  className="flex-1 rounded-b-2xl border p-2 space-y-2 min-h-[220px]"
                  style={{
                    background: 'var(--surface-card)',
                    borderColor: 'var(--border-soft)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  {laneTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[180px]">
                      <p className="text-[12px]" style={{ color: 'var(--text-subtle)' }}>
                        No {lane.label.toLowerCase()} tasks
                      </p>
                    </div>
                  ) : (
                    laneTasks.map((task) => (
                      <TaskCard key={task.id} task={task} openModal={openModal} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <TaskForm />
        <DeleteDialog />
      </div>
    </div>
  )
}

function TaskCard({
  task,
  openModal,
}: {
  task: Task
  openModal: ReturnType<typeof useUIStore.getState>['openModal']
}) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done'

  return (
    <div
      className="group rounded-xl border p-3 transition-colors"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-card-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--surface-card)'
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <p className="text-[13px] font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
          {task.title}
        </p>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => openModal({ type: 'editTask', id: task.id })}
            aria-label="Edit task"
          >
            <Pencil size={11} style={{ color: 'var(--text-muted)' }} />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => openModal({ type: 'confirmDelete', entity: 'task', id: task.id, name: task.title })}
            aria-label="Delete task"
          >
            <Trash2 size={11} style={{ color: 'var(--text-muted)' }} />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={task.priority ?? 'Medium'} />

        {task.client_name && (
          <span className="text-[11px] truncate max-w-[110px]" style={{ color: 'var(--text-muted)' }}>
            {task.client_name}
          </span>
        )}

        {task.due_date && (
          <span
            className="flex items-center gap-1 text-[11px] font-medium ml-auto tabular-nums"
            style={{ color: isOverdue ? '#C0392B' : 'var(--text-muted)' }}
          >
            {isOverdue && <AlertTriangle size={10} strokeWidth={1.75} />}
            {new Date(task.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="rounded-2xl border px-10 py-12 text-center"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
        Unable to load tasks
      </p>
      <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        Please check your connection and try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
        Retry
      </Button>
    </div>
  )
}
