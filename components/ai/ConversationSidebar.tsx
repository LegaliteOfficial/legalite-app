'use client'

import { useMemo, useState } from 'react'
import {
  MagnifyingGlass,
  Plus,
  ChatCircle,
  DotsThree,
  PencilSimple,
  PushPin,
  PushPinSlash,
  Trash,
  X,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SessionRecord } from '@/lib/ai/sessions'

/**
 * Conversation sidebar — mirrors Claude Desktop's left rail:
 *
 *   Top    : "New chat" button + a search input.
 *   Middle : sessions grouped by recency:
 *              Pinned · Today · Yesterday · Previous 7 days ·
 *              Previous 30 days · Older
 *            Pinned has its own group at the very top, exempt from
 *            the eviction cap; everything else is grouped by the
 *            `updated_at` timestamp relative to today.
 *   Row    : single-line title; the overflow menu lives in the
 *            top-right and surfaces on hover with Rename / Pin /
 *            Delete. Inline rename uses an in-place input so the
 *            partner doesn't have to leave the sidebar.
 *   Footer : conversation count.
 *
 * The reuse of `formatRelative` for per-row hover tooltip + the
 * group buckets means a session that just left the "Today" group
 * doesn't disappear — it slides one row down into "Yesterday" on
 * the next render. The chronology stays legible.
 */
export function ConversationSidebar({
  sessions, activeId, onSelect, onDelete, onRename, onTogglePin, onNew,
}: {
  sessions: SessionRecord[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onTogglePin: (id: string) => void
  onNew: () => void
}) {
  const [query, setQuery] = useState('')
  // The row currently in rename mode; null when nothing's being
  // edited. Storing the working title here keeps the input
  // controlled without leaking state into the parent.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Filter + group. Pinned bucket always renders first; everything
  // else falls into a recency bucket based on `updated_at`.
  const groups = useMemo(
    () => groupSessions(sessions, query),
    [sessions, query],
  )
  const visibleCount = groups.reduce((n, g) => n + g.items.length, 0)

  const beginRename = (s: SessionRecord) => {
    setEditingId(s.id)
    setEditingTitle(s.title)
  }
  const commitRename = () => {
    if (editingId && editingTitle.trim()) {
      onRename(editingId, editingTitle.trim())
    }
    setEditingId(null)
    setEditingTitle('')
  }
  const cancelRename = () => {
    setEditingId(null)
    setEditingTitle('')
  }

  return (
    <div
      className="w-[260px] shrink-0 border-r flex flex-col"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-sunken)',
      }}
    >
      {/* ─── Top: New chat + search ─────────────────────────── */}
      <div
        className="px-3 pt-3 pb-2 border-b space-y-2"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <Button
          onClick={onNew}
          size="sm"
          className="w-full justify-start rounded-lg h-9 text-[13px] font-semibold"
          style={{ background: 'var(--gold)', color: 'var(--navy)' }}
        >
          <Plus size={14} strokeWidth={2.25} />
          New chat
        </Button>

        <div className="relative">
          <MagnifyingGlass
            size={12}
            strokeWidth={1.75}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats…"
            className="h-8 pl-7 pr-7 text-[12.5px] rounded-md"
            style={{ background: 'var(--surface-card)' }}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 inline-flex items-center justify-center rounded cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={10} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Middle: grouped list ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {sessions.length === 0 ? (
          <EmptySidebarState />
        ) : visibleCount === 0 ? (
          <NoMatchState query={query} />
        ) : (
          groups.map((g) => (
            <div key={g.label} className="mb-3 last:mb-0">
              <div
                className="px-2 pt-1 pb-1 text-[10.5px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {g.label === 'Pinned' && <PushPin size={9} strokeWidth={2} />}
                {g.label}
              </div>
              {g.items.map((s) => {
                const isActive = activeId === s.id
                const isEditing = editingId === s.id
                return (
                  <div
                    key={s.id}
                    className="group relative flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors"
                    style={{
                      background: isActive
                        ? 'rgba(201,151,43,0.10)'
                        : 'transparent',
                    }}
                    onClick={() => !isEditing && onSelect(s.id)}
                    onMouseEnter={(e) => {
                      if (!isActive && !isEditing)
                        e.currentTarget.style.background =
                          'var(--surface-card)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive && !isEditing)
                        e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {/* Title — inline rename when in edit mode. */}
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={commitRename}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            commitRename()
                          } else if (e.key === 'Escape') {
                            e.preventDefault()
                            cancelRename()
                          }
                        }}
                        className="flex-1 min-w-0 bg-transparent text-[12.5px] font-medium outline-none border-b"
                        style={{
                          color: 'var(--text-primary)',
                          borderColor: 'var(--gold)',
                        }}
                      />
                    ) : (
                      <span
                        className="flex-1 min-w-0 text-[12.5px] font-medium truncate"
                        style={{
                          color: isActive
                            ? 'var(--text-primary)'
                            : 'var(--text-secondary)',
                        }}
                        title={`${s.title} · ${formatRelative(s.updated_at)}`}
                      >
                        {s.title}
                      </span>
                    )}

                    {/* Pin marker — surfaces even when not hovering
                        so the partner can spot pinned threads at
                        a glance. */}
                    {s.pinned && !isEditing && (
                      <PushPin
                        size={10}
                        strokeWidth={2}
                        className="shrink-0"
                        style={{ color: 'var(--gold)' }}
                      />
                    )}

                    {/* Overflow menu — hidden until hover/active to
                        keep the rail clean, matching the Desktop
                        app's affordance pattern. */}
                    {!isEditing && (
                      <RowMenu
                        session={s}
                        visible={isActive}
                        onRename={() => beginRename(s)}
                        onTogglePin={() => onTogglePin(s.id)}
                        onDelete={() => onDelete(s.id)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* ─── Footer: count ──────────────────────────────────── */}
      <div
        className="px-3 py-2 border-t text-[10.5px] tabular-nums"
        style={{
          borderColor: 'var(--border-soft)',
          color: 'var(--text-muted)',
        }}
      >
        {sessions.length === 0
          ? 'No conversations yet'
          : `${sessions.length} conversation${sessions.length === 1 ? '' : 's'}`}
      </div>
    </div>
  )
}

/**
 * Per-row overflow menu. Always reserves space (via `opacity` rather
 * than conditional rendering) so the row's title width doesn't
 * shift when hovered — keeps the sidebar visually calm.
 */
function RowMenu({
  session,
  visible,
  onRename,
  onTogglePin,
  onDelete,
}: {
  session: SessionRecord
  visible: boolean
  onRename: () => void
  onTogglePin: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Conversation actions"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 h-6 w-6 inline-flex items-center justify-center rounded cursor-pointer transition-opacity opacity-0 group-hover:opacity-100"
            style={{
              color: 'var(--text-muted)',
              opacity: visible ? 1 : undefined,
            }}
          >
            <DotsThree size={13} strokeWidth={1.75} />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onRename()
          }}
          className="text-[13px] cursor-pointer"
        >
          <PencilSimple size={12} strokeWidth={1.75} />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin()
          }}
          className="text-[13px] cursor-pointer"
        >
          {session.pinned ? (
            <>
              <PushPinSlash size={12} strokeWidth={1.75} />
              Unpin
            </>
          ) : (
            <>
              <PushPin size={12} strokeWidth={1.75} />
              Pin to top
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            if (
              window.confirm(
                `Delete "${session.title}"? This can't be undone.`,
              )
            ) {
              onDelete()
            }
          }}
          className="text-[13px] cursor-pointer"
          style={{ color: 'var(--accent-danger)' }}
        >
          <Trash size={12} strokeWidth={1.75} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function EmptySidebarState() {
  return (
    <div className="text-center p-4 mt-6">
      <ChatCircle
        size={18}
        strokeWidth={1.75}
        className="mx-auto mb-2"
        style={{ color: 'var(--text-subtle)' }}
      />
      <p className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
        No conversations yet
      </p>
      <p
        className="text-[10.5px] mt-1"
        style={{ color: 'var(--text-subtle)' }}
      >
        Ask a question to start one.
      </p>
    </div>
  )
}

function NoMatchState({ query }: { query: string }) {
  return (
    <div className="text-center p-4 mt-6">
      <MagnifyingGlass
        size={16}
        strokeWidth={1.75}
        className="mx-auto mb-2"
        style={{ color: 'var(--text-subtle)' }}
      />
      <p className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
        No matches for &ldquo;{query}&rdquo;
      </p>
    </div>
  )
}

/**
 * Bucket sessions into Claude-Desktop-style recency groups. Pinned
 * lives at the top regardless of timestamp; everything else falls
 * into Today / Yesterday / Previous 7 / Previous 30 / Older based
 * on `updated_at` distance from the start of today.
 *
 * The search filter (`query`) is applied *before* grouping so
 * empty buckets are dropped automatically.
 */
interface SidebarGroup {
  label: string
  items: SessionRecord[]
}

function groupSessions(
  sessions: SessionRecord[],
  query: string,
): SidebarGroup[] {
  const q = query.trim().toLowerCase()
  const filtered = q
    ? sessions.filter((s) => s.title.toLowerCase().includes(q))
    : sessions

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const DAY_MS = 24 * 60 * 60 * 1000

  const pinned: SessionRecord[] = []
  const today: SessionRecord[] = []
  const yesterday: SessionRecord[] = []
  const last7: SessionRecord[] = []
  const last30: SessionRecord[] = []
  const older: SessionRecord[] = []

  for (const s of filtered) {
    if (s.pinned) {
      pinned.push(s)
      continue
    }
    const ts = new Date(s.updated_at).getTime()
    if (Number.isNaN(ts)) {
      older.push(s)
      continue
    }
    const ageMs = startOfToday.getTime() - ts
    if (ts >= startOfToday.getTime()) today.push(s)
    else if (ageMs < DAY_MS) yesterday.push(s)
    else if (ageMs < 7 * DAY_MS) last7.push(s)
    else if (ageMs < 30 * DAY_MS) last30.push(s)
    else older.push(s)
  }

  // Each bucket sorted recency-first.
  const byRecent = (a: SessionRecord, b: SessionRecord) =>
    b.updated_at.localeCompare(a.updated_at)
  pinned.sort(byRecent)
  today.sort(byRecent)
  yesterday.sort(byRecent)
  last7.sort(byRecent)
  last30.sort(byRecent)
  older.sort(byRecent)

  return [
    { label: 'Pinned', items: pinned },
    { label: 'Today', items: today },
    { label: 'Yesterday', items: yesterday },
    { label: 'Previous 7 days', items: last7 },
    { label: 'Previous 30 days', items: last30 },
    { label: 'Older', items: older },
  ].filter((g) => g.items.length > 0)
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
