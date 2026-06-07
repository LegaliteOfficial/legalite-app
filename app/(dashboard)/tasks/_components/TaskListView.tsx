'use client'

import { useState } from 'react'
import { Briefcase, Bell, CaretRight, PencilSimple, DotsThree, Plus, Trash } from '@phosphor-icons/react'
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
  StatusIcon,
  formatDue,
  normPriority,
  normStatus,
} from './task-meta'

export interface TaskGroup {
  id: string
  label: string
  /** Accent dot colour for the section header. */
  color: string
  /** Optional leading glyph (e.g. a status icon). */
  glyph?: React.ReactNode
  tasks: Task[]
  /** Status the inline "+ Add" should seed when this group is grouped by status. */
  addDefaultStatus?: 'Pending' | 'In Progress' | 'Done'
}

export function TaskListView({
  groups,
  onCycleStatus,
  onEdit,
  onDelete,
  onAdd,
}: {
  groups: TaskGroup[]
  onCycleStatus: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onAdd: (group: TaskGroup) => void
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-card)' }}
    >
      {groups.map((group, gi) => {
        const isCollapsed = collapsed.has(group.id)
        return (
          <div key={group.id}>
            {/* Group header */}
            <div
              className="flex items-center gap-2 px-3 h-9"
              style={{
                background: 'var(--surface-sunken)',
                borderTop: gi === 0 ? 'none' : '1px solid var(--border-soft)',
              }}
            >
              <button
                type="button"
                onClick={() => toggle(group.id)}
                className="inline-flex items-center justify-center h-5 w-5 rounded cursor-pointer transition-transform"
                style={{ color: 'var(--text-muted)', transform: isCollapsed ? 'none' : 'rotate(90deg)' }}
                aria-label={isCollapsed ? 'Expand' : 'Collapse'}
              >
                <CaretRight size={14} strokeWidth={2} />
              </button>
              {group.glyph ?? (
                <span className="w-2 h-2 rounded-full" style={{ background: group.color }} aria-hidden />
              )}
              <span className="text-[12.5px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {group.label}
              </span>
              <span className="text-[12px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {group.tasks.length}
              </span>
              <button
                type="button"
                onClick={() => onAdd(group)}
                aria-label={`Add task to ${group.label}`}
                className="ml-auto inline-flex items-center justify-center h-6 w-6 rounded-md cursor-pointer transition-colors hover:bg-[var(--surface-overlay)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <Plus size={14} strokeWidth={2} />
              </button>
            </div>

            {/* Rows */}
            {!isCollapsed &&
              (group.tasks.length === 0 ? (
                <div className="px-3 py-3 text-[12.5px]" style={{ color: 'var(--text-subtle)' }}>
                  No tasks
                </div>
              ) : (
                group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onCycleStatus={() => onCycleStatus(task)}
                    onEdit={() => onEdit(task)}
                    onDelete={() => onDelete(task)}
                  />
                ))
              ))}
          </div>
        )
      })}
    </div>
  )
}

function TaskRow({
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
      className="group flex items-center gap-2.5 px-3 h-11 border-t cursor-pointer transition-colors hover:bg-[var(--surface-card-hover)]"
      style={{ borderColor: 'var(--border-soft)' }}
      onClick={onEdit}
    >
      <StatusIcon
        status={status}
        size={16}
        onClick={(e) => {
          e.stopPropagation()
          onCycleStatus()
        }}
      />
      <span onClick={(e) => e.stopPropagation()} className="inline-flex">
        <PriorityIcon priority={priority} size={15} />
      </span>

      <span
        className="flex-1 truncate text-[13.5px]"
        style={{
          color: done ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: done ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </span>

      {/* meta cluster */}
      {task.case_title && (
        <span
          className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] max-w-[150px]"
          style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}
        >
          <Briefcase size={10} strokeWidth={1.75} />
          <span className="truncate">{task.case_title}</span>
        </span>
      )}
      {task.reminders.length > 0 && (
        <span
          className="inline-flex items-center gap-0.5 text-[11px] tabular-nums"
          style={{ color: 'var(--text-muted)' }}
          title={`${task.reminders.length} email reminder${task.reminders.length === 1 ? '' : 's'}`}
        >
          <Bell size={11} strokeWidth={1.75} />
          {task.reminders.length}
        </span>
      )}
      {due && (
        <span
          className="inline-flex items-center text-[11.5px] tabular-nums whitespace-nowrap"
          style={{
            color: due.overdue && !done ? '#C0392B' : due.soon && !done ? 'var(--gold-dark)' : 'var(--text-muted)',
            fontWeight: (due.overdue || due.soon) && !done ? 600 : 400,
          }}
        >
          {due.label}
        </span>
      )}
      <AssigneeStack assignees={task.assignees} />

      {/* hover actions */}
      <div
        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
        <DropdownMenuItem onClick={onCycleStatus} className="text-[13px] cursor-pointer">
          <CaretRight size={13} strokeWidth={1.75} />
          Advance status
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="text-[13px] cursor-pointer"
          style={{ color: 'var(--accent-danger)' }}
        >
          <Trash size={13} strokeWidth={1.75} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
