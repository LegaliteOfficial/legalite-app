'use client'

import { ToggleSwitch } from './ToggleSwitch'

/**
 * One permission line — label on the left, switch on the right.
 * Locked rows render with greyed text + "locked" pill and don't toggle.
 */
export function PermissionRow({
  id,
  label,
  enabled,
  locked,
  onToggle,
}: {
  id: string
  label: string
  enabled: boolean
  locked: boolean
  onToggle: () => void
}) {
  return (
    <label
      htmlFor={`perm-${id}`}
      className="flex items-center justify-between gap-4 py-2 px-1 rounded-md transition-colors hover:bg-black/[0.02]"
      style={{ cursor: locked ? 'not-allowed' : 'pointer' }}
    >
      <span
        className="text-sm"
        style={{ color: locked ? '#9CA3AF' : 'var(--navy)' }}
      >
        {label}
        {locked && (
          <span
            className="ml-2 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: '#9CA3AF' }}
          >
            locked
          </span>
        )}
      </span>
      <ToggleSwitch
        id={`perm-${id}`}
        checked={enabled}
        onChange={onToggle}
        disabled={locked}
      />
    </label>
  )
}
