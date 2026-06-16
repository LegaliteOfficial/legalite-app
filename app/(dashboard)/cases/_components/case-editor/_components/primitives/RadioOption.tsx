'use client'

/**
 * Button-pattern radio. Same reasoning as `Checkbox` — the native
 * `<input type="radio">` wrapped in a `<label>` double-fires the change
 * event in some browsers and the hidden input can hold focus in a way
 * that confuses parent re-renders. `role="radio"` + `type="button"`
 * sidesteps both; the explicit type guarantees we never submit any
 * ancestor form.
 */
export function RadioOption({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: () => void
  label: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onChange}
      className="inline-flex items-start gap-2.5 cursor-pointer select-none text-left"
    >
      <span
        aria-hidden
        className="inline-flex h-[18px] w-[18px] mt-0.5 items-center justify-center rounded-full border transition-colors shrink-0"
        style={{
          borderColor: checked ? 'var(--gold)' : 'var(--border-default)',
          background: 'transparent',
        }}
      >
        {checked && (
          <span
            className="block h-[8px] w-[8px] rounded-full"
            style={{ background: 'var(--gold)' }}
          />
        )}
      </span>
      <span>
        <span
          className="block text-[13px] font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </span>
        {hint && (
          <span
            className="block text-[11.5px] mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {hint}
          </span>
        )}
      </span>
    </button>
  )
}
