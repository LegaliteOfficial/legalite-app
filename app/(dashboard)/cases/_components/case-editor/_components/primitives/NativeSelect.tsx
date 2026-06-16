'use client'

import { CaretDown } from '@phosphor-icons/react'
import type { SelectOptionGroup } from '../../_types'

/**
 * Native `<select>` styled to match the editor's other inputs. Light
 * caret on the right, soft border, supports either a flat options list
 * or `<optgroup>`-grouped sections.
 *
 * `colorScheme: light` forces the native option popup to render in
 * light mode regardless of the OS preference — without it macOS dark
 * users see a black popup against our light page.
 */
export function NativeSelect({
  value,
  onChange,
  placeholder,
  options,
  groups,
  disabled = false,
  onFocus,
  onBlur,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  options?: Array<{ value: string; label: string }> | readonly string[]
  /**
   * Optional grouped form — renders `<optgroup>` sections (e.g. Users /
   * Groups in firm-user pickers). If both `options` and `groups` are
   * provided, `groups` wins.
   */
  groups?: SelectOptionGroup[]
  disabled?: boolean
  /**
   * Optional focus callbacks — used by callers that want to surface
   * additional context (e.g. an empty-state hint) only when the user
   * actively engages the dropdown.
   */
  onFocus?: () => void
  onBlur?: () => void
}) {
  const normalize = (
    opts:
      | Array<{ value: string; label: string }>
      | readonly string[]
      | undefined,
  ) =>
    !opts
      ? []
      : opts.length === 0 || typeof opts[0] === 'string'
        ? (opts as unknown as readonly string[]).map((o) => ({
            value: o,
            label: o,
          }))
        : (opts as Array<{ value: string; label: string }>)
  const flat = normalize(options)
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer disabled:cursor-not-allowed"
        style={{
          borderColor: 'var(--border-default)',
          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          opacity: disabled ? 0.7 : 1,
          colorScheme: 'light',
        }}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {groups
          ? groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {normalize(g.options).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))
          : flat.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
      </select>
      <CaretDown
        size={13}
        strokeWidth={1.75}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-muted)' }}
      />
    </div>
  )
}
