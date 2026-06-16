'use client'

import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'

/**
 * Collapsible search input. Renders as a square icon-button until the
 * user activates it; expands to a 224px input with an inline clear
 * affordance. Auto-collapses on blur when empty so the row stays tidy.
 */
export function SearchBox({
  open,
  value,
  onOpen,
  onChange,
  onBlur,
}: {
  open: boolean
  value: string
  onOpen: () => void
  onChange: (next: string) => void
  /** Called when the input loses focus AND value is empty. */
  onBlur: () => void
}) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label="Search"
        className="inline-flex items-center justify-center h-9 w-9 rounded-lg border cursor-pointer"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-secondary)',
        }}
      >
        <MagnifyingGlass size={13} strokeWidth={1.75} />
      </button>
    )
  }
  return (
    <div className="relative w-56">
      <MagnifyingGlass
        size={13}
        strokeWidth={1.75}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-subtle)' }}
      />
      <Input
        autoFocus
        placeholder="Search clients…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          if (!value) onBlur()
        }}
        className="pl-9 pr-8 h-9 text-[13px] rounded-lg"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-5 w-5 rounded-md cursor-pointer"
          style={{ color: 'var(--text-subtle)' }}
        >
          <X size={12} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
