'use client'

import { X } from '@phosphor-icons/react'
import { NativeSelect } from '../primitives/NativeSelect'
import type { SelectOptionGroup } from '../../_types'

/**
 * Multi-pick dropdown for firm users / groups. Renders as a native
 * `<select>` grouped into "Groups" / "Users" via `<optgroup>`. Picking
 * an entry adds it to `value` and the trigger resets back to the
 * placeholder so the user can keep adding without re-opening.
 *
 *   - Already-selected items are hidden from the dropdown so the user
 *     can't double-add the same person.
 *   - By default the picked items render as removable chips beneath
 *     the trigger. Pass `hideSelectedPills` if the parent already has
 *     its own roster panel (Permissions section uses that pattern).
 */
export function FirmUserMultiPicker({
  value,
  onChange,
  firmUsers,
  groups = [],
  placeholder = 'Find a firm user',
  hideSelectedPills = false,
  onFocus,
  onBlur,
}: {
  value: string[]
  onChange: (next: string[]) => void
  firmUsers: string[]
  groups?: string[]
  placeholder?: string
  hideSelectedPills?: boolean
  /**
   * Forwarded to the underlying `<select>`. Lets the parent react to
   * the user focusing the picker — e.g. to show an empty-state hint
   * that only appears once they've actually engaged the field.
   */
  onFocus?: () => void
  onBlur?: () => void
}) {
  const availableUsers = firmUsers.filter((u) => !value.includes(u))
  const availableGroups = groups.filter((g) => !value.includes(g))
  const optgroups: SelectOptionGroup[] = [
    ...(availableGroups.length > 0
      ? [{ label: 'Groups', options: availableGroups }]
      : []),
    ...(availableUsers.length > 0
      ? [{ label: 'Users', options: availableUsers }]
      : []),
  ]
  const everythingPicked = optgroups.length === 0

  return (
    <div className="space-y-2">
      <NativeSelect
        // value stays empty so the trigger always shows the placeholder
        // — this is a stateless "picker" that emits adds to the parent.
        value=""
        onChange={(picked) => {
          if (picked && !value.includes(picked)) {
            onChange([...value, picked])
          }
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={
          everythingPicked
            ? 'All available users / groups added'
            : placeholder
        }
        groups={optgroups}
        disabled={everythingPicked}
      />
      {!hideSelectedPills && value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((u) => (
            <span
              key={u}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11.5px] font-medium"
              style={{
                background: 'var(--surface-sunken)',
                color: 'var(--text-secondary)',
              }}
            >
              {u}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== u))}
                className="cursor-pointer"
                aria-label={`Remove ${u}`}
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
