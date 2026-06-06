'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Briefcase, ChevronDown, User, X } from 'lucide-react'
import { useFirmMembers } from '@/hooks/use-firm-members'
import { useClients } from '@/hooks/use-clients'
import type { Participant } from '../_constants'

const keyOf = (p: { kind: string; id: string }) => `${p.kind}:${p.id}`

interface Option extends Participant {
  sublabel: string
}

/**
 * Multi-select for event participants — firm members and clients. The
 * signed-in user and a linked case's client are pre-seeded by the form hook;
 * this picker lets the user add/remove any firm member or client.
 */
export function ParticipantsPicker({
  value,
  onChange,
}: {
  value: Participant[]
  onChange: (next: Participant[]) => void
}) {
  const { data: members } = useFirmMembers()
  const { data: clients } = useClients()
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

  const memberOptions = useMemo<Option[]>(
    () =>
      (members ?? [])
        .filter((m) => m.status === 'active')
        .map((m) => ({
          kind: 'member',
          id: m.id,
          name: m.name || m.email,
          sublabel: prettyTitle(m.professional_title) || 'Member',
        })),
    [members],
  )
  const clientOptions = useMemo<Option[]>(
    () => (clients ?? []).map((c) => ({ kind: 'client', id: c.id, name: c.full_name, sublabel: 'Client' })),
    [clients],
  )

  const selected = useMemo(() => new Set(value.map(keyOf)), [value])

  const toggle = (p: Participant) => {
    onChange(
      selected.has(keyOf(p))
        ? value.filter((v) => keyOf(v) !== keyOf(p))
        : [...value, { kind: p.kind, id: p.id, name: p.name }],
    )
  }

  const filter = (opts: Option[]) => {
    const q = query.trim().toLowerCase()
    return q ? opts.filter((o) => o.name.toLowerCase().includes(q)) : opts
  }

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
            Add members or clients…
          </span>
        ) : (
          value.map((p) => <Chip key={keyOf(p)} participant={p} onRemove={() => toggle(p)} />)
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
              placeholder="Search members and clients…"
              className="w-full h-8 text-[13px] bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
              autoFocus
            />
          </div>
          <div className="max-h-[260px] overflow-y-auto py-1">
            <Group label="Firm members" options={filter(memberOptions)} selected={selected} onToggle={toggle} />
            <Group label="Clients" options={filter(clientOptions)} selected={selected} onToggle={toggle} />
            {filter(memberOptions).length === 0 && filter(clientOptions).length === 0 && (
              <p className="px-3 py-3 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
                Nothing matches &ldquo;{query}&rdquo;.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ participant, onRemove }: { participant: Participant; onRemove: () => void }) {
  const isClient = participant.kind === 'client'
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium"
      style={
        isClient
          ? { background: 'rgba(201,151,43,0.16)', color: 'var(--gold-dark, #B8860B)' }
          : { background: 'rgba(14,165,233,0.15)', color: '#0369A1' }
      }
      onClick={(e) => e.stopPropagation()}
    >
      {isClient ? <Briefcase size={10} strokeWidth={2} /> : <User size={10} strokeWidth={2} />}
      {participant.name}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="cursor-pointer"
        aria-label={`Remove ${participant.name}`}
      >
        <X size={11} strokeWidth={2} />
      </button>
    </span>
  )
}

function Group({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: Option[]
  selected: Set<string>
  onToggle: (p: Participant) => void
}) {
  if (options.length === 0) return null
  return (
    <div>
      <p
        className="px-3 pt-2 pb-1 text-[10.5px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <ul>
        {options.map((o) => {
          const checked = selected.has(keyOf(o))
          return (
            <li key={keyOf(o)}>
              <button
                type="button"
                onClick={() => onToggle(o)}
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
    </div>
  )
}

function prettyTitle(t?: string | null): string {
  if (!t) return ''
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
