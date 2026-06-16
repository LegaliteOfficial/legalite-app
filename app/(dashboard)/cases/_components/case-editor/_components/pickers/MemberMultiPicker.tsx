'use client'

import { X } from '@phosphor-icons/react'
import { NativeSelect } from '../primitives/NativeSelect'

/**
 * Picks real firm members by id (value = member id, label = name).
 * Selected members become the case team and are notified by email on
 * case creation.
 */
export function MemberMultiPicker({
  value,
  onChange,
  members,
}: {
  value: string[]
  onChange: (next: string[]) => void
  members: { id: string; name: string }[]
}) {
  const byId = new Map(members.map((m) => [m.id, m]))
  const available = members.filter((m) => !value.includes(m.id))
  const everythingPicked = members.length > 0 && available.length === 0

  return (
    <div className="space-y-2">
      <NativeSelect
        value=""
        onChange={(picked) => {
          if (picked && !value.includes(picked)) onChange([...value, picked])
        }}
        placeholder={
          members.length === 0
            ? 'No firm members yet'
            : everythingPicked
              ? 'All members added'
              : 'Find a firm member'
        }
        options={available.map((m) => ({ value: m.id, label: m.name }))}
        disabled={members.length === 0 || everythingPicked}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11.5px] font-medium"
              style={{
                background: 'var(--surface-sunken)',
                color: 'var(--text-secondary)',
              }}
            >
              {byId.get(id)?.name ?? 'Member'}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== id))}
                className="cursor-pointer"
                aria-label="Remove member"
              >
                <X size={11} strokeWidth={1.75} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
