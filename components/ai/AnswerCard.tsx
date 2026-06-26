'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { BookOpen, CaretDown, Copy, Check, Scales, Buildings, Briefcase, Sparkle, ArrowSquareOut, ThumbsUp, ThumbsDown, PaperPlaneTilt } from '@phosphor-icons/react'
import type {
  AskResponse,
  Citation,
  Confidence,
  FeedbackThumbs,
  StructuredCitation,
} from '@/lib/ai/types'
import type { TurnFeedback } from '@/lib/ai/sessions'
import {
  SourcePreviewDrawer,
  type SourcePreviewAnchor,
} from '@/components/ai/SourcePreviewDrawer'

interface AnswerCardProps {
  response: AskResponse
  /**
   * Persisted feedback for this turn, if any. Drives the visual state
   * of the thumbs buttons + the comment textarea's initial value.
   */
  feedback?: TurnFeedback | null
  /**
   * Submit feedback to the AI service. Resolves with the value that
   * was actually persisted (after the optimistic update) so the card
   * can sync its local state. Throws on network / 404 errors; the
   * caller is responsible for reverting state + toasting the user.
   */
  onSubmitFeedback?: (input: {
    thumbs: FeedbackThumbs
    comment: string | null
  }) => Promise<void>
}

const CONFIDENCE_META: Record<
  Confidence,
  { label: string; color: string; bg: string }
> = {
  high:   { label: 'High confidence',   color: '#2E7D4F', bg: 'rgba(46,125,79,0.10)' },
  medium: { label: 'Medium confidence', color: '#B8860B', bg: 'rgba(201,151,43,0.14)' },
  low:    { label: 'Low confidence',    color: '#C0392B', bg: 'rgba(192,57,43,0.10)' },
}

export function AnswerCard({ response, feedback, onSubmitFeedback }: AnswerCardProps) {
  const [copied, setCopied] = useState(false)
  // Source preview drawer — one drawer per card. Clicking any
  // citation row or source entry that carries a ``document_id`` sets
  // the anchor; the drawer slides in, fetches GET /documents/{id},
  // and scrolls to + highlights the cited chunk (when ``chunkId`` is
  // also present).
  const [previewAnchor, setPreviewAnchor] = useState<SourcePreviewAnchor | null>(null)
  const structured = response.structured_answer
  const directAnswer = structured?.direct_answer || response.answer
  const reasoning = structured?.legal_reasoning || response.reasoning_summary
  const confidenceText = structured?.confidence_assessment
  const confidence = CONFIDENCE_META[response.confidence]

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(buildPlainText(response))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard rejected — most browsers only allow it via secure context
    }
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Header — confidence + intent + copy */}
      <div
        className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
            style={{ background: confidence.bg, color: confidence.color }}
          >
            <span
              aria-hidden
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: confidence.color }}
            />
            {confidence.label}
          </span>
          {response.query_intent && (
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
              style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}
            >
              <Sparkle size={10} strokeWidth={1.75} />
              {humanizeIntent(response.query_intent)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={copyAll}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2 py-1 rounded-md transition-colors"
          style={{ color: copied ? '#2E7D4F' : 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            if (!copied) e.currentTarget.style.background = 'var(--surface-overlay)'
          }}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {copied ? <Check size={12} strokeWidth={1.75} /> : <Copy size={12} strokeWidth={1.75} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Direct answer */}
      <div className="px-5 pt-4 pb-2">
        <p
          className="text-[10.5px] font-medium uppercase tracking-wider mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Answer
        </p>
        <div
          className="text-[14.5px] leading-relaxed ai-markdown"
          style={{ color: 'var(--text-primary)' }}
        >
          <ReactMarkdown>{directAnswer}</ReactMarkdown>
        </div>
      </div>

      {/* Legal reasoning */}
      {reasoning && (
        <div className="px-5 pb-4">
          <Section title="Legal reasoning">
            <div className="text-[13px] leading-relaxed ai-markdown" style={{ color: 'var(--text-secondary)' }}>
              <ReactMarkdown>{reasoning}</ReactMarkdown>
            </div>
            {confidenceText && (
              <p
                className="mt-2 text-[12px] italic"
                style={{ color: 'var(--text-muted)' }}
              >
                {confidenceText}
              </p>
            )}
          </Section>
        </div>
      )}

      {/* Applicable law */}
      {structured?.applicable_law && structured.applicable_law.length > 0 && (
        <CitationGroup
          title="Applicable law"
          Icon={Scales}
          items={structured.applicable_law}
          kind="law"
          onPreview={setPreviewAnchor}
        />
      )}

      {/* Relevant public cases */}
      {structured?.relevant_public_cases && structured.relevant_public_cases.length > 0 && (
        <CitationGroup
          title="Relevant cases"
          Icon={Buildings}
          items={structured.relevant_public_cases}
          kind="case"
          onPreview={setPreviewAnchor}
        />
      )}

      {/* Firm similar cases (tenant-private) */}
      {structured?.firm_similar_cases && structured.firm_similar_cases.length > 0 && (
        <CitationGroup
          title="Similar cases from your firm"
          Icon={Briefcase}
          items={structured.firm_similar_cases}
          kind="case"
          accent
          onPreview={setPreviewAnchor}
        />
      )}

      {/* Raw citations (source provenance) */}
      {response.citations.length > 0 && (
        <SourcesBlock
          citations={response.citations}
          onPreview={setPreviewAnchor}
        />
      )}

      {/* Feedback bar — only renders when the backend gave us a
          message_id to bind to. Sits above the disclaimer so the user
          reads the answer, then the call to action, then the legal
          disclaimer at the very bottom. */}
      {response.message_id && onSubmitFeedback && (
        <FeedbackBar
          feedback={feedback ?? null}
          onSubmit={onSubmitFeedback}
        />
      )}

      {/* Disclaimer */}
      <p
        className="text-[11px] px-5 py-3 border-t"
        style={{
          color: 'var(--text-muted)',
          background: 'var(--surface-sunken)',
          borderColor: 'var(--border-soft)',
        }}
      >
        {response.disclaimer}
      </p>

      {/* Source preview drawer — mounted at the card level so each
          answer's clicks open their own panel. Rendered conditionally
          (anchor === null hides). */}
      <SourcePreviewDrawer
        anchor={previewAnchor}
        onClose={() => setPreviewAnchor(null)}
      />
    </div>
  )
}

// ── Feedback bar ─────────────────────────────────────────────────────────

function FeedbackBar({
  feedback,
  onSubmit,
}: {
  feedback: TurnFeedback | null
  onSubmit: (input: {
    thumbs: FeedbackThumbs
    comment: string | null
  }) => Promise<void>
}) {
  // Local optimistic state — we set it the moment the user clicks so
  // the buttons feel responsive, then reconcile with the parent prop
  // when the network call resolves (or reverts on error).
  const [optimistic, setOptimistic] = useState<FeedbackThumbs | null>(
    feedback?.thumbs ?? null,
  )
  const [comment, setComment] = useState<string>(feedback?.comment ?? '')
  const [submittingThumbs, setSubmittingThumbs] = useState<FeedbackThumbs | null>(
    null,
  )
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [commentJustSaved, setCommentJustSaved] = useState(false)

  // Reconcile when the parent prop updates (e.g. the page persisted
  // the vote and pushed a fresh session record back through).
  useEffect(() => {
    setOptimistic(feedback?.thumbs ?? null)
    setComment(feedback?.comment ?? '')
  }, [feedback?.thumbs, feedback?.comment])

  const handleVote = async (thumbs: FeedbackThumbs) => {
    // Toggle off the comment box automatically when switching to thumbs-up.
    if (thumbs === 'up') setShowCommentBox(false)
    if (thumbs === 'down') setShowCommentBox(true)

    const prev = optimistic
    setOptimistic(thumbs)
    setSubmittingThumbs(thumbs)
    try {
      await onSubmit({ thumbs, comment: comment.trim() || null })
    } catch {
      setOptimistic(prev) // revert
    } finally {
      setSubmittingThumbs(null)
    }
  }

  const handleSendComment = async () => {
    if (!optimistic) return
    const trimmed = comment.trim()
    setSubmittingComment(true)
    try {
      await onSubmit({ thumbs: optimistic, comment: trimmed || null })
      setCommentJustSaved(true)
      setTimeout(() => setCommentJustSaved(false), 1800)
    } catch {
      // page-level toast surfaces the failure; keep the text so user can retry
    } finally {
      setSubmittingComment(false)
    }
  }

  const isUp = optimistic === 'up'
  const isDown = optimistic === 'down'
  const acked = optimistic !== null

  return (
    <div
      className="border-t px-5 py-3 flex items-center justify-between gap-3 flex-wrap"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="flex items-center gap-3">
        <span
          className="text-[11.5px] font-medium"
          style={{ color: acked ? 'var(--text-secondary)' : 'var(--text-muted)' }}
        >
          {acked
            ? optimistic === 'up'
              ? 'Thanks — glad this helped.'
              : 'Thanks — your note helps LegaLite improve.'
            : 'Was this answer helpful?'}
        </span>
        <div
          className="inline-flex items-center rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <ThumbButton
            kind="up"
            active={isUp}
            disabled={!!submittingThumbs}
            loading={submittingThumbs === 'up'}
            onClick={() => handleVote('up')}
          />
          <span
            aria-hidden
            className="block w-px self-stretch"
            style={{ background: 'var(--border-default)' }}
          />
          <ThumbButton
            kind="down"
            active={isDown}
            disabled={!!submittingThumbs}
            loading={submittingThumbs === 'down'}
            onClick={() => handleVote('down')}
          />
        </div>
      </div>

      {isDown && !showCommentBox && (
        <button
          type="button"
          onClick={() => setShowCommentBox(true)}
          className="text-[11.5px] font-medium underline underline-offset-2 hover:opacity-80"
          style={{ color: 'var(--gold-dark)' }}
        >
          Add a note
        </button>
      )}

      {isDown && showCommentBox && (
        <div className="w-full mt-1">
          <div
            className="rounded-xl border overflow-hidden"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-sunken)',
            }}
          >
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What went wrong? Wrong cite, missed an issue, refused unnecessarily…"
              rows={2}
              maxLength={2000}
              className="w-full resize-none bg-transparent px-3 py-2 text-[12.5px] leading-relaxed outline-none"
              style={{ color: 'var(--text-primary)' }}
              disabled={submittingComment}
            />
            <div
              className="flex items-center justify-between gap-2 px-3 py-1.5 border-t"
              style={{
                borderColor: 'var(--border-soft)',
                background: 'var(--surface-card)',
              }}
            >
              <span
                className="text-[10.5px] tabular-nums"
                style={{ color: 'var(--text-muted)' }}
              >
                {comment.length}/2000
              </span>
              <div className="flex items-center gap-1.5">
                {commentJustSaved && (
                  <span
                    className="text-[10.5px] font-medium inline-flex items-center gap-1"
                    style={{ color: '#2E7D4F' }}
                  >
                    <Check size={10} strokeWidth={2} />
                    Saved
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowCommentBox(false)}
                  className="text-[11px] font-medium px-2 py-1 rounded-md hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSendComment}
                  disabled={submittingComment}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors disabled:opacity-60"
                  style={{
                    background: 'var(--gold)',
                    color: 'var(--navy)',
                  }}
                >
                  <PaperPlaneTilt size={10} strokeWidth={2} />
                  {submittingComment ? 'Sending…' : 'Send note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ThumbButton({
  kind,
  active,
  disabled,
  loading,
  onClick,
}: {
  kind: FeedbackThumbs
  active: boolean
  disabled: boolean
  loading: boolean
  onClick: () => void
}) {
  const Icon = kind === 'up' ? ThumbsUp : ThumbsDown
  // Gold-tinted active state for "up" matches the brand affirmation
  // language. Red-tinted "down" keeps the meaning legible even when
  // the user is colour-blind to the gold (gold + red are distinguishable
  // for the most common deuteranomaly).
  const activeColor = kind === 'up' ? 'var(--gold-dark)' : '#C0392B'
  const activeBg =
    kind === 'up' ? 'rgba(201,151,43,0.16)' : 'rgba(192,57,43,0.12)'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={kind === 'up' ? 'Mark as helpful' : 'Mark as not helpful'}
      aria-pressed={active}
      className="inline-flex items-center justify-center h-7 w-9 transition-colors disabled:opacity-60"
      style={{
        background: active ? activeBg : 'transparent',
        color: active ? activeColor : 'var(--text-muted)',
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) e.currentTarget.style.background = 'var(--surface-overlay)'
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) e.currentTarget.style.background = 'transparent'
      }}
    >
      <Icon
        size={13}
        weight={active ? 'fill' : 'regular'}
        style={{
          opacity: loading ? 0.55 : 1,
          transform: loading ? 'scale(0.92)' : 'none',
          transition: 'transform 120ms ease, opacity 120ms ease',
        }}
      />
    </button>
  )
}

// ── Pieces ───────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="text-[10.5px] font-medium uppercase tracking-wider mb-2"
        style={{ color: 'var(--text-muted)' }}
      >
        {title}
      </p>
      {children}
    </div>
  )
}

interface CitationGroupProps {
  title: string
  Icon: typeof Scales
  items: StructuredCitation[]
  kind: 'law' | 'case'
  accent?: boolean
  /**
   * Click handler for "view source". When undefined (or the row's
   * ``document_id`` is null), the row stays non-interactive — the
   * pointer-cursor + hover background only appear when a click would
   * actually do something, so users never click a dead row.
   */
  onPreview?: (anchor: SourcePreviewAnchor) => void
}

function CitationGroup({ title, Icon, items, kind, accent, onPreview }: CitationGroupProps) {
  const [expanded, setExpanded] = useState(items.length <= 3)

  return (
    <div className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left transition-colors"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-overlay)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <span className="inline-flex items-center gap-2">
          <Icon size={14} strokeWidth={1.75} style={{ color: accent ? 'var(--gold)' : 'var(--text-secondary)' }} />
          <span
            className="text-[12.5px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </span>
          <span
            className="inline-flex items-center justify-center h-[18px] min-w-[20px] px-1.5 rounded-full text-[10.5px] font-medium tabular-nums"
            style={{
              background: 'var(--surface-sunken)',
              color: 'var(--text-muted)',
            }}
          >
            {items.length}
          </span>
        </span>
        <CaretDown
          size={14}
          strokeWidth={1.75}
          style={{
            color: 'var(--text-muted)',
            transform: expanded ? 'none' : 'rotate(-90deg)',
            transition: 'transform 180ms ease',
          }}
        />
      </button>
      {expanded && (
        <ul className="px-5 pb-4 space-y-2.5">
          {items.map((item) => {
            const heading =
              kind === 'law' ? formatLawHeading(item) : formatCaseHeading(item)
            const previewable = !!item.document_id && !!onPreview
            const handleClick = previewable
              ? () =>
                  onPreview!({
                    documentId: item.document_id!,
                    chunkId: item.chunk_id ?? null,
                    label: heading,
                  })
              : undefined
            return (
              <li
                key={item.citation_id}
                className="flex gap-3 text-[12.5px] leading-relaxed rounded-md transition-colors"
                role={previewable ? 'button' : undefined}
                tabIndex={previewable ? 0 : undefined}
                aria-label={previewable ? `Preview source: ${heading}` : undefined}
                onClick={handleClick}
                onKeyDown={
                  previewable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleClick!()
                        }
                      }
                    : undefined
                }
                onMouseEnter={(e) => {
                  if (previewable)
                    e.currentTarget.style.background = 'var(--surface-overlay)'
                }}
                onMouseLeave={(e) => {
                  if (previewable)
                    e.currentTarget.style.background = 'transparent'
                }}
                style={{
                  color: 'var(--text-secondary)',
                  cursor: previewable ? 'pointer' : 'default',
                  padding: previewable ? '4px 6px' : 0,
                  margin: previewable ? '-4px -6px' : 0,
                }}
              >
                <span
                  className="inline-flex items-center justify-center h-[18px] min-w-[22px] px-1.5 rounded text-[10.5px] font-semibold tabular-nums shrink-0"
                  style={{
                    background: accent
                      ? 'rgba(201,151,43,0.14)'
                      : 'var(--surface-sunken)',
                    color: accent ? 'var(--gold-dark)' : 'var(--text-secondary)',
                  }}
                >
                  {item.citation_id}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium flex items-center gap-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span className="truncate">{heading}</span>
                    {previewable && (
                      <ArrowSquareOut
                        size={10}
                        strokeWidth={1.75}
                        style={{ color: 'var(--text-muted)' }}
                        aria-hidden
                      />
                    )}
                  </div>
                  {item.summary && (
                    <div
                      className="mt-0.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {item.summary}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function SourcesBlock({
  citations,
  onPreview,
}: {
  citations: Citation[]
  onPreview?: (anchor: SourcePreviewAnchor) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? citations : citations.slice(0, 3)

  return (
    <div className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
      <div className="px-5 py-3">
        <p
          className="text-[10.5px] font-medium uppercase tracking-wider mb-2.5"
          style={{ color: 'var(--text-muted)' }}
        >
          Sources ({citations.length})
        </p>
        <ul className="space-y-1.5">
          {visible.map((c, i) => {
            const heading = formatCitationHeading(c)
            const previewable = !!c.document_id && !!onPreview
            const handleClick = previewable
              ? () =>
                  onPreview!({
                    documentId: c.document_id!,
                    chunkId: c.chunk_id ?? null,
                    label: heading,
                  })
              : undefined
            return (
              <li
                key={i}
                className="flex items-start gap-2 text-[12px] leading-relaxed rounded-md transition-colors"
                role={previewable ? 'button' : undefined}
                tabIndex={previewable ? 0 : undefined}
                aria-label={
                  previewable ? `Preview source: ${heading}` : undefined
                }
                onClick={handleClick}
                onKeyDown={
                  previewable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleClick!()
                        }
                      }
                    : undefined
                }
                onMouseEnter={(e) => {
                  if (previewable)
                    e.currentTarget.style.background =
                      'var(--surface-overlay)'
                }}
                onMouseLeave={(e) => {
                  if (previewable)
                    e.currentTarget.style.background = 'transparent'
                }}
                style={{
                  color: 'var(--text-secondary)',
                  cursor: previewable ? 'pointer' : 'default',
                  padding: previewable ? '3px 6px' : 0,
                  margin: previewable ? '-3px -6px' : 0,
                }}
              >
                <BookOpen
                  size={11}
                  strokeWidth={1.75}
                  className="mt-1 shrink-0"
                  style={{
                    color:
                      c.source_scope === 'tenant_private'
                        ? 'var(--gold)'
                        : 'var(--text-muted)',
                  }}
                />
                <span className="flex-1 min-w-0">
                  <span
                    className="font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {heading}
                  </span>
                  {c.page_number && (
                    <span
                      className="ml-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      · p.{c.page_number}
                    </span>
                  )}
                  {c.relevance > 0 && (
                    <span
                      className="ml-1 tabular-nums"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      · {Math.round(c.relevance * 100)}% match
                    </span>
                  )}
                  {c.source_scope === 'tenant_private' && (
                    <span
                      className="ml-1 text-[10.5px]"
                      style={{ color: 'var(--gold-dark)' }}
                    >
                      · firm
                    </span>
                  )}
                  {previewable && (
                    <ArrowSquareOut
                      size={9}
                      strokeWidth={1.75}
                      className="ml-1 inline-block align-baseline"
                      style={{ color: 'var(--text-muted)' }}
                      aria-hidden
                    />
                  )}
                </span>
              </li>
            )
          })}
        </ul>
        {citations.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-medium hover:underline underline-offset-2"
            style={{ color: 'var(--gold)' }}
          >
            <ArrowSquareOut size={11} strokeWidth={1.75} />
            {expanded ? 'Show fewer' : `Show ${citations.length - 3} more`}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Formatters ───────────────────────────────────────────────────────────

function formatLawHeading(c: StructuredCitation): string {
  const parts: string[] = []
  if (c.law_name) parts.push(c.law_name)
  if (c.section) parts.push(`s.${c.section}`)
  else if (c.article) parts.push(`art.${c.article}`)
  return parts.join(' · ') || `Citation ${c.citation_id}`
}

function formatCaseHeading(c: StructuredCitation): string {
  const parts: string[] = []
  if (c.case_title) parts.push(c.case_title)
  if (c.court) parts.push(c.court)
  return parts.join(' — ') || c.law_name || `Citation ${c.citation_id}`
}

function formatCitationHeading(c: Citation): string {
  if (c.law_name) {
    const parts = [c.law_name]
    if (c.section) parts.push(`s.${c.section}`)
    else if (c.article) parts.push(`art.${c.article}`)
    return parts.join(', ')
  }
  if (c.law) return c.law
  return 'Source'
}

function humanizeIntent(intent: string): string {
  // The query planner emits snake_case identifiers. Render them in title case.
  return intent
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function buildPlainText(r: AskResponse): string {
  const sa = r.structured_answer
  const direct = sa?.direct_answer || r.answer
  const reasoning = sa?.legal_reasoning || r.reasoning_summary
  let out = direct
  if (reasoning) out += '\n\nLegal reasoning:\n' + reasoning
  if (r.citations.length) {
    out += '\n\nSources:\n'
    for (const c of r.citations) {
      out += `- ${formatCitationHeading(c)}`
      if (c.page_number) out += `, p.${c.page_number}`
      out += '\n'
    }
  }
  out += '\n\n' + r.disclaimer
  return out
}
