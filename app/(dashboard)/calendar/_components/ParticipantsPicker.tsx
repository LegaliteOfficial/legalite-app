'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { STUB_FIRM_USERS } from '../_constants'

/**
 * Multi-select dropdown for picking firm-user participants. The
 * signed-in user always appears first (marked "(you)") followed by a
 * stub roster — swap STUB_FIRM_USERS for a live `useFirmUsers` hook
 * later without changing this component.
 */
export function ParticipantsPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const currentUserName = useAuthStore((s) => s.user?.name) || 'You'
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Click-outside closes.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const allOptions = useMemo(() => {
    const set = new Set<string>()
    set.add(currentUserName)
    for (const u of STUB_FIRM_USERS) set.add(u)
    for (const v of value) set.add(v)
    return Array.from(set)
  }, [currentUserName, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allOptions
    return allOptions.filter((o) => o.toLowerCase().includes(q))
  }, [allOptions, query])

  const toggle = (name: string) => {
    onChange(
      value.includes(name) ? value.filter((v) => v !== name) : [...value, name],
    )
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <Trigger
        open={open}
        value={value}
        onToggleOpen={() => setOpen((v) => !v)}
        onRemove={(name) => toggle(name)}
      />
      {open && (
        <Listbox
          query={query}
          onQueryChange={setQuery}
          filtered={filtered}
          currentUserName={currentUserName}
          value={value}
          onToggle={toggle}
        />
      )}
    </div>
  )
}

// ── Internals ─────────────────────────────────────────────────────────────

function Trigger({
  open,
  value,
  onToggleOpen,
  onRemove,
}: {
  open: boolean
  value: string[]
  onToggleOpen: () => void
  onRemove: (name: string) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggleOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggleOpen()
        }
      }}
      className="w-full flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-2 min-h-[40px] text-left cursor-pointer"
      style={{
        borderColor: open ? 'var(--gold)' : 'var(--border-default)',
        background: 'var(--surface-card)',
        boxShadow: open ? '0 0 0 2px rgba(201,151,43,0.16)' : 'none',
      }}
      aria-haspopup="listbox"
      aria-expanded={open}
    >
      {value.length === 0 ? (
        <span className="text-[13px] px-1" style={{ color: 'var(--text-muted)' }}>
          Add participants…
        </span>
      ) : (
        value.map((u) => (
          <span
            key={u}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium"
            style={{ background: 'rgba(14,165,233,0.15)', color: '#0369A1' }}
            onClick={(e) => e.stopPropagation()}
          >
            {u}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(u)
              }}
              className="cursor-pointer"
              aria-label={`Remove ${u} from participants`}
            >
              <X size={11} strokeWidth={2} />
            </button>
          </span>
        ))
      )}
      <ChevronDown
        size={13}
        strokeWidth={1.75}
        className="ml-auto"
        style={{ color: 'var(--text-muted)' }}
      />
    </div>
  )
}

function Listbox({
  query,
  onQueryChange,
  filtered,
  currentUserName,
  value,
  onToggle,
}: {
  query: string
  onQueryChange: (v: string) => void
  filtered: string[]
  currentUserName: string
  value: string[]
  onToggle: (name: string) => void
}) {
  return (
    <div
      className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-default)',
        boxShadow: 'var(--shadow-lg)',
      }}
      role="listbox"
    >
      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-soft)' }}>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search firm users…"
          className="w-full h-8 text-[13px] bg-transparent outline-none"
          style={{ color: 'var(--text-primary)' }}
          autoFocus
        />
      </div>
      <ul className="max-h-[220px] overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <li className="px-3 py-3 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
            No firm users match &ldquo;{query}&rdquo;.
          </li>
        ) : (
          filtered.map((name) => (
            <ListboxItem
              key={name}
              name={name}
              isCurrentUser={name === currentUserName}
              checked={value.includes(name)}
              onToggle={() => onToggle(name)}
            />
          ))
        )}
      </ul>
    </div>
  )
}

function ListboxItem({
  name,
  isCurrentUser,
  checked,
  onToggle,
}: {
  name: string
  isCurrentUser: boolean
  checked: boolean
  onToggle: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] cursor-pointer transition-colors"
        style={{
          color: 'var(--text-primary)',
          background: checked ? 'rgba(201,151,43,0.08)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (checked) return
          e.currentTarget.style.background = 'var(--surface-sunken)'
        }}
        onMouseLeave={(e) => {
          if (checked) return
          e.currentTarget.style.background = 'transparent'
        }}
        role="option"
        aria-selected={checked}
      >
        <span
          className="inline-flex h-4 w-4 items-center justify-center rounded-sm border"
          style={{
            borderColor: checked ? 'var(--gold)' : 'var(--border-default)',
            background: checked ? 'var(--gold)' : 'transparent',
          }}
          aria-hidden
        >
          {checked && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
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
        <span className="flex-1 truncate">
          {name}
          {isCurrentUser && (
            <span className="ml-2 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
              (you)
            </span>
          )}
        </span>
      </button>
    </li>
  )
}
