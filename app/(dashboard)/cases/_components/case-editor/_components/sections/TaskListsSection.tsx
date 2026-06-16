'use client'

import { Plus, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '../primitives/Checkbox'
import { FieldLabel } from '../primitives/FieldLabel'
import type { NewCaseForm, SetField } from '../../_types'

/**
 * Task list picker. Each row is a free-text task-list name (a picker
 * that browses firm-defined templates lands when the task-list admin
 * screen ships). The notify-assignees toggle controls whether users
 * assigned to spawned tasks receive an email.
 */
export function TaskListsSection({
  form,
  setField,
}: {
  form: NewCaseForm
  setField: SetField
}) {
  const setRow = (idx: number, value: string) => {
    setField(
      'task_lists',
      form.task_lists.map((v, i) => (i === idx ? value : v)),
    )
  }
  const removeRow = (idx: number) => {
    setField(
      'task_lists',
      form.task_lists.filter((_, i) => i !== idx),
    )
  }
  const addRow = () => {
    setField('task_lists', [...form.task_lists, ''])
  }

  return (
    <div className="space-y-4">
      <Checkbox
        checked={form.task_lists_notify_assignees}
        onChange={(v) => setField('task_lists_notify_assignees', v)}
        label="Notify assignees when these tasks are created"
        hint="Sends an email when each spawned task gets assigned."
      />
      <div className="space-y-2">
        {form.task_lists.map((value, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end"
          >
            <div>
              {idx === 0 && <FieldLabel>Task list</FieldLabel>}
              <Input
                value={value}
                onChange={(e) => setRow(idx, e.target.value)}
                placeholder="Find a task list"
                className="h-10 rounded-lg text-[13px]"
                style={{ borderColor: 'var(--border-default)' }}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="p-1.5 rounded-md transition-colors cursor-pointer self-end mb-1"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
                e.currentTarget.style.color = '#C0392B'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
              aria-label="Remove task list"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addRow}>
        <Plus size={13} strokeWidth={2} />
        Add task list
      </Button>
    </div>
  )
}
