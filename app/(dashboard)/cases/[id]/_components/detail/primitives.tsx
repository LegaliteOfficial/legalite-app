'use client'

/**
 * Small building blocks shared by the case detail tabs: panels, labelled
 * fields that always render (an empty field says "Not set" rather than
 * disappearing, so nothing is silently missing), click-to-edit text and
 * dates, chips, avatars and countdown pills.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, PencilSimple, X } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/shared/Spinner'
import { cn } from '@/lib/utils'
import { daysUntil, fmtDate, relativeDays, urgencyOf, URGENCY_STYLE } from '../../_lib/case-details'

export function Panel({
  title,
  icon,
  action,
  children,
  className,
  bodyClassName,
  count,
  id,
}: {
  title: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  count?: number
  id?: string
}) {
  return (
    <section
      id={id}
      className={cn('case-panel rounded-2xl border', className)}
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)', boxShadow: 'var(--shadow-xs)' }}
    >
      <header className="flex items-center gap-2 px-5 pb-3 pt-4">
        {icon && (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'var(--gold-muted)', color: 'var(--gold-dark)' }}>
            {icon}
          </span>
        )}
        <h2 className="text-[13.5px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        {count !== undefined && (
          <span className="rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums" style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
            {count}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">{action}</div>
      </header>
      <div className={cn('px-5 pb-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export function FieldGrid({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  return (
    <dl
      className={cn(
        'grid gap-x-6 gap-y-4',
        cols === 1 && 'grid-cols-1',
        cols === 2 && 'grid-cols-1 sm:grid-cols-2',
        cols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      )}
    >
      {children}
    </dl>
  )
}

/** A labelled value. `empty` decides whether to show the "Not set" state. */
export function Field({
  label,
  children,
  empty,
  hint,
  wide,
}: {
  label: string
  children?: ReactNode
  empty?: boolean
  hint?: string
  wide?: boolean
}) {
  return (
    <div className={cn('min-w-0', wide && 'sm:col-span-full')}>
      <dt className="mb-1 text-[11.5px] font-medium uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </dt>
      <dd className="min-w-0 text-[13.5px] leading-snug" style={{ color: 'var(--text-primary)' }}>
        {empty ? <NotSet /> : children}
        {hint && <p className="mt-0.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      </dd>
    </div>
  )
}

export function NotSet({ children = 'Not set' }: { children?: ReactNode }) {
  return <span className="italic" style={{ color: 'var(--text-muted)' }}>{children}</span>
}

export function YesNo({ value }: { value: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: value ? '#12B76A' : '#C4C8CF' }} />
      {value ? 'Yes' : 'No'}
    </span>
  )
}

export function Chips({ items, empty = 'None' }: { items: string[]; empty?: string }) {
  if (items.length === 0) return <NotSet>{empty}</NotSet>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span
          key={t}
          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium"
          style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-sunken)', color: 'var(--text-primary)' }}
        >
          {t}
        </span>
      ))}
    </div>
  )
}

const AVATAR_TINTS = ['#C9972B', '#2E6F95', '#5B7F4A', '#8A4F7D', '#B4532A', '#3D5A80', '#7A6C5D']

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function Avatar({ name, src, size = 32 }: { name: string; src?: string | null; size?: number }) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const tint = AVATAR_TINTS[h % AVATAR_TINTS.length]
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  }
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: tint, fontSize: Math.round(size * 0.38) }}
    >
      {initials(name)}
    </span>
  )
}

/** Date with a coloured "in 5 days" / "2 days ago" badge. */
export function DueBadge({ date, done }: { date?: string | null; done?: boolean }) {
  const days = daysUntil(date)
  if (days === null) return null
  const style = done ? URGENCY_STYLE.none : URGENCY_STYLE[urgencyOf(days)]
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap"
      style={{ color: style.fg, background: style.bg }}
      title={fmtDate(date)}
    >
      {relativeDays(days)}
    </span>
  )
}

function EditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-black/5 focus-visible:opacity-100 group-hover:opacity-100 max-lg:opacity-60"
      style={{ color: 'var(--text-muted)' }}
    >
      <PencilSimple size={13} />
    </button>
  )
}

function SaveCancel({ saving, onSave, onCancel }: { saving: boolean; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        aria-label="Save"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-60"
        style={{ background: 'var(--navy)', color: '#fff' }}
      >
        {saving ? <Spinner size={13} /> : <Check size={14} weight="bold" />}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        aria-label="Cancel"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

/**
 * Click-to-edit text. Enter saves (Ctrl/Cmd+Enter when multiline), Escape
 * cancels. Stays in edit mode with the draft intact if the save fails.
 */
export function EditableText({
  value,
  placeholder,
  onSave,
  multiline,
  className,
  displayClassName,
  label = 'Edit',
  renderValue,
}: {
  value: string
  placeholder: string
  onSave: (v: string) => Promise<boolean>
  multiline?: boolean
  className?: string
  displayClassName?: string
  label?: string
  renderValue?: (v: string) => ReactNode
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) ref.current?.focus()
  }, [editing])

  const start = () => {
    setDraft(value)
    setEditing(true)
  }
  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }
  const commit = async () => {
    if (draft.trim() === value.trim()) return setEditing(false)
    setSaving(true)
    const ok = await onSave(draft.trim())
    setSaving(false)
    if (ok) setEditing(false)
  }

  if (editing) {
    const onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') cancel()
      if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        void commit()
      }
    }
    return (
      <div className={cn('flex items-start gap-2', className)}>
        {multiline ? (
          <Textarea ref={ref} value={draft} rows={6} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} className="flex-1 text-[13.5px] leading-relaxed" disabled={saving} />
        ) : (
          <Input ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} className="h-8 flex-1 text-[13.5px]" disabled={saving} />
        )}
        <SaveCancel saving={saving} onSave={() => void commit()} onCancel={cancel} />
      </div>
    )
  }

  return (
    <div className={cn('group flex items-start gap-1.5', className)}>
      <button
        type="button"
        onClick={start}
        className={cn('min-w-0 flex-1 cursor-text rounded-md text-left', multiline && 'whitespace-pre-wrap', displayClassName)}
        style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        {value ? (renderValue ? renderValue(value) : value) : <span className="italic">{placeholder}</span>}
      </button>
      <EditButton onClick={start} label={label} />
    </div>
  )
}

/** Click-to-edit date (YYYY-MM-DD), with an optional countdown badge. */
export function EditableDate({
  value,
  onSave,
  placeholder = 'Not set',
  countdown,
  label = 'Edit date',
}: {
  value?: string | null
  onSave: (v: string) => Promise<boolean>
  placeholder?: string
  countdown?: boolean
  label?: string
}) {
  const current = value ? value.slice(0, 10) : ''
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(current)
  const [saving, setSaving] = useState(false)

  const commit = async () => {
    if (!draft || draft === current) return setEditing(false)
    setSaving(true)
    const ok = await onSave(draft)
    setSaving(false)
    if (ok) setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="date"
          autoFocus
          value={draft}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="h-8 rounded-lg border px-2.5 text-[13px]"
          style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-card)', color: 'var(--text-primary)', colorScheme: 'light' }}
        />
        <SaveCancel saving={saving} onSave={() => void commit()} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  const start = () => {
    setDraft(current)
    setEditing(true)
  }
  return (
    <div className="group flex flex-wrap items-center gap-2">
      <button type="button" onClick={start} className="cursor-text text-left">
        {current ? fmtDate(current) : <NotSet>{placeholder}</NotSet>}
      </button>
      {countdown && current && <DueBadge date={current} />}
      <EditButton onClick={start} label={label} />
    </div>
  )
}
