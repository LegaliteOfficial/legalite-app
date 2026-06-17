'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowSquareOut,
  Scales,
  Buildings,
  BookOpen,
  X,
  Spinner,
  Warning,
  Briefcase,
} from '@phosphor-icons/react'

import { getDocument, AiServiceError } from '@/lib/ai/client'
import type { DocumentView, DocumentChunkView } from '@/lib/ai/types'

/**
 * Anchor describing WHICH source the user clicked. ``documentId`` is
 * the only required field — we open the drawer, fetch the document,
 * and (when ``chunkId`` is provided) scroll-to + highlight the exact
 * passage that was cited.
 *
 * ``label`` is purely cosmetic — the visible heading the AnswerCard
 * showed before the click. We display it as a faded subtitle so the
 * user has continuity between "the row they clicked" and "what the
 * drawer is showing".
 */
export interface SourcePreviewAnchor {
  documentId: string
  chunkId: string | null
  label?: string
}

interface SourcePreviewDrawerProps {
  anchor: SourcePreviewAnchor | null
  onClose: () => void
}

/**
 * SourcePreviewDrawer — slides in from the right when the user clicks
 * a citation or source row in the AnswerCard.
 *
 * Behavior:
 *   - Loads GET /documents/{id} on open. Aborts the fetch on close.
 *   - When ``chunkId`` matches a chunk on the document, that chunk's
 *     row scrolls into view and is rendered with the LegaLite gold
 *     highlight band so the user can see exactly what the AI cited.
 *   - "Open original PDF" launches the Supabase signed URL in a new
 *     tab. Hidden when the backend didn't supply a URL (storage
 *     unconfigured / upload failed / signing failed).
 *   - ESC closes. Backdrop click closes. The drawer traps focus
 *     while open so keyboard navigation stays inside.
 */
export function SourcePreviewDrawer({
  anchor,
  onClose,
}: SourcePreviewDrawerProps) {
  const [doc, setDoc] = useState<DocumentView | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chunkRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const open = anchor !== null

  // Fetch on open / id change. Abort on close so we don't leave a
  // dangling promise resolving into a closed drawer.
  useEffect(() => {
    if (!anchor) {
      setDoc(null)
      setError(null)
      return
    }
    const ctrl = new AbortController()
    setLoading(true)
    setError(null)
    setDoc(null)
    getDocument(anchor.documentId, { signal: ctrl.signal })
      .then((d) => {
        setDoc(d)
        setLoading(false)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(
          err instanceof AiServiceError
            ? err.message
            : 'Could not load the source.',
        )
        setLoading(false)
      })
    return () => ctrl.abort()
  }, [anchor])

  // ESC closes; backdrop click closes.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Move focus into the drawer on open for keyboard accessibility.
  useEffect(() => {
    if (open) closeBtnRef.current?.focus()
  }, [open])

  // Scroll the highlighted chunk into view after the document loads.
  // The DOM has to exist first, which is why this is in its own effect.
  useEffect(() => {
    if (!doc || !anchor?.chunkId) return
    const el = chunkRefs.current.get(anchor.chunkId)
    if (el) {
      // ``smooth`` is intentional — the small visual transition tells
      // the user "the drawer moved you to the cited passage".
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [doc, anchor?.chunkId])

  if (!open) return null

  return (
    <>
      {/* Backdrop — semi-opaque so the chat is still visible behind. */}
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(11,23,46,0.45)' }}
      />

      {/* Drawer panel — slides in from the right. ``role="dialog"``
          + ``aria-modal`` makes screen readers treat it as a modal. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Source preview"
        className="fixed top-0 right-0 z-50 h-full w-full max-w-2xl flex flex-col shadow-2xl"
        style={{
          background: 'var(--surface-card)',
          borderLeft: '1px solid var(--border-soft)',
          animation: 'sourceDrawerIn 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <DrawerHeader
          ref={closeBtnRef}
          doc={doc}
          anchor={anchor}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto">
          {loading && <DrawerLoading />}
          {error && <DrawerError message={error} />}
          {doc && !loading && !error && (
            <DocumentBody
              doc={doc}
              highlightChunkId={anchor?.chunkId ?? null}
              registerChunkRef={(id, el) => {
                chunkRefs.current.set(id, el)
              }}
            />
          )}
        </div>
      </aside>

      <style jsx global>{`
        @keyframes sourceDrawerIn {
          from {
            transform: translateX(40%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}

// ── Header ────────────────────────────────────────────────────────────────

const DrawerHeader = ({
  ref,
  doc,
  anchor,
  onClose,
}: {
  ref: React.Ref<HTMLButtonElement>
  doc: DocumentView | null
  anchor: SourcePreviewAnchor | null
  onClose: () => void
}) => {
  const Icon = pickIcon(doc?.doc_type)
  return (
    <div
      className="px-5 pt-4 pb-3 border-b"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon
              size={14}
              strokeWidth={1.75}
              style={{ color: 'var(--text-muted)' }}
            />
            <span
              className="text-[10.5px] font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              {doc?.doc_type ?? 'Source'}
              {doc?.law_type && doc.law_type !== doc.doc_type
                ? ` · ${doc.law_type}`
                : ''}
              {doc?.visibility_scope === 'tenant_private' && (
                <span style={{ color: 'var(--gold-dark)' }}> · firm</span>
              )}
            </span>
          </div>
          <h2
            className="font-heading text-[16px] font-semibold leading-tight truncate"
            style={{ color: 'var(--text-primary)' }}
            title={doc?.title}
          >
            {doc?.title ?? anchor?.label ?? 'Loading source…'}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {doc?.pdf_url && (
            <a
              href={doc.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-md transition-opacity hover:opacity-90"
              style={{
                background: 'var(--gold)',
                color: 'var(--navy)',
              }}
            >
              <ArrowSquareOut size={11} strokeWidth={1.75} />
              Open original PDF
            </a>
          )}
          <button
            ref={ref}
            type="button"
            onClick={onClose}
            aria-label="Close source preview"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'var(--surface-overlay)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            <X size={13} strokeWidth={1.75} />
          </button>
        </div>
      </div>
      {doc && (
        <div
          className="mt-2 flex items-center gap-3 text-[11px]"
          style={{ color: 'var(--text-muted)' }}
        >
          <span>{doc.page_count} pages</span>
          <span aria-hidden>·</span>
          <span>{doc.chunks.length} indexed sections</span>
          {doc.pdf_url_expires_in_seconds && (
            <>
              <span aria-hidden>·</span>
              <span
                title="Signed URL TTL"
                style={{ color: 'var(--text-subtle)' }}
              >
                PDF link expires in{' '}
                {formatTtl(doc.pdf_url_expires_in_seconds)}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Body ──────────────────────────────────────────────────────────────────

function DocumentBody({
  doc,
  highlightChunkId,
  registerChunkRef,
}: {
  doc: DocumentView
  highlightChunkId: string | null
  registerChunkRef: (chunkId: string, el: HTMLDivElement | null) => void
}) {
  // Group chunks by page so the rendered document looks like a
  // document, not a stream of unbroken paragraphs.
  const pages = useMemo(() => groupByPage(doc.chunks), [doc.chunks])

  return (
    <div className="px-5 py-5 space-y-6">
      {pages.length === 0 && (
        <div
          className="rounded-lg border px-4 py-6 text-center text-[12.5px]"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'var(--surface-sunken)',
            color: 'var(--text-muted)',
          }}
        >
          This document has no indexed text yet. Try opening the
          original PDF if available.
        </div>
      )}

      {pages.map((page) => (
        <section key={page.label} className="space-y-2.5">
          <div
            className="text-[10.5px] font-medium uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            {page.label}
          </div>
          <div className="space-y-3">
            {page.chunks.map((c) => {
              const isCited = c.chunk_id === highlightChunkId
              return (
                <ChunkBlock
                  key={c.chunk_id}
                  chunk={c}
                  cited={isCited}
                  registerRef={(el) => registerChunkRef(c.chunk_id, el)}
                />
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function ChunkBlock({
  chunk,
  cited,
  registerRef,
}: {
  chunk: DocumentChunkView
  cited: boolean
  registerRef: (el: HTMLDivElement | null) => void
}) {
  const breadcrumb = formatChunkBreadcrumb(chunk)
  return (
    <div
      ref={registerRef}
      className="rounded-lg px-3 py-2.5 transition-colors"
      style={{
        background: cited
          ? 'rgba(201,151,43,0.10)'
          : 'transparent',
        border: cited
          ? '1px solid rgba(201,151,43,0.45)'
          : '1px solid transparent',
      }}
    >
      {breadcrumb && (
        <div
          className="text-[10.5px] font-medium mb-1"
          style={{
            color: cited ? 'var(--gold-dark)' : 'var(--text-muted)',
          }}
        >
          {breadcrumb}
        </div>
      )}
      <p
        className="text-[13px] leading-relaxed whitespace-pre-wrap"
        style={{
          color: cited ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
      >
        {chunk.content}
      </p>
      {cited && (
        <div
          className="mt-2 inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--gold-dark)' }}
        >
          <span
            aria-hidden
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--gold-dark)' }}
          />
          Cited passage
        </div>
      )}
    </div>
  )
}

// ── States ────────────────────────────────────────────────────────────────

function DrawerLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Spinner
        size={20}
        strokeWidth={1.75}
        className="animate-spin"
        style={{ color: 'var(--text-muted)' }}
      />
      <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
        Loading source…
      </span>
    </div>
  )
}

function DrawerError({ message }: { message: string }) {
  return (
    <div className="px-5 py-8">
      <div
        className="rounded-lg border px-4 py-5 text-center"
        style={{
          borderColor: 'rgba(192,57,43,0.30)',
          background: 'rgba(192,57,43,0.06)',
        }}
      >
        <Warning
          size={18}
          weight="fill"
          className="mx-auto mb-2"
          style={{ color: '#C0392B' }}
        />
        <p
          className="text-[12.5px] font-medium"
          style={{ color: '#C0392B' }}
        >
          {message}
        </p>
        <p
          className="text-[11px] mt-1"
          style={{ color: 'var(--text-muted)' }}
        >
          The source may have been removed, or it might belong to a
          different organisation.
        </p>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────

interface PageGroup {
  label: string
  chunks: DocumentChunkView[]
}

function groupByPage(chunks: DocumentChunkView[]): PageGroup[] {
  const groups = new Map<string, DocumentChunkView[]>()
  for (const c of chunks) {
    const label =
      c.page_start && c.page_end && c.page_start !== c.page_end
        ? `Page ${c.page_start}–${c.page_end}`
        : c.page_start
          ? `Page ${c.page_start}`
          : 'Unpaginated'
    const bucket = groups.get(label) ?? []
    bucket.push(c)
    groups.set(label, bucket)
  }
  // Insertion order matches the chunk array, which the backend orders
  // by page_start → start_char → created_at. No re-sort needed.
  return Array.from(groups, ([label, chunks]) => ({ label, chunks }))
}

function formatChunkBreadcrumb(c: DocumentChunkView): string | null {
  const parts: string[] = []
  if (c.chapter) parts.push(`Ch. ${c.chapter}`)
  if (c.part) parts.push(`Part ${c.part}`)
  if (c.article) parts.push(`Art. ${c.article}`)
  if (c.section) parts.push(`s. ${c.section}`)
  if (c.clause) parts.push(`cl. ${c.clause}`)
  if (c.subsection) parts.push(`subs. ${c.subsection}`)
  return parts.length ? parts.join(' · ') : null
}

function pickIcon(docType: string | undefined): typeof Scales {
  if (!docType) return BookOpen
  const lc = docType.toLowerCase()
  if (lc.includes('case')) return Buildings
  if (lc.includes('memo') || lc.includes('sample') || lc.includes('template'))
    return Briefcase
  if (lc.includes('constitution') || lc.includes('act') || lc.includes('regulation'))
    return Scales
  return BookOpen
}

function formatTtl(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.round(seconds / 3600)
    return `${h}h`
  }
  if (seconds >= 60) {
    const m = Math.round(seconds / 60)
    return `${m}m`
  }
  return `${seconds}s`
}
