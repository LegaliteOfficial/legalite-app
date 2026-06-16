'use client'

import { useState } from 'react'
import { CaretDown, Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { ContactOption } from '../../_types'

/**
 * Searchable contact combobox — text-input filtering + popover list of
 * matching contacts + a "+ New contact" entry at the bottom (stubbed
 * to a toast until the quick-create form ships).
 *
 * Stores the contact ID in `value` when a real option is picked, or the
 * raw typed text otherwise — that lets the user record a contact name
 * even before a backing contact record exists (the save handler will
 * either resolve to an existing ID or create one).
 */
export function ContactCombobox({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (next: string) => void
  options: ContactOption[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  // If `value` is a known contact ID, surface its label in the input
  // when the popover is closed. While typing we show the raw query.
  const selected = options.find((o) => o.id === value)
  const displayValue = open ? query : (selected?.label ?? value)

  const filtered = options.filter((o) => {
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return (
      o.label.toLowerCase().includes(q) ||
      (o.email ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="relative">
      <input
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          // Typing wipes any previous selection — the user is searching
          // for a new contact.
          onChange(e.target.value)
        }}
        onFocus={() => {
          setOpen(true)
          setQuery('')
        }}
        onBlur={() => {
          // Delay close so a mousedown on a list item can fire first.
          setTimeout(() => setOpen(false), 150)
        }}
        placeholder="Search for a contact's name and/or email"
        className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px]"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
        }}
      />
      <CaretDown
        size={13}
        strokeWidth={1.75}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-muted)' }}
      />
      {open && (
        <div
          className="absolute z-30 left-0 right-0 top-full mt-1 rounded-lg border max-h-[260px] overflow-y-auto"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {filtered.length === 0 && (
            <div
              className="px-3 py-2.5 text-[12.5px]"
              style={{ color: 'var(--text-muted)' }}
            >
              No matching contacts. Try a different name or create one below.
            </div>
          )}
          {filtered.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(opt.id)
                setOpen(false)
              }}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-[13px] transition-colors cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold shrink-0"
                style={{
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-muted)',
                }}
                aria-hidden
              >
                {opt.label
                  .split(' ')
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate font-medium">{opt.label}</span>
                {opt.email && (
                  <span
                    className="block truncate text-[11.5px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {opt.email}
                  </span>
                )}
              </span>
            </button>
          ))}
          <div
            className="border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                setOpen(false)
                toast.info('New contact form is coming next.')
              }}
              className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-[13px] font-medium transition-colors cursor-pointer"
              style={{ color: 'var(--gold-dark)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <Plus size={13} strokeWidth={2} />
              New contact
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
