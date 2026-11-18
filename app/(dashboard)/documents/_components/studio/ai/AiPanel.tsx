'use client'

/**
 * The studio's AI panel, docked beside the page. Three tabs:
 *
 * - Draft   write from an instruction, continue the document, or rewrite
 *           the selection; results wait on a card until accepted.
 * - Review  a partner-style check of the whole draft; each issue can be
 *           jumped to and, where the model quoted the text, fixed in place.
 * - Ask     grounded legal Q&A about this document (the /ask pipeline).
 */

import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Editor } from '@tiptap/react'
import {
  ArrowClockwise,
  ArrowDown,
  BookOpen,
  Check,
  ClipboardText,
  MagnifyingGlass,
  PaperPlaneRight,
  Sparkle,
  Stop,
  TextAlignLeft,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/shared/Spinner'
import { buildPageContext } from '@/components/ai/DocumentAssistant'
import { askStream, AiServiceError } from '@/lib/ai/client'
import { DEFAULT_DISCLAIMER } from '@/lib/ai/types'
import { REWRITE_ACTIONS, type DraftSource, type ReviewIssue } from '@/lib/ai/drafting'
import { sanitizeAiHtml } from '@/lib/documents/text'
import { findQuote, revealRange } from './editor-text'
import type { DraftAssistant } from './use-draft-assistant'

export type AiTab = 'draft' | 'review' | 'ask'

export interface AiPanelHandle {
  focus: (tab?: AiTab) => void
}

const TABS: ReadonlyArray<{ id: AiTab; label: string }> = [
  { id: 'draft', label: 'Draft' },
  { id: 'review', label: 'Review' },
  { id: 'ask', label: 'Ask' },
]

const SEVERITY = {
  high: { label: 'High', color: '#C0392B', bg: 'rgba(192,57,43,0.08)' },
  medium: { label: 'Medium', color: '#B7791F', bg: 'rgba(201,151,43,0.12)' },
  low: { label: 'Low', color: '#6B7280', bg: 'var(--surface-sunken)' },
} as const

export const AiPanel = forwardRef<
  AiPanelHandle,
  {
    editor: Editor
    assistant: DraftAssistant
    hasSelection: boolean
    tab: AiTab
    onTabChange: (t: AiTab) => void
    useAuthorities: boolean
    onUseAuthoritiesChange: (v: boolean) => void
    linkedCaseTitle: string | null
    documentTitle: string
    onClose: () => void
    className?: string
  }
>(function AiPanel(
  { editor, assistant, hasSelection, tab, onTabChange, useAuthorities, onUseAuthoritiesChange, linkedCaseTitle, documentTitle, onClose, className = 'w-[380px]' },
  ref,
) {
  const draftInputRef = useRef<HTMLTextAreaElement>(null)
  const askInputRef = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(ref, () => ({
    focus: (t) => {
      if (t) onTabChange(t)
      setTimeout(() => (t === 'ask' ? askInputRef : draftInputRef).current?.focus(), 30)
    },
  }))

  return (
    <aside
      className={`flex shrink-0 flex-col border-l ${className}`}
      style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-card)' }}
      aria-label="AI assistant"
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--border-soft)' }}>
        <Sparkle size={14} weight="fill" style={{ color: 'var(--gold)' }} />
        <div className="flex flex-1 items-center gap-0.5" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => onTabChange(t.id)}
              className="cursor-pointer rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors hover:bg-[var(--surface-overlay)]"
              style={{
                background: tab === t.id ? 'var(--surface-sunken)' : undefined,
                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI panel"
          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md hover:bg-[var(--surface-overlay)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'draft' && (
          <DraftTab
            inputRef={draftInputRef}
            editor={editor}
            assistant={assistant}
            hasSelection={hasSelection}
            useAuthorities={useAuthorities}
            onUseAuthoritiesChange={onUseAuthoritiesChange}
            linkedCaseTitle={linkedCaseTitle}
          />
        )}
        {tab === 'review' && <ReviewTab editor={editor} assistant={assistant} />}
        {tab === 'ask' && <AskTab inputRef={askInputRef} editor={editor} documentTitle={documentTitle} />}
      </div>
    </aside>
  )
})

// ── Draft ────────────────────────────────────────────────────────────────

function DraftTab({
  inputRef,
  editor,
  assistant,
  hasSelection,
  useAuthorities,
  onUseAuthoritiesChange,
  linkedCaseTitle,
}: {
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  editor: Editor
  assistant: DraftAssistant
  hasSelection: boolean
  useAuthorities: boolean
  onUseAuthoritiesChange: (v: boolean) => void
  linkedCaseTitle: string | null
}) {
  const [instruction, setInstruction] = useState('')
  const run = assistant.run && assistant.run.mode !== 'review' ? assistant.run : null
  const busy = run?.phase === 'working'
  const empty = editor.isEmpty

  const submit = () => {
    const text = instruction.trim()
    if (!text || busy) return
    if (hasSelection) assistant.rewriteSelection({ instruction: text })
    else assistant.generate(text)
    setInstruction('')
  }

  return (
    <div className="space-y-4 p-3">
      <div className="rounded-xl border" style={{ borderColor: 'var(--border-soft)' }}>
        <textarea
          ref={inputRef}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          rows={3}
          placeholder={
            hasSelection
              ? 'How should the selected text change?'
              : empty
                ? 'Describe the document to draft...'
                : 'What should be added at the cursor?'
          }
          className="block w-full resize-none bg-transparent px-3 pt-2.5 text-[13px] leading-snug outline-none placeholder:text-[var(--text-subtle)]"
          style={{ color: 'var(--text-primary)' }}
        />
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <span className="truncate pl-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {hasSelection ? 'Applies to your selection' : empty ? 'Writes the whole document' : 'Inserts at the cursor'}
          </span>
          <Button size="sm" className="h-7 rounded-lg" disabled={!instruction.trim() || busy} onClick={submit}>
            <PaperPlaneRight size={13} weight="fill" />
            {hasSelection ? 'Rewrite' : 'Draft'}
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {hasSelection ? 'Rewrite selection' : 'Quick actions'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {hasSelection ? (
            REWRITE_ACTIONS.map((a) => (
              <Chip key={a.id} disabled={busy} title={a.hint} onClick={() => assistant.rewriteSelection({ action: a.id })}>
                {a.label}
              </Chip>
            ))
          ) : (
            <>
              <Chip disabled={busy || empty} onClick={() => assistant.continueWriting()}>
                <ArrowDown size={12} /> Continue writing
              </Chip>
              <Chip disabled={busy || empty} onClick={() => assistant.review()}>
                <MagnifyingGlass size={12} /> Review draft
              </Chip>
              <span className="w-full pt-0.5 text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                Select text in the page to rewrite it.
              </span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-1.5 rounded-lg px-2.5 py-2 text-[11.5px]" style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={useAuthorities}
            onChange={(e) => onUseAuthoritiesChange(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--gold)]"
          />
          Cite statutes and rules from the legal library
        </label>
        <p className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <BookOpen size={13} />
          {linkedCaseTitle ? `Using facts from ${linkedCaseTitle}` : 'No case linked: link one for party names and suit details'}
        </p>
      </div>

      {run && <ResultCard assistant={assistant} />}
    </div>
  )
}

function ResultCard({ assistant }: { assistant: DraftAssistant }) {
  const run = assistant.run!
  const html = useMemo(() => sanitizeAiHtml(run.html), [run.html])
  const working = run.phase === 'working'
  const fill = run.target.kind === 'fill'

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: working ? 'var(--gold)' : 'var(--border-soft)' }}>
      <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-sunken)' }}>
        {working ? <Spinner size={12} /> : run.phase === 'error' ? <WarningCircle size={13} color="#C0392B" /> : <Check size={13} color="#2E7D4F" />}
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>
          {run.label}
        </span>
        {working && (
          <button type="button" onClick={assistant.stop} className="inline-flex cursor-pointer items-center gap-1 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
            <Stop size={11} weight="fill" /> Stop
          </button>
        )}
      </div>

      {run.error ? (
        <p className="px-3 py-3 text-[12.5px]" style={{ color: '#C0392B' }}>{run.error}</p>
      ) : fill ? (
        <p className="px-3 py-3 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
          {working ? (run.status ?? 'Writing into the page...') : 'The draft is in the page. Read it through, then edit, review or rewrite any part.'}
        </p>
      ) : (
        <div
          className="ai-preview max-h-[320px] overflow-y-auto px-3 py-2.5 text-[12.5px] leading-relaxed [&_h2]:mt-2 [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:list-disc"
          style={{ color: 'var(--text-primary)' }}
        >
          {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : <p style={{ color: 'var(--text-muted)' }}>{run.status ?? 'Thinking...'}</p>}
        </div>
      )}

      {run.clipped && (
        <p className="px-3 pb-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          The document is long, so only part of it was sent for context.
        </p>
      )}

      <Sources sources={run.sources} />

      {run.phase === 'done' && (
        <div className="flex flex-wrap items-center gap-1.5 border-t px-3 py-2" style={{ borderColor: 'var(--border-soft)' }}>
          {fill ? (
            <>
              <Button size="sm" className="h-7 rounded-lg" onClick={assistant.discard}>Keep draft</Button>
              <Button size="sm" variant="outline" className="h-7 rounded-lg" onClick={assistant.undoFill}>Remove it</Button>
            </>
          ) : run.target.kind === 'replace' ? (
            <>
              <Button size="sm" className="h-7 rounded-lg" onClick={() => assistant.accept('replace')}>Replace</Button>
              <Button size="sm" variant="outline" className="h-7 rounded-lg" onClick={() => assistant.accept('insert-below')}>Insert below</Button>
              <Button size="sm" variant="ghost" className="h-7 rounded-lg" onClick={assistant.discard}>Discard</Button>
            </>
          ) : (
            <>
              <Button size="sm" className="h-7 rounded-lg" onClick={() => assistant.accept()}>Insert</Button>
              <CopyButton html={html} />
              <Button size="sm" variant="ghost" className="h-7 rounded-lg" onClick={assistant.discard}>Discard</Button>
            </>
          )}
        </div>
      )}
      {run.phase === 'error' && (
        <div className="border-t px-3 py-2" style={{ borderColor: 'var(--border-soft)' }}>
          <Button size="sm" variant="ghost" className="h-7 rounded-lg" onClick={assistant.discard}>Dismiss</Button>
        </div>
      )}
    </div>
  )
}

function CopyButton({ html }: { html: string }) {
  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 rounded-lg"
      onClick={async () => {
        try {
          const div = document.createElement('div')
          div.innerHTML = html
          await navigator.clipboard.writeText(div.innerText)
          toast.success('Copied.')
        } catch {
          toast.error('Could not copy to the clipboard.')
        }
      }}
    >
      <ClipboardText size={13} /> Copy
    </Button>
  )
}

function Sources({ sources }: { sources: DraftSource[] }) {
  const [open, setOpen] = useState(false)
  if (sources.length === 0) return null
  return (
    <div className="border-t px-3 py-2" style={{ borderColor: 'var(--border-soft)' }}>
      <button type="button" onClick={() => setOpen(!open)} className="flex cursor-pointer items-center gap-1.5 text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        <BookOpen size={12} />
        {sources.length} {sources.length === 1 ? 'authority' : 'authorities'} available to cite
      </button>
      {open && (
        <ul className="mt-2 space-y-2">
          {sources.map((s) => (
            <li key={s.ref} className="text-[11.5px]">
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.label}</span>
              <p className="mt-0.5 line-clamp-3" style={{ color: 'var(--text-muted)' }}>{s.excerpt}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Review ───────────────────────────────────────────────────────────────

function ReviewTab({ editor, assistant }: { editor: Editor; assistant: DraftAssistant }) {
  const [focus, setFocus] = useState('')
  const [resolved, setResolved] = useState<Set<number>>(new Set())
  const run = assistant.run?.mode === 'review' ? assistant.run : null
  const working = run?.phase === 'working'
  const issues = run?.review?.issues ?? []
  const open = issues.map((issue, i) => ({ issue, i })).filter(({ i }) => !resolved.has(i))

  const start = () => {
    setResolved(new Set())
    assistant.review(focus.trim() || undefined)
  }

  return (
    <div className="space-y-3 p-3">
      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        A partner-style check for legal risk, inconsistent names, dates and amounts, unsupported statements of law and unfilled placeholders.
      </p>
      <input
        value={focus}
        onChange={(e) => setFocus(e.target.value)}
        placeholder="Optional focus, e.g. compliance with Order 11 C.I. 47"
        className="h-8 w-full rounded-lg border bg-transparent px-2.5 text-[12.5px] outline-none focus:border-[var(--gold)]"
        style={{ borderColor: 'var(--border-soft)', color: 'var(--text-primary)' }}
      />
      <Button size="sm" className="h-8 w-full rounded-lg" disabled={working} onClick={start}>
        {working ? <Spinner size={13} /> : run ? <ArrowClockwise size={13} /> : <MagnifyingGlass size={13} />}
        {working ? 'Reviewing...' : run ? 'Review again' : 'Review this draft'}
      </Button>

      {run?.error && <p className="text-[12.5px]" style={{ color: '#C0392B' }}>{run.error}</p>}

      {run?.review && (
        <>
          {run.review.summary && (
            <p className="rounded-lg px-3 py-2 text-[12.5px] leading-relaxed" style={{ background: 'var(--surface-sunken)', color: 'var(--text-primary)' }}>
              {run.review.summary}
            </p>
          )}
          {open.length === 0 ? (
            <p className="flex items-center gap-1.5 text-[12.5px]" style={{ color: '#2E7D4F' }}>
              <Check size={13} /> {issues.length ? 'All issues resolved.' : 'No issues found.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {open.map(({ issue, i }) => (
                <IssueCard key={i} editor={editor} issue={issue} onResolve={() => setResolved(new Set(resolved).add(i))} />
              ))}
            </ul>
          )}
          <Sources sources={run.sources} />
          <p className="text-[10.5px]" style={{ color: 'var(--text-subtle)' }}>{DEFAULT_DISCLAIMER}</p>
        </>
      )}
    </div>
  )
}

function IssueCard({ editor, issue, onResolve }: { editor: Editor; issue: ReviewIssue; onResolve: () => void }) {
  const sev = SEVERITY[issue.severity]
  // Recomputed per render so edits to the page are reflected.
  const range = issue.quote ? findQuote(editor, issue.quote) : null
  const canApply = !!range && !!issue.suggestion && issue.suggestion.length < 1500

  const apply = () => {
    const r = issue.quote ? findQuote(editor, issue.quote) : null
    if (!r) {
      toast.error('That text is no longer in the document.')
      return
    }
    editor.chain().focus().insertContentAt(r, issue.suggestion).run()
    toast.success('Fix applied.')
    onResolve()
  }

  return (
    <li className="rounded-xl border p-2.5" style={{ borderColor: 'var(--border-soft)' }}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase" style={{ background: sev.bg, color: sev.color }}>
          {sev.label}
        </span>
        <p className="flex-1 text-[12.5px] font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{issue.title}</p>
      </div>
      {issue.detail && <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{issue.detail}</p>}
      {issue.quote && (
        <button
          type="button"
          disabled={!range}
          onClick={() => range && revealRange(editor, range)}
          className="mt-1.5 block w-full cursor-pointer border-l-2 pl-2 text-left text-[11.5px] italic disabled:cursor-default"
          style={{ borderColor: sev.color, color: 'var(--text-muted)' }}
          title={range ? 'Show in document' : 'Not found in the current text'}
        >
          &ldquo;{issue.quote.length > 160 ? `${issue.quote.slice(0, 160)}...` : issue.quote}&rdquo;
        </button>
      )}
      {issue.suggestion && (
        <p className="mt-1.5 rounded-md px-2 py-1.5 text-[11.5px] leading-relaxed" style={{ background: 'var(--surface-sunken)', color: 'var(--text-primary)' }}>
          <TextAlignLeft size={11} className="mr-1 inline" />
          {issue.suggestion}
        </p>
      )}
      <div className="mt-2 flex gap-1.5">
        {canApply && (
          <Button size="sm" className="h-6 rounded-md px-2 text-[11.5px]" onClick={apply}>Apply fix</Button>
        )}
        {range && (
          <Button size="sm" variant="outline" className="h-6 rounded-md px-2 text-[11.5px]" onClick={() => revealRange(editor, range)}>Show</Button>
        )}
        <Button size="sm" variant="ghost" className="h-6 rounded-md px-2 text-[11.5px]" onClick={onResolve}>Dismiss</Button>
      </div>
    </li>
  )
}

// ── Ask ──────────────────────────────────────────────────────────────────

function AskTab({
  inputRef,
  editor,
  documentTitle,
}: {
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  editor: Editor
  documentTitle: string
}) {
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState('')
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(async () => {
    const q = question.trim()
    if (!q || busy) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const { context } = buildPageContext({ tab: 'Studio', documentTitle, documentHTML: editor.getHTML() })
    setAsked(q)
    setQuestion('')
    setAnswer('')
    setError(null)
    setStatus(null)
    setBusy(true)
    try {
      for await (const evt of askStream({ question: q, session_id: sessionRef.current, context }, { signal: ctrl.signal })) {
        if (evt.event === 'status') setStatus(evt.data.message)
        else if (evt.event === 'answer_delta') setAnswer((a) => a + evt.data.text)
        else if (evt.event === 'refused' || evt.event === 'completed') {
          sessionRef.current = evt.data.session_id ?? sessionRef.current
          setAnswer(evt.data.answer)
        } else if (evt.event === 'error') throw new AiServiceError(evt.data.message, 0)
      }
    } catch (err) {
      if (!ctrl.signal.aborted) setError(err instanceof AiServiceError ? err.message : 'The assistant could not be reached.')
    } finally {
      if (!ctrl.signal.aborted) setBusy(false)
    }
  }, [question, busy, documentTitle, editor])

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-end gap-2 rounded-xl border p-2" style={{ borderColor: 'var(--border-soft)' }}>
        <textarea
          ref={inputRef}
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          placeholder="Ask about this document or the law behind it..."
          className="flex-1 resize-none bg-transparent px-1 text-[13px] outline-none placeholder:text-[var(--text-subtle)]"
          style={{ color: 'var(--text-primary)' }}
        />
        <Button size="icon" className="h-8 w-8 shrink-0 rounded-full" disabled={!question.trim() || busy} onClick={() => void send()} aria-label="Ask">
          <PaperPlaneRight size={14} weight="fill" />
        </Button>
      </div>
      {asked && (
        <div className="space-y-2">
          <p className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{asked}</p>
          {error ? (
            <p className="text-[12.5px]" style={{ color: '#C0392B' }}>{error}</p>
          ) : answer ? (
            <div className="ai-markdown text-[12.5px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              <Spinner size={12} /> {status ?? 'Thinking...'}
            </p>
          )}
          {!busy && answer && <p className="text-[10.5px]" style={{ color: 'var(--text-subtle)' }}>{DEFAULT_DISCLAIMER}</p>}
        </div>
      )}
    </div>
  )
}

function Chip({ children, onClick, disabled, title }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors hover:border-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40"
      style={{ borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}
    >
      {children}
    </button>
  )
}
