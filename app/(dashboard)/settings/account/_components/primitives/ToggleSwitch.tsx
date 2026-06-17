'use client'

export function ToggleSwitch({
  checked,
  onToggle,
  disabled = false,
}: {
  checked: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: checked ? '#C9972B' : '#D1D5DB' }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out"
        style={{
          transform: checked ? 'translateX(1.25rem)' : 'translateX(0.15rem)',
        }}
      />
    </button>
  )
}
