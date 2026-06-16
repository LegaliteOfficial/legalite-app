'use client'

import { CaretDown } from '@phosphor-icons/react'

/**
 * Funnel-chip visual presentation. Renders a `<span>` (NOT a button)
 * because it's always wrapped inside the DropdownMenuTrigger's actual
 * button. Nested buttons would be invalid HTML and would silently drop
 * the inner click — surfaced as "chip looks open but dropdown is empty".
 *
 * Gold-tinted background + count badge / active-text when one or more
 * options are selected so the user can tell at a glance whether a
 * filter is active.
 */
export function ChipTrigger({
  icon,
  label,
  activeCount,
  activeText,
}: {
  icon: React.ReactNode
  label: string
  activeCount?: number
  activeText?: string
}) {
  const active = (activeCount && activeCount > 0) || !!activeText
  return (
    <span
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12.5px] font-medium cursor-pointer"
      style={{
        borderColor: active ? 'var(--gold)' : 'var(--border-default)',
        background: active
          ? 'var(--accent-today-tint)'
          : 'var(--surface-card)',
        color: 'var(--text-secondary)',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
      {label}
      {activeCount != null && activeCount > 0 && (
        <span
          className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10.5px] font-semibold"
          style={{
            background: 'var(--accent-today-tint-strong)',
            color: 'var(--accent-today)',
          }}
        >
          {activeCount}
        </span>
      )}
      {activeText && (
        <span
          className="text-[11.5px] font-semibold"
          style={{ color: 'var(--accent-today)' }}
        >
          · {activeText}
        </span>
      )}
      <CaretDown
        size={11}
        strokeWidth={1.75}
        style={{ color: 'var(--text-muted)' }}
      />
    </span>
  )
}
