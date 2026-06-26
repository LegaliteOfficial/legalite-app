'use client'

import { CaretDown } from '@phosphor-icons/react'

/** Label + optional hint wrapper around any control. */
export function Field({
  label,
  hint,
  htmlFor,
  required,
  children,
}: {
  label: string
  hint?: string
  htmlFor?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
        {required && <span style={{ color: 'var(--gold-dark)' }}> *</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[12px] leading-snug" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

/** Native select styled to match the firm form inputs. */
export function NativeSelect({
  id,
  value,
  onChange,
  options,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full rounded-lg border bg-white h-10 px-3 pr-9 text-sm transition-colors focus:outline-none focus:border-yellow-600"
        style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <CaretDown
        size={13}
        strokeWidth={2.25}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--text-muted)' }}
      />
    </div>
  )
}
