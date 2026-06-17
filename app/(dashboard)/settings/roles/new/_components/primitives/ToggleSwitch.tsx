'use client'

/**
 * Switch-style toggle — gold filled when on, neutral when off. Used by
 * every permission row.
 */
export function ToggleSwitch({
  id,
  checked,
  onChange,
  disabled,
}: {
  id?: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: checked ? 'var(--gold)' : '#D1D5DB' }}
    >
      <span
        className="pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform"
        style={{
          transform: checked
            ? 'translateX(1.125rem)'
            : 'translateX(0.15rem)',
        }}
      />
    </button>
  )
}
