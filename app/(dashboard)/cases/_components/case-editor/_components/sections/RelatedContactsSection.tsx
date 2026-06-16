'use client'

import { Plus, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '../primitives/Checkbox'
import { ContactCombobox } from '../primitives/ContactCombobox'
import { FieldLabel } from '../primitives/FieldLabel'
import type { ContactOption, RelatedContactDraft } from '../../_types'

/**
 * Witnesses, opposing parties, experts — anyone tied to the case
 * besides the client. Each row optionally flags the contact as a "bill
 * recipient" (their address goes on invoices).
 */
export function RelatedContactsSection({
  value,
  onChange,
  contactOptions,
}: {
  value: RelatedContactDraft[]
  onChange: (next: RelatedContactDraft[]) => void
  contactOptions: ContactOption[]
}) {
  const addRow = () => {
    onChange([
      ...value,
      {
        id: crypto.randomUUID(),
        contact_id: '',
        relationship: '',
        bill_recipient: false,
      },
    ])
  }
  const removeRow = (id: string) =>
    onChange(value.filter((r) => r.id !== id))
  const updateRow = (id: string, patch: Partial<RelatedContactDraft>) =>
    onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
          No related contacts yet. Add witnesses, opposing parties, experts,
          etc.
        </p>
      )}
      {value.map((row) => (
        <div
          key={row.id}
          className="rounded-xl border p-4 space-y-3"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div>
              <FieldLabel>Contact</FieldLabel>
              <ContactCombobox
                value={row.contact_id}
                onChange={(v) => updateRow(row.id, { contact_id: v })}
                options={contactOptions}
              />
            </div>
            <div>
              <FieldLabel>Relationship</FieldLabel>
              <Input
                placeholder="e.g. Witness, Opposing counsel"
                value={row.relationship}
                onChange={(e) =>
                  updateRow(row.id, { relationship: e.target.value })
                }
                className="h-10 rounded-lg text-[13px]"
                style={{ borderColor: 'var(--border-default)' }}
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeRow(row.id)}
              aria-label="Remove related contact"
            >
              <Trash size={13} style={{ color: 'var(--text-muted)' }} />
            </Button>
          </div>
          <Checkbox
            checked={row.bill_recipient}
            onChange={(v) => updateRow(row.id, { bill_recipient: v })}
            label="Bill recipient"
            hint="Invoices for this case can be addressed to this contact."
          />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addRow}>
        <Plus size={13} strokeWidth={2} />
        Add related contact
      </Button>
    </div>
  )
}
