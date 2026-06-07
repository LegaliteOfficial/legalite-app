'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { PaperPlaneTilt, Scales, BookOpen, MagnifyingGlass, Plus, ChatCircle, Trash, Clock, SidebarSimple, Sidebar } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

import { ask, submitFeedback, AiServiceError } from '@/lib/ai/client'
import {
  listSessions,
  getSession,
  appendUserTurn,
  appendAssistantTurn,
  dropLastAssistantTurn,
  deleteSession,
  setTurnFeedback,
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

function ConversationSidebar({
  sessions, activeId, onSelect, onDelete, onNew,
}: {
  sessions: SessionRecord[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onNew: () => void
}) {
  return (
    <div
      className="w-64 shrink-0 border-r flex flex-col"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
      }}
    >
      <div className="p-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
        <Button onClick={onNew} size="lg" className="w-full rounded-lg">
          <Plus size={14} strokeWidth={2} />
          New conversation
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sessions.length === 0 ? (
          <div className="text-center p-4">
            <ChatCircle
              size={18}
              strokeWidth={1.75}
              className="mx-auto mb-2"
              style={{ color: 'var(--text-subtle)' }}
            />
            <p className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
              No conversations yet
            </p>
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = activeId === s.id
            return (
              <div
                key={s.id}
                className="group flex items-start gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors"
                style={{
                  background: isActive ? 'var(--surface-sunken)' : 'transparent',
                }}
                onClick={() => onSelect(s.id)}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--surface-overlay)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <ChatCircle
                  size={13}
                  strokeWidth={1.75}
                  className="mt-0.5 shrink-0"
                  style={{ color: isActive ? 'var(--gold)' : 'var(--text-muted)' }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[12.5px] font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {s.title}
                  </p>
                  <p
                    className="text-[10.5px] flex items-center gap-1 tabular-nums"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Clock size={9} strokeWidth={1.75} />
                    {formatRelative(s.updated_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(s.id) }}
                  className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded flex items-center justify-center transition-all"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Delete conversation"
                >
                  <Trash size={11} strokeWidth={1.75} />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
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
