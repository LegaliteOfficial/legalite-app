'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'

import { askStream, submitFeedback, AiServiceError } from '@/lib/ai/client'
import {
  listSessions,
  getSession,
  appendUserTurn,
  appendAssistantTurn,
  dropLastAssistantTurn,
  deleteSession,
  setTurnFeedback,
  renameSession,
  pinSession,
  refineTitle,
  historyForRequest,
  type SessionRecord,
  type Turn,
} from '@/lib/ai/sessions'
import { buildStreamingResponse } from '@/lib/ai/streaming'
import {
  DEFAULT_DISCLAIMER,
  type AskResponse,
  type FeedbackThumbs,
  type WorkspaceConsent,
} from '@/lib/ai/types'
import type { PermissionChoice } from '@/components/ai/WorkspacePermissionCard'
import { useResolveWorkspacePermission } from '@/hooks/use-ai-workspace-access'
import { AnswerCard } from '@/components/ai/AnswerCard'
import { ConversationSidebar } from '@/components/ai/ConversationSidebar'
import { ChatHeader } from '@/components/ai/ChatHeader'
import { EmptyState } from '@/components/ai/EmptyState'
import { TurnBubble } from '@/components/ai/TurnBubble'
import { LoadingTurn } from '@/components/ai/LoadingTurn'
import { Composer } from '@/components/ai/Composer'
import { useIsPhone } from '@/hooks/use-media-query'

export default function AiAssistantPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // Conversation list: open beside the chat on wider screens; on phones
  // it is an overlay drawer, closed until asked for.
  const isPhone = useIsPhone()
  const [sidebarPref, setSidebarOpen] = useState<boolean | null>(null)
  const sidebarOpen = sidebarPref ?? !isPhone
  // Live text from `answer_delta` SSE events. Cleared once the turn is
  // committed to `turns` (either the `completed` or `refused` terminal
  // event). Rendered in place of LoadingTurn once the model starts
  // producing output.
  const [streamingText, setStreamingText] = useState('')
  const [streamingPhase, setStreamingPhase] = useState<'retrieving' | 'answering' | null>(null)
  // Agent progress line from `status` events ("Searching the Legalite
  // library: …"). Shown in LoadingTurn until answer text starts arriving.
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const resolvePermission = useResolveWorkspacePermission()

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

  /**
   * Run one question through the assistant. ``resume`` re-runs the last
   * question after the user answered a workspace permission card: the
   * card turn is replaced by the real answer, and no new user turn is
   * added.
   */
  const runTurn = useCallback(async (
    question: string,
    opts: { consent?: WorkspaceConsent; resume?: boolean } = {},
  ) => {
    // Cancel any in-flight request before starting a new one.
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    let id: string
    let record: SessionRecord
    const existing = opts.resume && activeId ? getSession(activeId) : null
    if (existing && activeId) {
      dropLastAssistantTurn(activeId)
      id = activeId
      record = getSession(activeId) ?? existing
    } else {
      const appended = appendUserTurn(activeId, question, new Date().toISOString())
      id = appended.id
      record = appended.record
    }
    setActiveId(id)
    setTurns(record.turns)
    setIsLoading(true)
    setStreamingText('')
    setStreamingPhase('retrieving')
    setStatusMessage(null)
    refreshSidebar()

    try {
      let response: AskResponse | null = null
      for await (const evt of askStream(
        {
          question,
          session_id: id,
          // Everything before the turn just appended (the current question).
          history: historyForRequest(record.turns.slice(0, -1)),
          workspace_consent: opts.consent ?? null,
        },
        { signal: ctrl.signal },
      )) {
        switch (evt.event) {
          case 'retrieval_started':
            setStreamingPhase('retrieving')
            break
          case 'sources_found':
            setStreamingPhase('answering')
            break
          case 'status':
            setStatusMessage(evt.data.message)
            break
          case 'answer_delta':
            setStreamingText((prev) => prev + evt.data.text)
            break
          case 'permission_required':
            // The terminal `completed` payload carries the request; the
            // permission card renders from that.
            setStatusMessage('Waiting for your permission')
            break
          case 'action_proposed':
            // The terminal `completed` payload carries every proposal;
            // the confirmation cards render from that.
            setStatusMessage(`Prepared: ${evt.data.summary}`)
            break
          case 'reasoning':
          case 'citations':
            // Not needed for the live bubble — the terminal event below
            // carries the full structured payload the committed turn uses.
            break
          case 'refused':
            // Post-generation grounding check rejected the answer AFTER
            // it already streamed via answer_delta. This response is
            // authoritative and replaces whatever the deltas showed —
            // we never merge streamed text into the committed turn.
            response = {
              answer: evt.data.answer,
              citations: [],
              confidence: evt.data.confidence,
              disclaimer: DEFAULT_DISCLAIMER,
              sources_used: [],
              reasoning_summary: '',
              session_id: evt.data.session_id,
              structured_answer: evt.data.structured_answer,
              query_intent: evt.data.query_intent,
              query_intent_confidence: null,
              message_id: evt.data.message_id,
            }
            break
          case 'completed':
            response = evt.data
            break
          case 'error':
            // Once the SSE response has started, the server can't turn
            // a mid-pipeline failure into a proper HTTP error status —
            // it sends this instead of just dropping the connection.
            throw new AiServiceError(evt.data.message, 0)
        }
      }
      if (!response) {
        throw new AiServiceError(
          'The AI service ended the stream without a final answer.',
          0,
        )
      }
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
        if (isFirstAssistantTurn && response.answer_mode !== 'permission_required') {
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
        setStreamingText('')
        setStreamingPhase(null)
        setStatusMessage(null)
      }
    }
  }, [activeId, refreshSidebar])

  const handleSend = useCallback(() => {
    const question = input.trim()
    if (!question || isLoading) return
    setInput('')
    void runTurn(question)
  }, [input, isLoading, runTurn])

  /**
   * The user answered the permission card on the last turn. Record the
   * decision, save "Always allow" as their preference, then re-run the
   * same question with the decision attached.
   */
  const handlePermission = useCallback(
    async (choice: PermissionChoice) => {
      const last = turns[turns.length - 1]
      const prev = turns[turns.length - 2]
      const request = last?.role === 'assistant' ? last.response.permission_request : null
      if (!request || prev?.role !== 'user' || isLoading) return

      const consent = await resolvePermission(choice, request)
      await runTurn(prev.content, { resume: true, consent })
    },
    [turns, isLoading, runTurn, resolvePermission],
  )

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
    <div className="relative flex-1 flex overflow-hidden">
      {sidebarOpen && isPhone && (
        <button
          type="button"
          aria-label="Close conversations"
          onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 z-20 bg-black/30"
        />
      )}
      {sidebarOpen && (
        <div
          className={isPhone ? 'absolute inset-y-0 left-0 z-30 flex w-[85%] max-w-[320px] shadow-xl' : 'flex'}
          style={isPhone ? { background: 'var(--surface-page)' } : undefined}
        >
          <ConversationSidebar
            sessions={sessions}
            activeId={activeId}
            onSelect={(id) => {
              if (isPhone) setSidebarOpen(false)
              void loadConversation(id)
            }}
            onDelete={handleDelete}
            onRename={handleRename}
            onTogglePin={handleTogglePin}
            onNew={() => {
              if (isPhone) setSidebarOpen(false)
              startNewConversation()
            }}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--surface-card)' }}>
        <ChatHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {turns.length === 0 && !isLoading ? (
            <EmptyState onPick={(text) => setInput(text)} />
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {turns.map((turn, i) => (
                <TurnBubble
                  key={i}
                  turn={turn}
                  busy={isLoading}
                  onPermission={i === turns.length - 1 ? handlePermission : undefined}
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
              {isLoading &&
                (streamingText ? (
                  <div className="flex justify-start">
                    <div className="max-w-[92%] w-full">
                      <AnswerCard
                        response={buildStreamingResponse(streamingText)}
                        streaming
                      />
                    </div>
                  </div>
                ) : (
                  <LoadingTurn phase={streamingPhase} message={statusMessage} />
                ))}
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
