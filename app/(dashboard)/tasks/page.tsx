'use client'

import { Plus, Pencil, Trash2, CheckSquare, Clock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { TaskForm } from '@/components/shared/TaskForm'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useTasks } from '@/hooks/use-tasks'
import { useUIStore } from '@/stores/ui.store'
import type { Task } from '@/types'

const LANES = [
  { key: 'Pending' as const, label: 'Pending', icon: Clock, color: '#B8860B', bg: 'rgba(201,151,43,0.06)' },
  { key: 'In Progress' as const, label: 'In Progress', icon: Loader2, color: '#2563EB', bg: 'rgba(59,130,246,0.06)' },
  { key: 'Done' as const, label: 'Done', icon: CheckCircle2, color: '#2E7D4F', bg: 'rgba(46,125,79,0.06)' },
] as const

export default function TasksPage() {
  const { data: tasks, isLoading, error } = useTasks()
  const { openModal } = useUIStore()

  if (isLoading) return <PageSkeleton />
  if (error) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div
          className="text-center rounded-2xl border px-12 py-10"
          style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--navy)' }}>
            Unable to load tasks
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Please check your connection and try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-xs">
            Retry
          </Button>
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
    <div className="flex-1 overflow-y-auto p-6 lg:p-8" style={{ background: 'var(--cream)' }}>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'rgba(201,151,43,0.1)' }}
          >
            <CheckSquare size={18} style={{ color: 'var(--gold)' }} />
          </div>
          <div>
            <h2
              className="font-heading text-lg font-bold leading-tight"
              style={{ color: 'var(--navy)' }}
            >
              Task Manager
            </h2>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {pendingCount} pending
            </p>
          </div>
        </div>
        <Button
          onClick={() => openModal({ type: 'addTask' })}
          className="h-9 px-4 rounded-xl text-[13px] font-semibold shadow-sm"
          style={{ background: 'var(--gold)', color: '#fff' }}
        >
          <Plus size={15} className="mr-1.5" />
          Add Task
        </Button>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-3 gap-4">
        {LANES.map((lane) => {
          const Icon = lane.icon
          const laneTasks = grouped[lane.key]
          return (
            <div key={lane.key} className="flex flex-col">
              {/* Lane header */}
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-t-xl border border-b-0"
                style={{ background: lane.bg, borderColor: 'var(--border)' }}
              >
                <Icon size={14} style={{ color: lane.color }} />
                <span
                  className="text-[11px] uppercase tracking-[0.08em] font-bold"
                  style={{ color: lane.color }}
                >
                  {lane.label}
                </span>
                <span
                  className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold ml-auto"
                  style={{ background: 'rgba(13,27,42,0.06)', color: 'rgba(13,27,42,0.4)' }}
                >
                  {laneTasks.length}
                </span>
              </div>

              {/* Lane body */}
              <div
                className="flex-1 rounded-b-xl border p-3 space-y-2.5 min-h-[200px]"
                style={{
                  background: 'var(--cream-white)',
                  borderColor: 'var(--border)',
                  boxShadow: '0 1px 3px rgba(13,27,42,0.04)',
                }}
              >
                {laneTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-full min-h-[160px]">
                    <p className="text-[12px] text-gray-300">
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
      className="rounded-xl border p-3 transition-all duration-150 group"
      style={{
        borderColor: 'var(--border)',
        background: '#fff',
        boxShadow: '0 1px 2px rgba(13,27,42,0.03)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(13,27,42,0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(13,27,42,0.03)'
      }}
    >
      {/* Title + actions */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[13px] font-medium leading-snug" style={{ color: 'var(--navy)' }}>
          {task.title}
        </p>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-md"
            onClick={() => openModal({ type: 'editTask', id: task.id })}
          >
            <Pencil size={11} style={{ color: 'var(--navy)' }} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-md hover:bg-red-50"
            onClick={() => openModal({ type: 'confirmDelete', entity: 'task', id: task.id, name: task.title })}
          >
            <Trash2 size={11} className="text-red-400" />
          </Button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={task.priority ?? 'Medium'} />

        {task.client_name && (
          <span className="text-[10.5px] text-gray-400 truncate max-w-[100px]">
            {task.client_name}
          </span>
        )}

        {task.due_date && (
          <span
            className="flex items-center gap-0.5 text-[10.5px] font-medium ml-auto"
            style={{ color: isOverdue ? '#C0392B' : 'rgba(13,27,42,0.4)' }}
          >
            {isOverdue && <AlertTriangle size={10} />}
            {new Date(task.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}
