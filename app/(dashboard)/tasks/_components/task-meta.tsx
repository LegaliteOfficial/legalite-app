'use client'

/**
 * Task display metadata + Linear-style status / priority glyphs.
 *
 * These are the visual primitives the list and board views share:
 *   - StatusIcon   — circular progress glyph (backlog → in-progress → done)
 *   - PriorityIcon — the signature three-bar priority indicator
 *   - normalisers + small formatters
 *
 * Backend constraint: status ∈ {Pending, In Progress, Done},
 * priority ∈ {High, Medium, Low}. We keep to those but render them with
 * a richer, Linear-inspired visual language.
 */

import type { Task } from '@/hooks/use-tasks'

export type TaskStatus = 'Pending' | 'In Progress' | 'Done'
export type TaskPriority = 'High' | 'Medium' | 'Low'

export const STATUSES: TaskStatus[] = ['Pending', 'In Progress', 'Done']
export const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low']

export const STATUS_META: Record<
  TaskStatus,
  { label: string; color: string; next: TaskStatus; order: number }
> = {
  Pending: { label: 'Pending', color: '#8A8F99', next: 'In Progress', order: 0 },
  'In Progress': { label: 'In Progress', color: '#C9972B', next: 'Done', order: 1 },
  Done: { label: 'Done', color: '#2E7D4F', next: 'Pending', order: 2 },
}

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; color: string; tint: string; rank: number }
> = {
  High: { label: 'High', color: '#C0392B', tint: 'rgba(192,57,43,0.12)', rank: 0 },
  Medium: { label: 'Medium', color: '#C9972B', tint: 'rgba(201,151,43,0.14)', rank: 1 },
  Low: { label: 'Low', color: '#8A8F99', tint: 'rgba(138,143,153,0.14)', rank: 2 },
}

export const normPriority = (p: string | null | undefined): TaskPriority =>
  p === 'High' || p === 'Low' ? p : 'Medium'
export const normStatus = (s: string | null | undefined): TaskStatus =>
  s === 'In Progress' || s === 'Done' ? s : 'Pending'

// ── Status glyph ─────────────────────────────────────────────────────────

/**
 * Linear-style status circle. Pending = dashed ring, In Progress = half-filled
 * ring, Done = solid check. Clickable when `onClick` is supplied (cycles).
 */
export function StatusIcon({
  status,
  size = 16,
  onClick,
  className,
}: {
  status: TaskStatus
  size?: number
  onClick?: (e: React.MouseEvent) => void
  className?: string
}) {
  const { color, next } = STATUS_META[status]
  const glyph = (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      {status === 'Pending' && (
        <circle
          cx="8"
          cy="8"
          r="6.4"
          stroke={color}
          strokeWidth="1.6"
          strokeDasharray="2 2.6"
          fill="none"
        />
      )}
      {status === 'In Progress' && (
        <>
          <circle cx="8" cy="8" r="6.4" stroke={color} strokeWidth="1.6" fill="none" />
          <circle
            cx="8"
            cy="8"
            r="3.2"
            fill="none"
            stroke={color}
            strokeWidth="6.4"
            strokeDasharray="10 20.1"
            transform="rotate(-90 8 8)"
          />
        </>
      )}
      {status === 'Done' && (
        <>
          <circle cx="8" cy="8" r="7" fill={color} />
          <path
            d="M4.8 8.2 L7 10.4 L11.3 5.8"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}
    </svg>
  )

  if (!onClick) return <span className={className}>{glyph}</span>
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Mark as ${next}`}
      aria-label={`Status: ${status}. Click to mark as ${next}`}
      className={`inline-flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${className ?? ''}`}
    >
      {glyph}
    </button>
  )
}

// ── Priority glyph ───────────────────────────────────────────────────────

/** Three-bar priority indicator. Filled bars = priority strength. */
export function PriorityIcon({
  priority,
  size = 16,
}: {
  priority: TaskPriority
  size?: number
}) {
  const { color } = PRIORITY_META[priority]
  const empty = 'rgba(13,27,42,0.14)'
  // High = 3 filled, Medium = 2 filled, Low = 1 filled.
  const filledCount = priority === 'High' ? 3 : priority === 'Medium' ? 2 : 1
  const bars = [
    { x: 2, y: 9, h: 5 },
    { x: 6.5, y: 6, h: 8 },
    { x: 11, y: 3, h: 11 },
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      {bars.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width="3"
          height={b.h}
          rx="1"
          fill={i < filledCount ? color : empty}
        />
      ))}
    </svg>
  )
}

// ── Avatars ──────────────────────────────────────────────────────────────

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Deterministic soft colour per name so avatars stay stable + distinct. */
const AVATAR_TINTS = [
  ['rgba(201,151,43,0.18)', '#A07A1E'],
  ['rgba(37,99,235,0.16)', '#1D4ED8'],
  ['rgba(46,125,79,0.16)', '#216A43'],
  ['rgba(124,58,237,0.16)', '#6D28D9'],
  ['rgba(192,57,43,0.14)', '#A93226'],
  ['rgba(15,118,110,0.16)', '#0F766E'],
] as const

export function avatarColors(name: string): readonly [string, string] {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_TINTS[h % AVATAR_TINTS.length]
}

export function AssigneeStack({
  assignees,
  max = 3,
}: {
  assignees: Task['assignees']
  max?: number
}) {
  if (assignees.length === 0) return null
  const shown = assignees.slice(0, max)
  const extra = assignees.length - shown.length
  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {shown.map((a) => {
          const [bg, fg] = avatarColors(a.name)
          return (
            <span
              key={a.id}
              title={a.name}
              className="inline-flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-semibold ring-2"
              style={{ background: bg, color: fg, '--tw-ring-color': 'var(--surface-card)' } as React.CSSProperties}
            >
              {initials(a.name)}
            </span>
          )
        })}
      </div>
      {extra > 0 && (
        <span className="ml-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          +{extra}
        </span>
      )}
    </div>
  )
}

// ── Formatters ───────────────────────────────────────────────────────────

/** Compact, relative-aware due label. Returns null when no date. */
export function formatDue(iso: string | null | undefined): {
  label: string
  overdue: boolean
  soon: boolean
} | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDue = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayDiff = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86400000)
  const overdue = d.getTime() < now.getTime()
  const soon = dayDiff >= 0 && dayDiff <= 2

  let label: string
  if (dayDiff === 0) label = 'Today'
  else if (dayDiff === 1) label = 'Tomorrow'
  else if (dayDiff === -1) label = 'Yesterday'
  else if (dayDiff > 1 && dayDiff < 7) label = d.toLocaleDateString('en-GB', { weekday: 'short' })
  else label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return { label, overdue, soon }
}
