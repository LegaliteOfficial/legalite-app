'use client'

import { Plus, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '../primitives/FieldLabel'
import type { NewCaseForm, SetField } from '../../_types'

/**
 * Conflict checks tied to the case. The actual conflict-search engine
 * ships with its own screen — here we just track which existing checks
 * have been linked to this case (stored as a list of identifiers; until
 * the engine ships, the user enters free text).
 */
export function ConflictChecksSection({
  form,
  setField,
}: {
  form: NewCaseForm
  setField: SetField
}) {
  const updateRow = (idx: number, value: string) =>
    setField(
      'conflict_checks',
      form.conflict_checks.map((v, i) => (i === idx ? value : v)),
    )
  const removeRow = (idx: number) =>
    setField(
      'conflict_checks',
      form.conflict_checks.filter((_, i) => i !== idx),
    )
  const addRow = () =>
    setField('conflict_checks', [...form.conflict_checks, ''])

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {form.conflict_checks.map((value, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end"
          >
            <div>
              {idx === 0 && <FieldLabel>Conflict checks</FieldLabel>}
              <Input
                value={value}
                onChange={(e) => updateRow(idx, e.target.value)}
                placeholder="Select conflict check"
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
              aria-label="Remove conflict check"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addRow}>
        <Plus size={13} strokeWidth={2} />
        Link another conflict check
      </Button>
    </div>
  )
}
