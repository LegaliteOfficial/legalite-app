'use client'

import { CaretDown, X } from '@phosphor-icons/react'
import type { OptionGroup } from '../_types'

/**
 * Native <select> wrapper styled to match the filter drawer. We use a
 * native select instead of a fancy primitive because the drawer hosts
 * ~10 of these and native keyboard/scroll inside a Dialog stays
 * predictable.
 *
 * Provide EITHER `options` (flat list) OR `groups` (sectioned with
 * <optgroup> headers). If both are given, `groups` wins.
 */
export function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  groups,
  disabled = false,
  disabledHint,
  clearable = false,
}: {
  value: string
  onChange: (next: string) => void
  placeholder: string
  options?: readonly string[]
  groups?: readonly OptionGroup[]
  disabled?: boolean
  disabledHint?: string
  clearable?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer disabled:cursor-not-allowed"
        style={{
          borderColor: 'var(--border-default)',
          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          opacity: disabled ? 0.7 : 1,
          // Force the native popup to render with the light theme even on
          // dark OS — matches the rest of the app.
          colorScheme: 'light',
        }}
      >
        <option value="">{placeholder}</option>
        {groups
          ? groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </optgroup>
          ))
          : (options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
      </select>
      <div
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {clearable && value && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onChange('')
            }}
            className="pointer-events-auto p-0.5 rounded cursor-pointer"
          >
            <X size={12} strokeWidth={1.75} />
          </button>
        )}
        <CaretDown size={13} strokeWidth={1.75} />
      </div>
      {disabled && disabledHint && (
        <p className="mt-1 text-[11px]" style={{ color: 'var(--text-subtle)' }}>
          {disabledHint}
        </p>
      )}
    </div>
  )
}
