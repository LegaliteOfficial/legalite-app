'use client'

import { useState } from 'react'
import { CaretDown, CaretRight } from '@phosphor-icons/react'

/**
 * Reusable collapsible card used by every dashboard panel. Chevron on
 * the left toggles expand/collapse; an optional right-slot holds
 * actions (Edit, Copy, etc.).
 */
export function CollapsibleCard({
  label,
  defaultOpen = true,
  rightSlot,
  children,
}: {
  label: string
  defaultOpen?: boolean
  rightSlot?: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section
      className="rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <header className="flex items-center justify-between px-5 py-3.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold cursor-pointer"
          style={{ color: 'var(--text-primary)' }}
          aria-expanded={open}
        >
          {open ? (
            <CaretDown size={14} strokeWidth={2} />
          ) : (
            <CaretRight size={14} strokeWidth={2} />
          )}
          {label}
        </button>
        {rightSlot}
      </header>
      {open && (
        <div
          className="px-5 pb-5 border-t pt-4"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          {children}
        </div>
      )}
    </section>
  )
}
