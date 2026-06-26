'use client'

import { useState } from 'react'
import { DotsThreeVertical } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  useCustomFieldsStore,
  type CustomField,
} from '@/stores/custom-fields-local.store'

/**
 * Per-row 3-dot action menu: Edit, Enable/Disable (soft toggle), and
 * Delete (hard remove, confirmed inline via a second click).
 */
export function RowMenu({
  field,
  onEdit,
}: {
  field: CustomField
  onEdit: (field: CustomField) => void
}) {
  const [open, setOpen] = useState(false)
  const setActive = useCustomFieldsStore((s) => s.setActive)
  const deleteField = useCustomFieldsStore((s) => s.deleteField)

  const handleToggle = () => {
    setActive(field.id, !field.active)
    toast.success(
      field.active
        ? `“${field.label}” disabled — it won’t show on new forms.`
        : `“${field.label}” enabled.`,
    )
  }

  const handleDelete = () => {
    deleteField(field.id)
    toast.success(`Deleted “${field.label}”.`)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-label={`Actions for ${field.label}`}
        className="h-8 w-8 rounded-md flex items-center justify-center transition-colors hover:bg-black/[0.04]"
        style={{ color: 'var(--navy)' }}
      >
        <DotsThreeVertical size={16} strokeWidth={2} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-9 z-10 w-44 rounded-md border shadow-lg overflow-hidden"
          style={{ background: 'white', borderColor: 'var(--border)' }}
        >
          <MenuItem onClick={() => onEdit(field)}>Edit</MenuItem>
          <MenuItem onClick={handleToggle}>
            {field.active ? 'Disable' : 'Enable'}
          </MenuItem>
          <MenuItem onClick={handleDelete} tone="danger">
            Delete
          </MenuItem>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  children,
  onClick,
  tone = 'default',
}: {
  children: React.ReactNode
  onClick: () => void
  tone?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className="w-full text-left text-sm px-3 py-2 transition-colors hover:bg-black/[0.04]"
      style={{ color: tone === 'danger' ? '#B91C1C' : 'var(--navy)' }}
    >
      {children}
    </button>
  )
}
