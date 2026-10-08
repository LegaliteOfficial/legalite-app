'use client'

/**
 * Document assistant — the floating "Ask" control on the Documents page.
 *
 * Collapsed it is a round pill in the bottom right corner. Tapping it
 * morphs the same element into a composer panel: one container animating
 * its width, height and corner radius, so the pill appears to grow into
 * the panel rather than one element being swapped for another. The page
 * behind stays put — this is an overlay, never a route change.
 *
 * Context
 * -------
 * The assistant answers about what is on screen. The AI service's /ask
 * contract only carries `question` and `session_id`, and that service is
 * a separate deployment we do not change from here, so the page context
 * is folded into the question itself under a labelled preamble. The
 * preamble is capped (see CONTEXT_BUDGET) because the editor body can run
 * to many pages and the service rejects oversized payloads.
 *
 * Dismissal
 * ---------
 * Close button, click outside, or Escape. The conversation is kept while
 * the page is mounted, so reopening shows the last answer instead of a
 * blank box.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PaperPlaneRight, Sparkle, X, ArrowClockwise } from '@phosphor-icons/react'
import { askStream, AiServiceError } from '@/lib/ai/client'
import { DEFAULT_DISCLAIMER } from '@/lib/ai/types'

/** Characters of page context sent with a question. Roughly 1,500 tokens. */
const CONTEXT_BUDGET = 6000

export interface DocumentContext {
  /** Which tab the user is looking at. */
  tab: string
  /** Title of the document open in the editor, when there is one. */
  documentTitle?: string | null
  /** Live editor body as HTML, including unsaved edits. */
  documentHTML?: string | null
  /** Titles of the documents listed on the current tab. */
  visibleDocuments?: string[]
}

/** Strips tags and collapses whitespace so the model sees prose, not markup. */
function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Folds the page context into the question. Returns the question
 * unchanged when there is nothing useful on screen, so a general legal
 * question is not weighed down by an empty preamble.
 */
export function buildContextualQuestion(
  question: string,
  ctx: DocumentContext,
): {
  prompt: string
  /** What the assistant actually got to see, so the UI can say so honestly. */
  contextKind: 'none' | 'document' | 'document-truncated' | 'list'
} {
  const parts: string[] = []
  let truncated = false

  if (ctx.documentTitle?.trim()) {
    parts.push(`Document title: ${ctx.documentTitle.trim()}`)
  }

  const body = ctx.documentHTML ? htmlToText(ctx.documentHTML) : ''
  if (body) {
    const clipped = body.length > CONTEXT_BUDGET
    truncated = clipped
    parts.push(
      `Document body${clipped ? ' (truncated)' : ''}:\n${
        clipped ? body.slice(0, CONTEXT_BUDGET) : body
      }`,
    )
  }

  if (!body && ctx.visibleDocuments?.length) {
    parts.push(
      `Documents listed on this page: ${ctx.visibleDocuments
        .slice(0, 25)
        .join(', ')}`,
    )
  }

  if (parts.length === 0) return { prompt: question, contextKind: 'none' }

  const contextKind: 'document' | 'document-truncated' | 'list' = body
    ? truncated
      ? 'document-truncated'
      : 'document'
    : 'list'

  const preamble = [
    'The user is working in the Documents section of their legal practice software.',
    `They are on the "${ctx.tab}" tab.`,
    'Use the following on-screen context when it is relevant to the question.',
    'If the question is general legal research, answer it on its own terms.',
    '',
    '--- BEGIN PAGE CONTEXT ---',
    parts.join('\n\n'),
    '--- END PAGE CONTEXT ---',
    '',
    'Question:',
  ].join('\n')

  return { prompt: `${preamble}\n${question}`, contextKind }
}

/** Plain description of what the assistant could see, shown as a chip. */
const CONTEXT_LABEL: Record<string, string | null> = {
  none: null,
  document: 'Reading this document',
  'document-truncated': 'Reading this document (first few pages)',
  list: 'Seeing the documents listed here',
}

type Phase = 'idle' | 'retrieving' | 'answering'

export function DocumentAssistant({ context }: { context: DocumentContext }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [contextNote, setContextNote] = useState<string | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const sessionRef = useRef<string | null>(null)

  const busy = phase !== 'idle'

  // Keep a stable reference for the dismissal handlers below.
  const close = useCallback(() => {
    setOpen(false)
    abortRef.current?.abort()
    setPhase('idle')
  }, [])

  // Escape closes, matching every other dismissable surface in the app.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  // Click outside closes. Bound on pointerdown so a drag that starts
  // inside and ends outside does not count as an outside click.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) close()
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [open, close])

  // Focus the composer once the morph has finished, so the caret does not
  // land mid-animation and scroll the panel.
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 260)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => () => abortRef.current?.abort(), [])

  const placeholder = useMemo(() => {
    if (context.documentTitle?.trim()) {
      return `Ask about "${context.documentTitle.trim().slice(0, 38)}"…`
    }
    return 'Ask about your documents…'
  }, [context.documentTitle])

  const send = useCallback(async () => {
    const question = input.trim()
    if (!question || busy) return

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    const { prompt, contextKind } = buildContextualQuestion(question, context)

    setAnswer('')
    setError(null)
    setPhase('retrieving')
    setContextNote(CONTEXT_LABEL[contextKind] ?? null)

    try {
      for await (const evt of askStream(
        { question: prompt, session_id: sessionRef.current },
        { signal: ctrl.signal },
      )) {
        switch (evt.event) {
          case 'retrieval_started':
            setPhase('retrieving')
            break
          case 'sources_found':
            setPhase('answering')
            break
          case 'answer_delta':
            setPhase('answering')
            setAnswer((prev) => prev + evt.data.text)
            break
          case 'refused':
            sessionRef.current = evt.data.session_id ?? sessionRef.current
            setAnswer(evt.data.answer)
            break
          case 'completed':
            sessionRef.current = evt.data.session_id ?? sessionRef.current
            setAnswer(evt.data.answer)
            break
          case 'error':
            throw new AiServiceError(evt.data.message, 0)
        }
      }
      setInput('')
    } catch (err) {
      // An abort is the user closing or re-asking; not a failure to report.
      if (ctrl.signal.aborted) return
      setError(
        err instanceof AiServiceError
          ? err.message
          : 'The assistant could not be reached. Please try again.',
      )
    } finally {
      if (!ctrl.signal.aborted) setPhase('idle')
    }
  }, [input, busy, context])

  return (
    // Below lg the app shows a 58px bottom tab bar, so the control is
    // lifted clear of it (plus the iOS home indicator) rather than
    // floating over the navigation.
    <div className="pointer-events-none fixed bottom-[calc(74px+env(safe-area-inset-bottom))] right-4 z-50 flex justify-end lg:bottom-6 lg:right-6">
      <div
        ref={panelRef}
        className={`ai-shine pointer-events-auto origin-bottom-right transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open
            ? 'w-[min(92vw,420px)] rounded-2xl p-[1.5px] shadow-[0_24px_60px_-18px_rgba(13,27,42,0.45)]'
            : 'w-[104px] rounded-full p-[1.5px] shadow-[0_10px_24px_-8px_rgba(13,27,42,0.4)]'
        }`}
      >
        {/* Inner surface. The 1.5px padding above is the only place the
            rotating gradient shows, which is what makes it read as a border. */}
        <div
          className={`overflow-hidden ${open ? 'rounded-[14.5px]' : 'rounded-full'}`}
          style={{ background: 'var(--surface-card)' }}
        >
          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Ask about these documents"
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 text-[13.5px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              <Sparkle size={15} weight="fill" style={{ color: '#3B82F6' }} />
              Ask
            </button>
          ) : (
            <div className="flex max-h-[min(70vh,560px)] flex-col">
              {/* Header */}
              <div
                className="flex shrink-0 items-center justify-between gap-2 border-b px-3.5 py-2.5"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <span
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Sparkle size={13} weight="fill" style={{ color: '#3B82F6' }} />
                  Ask LegaLite
                </span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close assistant"
                  className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-overlay)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={13} strokeWidth={2.25} />
                </button>
              </div>

              {/* Answer area — only occupies space once there is something
                  to show, so the opened panel starts as just a composer. */}
              {(busy || answer || error) && (
                <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
                  {contextNote && (
                    <div
                      className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{
                        background: 'rgba(59,130,246,0.10)',
                        color: '#2563EB',
                      }}
                    >
                      {contextNote}
                    </div>
                  )}

                  {error ? (
                    <p className="text-[12.5px]" style={{ color: '#C0392B' }}>
                      {error}
                    </p>
                  ) : answer ? (
                    <>
                      <p
                        className="whitespace-pre-wrap text-[13px] leading-relaxed"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {answer}
                      </p>
                      {phase === 'idle' && (
                        <p
                          className="mt-2.5 text-[10.5px] leading-snug"
                          style={{ color: 'var(--text-subtle)' }}
                        >
                          {DEFAULT_DISCLAIMER}
                        </p>
                      )}
                    </>
                  ) : (
                    <p
                      className="inline-flex items-center gap-1.5 text-[12.5px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <ArrowClockwise size={12} className="animate-spin" />
                      {phase === 'retrieving'
                        ? 'Looking through the sources…'
                        : 'Writing…'}
                    </p>
                  )}
                </div>
              )}

              {/* Composer */}
              <div
                className="shrink-0 border-t p-2.5"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      // Grow with the question, up to a few lines.
                      e.target.style.height = 'auto'
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        void send()
                      }
                    }}
                    placeholder={placeholder}
                    className="max-h-[120px] min-h-[36px] flex-1 resize-none bg-transparent px-1.5 py-2 text-[13px] leading-snug outline-none"
                    style={{ color: 'var(--text-primary)' }}
                  />
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={!input.trim() || busy}
                    aria-label="Send question"
                    className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
                    style={{ background: '#3B82F6', color: '#FFFFFF' }}
                  >
                    <PaperPlaneRight size={14} weight="fill" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
