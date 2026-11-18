'use client'

/**
 * The studio's AI engine. Runs one /draft request at a time and keeps
 * what came back until the lawyer accepts or discards it.
 *
 * Where a result goes is fixed when the request starts (`target`):
 * - `fill`     the document was empty: the draft streams straight into the
 *              page so the lawyer watches it being written. One undo
 *              removes it.
 * - `replace`  a rewrite of the selection; accepting swaps it in place.
 * - `insert`   new text (generate into a non-empty document, continue);
 *              accepting inserts it at the remembered position.
 * - `review`   no text; a list of issues the panel shows.
 *
 * Nothing but `fill` touches the document without the lawyer accepting.
 *
 * Saving: TipTap only emits `update` when a transaction changes the
 * document. A `fill` streams in with updates suppressed (so half-written
 * text is not autosaved), and the final version is usually identical to
 * what was streamed, so no `update` fires at the end. `onContent` is
 * therefore called explicitly whenever a fill ends (done, stopped or
 * failed), so the page and what autosave sees can never drift apart.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { toast } from 'sonner'
import { AiServiceError } from '@/lib/ai/client'
import {
  DRAFT_LIMITS,
  REWRITE_ACTIONS,
  draftStream,
  type DraftMode,
  type DraftSource,
  type ReviewResult,
  type RewriteAction,
} from '@/lib/ai/drafting'
import { clip, htmlToText } from '@/lib/documents/text'

export type DraftTarget =
  | { kind: 'fill' }
  | { kind: 'replace'; from: number; to: number; original: string }
  | { kind: 'insert'; at: number }
  | { kind: 'review' }

export type DraftPhase = 'idle' | 'working' | 'done' | 'error'

export interface DraftRun {
  mode: DraftMode
  /** Short description shown on the result card. */
  label: string
  target: DraftTarget
  phase: DraftPhase
  status: string | null
  /** Streamed or final HTML for write modes. */
  html: string
  sources: DraftSource[]
  review: ReviewResult | null
  error: string | null
  /** Notes when part of the document was not sent (too long). */
  clipped: boolean
}

export interface DraftContext {
  title: string
  /** Case facts for the model, already formatted. */
  matter: string | null
  useAuthorities: boolean
}

/** Partial HTML can end mid-tag; drop a trailing unfinished tag before rendering. */
function renderable(html: string): string {
  const lastOpen = html.lastIndexOf('<')
  return lastOpen > html.lastIndexOf('>') ? html.slice(0, lastOpen) : html
}

export function useDraftAssistant(
  editor: Editor | null,
  getContext: () => DraftContext,
  onContent: (html: string) => void,
) {
  const [run, setRun] = useState<DraftRun | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const onContentRef = useRef(onContent)
  useEffect(() => {
    onContentRef.current = onContent
  })

  useEffect(() => () => abortRef.current?.abort(), [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setRun((r) => (r && r.phase === 'working' ? { ...r, phase: r.html ? 'done' : 'idle', status: null } : r))
    editor?.setEditable(true)
  }, [editor])

  const start = useCallback(
    async (opts: {
      mode: DraftMode
      label: string
      target: DraftTarget
      instruction?: string
      action?: RewriteAction
      selection?: string
    }) => {
      if (!editor) return
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      const ctx = getContext()

      const docText = htmlToText(editor.getHTML())
      // Continue needs the end of the document most; everything else the start.
      const { text: docSent, clipped } =
        opts.mode === 'continue' && docText.length > DRAFT_LIMITS.document
          ? { text: docText.slice(-DRAFT_LIMITS.document), clipped: true }
          : clip(docText, DRAFT_LIMITS.document)

      setRun({
        mode: opts.mode,
        label: opts.label,
        target: opts.target,
        phase: 'working',
        status: null,
        html: '',
        sources: [],
        review: null,
        error: null,
        clipped,
      })

      if (opts.target.kind === 'fill') editor.setEditable(false)

      let streamed = ''
      try {
        for await (const evt of draftStream(
          {
            mode: opts.mode,
            instruction: opts.instruction?.slice(0, DRAFT_LIMITS.instruction) ?? '',
            action: opts.action ?? null,
            document_title: ctx.title || null,
            document: docSent || null,
            selection: opts.selection ? clip(opts.selection, DRAFT_LIMITS.selection).text : null,
            matter: ctx.matter ? clip(ctx.matter, DRAFT_LIMITS.matter).text : null,
            use_authorities: ctx.useAuthorities,
          },
          { signal: ctrl.signal },
        )) {
          switch (evt.event) {
            case 'sources_found':
              setRun((r) => (r ? { ...r, sources: evt.data.sources } : r))
              break
            case 'status':
              setRun((r) => (r ? { ...r, status: evt.data.message } : r))
              break
            case 'delta':
              streamed += evt.data.text
              if (opts.target.kind === 'fill') {
                editor.commands.setContent(renderable(streamed), { emitUpdate: false })
              }
              setRun((r) => (r ? { ...r, html: streamed } : r))
              break
            case 'review':
              setRun((r) => (r ? { ...r, review: evt.data } : r))
              break
            case 'completed': {
              const finalHtml = evt.data.text
              if (opts.target.kind === 'fill') {
                // Canonical version replaces the streamed one; emitting the
                // update lets autosave pick it up. Undo restores the blank page.
                editor.setEditable(true)
                editor.commands.setContent(finalHtml, { emitUpdate: true })
              }
              setRun((r) =>
                r ? { ...r, phase: 'done', status: null, html: finalHtml, sources: evt.data.sources } : r,
              )
              break
            }
            case 'error':
              throw new AiServiceError(evt.data.message, 0)
          }
        }
      } catch (err) {
        if (ctrl.signal.aborted) return
        const message =
          err instanceof AiServiceError ? err.message : 'The drafting assistant could not be reached.'
        setRun((r) => (r ? { ...r, phase: 'error', status: null, error: message } : r))
        toast.error(message)
      } finally {
        if (opts.target.kind === 'fill') {
          editor.setEditable(true)
          // Whatever is on the page now (complete, stopped or partial) is
          // what autosave must hold.
          onContentRef.current(editor.getHTML())
        }
      }
    },
    [editor, getContext],
  )

  // ── Entry points ──────────────────────────────────────────────────────

  /** Draft from an instruction. Empty page: write the whole document. */
  const generate = useCallback(
    (instruction: string) => {
      if (!editor || !instruction.trim()) return
      const empty = editor.isEmpty || !editor.getText().trim()
      void start({
        mode: 'generate',
        label: instruction.trim(),
        instruction,
        target: empty ? { kind: 'fill' } : { kind: 'insert', at: editor.state.selection.to },
      })
    },
    [editor, start],
  )

  /** Rewrite the current selection with a preset or a free instruction. */
  const rewriteSelection = useCallback(
    (how: { action?: RewriteAction; instruction?: string }) => {
      if (!editor) return
      const { from, to, empty } = editor.state.selection
      if (empty) {
        toast.error('Select the text you want to rewrite first.')
        return
      }
      const original = editor.state.doc.textBetween(from, to, '\n')
      const preset = REWRITE_ACTIONS.find((a) => a.id === how.action)
      void start({
        mode: 'rewrite',
        label: how.instruction?.trim() || preset?.label || 'Rewrite',
        action: how.action,
        instruction: how.instruction,
        selection: original,
        target: { kind: 'replace', from, to, original },
      })
    },
    [editor, start],
  )

  const continueWriting = useCallback(
    (guidance?: string) => {
      if (!editor || !editor.getText().trim()) {
        toast.error('Write or draft something first, then continue from it.')
        return
      }
      void start({
        mode: 'continue',
        label: 'Continue writing',
        instruction: guidance,
        target: { kind: 'insert', at: editor.state.doc.content.size },
      })
    },
    [editor, start],
  )

  const review = useCallback(
    (focus?: string) => {
      if (!editor || !editor.getText().trim()) {
        toast.error('There is nothing to review yet.')
        return
      }
      void start({ mode: 'review', label: 'Review', instruction: focus, target: { kind: 'review' } })
    },
    [editor, start],
  )

  // ── Results ───────────────────────────────────────────────────────────

  const accept = useCallback(
    (how: 'replace' | 'insert-below' = 'replace') => {
      if (!editor || !run || run.phase !== 'done' || !run.html) return
      const t = run.target
      if (t.kind === 'replace') {
        const current = editor.state.doc.textBetween(
          Math.min(t.from, editor.state.doc.content.size),
          Math.min(t.to, editor.state.doc.content.size),
          '\n',
        )
        if (current !== t.original) {
          // The text moved since the request; put the result where the
          // cursor is rather than over the wrong words.
          editor.chain().focus().insertContent(run.html).run()
          toast.message('The original text changed, so the rewrite was inserted at the cursor.')
        } else if (how === 'insert-below') {
          editor.chain().focus().insertContentAt(t.to, run.html).run()
        } else {
          editor.chain().focus().insertContentAt({ from: t.from, to: t.to }, run.html).run()
        }
      } else if (t.kind === 'insert') {
        const at = Math.min(t.at, editor.state.doc.content.size)
        editor.chain().focus().insertContentAt(at, run.html).run()
      }
      setRun(null)
      toast.success('Added to the document.')
    },
    [editor, run],
  )

  const discard = useCallback(() => {
    abortRef.current?.abort()
    editor?.setEditable(true)
    setRun(null)
  }, [editor])

  /** Undo a `fill` draft (the page was empty before). */
  const undoFill = useCallback(() => {
    if (!editor) return
    editor.commands.clearContent(true)
    onContentRef.current(editor.getHTML())
    setRun(null)
  }, [editor])

  return { run, generate, rewriteSelection, continueWriting, review, accept, discard, undoFill, stop }
}

export type DraftAssistant = ReturnType<typeof useDraftAssistant>
