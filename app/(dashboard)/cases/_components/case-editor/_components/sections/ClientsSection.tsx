'use client'

import { Plus, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { FieldLabel } from '../primitives/FieldLabel'
import { NativeSelect } from '../primitives/NativeSelect'

/**
 * One-or-more client picker. Always renders at least one row; removing
 * the last one collapses back to an empty placeholder rather than
 * leaving the section bare.
 */
export function ClientsSection({
  clientIds,
  onChange,
  clientOptions,
}: {
  clientIds: string[]
  onChange: (next: string[]) => void
  clientOptions: Array<{ id: string; label: string }>
}) {
  const setAt = (idx: number, val: string) => {
    const next = [...clientIds]
    next[idx] = val
    onChange(next)
  }
  const removeAt = (idx: number) => {
    if (clientIds.length === 1) {
      onChange([''])
      return
    }
    onChange(clientIds.filter((_, i) => i !== idx))
  }
  return (
    <div className="space-y-3">
      {clientIds.map((id, idx) => (
        <div key={idx} className="flex items-end gap-2">
          <div className="flex-1">
            <FieldLabel required={idx === 0}>
              {idx === 0 ? 'Client' : `Additional client ${idx}`}
            </FieldLabel>
            <NativeSelect
              value={id}
              onChange={(v) => setAt(idx, v)}
              placeholder="Find a contact to add as client"
              options={clientOptions.map((c) => ({
                value: c.id,
                label: c.label,
              }))}
            />
          </div>
          {idx > 0 && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeAt(idx)}
              aria-label="Remove client"
            >
              <X size={13} style={{ color: 'var(--text-muted)' }} />
            </Button>
          )}
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...clientIds, ''])}
      >
        <Plus size={13} strokeWidth={2} />
        Add another client
      </Button>
    </div>
  )
}
