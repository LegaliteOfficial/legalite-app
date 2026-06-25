'use client'

/**
 * A labelled on/off row. The whole row is the click target; the pill on
 * the right reflects state. Used for the boolean AI preferences.
 */
export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-3.5 text-left"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
        <span className="block text-[13px] mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </span>
      </span>
      <span
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
        style={{ background: checked ? 'var(--gold)' : 'var(--border-strong)' }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </span>
    </button>
  )
}
