'use client'

import { Plus, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '../primitives/FieldLabel'
import { NativeSelect } from '../primitives/NativeSelect'
import {
  REMINDER_BUILTIN_RECIPIENTS,
  REMINDER_UNITS,
} from '../../_constants'
import type { ReminderDraft, ReminderUnit } from '../../_types'

/**
 * Statute-of-limitations reminders. Each row = one notification
 * scheduled ahead of the deadline (e.g. "Me via popup, 10 Days
 * Before"). The "Before" suffix is fixed — reminders ahead of a
 * deadline are the only sensible direction.
 */
export function StatuteRemindersField({
  value,
  onChange,
  firmUserOptions,
}: {
  value: ReminderDraft[]
  onChange: (next: ReminderDraft[]) => void
  firmUserOptions: string[]
}) {
  const recipientOptions = [
    ...REMINDER_BUILTIN_RECIPIENTS,
    ...firmUserOptions.filter((n) => n.toLowerCase() !== 'me'),
  ]
  const addRow = () => {
    onChange([
      ...value,
      {
        id: crypto.randomUUID(),
        recipient: REMINDER_BUILTIN_RECIPIENTS[0],
        amount: '10',
        unit: 'Days',
      },
    ])
  }
  const updateRow = (id: string, patch: Partial<ReminderDraft>) =>
    onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const removeRow = (id: string) =>
    onChange(value.filter((r) => r.id !== id))

  return (
    <div>
      <FieldLabel>Statute of limitations date reminders</FieldLabel>
      <div className="space-y-2">
        {value.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[minmax(0,1fr)_70px_110px_auto_auto] gap-2 items-center"
          >
            <NativeSelect
              value={row.recipient}
              onChange={(v) => updateRow(row.id, { recipient: v })}
              options={recipientOptions}
            />
            <Input
              inputMode="numeric"
              value={row.amount}
              onChange={(e) =>
                updateRow(row.id, {
                  amount: e.target.value.replace(/[^0-9]/g, ''),
                })
              }
              className="h-10 rounded-lg text-[13px] tabular-nums text-center"
              style={{ borderColor: 'var(--border-default)' }}
            />
            <NativeSelect
              value={row.unit}
              onChange={(v) => updateRow(row.id, { unit: v as ReminderUnit })}
              options={REMINDER_UNITS}
            />
            <span
              className="text-[13px] font-medium px-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Before
            </span>
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="p-1.5 rounded-md transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
                e.currentTarget.style.color = '#C0392B'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
              aria-label="Remove reminder"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addRow} className="mt-2">
        <Plus size={13} strokeWidth={2} />
        Add reminder
      </Button>
    </div>
  )
}
