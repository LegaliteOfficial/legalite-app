'use client'

import { useEffect, useRef, useState } from 'react'
import { CaretDown, Columns } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { COLUMNS } from '../_lib/columns'
import type { ColumnId } from '../_types'

/**
 * Two-panel column-visibility popover (Visible columns + Custom Fields).
 * Edits live in a local draft `Set<ColumnId>` and only commit when the
 * user hits "Update columns" — clicking outside discards.
 */
export function ColumnsPicker({
  visible,
  onChange,
}: {
  visible: Set<ColumnId>
  onChange: (next: Set<ColumnId>) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<ColumnId>>(new Set(visible))
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Open the popover with the current applied state, not whatever the
  // user was last editing before cancelling.
  const openPopover = () => {
    setDraft(new Set(visible))
    setOpen(true)
  }
  const cancel = () => setOpen(false)
  const apply = () => {
    onChange(draft)
    setOpen(false)
  }

  const toggle = (id: ColumnId) => {
    const next = new Set(draft)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setDraft(next)
  }

  // Click-outside-to-cancel. Listener attaches only while open to avoid
  // global noise.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (open ? cancel() : openPopover())}
      >
        <Columns size={13} strokeWidth={1.75} />
        Columns
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 480,
          }}
        >
          <div
            className="grid grid-cols-2 divide-x"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <div className="p-4">
              <div
                className="text-[11px] uppercase tracking-wider font-semibold mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Visible columns
              </div>
              <ul className="space-y-1.5">
                {COLUMNS.map((col) => {
                  const checked = draft.has(col.id)
                  return (
                    <li key={col.id}>
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[13px]">
                        <span
                          className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                          style={{
                            borderColor: checked
                              ? 'var(--gold)'
                              : 'var(--border-default)',
                            background: checked ? 'var(--gold)' : 'transparent',
                          }}
                          aria-hidden
                        >
                          {checked && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 6.5L5 9.5L10 3.5"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {col.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(col.id)}
                          className="sr-only"
                        />
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="p-4">
              <div
                className="text-[11px] uppercase tracking-wider font-semibold mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Custom Fields
              </div>
              <div className="relative">
                <input
                  placeholder="Select or search fields"
                  disabled
                  className="w-full h-9 rounded-lg border px-3 pr-9 text-[12.5px] disabled:cursor-not-allowed"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-muted)',
                  }}
                />
                <CaretDown
                  size={12}
                  strokeWidth={1.75}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>
              <p
                className="mt-2 text-[11.5px]"
                style={{ color: 'var(--text-muted)' }}
              >
                Select up to 5 fields
              </p>
              <p
                className="mt-3 text-[11px]"
                style={{ color: 'var(--text-subtle)' }}
              >
                Custom contact fields land with the firm settings screen.
              </p>
            </div>
          </div>
          <div
            className="flex items-center justify-start gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button size="sm" onClick={apply}>
              Update columns
            </Button>
            <Button variant="ghost" size="sm" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
