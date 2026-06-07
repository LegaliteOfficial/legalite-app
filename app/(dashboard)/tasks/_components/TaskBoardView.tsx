'use client'

import { Bell, Briefcase, PencilSimple, DotsThree, Plus, Trash } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PriorityButton } from '@/components/shared/PriorityButton'
import type { Task } from '@/hooks/use-tasks'
import {
  AssigneeStack,
  PriorityIcon,
  STATUSES,
  STATUS_META,
  StatusIcon,
  formatDue,
  normPriority,
  normStatus,
  type TaskStatus,
} from './task-meta'

export function TaskBoardView({
  tasks,
  onCycleStatus,
  onEdit,
  onDelete,
  onAdd,
}: {
  tasks: Task[]
  onCycleStatus: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onAdd: (status: TaskStatus) => void
}) {
  const lanes = STATUSES.map((s) => ({
    status: s,
    tasks: tasks.filter((t) => normStatus(t.status) === s),
  }))

  return (
    <div className="grid grid-cols-3 gap-4">
      {lanes.map(({ status, tasks: laneTasks }) => {
        const meta = STATUS_META[status]
        return (
          <div key={status} className="flex flex-col">
            {/* Lane header */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-t-2xl border border-b-0"
              style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)' }}
            >
              <StatusIcon status={status} size={15} />
              <span className="text-[12.5px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {meta.label}
              </span>
              <span
                className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 rounded-full text-[10.5px] font-medium tabular-nums"
                style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}
              >
                {laneTasks.length}
              </span>
              <button
                type="button"
                onClick={() => onAdd(status)}
                aria-label={`Add task to ${meta.label}`}
                className="ml-auto inline-flex items-center justify-center h-6 w-6 rounded-md cursor-pointer transition-colors hover:bg-[var(--surface-overlay)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <Plus size={13} strokeWidth={2} />
              </button>
            </div>

            {/* Lane body */}
            <div
              className="flex-1 rounded-b-2xl border p-2 space-y-2 min-h-[280px]"
              style={{ background: 'var(--surface-sunken)', borderColor: 'var(--border-soft)' }}
            >
              {laneTasks.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onAdd(status)}
                  className="w-full h-full min-h-[240px] rounded-lg border border-dashed flex items-center justify-center text-[12px] cursor-pointer"
                  style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)', background: 'transparent' }}
                >
                  Click to add a task
                </button>
              ) : (
                laneTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onCycleStatus={() => onCycleStatus(task)}
                    onEdit={() => onEdit(task)}
                    onDelete={() => onDelete(task)}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TaskCard({
  task,
  onCycleStatus,
  onEdit,
  onDelete,
}: {
  task: Task
  onCycleStatus: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const status = normStatus(task.status)
  const priority = normPriority(task.priority)
  const due = formatDue(task.due_date)
  const done = status === 'Done'

  return (
    <div
      className="group rounded-xl border p-2.5 cursor-pointer transition-shadow hover:shadow-[var(--shadow-md)]"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)', boxShadow: 'var(--shadow-xs)' }}
      onClick={onEdit}
    >
      {/* Header: status + priority + actions */}
      <div className="flex items-center gap-2 mb-1.5">
        <StatusIcon
          status={status}
          size={15}
          onClick={(e) => {
            e.stopPropagation()
            onCycleStatus()
          }}
        />
        <span onClick={(e) => e.stopPropagation()} className="inline-flex">
          <PriorityIcon priority={priority} size={14} />
        </span>
        <div
          className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <PriorityButton
            entityType="case"
            entityId={`task:${task.id}`}
            label={task.title}
            metadata={{ task_status: status, due_at: task.due_date ?? null }}
          />
          <RowMenu onEdit={onEdit} onCycleStatus={onCycleStatus} onDelete={onDelete} />
        </div>
      </div>

      {/* Title + notes */}
      <p
        className="text-[13px] font-medium leading-snug"
        style={{
          color: done ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: done ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </p>
      {task.notes && (
        <p className="text-[11.5px] mt-1 leading-snug line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {task.notes}
        </p>
      )}

      {/* Footer meta */}
      <div className="flex items-center gap-2 flex-wrap mt-2">
        {task.case_title && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] max-w-[140px]"
            style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}
          >
            <Briefcase size={9} strokeWidth={1.75} />
            <span className="truncate">{task.case_title}</span>
          </span>
        )}
        {due && (
          <span
            className="inline-flex items-center text-[11px] tabular-nums"
            style={{
              color: due.overdue && !done ? '#C0392B' : due.soon && !done ? 'var(--gold-dark)' : 'var(--text-muted)',
              fontWeight: (due.overdue || due.soon) && !done ? 600 : 400,
            }}
          >
            {due.label}
          </span>
        )}
        {task.reminders.length > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
            <Bell size={10} strokeWidth={1.75} />
            {task.reminders.length}
          </span>
        )}
        <span className="ml-auto">
          <AssigneeStack assignees={task.assignees} />
        </span>
      </div>
    </div>
  )
}

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
            <DotsThree size={14} strokeWidth={2} />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onEdit} className="text-[13px] cursor-pointer">
          <PencilSimple size={13} strokeWidth={1.75} />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-[13px] cursor-pointer" style={{ color: 'var(--accent-danger)' }}>
          <Trash size={13} strokeWidth={1.75} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
