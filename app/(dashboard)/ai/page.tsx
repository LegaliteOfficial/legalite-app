'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import Image from 'next/image'
// Phosphor icon set (project-wide standard). My recent sidebar
// rebuild + auto-title work originally used lucide names; converted
// to phosphor equivalents here after the merge:
//   Send -> PaperPlaneTilt, Scale -> Scales, Search -> MagnifyingGlass,
//   MessageSquare -> ChatCircle, MoreHorizontal -> DotsThree,
//   Pencil -> PencilSimple, Pin -> PushPin, PinOff -> PushPinSlash,
//   Trash2 -> Trash, PanelLeftClose -> SidebarSimple, PanelLeft -> Sidebar.
import {
  PaperPlaneTilt,
  Scales,
  BookOpen,
  MagnifyingGlass,
  Plus,
  ChatCircle,
  DotsThree,
  PencilSimple,
  PushPin,
  PushPinSlash,
  Trash,
  SidebarSimple,
  Sidebar,
  X,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

import { ask, submitFeedback, AiServiceError } from '@/lib/ai/client'
import {
  listSessions,
  getSession,
  appendUserTurn,
  appendAssistantTurn,
  dropLastAssistantTurn,
  deleteSession,
  // Their addition: turn-level feedback storage.
  setTurnFeedback,
  // My additions: sidebar rename + pin + smart auto-title refinement.
  renameSession,
  pinSession,
  refineTitle,
  type SessionRecord,
  type Turn,
} from '@/lib/ai/sessions'
import type { FeedbackThumbs } from '@/lib/ai/types'
import { AnswerCard } from '@/components/ai/AnswerCard'

const SUGGESTIONS = [
  { Icon: Scales, text: 'What are the grounds for judicial review in Ghana?' },
  { Icon: BookOpen, text: 'Summarize the Matrimonial Causes Act provisions on divorce.' },
  { Icon: MagnifyingGlass, text: 'Find precedents on breach of contract in commercial disputes.' },
]

export default function AiAssistantPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load persisted sessions on mount (client-only — localStorage isn't
  // available during SSR, and we want the latest snapshot every mount).
  useEffect(() => {
    setSessions(listSessions())
  }, [])

  // Auto-scroll to bottom when turns change.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, isLoading])

  const refreshSidebar = useCallback(() => {
    setSessions(listSessions())
  }, [])

  const loadConversation = useCallback((id: string) => {
    const rec = getSession(id)
    if (!rec) {
      toast.error('Could not load that conversation.')
      return
    }
    abortRef.current?.abort()
    setActiveId(id)
    setTurns(rec.turns)
    setInput('')
  }, [])

  const startNewConversation = useCallback(() => {
    abortRef.current?.abort()
    setActiveId(null)
    setTurns([])
    setInput('')
  }, [])

  const handleDelete = useCallback((id: string) => {
    deleteSession(id)
    refreshSidebar()
    if (activeId === id) {
      setActiveId(null)
      setTurns([])
    }
  }, [activeId, refreshSidebar])

  // Rename — fired from the sidebar's overflow menu. Trims +
  // truncates inside the storage layer; we just refresh the sidebar
  // afterwards so the new title flows through immediately.
  const handleRename = useCallback(
    (id: string, title: string) => {
      const next = renameSession(id, title)
      if (next) refreshSidebar()
    },
    [refreshSidebar],
  )

  // Pin / unpin — flips the boolean in storage. Pinned sessions
  // are exempt from the MAX_SESSIONS eviction cap and render in
  // their own group at the top of the sidebar.
  const handleTogglePin = useCallback(
    (id: string) => {
      const current = getSession(id)
      if (!current) return
      const next = pinSession(id, !current.pinned)
      if (next) {
        refreshSidebar()
        toast.success(next.pinned ? 'Pinned to the top.' : 'Unpinned.')
      }
    },
    [refreshSidebar],
  )

  const handleSend = useCallback(async () => {
    const question = input.trim()
    if (!question || isLoading) return
    if (question.length < 1) {
      toast.error('Question must be at least 3 characters.')
      return
    }

    // Cancel any in-flight request before starting a new one.
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    const now = new Date().toISOString()
    const { id, record } = appendUserTurn(activeId, question, now)
    setActiveId(id)
    setTurns(record.turns)
    setInput('')
    setIsLoading(true)
    refreshSidebar()

    try {
      const response = await ask(
        { question, session_id: id },
        { signal: ctrl.signal },
      )
      // The service may rotate the session_id (e.g. a new memory bucket).
      // Trust the server's id if it sends one back — pass our `id` as
      // previousId so the storage layer can migrate the record's key.
      const finalId = response.session_id ?? id
      const updated = appendAssistantTurn(
        finalId,
        response,
        new Date().toISOString(),
        id,
      )
      if (updated) {
        if (finalId !== id) setActiveId(finalId)
        setTurns(updated.turns)
        // Refine the sidebar title now that we have the assistant
        // response in hand. `refineTitle` only acts when the title
        // isn't locked (i.e. the partner hasn't manually renamed)
        // and produces a better noun-phrase than the initial
        // question truncation — Claude-Desktop-style "title gets
        // smarter once the answer lands". We only refine on the
        // very first assistant turn — subsequent turns in the
        // same thread shouldn't reset the title back to what the
        // first question implied.
        const isFirstAssistantTurn =
          updated.turns.filter((t) => t.role === 'assistant').length === 1
        if (isFirstAssistantTurn) {
          refineTitle(finalId, question, response)
        }
        refreshSidebar()
      } else {
        // Storage layer couldn't resolve any record — fall back to rendering
        // the response in memory so the user never sees a blank thread.
        setTurns((prev) => [
          ...prev,
          { role: 'assistant', response, created_at: new Date().toISOString() },
        ])
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Request was cancelled (new send / nav away). Drop the orphan
        // user turn we already appended so the sidebar stays clean.
        dropLastAssistantTurn(id)
        return
      }
      const message =
        err instanceof AiServiceError
          ? err.message
          : 'Something went wrong reaching the AI service.'
      toast.error(message)
      // Keep the user turn visible so they can retry without retyping.
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null
        setIsLoading(false)
      }
    }
  }, [input, isLoading, activeId, refreshSidebar])

  /**
   * Persist a thumbs vote (and optional comment) for an assistant
   * turn. The server upserts on (message_id, organization?, user?) so
   * we can call this every time the user toggles — no client-side
   * "have I submitted yet" tracking required. Optimistic UI lives in
   * AnswerCard's local state; here we only commit to localStorage
   * once the network call succeeds.
   */
  const handleSubmitFeedback = useCallback(
    async (
      sessionId: string,
      messageId: string,
      input: { thumbs: FeedbackThumbs; comment: string | null },
    ) => {
      try {
        await submitFeedback(messageId, {
          thumbs: input.thumbs,
          comment: input.comment ?? undefined,
        })
        const updated = setTurnFeedback(sessionId, messageId, {
          thumbs: input.thumbs,
          comment: input.comment,
          submitted_at: new Date().toISOString(),
        })
        if (updated) setTurns(updated.turns)
      } catch (err) {
        const message =
          err instanceof AiServiceError
            ? err.message
            : 'Could not save your feedback. Please try again.'
        toast.error(message)
        throw err // let AnswerCard revert its optimistic state
      }
    },
    [],
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }, [handleSend])

  return (
    <div className="flex-1 flex overflow-hidden">
      {sidebarOpen && (
        <ConversationSidebar
          sessions={sessions}
          activeId={activeId}
          onSelect={loadConversation}
          onDelete={handleDelete}
          onRename={handleRename}
          onTogglePin={handleTogglePin}
          onNew={startNewConversation}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--surface-card)' }}>
        <ChatHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {turns.length === 0 && !isLoading ? (
            <EmptyState onPick={(text) => setInput(text)} />
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {turns.map((turn, i) => (
                <TurnBubble
                  key={i}
                  turn={turn}
                  onSubmitFeedback={
                    turn.role === 'assistant' && turn.response.message_id && activeId
                      ? (input) =>
                          handleSubmitFeedback(
                            activeId,
                            turn.response.message_id as string,
                            input,
                          )
                      : undefined
                  }
                />
              ))}
              {isLoading && <LoadingTurn />}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <Composer
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────

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
function ConversationSidebar({
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

// ── Header ─────────────────────────────────────────────────────────────────

function ChatHeader({
  sidebarOpen,
  onToggleSidebar,
}: {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}) {
  return (
    <div
      className="px-6 py-4 border-b"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="h-8 w-8 rounded-lg flex items-center justify-center border transition-colors"
          style={{
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-overlay)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <SidebarSimple size={14} strokeWidth={1.75} /> : <Sidebar size={14} strokeWidth={1.75} />}
        </button>
        <h1
          className="font-heading text-lg font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          LegaLite AI
        </h1>
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded"
          style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}
        >
          Ghana legal Q&amp;A
        </span>
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center">
      <div className="h-14 w-14 rounded-2xl overflow-hidden flex items-center justify-center mb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.ico" alt="LegaLite" className="h-14 w-14 object-cover" />
      </div>
      <h2
        className="font-heading text-[22px] font-semibold mb-2 tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        How can I help you today?
      </h2>
      <p
        className="text-[13.5px] mb-8 leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        Ask about Ghana law, find case precedents, or get help drafting legal arguments.
      </p>
      <div className="w-full space-y-2">
        {SUGGESTIONS.map((s, i) => {
          const Icon = s.Icon
          return (
            <button
              key={i}
              onClick={() => onPick(s.text)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-[13px] transition-colors"
              style={{
                background: 'var(--surface-card)',
                borderColor: 'var(--border-soft)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-xs)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-card-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-card)')}
            >
              <Icon size={15} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
              {s.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Turn rendering ─────────────────────────────────────────────────────────

function TurnBubble({
  turn,
  onSubmitFeedback,
}: {
  turn: Turn
  onSubmitFeedback?: (input: {
    thumbs: FeedbackThumbs
    comment: string | null
  }) => Promise<void>
}) {
  if (turn.role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] rounded-2xl px-5 py-3 text-[14px] leading-relaxed"
          style={{
            background: 'var(--surface-sunken)',
            color: 'var(--text-primary)',
          }}
        >
          {turn.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] w-full">
        <AnswerCard
          response={turn.response}
          feedback={turn.feedback ?? null}
          onSubmitFeedback={onSubmitFeedback}
        />
      </div>
    </div>
  )
}

// ── Loading state with the gavel gif ───────────────────────────────────────

function LoadingTurn() {
  return (
    <div className="flex justify-start">
      <div
        className="rounded-2xl border px-4 py-3 flex items-center gap-3"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border-soft)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0"
          style={{ background: 'var(--surface-sunken)' }}
        >
          <Image
            src="/gifs/gavel.gif"
            alt="Researching"
            fill
            sizes="36px"
            className="object-cover"
            unoptimized
            priority
          />
        </div>
        <div className="flex flex-col">
          <span
            className="text-[13px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Legaliting<span className="inline-block ml-0.5 typing-dots" aria-hidden>…</span>
          </span>
          <span
            className="text-[11.5px]"
            style={{ color: 'var(--text-muted)' }}
          >
            Searching Ghana legal corpus and drafting an answer
          </span>
        </div>
        <style jsx>{`
          @keyframes pulse-dots {
            0%, 80%, 100% { opacity: 0.25; }
            40% { opacity: 1; }
          }
          .typing-dots {
            animation: pulse-dots 1.4s infinite;
          }
        `}</style>
      </div>
    </div>
  )
}

// ── Composer ───────────────────────────────────────────────────────────────

function Composer({
  value, onChange, onSend, onKeyDown, disabled,
}: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  disabled: boolean
}) {
  return (
    <div
      className="px-6 py-4 border-t"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask LegaLite anything…"
          rows={1}
          className="resize-none min-h-[44px] max-h-[120px]"
          disabled={disabled}
        />
        <Button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          size="icon-lg"
          className="h-11 w-11 shrink-0"
          aria-label="Send"
        >
          <PaperPlaneTilt size={15} strokeWidth={1.75} />
        </Button>
      </div>
      <p
        className="text-center text-[10.5px] mt-2"
        style={{ color: 'var(--text-muted)' }}
      >
        Answers are grounded in Ghana legal sources. Always verify before relying on them in practice.
      </p>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

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
