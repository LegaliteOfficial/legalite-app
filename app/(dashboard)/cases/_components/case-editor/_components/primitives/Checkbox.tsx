'use client'

import { Check } from '@phosphor-icons/react'

/**
 * Button-pattern checkbox. The native `<label>` wrapping
 * `<input type="checkbox" sr-only>` pattern double-fires the change
 * event on some browsers and the hidden input can hold focus in a way
 * that confuses parent re-renders — net effect is a blank page after
 * the click in certain layouts. `role="checkbox"` + `type="button"`
 * sidesteps both; the explicit type guarantees we never submit any
 * ancestor form.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-start gap-2.5 cursor-pointer select-none text-left"
    >
      <span
        aria-hidden
        className="inline-flex h-[18px] w-[18px] mt-0.5 items-center justify-center rounded-md border transition-colors shrink-0"
        style={{
          borderColor: checked ? 'var(--gold)' : 'var(--border-default)',
          background: checked ? 'var(--gold)' : 'transparent',
        }}
      >
        {checked && (
          <Check size={12} strokeWidth={2.5} style={{ color: 'white' }} />
        )}
      </span>
      <span>
        <span
          className="block text-[13px]"
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
