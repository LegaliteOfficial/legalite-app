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
  type SessionRecord,
  type Turn,
} from '@/lib/ai/sessions'
import { buildStreamingResponse } from '@/lib/ai/streaming'
import { DEFAULT_DISCLAIMER, type AskResponse, type FeedbackThumbs } from '@/lib/ai/types'
import { AnswerCard } from '@/components/ai/AnswerCard'
import { ConversationSidebar } from '@/components/ai/ConversationSidebar'
import { ChatHeader } from '@/components/ai/ChatHeader'
import { EmptyState } from '@/components/ai/EmptyState'
import { TurnBubble } from '@/components/ai/TurnBubble'
import { LoadingTurn } from '@/components/ai/LoadingTurn'
import { Composer } from '@/components/ai/Composer'

export default function AiAssistantPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  // Live text from `answer_delta` SSE events. Cleared once the turn is
  // committed to `turns` (either the `completed` or `refused` terminal
  // event). Rendered in place of LoadingTurn once the model starts
  // producing output.
  const [streamingText, setStreamingText] = useState('')
  const [streamingPhase, setStreamingPhase] = useState<'retrieving' | 'answering' | null>(null)

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
    setStreamingText('')
    setStreamingPhase('retrieving')
    refreshSidebar()

    try {
      let response: AskResponse | null = null
      for await (const evt of askStream(
        { question, session_id: id },
        { signal: ctrl.signal },
      )) {
        switch (evt.event) {
          case 'retrieval_started':
            setStreamingPhase('retrieving')
            break
          case 'sources_found':
            setStreamingPhase('answering')
            break
          case 'answer_delta':
            setStreamingText((prev) => prev + evt.data.text)
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
        setStreamingText('')
        setStreamingPhase(null)
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
                  <LoadingTurn phase={streamingPhase} />
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
