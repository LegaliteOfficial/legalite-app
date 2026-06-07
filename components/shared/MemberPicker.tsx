'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, User, X } from 'lucide-react'
import { useFirmMembers } from '@/hooks/use-firm-members'

/** A picked firm member — the minimal shape the task composer needs. */
export interface PickedMember {
  /** firm_members.id — what the backend's `assignee_member_ids` expects. */
  id: string
  name: string
  title?: string | null
}

interface Option extends PickedMember {
  sublabel: string
}

/**
 * Multi-select for firm members — used to assign a task to one or more
 * teammates. Mirrors the calendar ParticipantsPicker, trimmed to members
 * only (tasks are assigned to people, not clients). Returns the picked
 * `firm_members.id` set so the composer can map straight to
 * `assignee_member_ids`.
 */
export function MemberPicker({
  value,
  onChange,
  placeholder = 'Assign to firm members…',
}: {
  value: PickedMember[]
  onChange: (next: PickedMember[]) => void
  placeholder?: string
}) {
  const { data: members } = useFirmMembers()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

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

  const options = useMemo<Option[]>(
    () =>
      (members ?? [])
        .filter((m) => m.status === 'active')
        .map((m) => ({
          id: m.id,
          name: m.name || m.email,
          title: m.professional_title,
          sublabel: prettyTitle(m.professional_title) || 'Member',
        })),
    [members],
  )

  const selected = useMemo(() => new Set(value.map((v) => v.id)), [value])

  const toggle = (m: PickedMember) => {
    onChange(
      selected.has(m.id)
        ? value.filter((v) => v.id !== m.id)
        : [...value, { id: m.id, name: m.name, title: m.title }],
    )
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options
  }, [options, query])

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((v) => !v)
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
            {placeholder}
          </span>
        ) : (
          value.map((m) => <Chip key={m.id} member={m} onRemove={() => toggle(m)} />)
        )}
        <ChevronDown size={13} strokeWidth={1.75} className="ml-auto" style={{ color: 'var(--text-muted)' }} />
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border overflow-hidden"
          style={{ background: 'var(--surface-card)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-lg)' }}
          role="listbox"
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-soft)' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members…"
              className="w-full h-8 text-[13px] bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
              autoFocus
            />
          </div>
          <div className="max-h-[260px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
                {options.length === 0
                  ? 'No active firm members yet.'
                  : `Nothing matches “${query}”.`}
              </p>
            ) : (
              <ul>
                {filtered.map((o) => {
                  const checked = selected.has(o.id)
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => toggle(o)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] cursor-pointer transition-colors"
                        style={{ color: 'var(--text-primary)', background: checked ? 'rgba(201,151,43,0.08)' : 'transparent' }}
                        role="option"
                        aria-selected={checked}
                      >
                        <span
                          className="inline-flex h-4 w-4 items-center justify-center rounded-sm border shrink-0"
                          style={{
                            borderColor: checked ? 'var(--gold)' : 'var(--border-default)',
                            background: checked ? 'var(--gold)' : 'transparent',
                          }}
                          aria-hidden
                        >
                          {checked && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6.5L5 9.5L10 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="flex-1 truncate">{o.name}</span>
                        <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                          {o.sublabel}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ member, onRemove }: { member: PickedMember; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium"
      style={{ background: 'rgba(14,165,233,0.15)', color: '#0369A1' }}
      onClick={(e) => e.stopPropagation()}
    >
      <User size={10} strokeWidth={2} />
      {member.name}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="cursor-pointer"
        aria-label={`Remove ${member.name}`}
      >
        <X size={11} strokeWidth={2} />
      </button>
    </span>
  )
}

function prettyTitle(t?: string | null): string {
  if (!t) return ''
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
