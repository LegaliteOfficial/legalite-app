'use client'

/**
 * The drafting studio for one document (/documents/[id]).
 *
 * Page on the left (TipTap, styled by the document's design so screen
 * matches print), AI or Design panel on the right. Everything autosaves.
 * AI is part of the writing surface rather than a separate chat:
 *
 * - A new document started with "Draft with AI" is written straight into
 *   the page on arrival.
 * - Selecting text shows a bar of one-click rewrites.
 * - The AI panel drafts at the cursor, continues the document, reviews it
 *   for issues (with jump-to and apply-fix) and answers legal questions.
 *
 * The parent remounts this component (via `key`) for a different document.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor } from '@tiptap/react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCases } from '@/hooks/use-cases'
import { useCreateDocument, useDeleteDocument } from '@/hooks/use-documents'
import { useIsPhone } from '@/hooks/use-media-query'
import { normaliseDesign, type DocumentDesign } from '@/lib/documents/design'
import { PdfExportError, pdfFilename, renderDocumentPdf, saveBlob } from '@/lib/documents/pdf'
import { STATUS_META, normaliseStatus, type DocumentStatus } from '@/lib/documents/status'
import { countWords } from '@/lib/documents/text'
import type { Case, Document } from '@/types'
import { useAutosave } from '../../_hooks/use-autosave'
import { useLetterheadFirm } from '../../_hooks/use-letterhead-firm'
import { takeDraftIntent } from '../../_hooks/use-start-document'
import { AiPanel, type AiPanelHandle, type AiTab } from './ai/AiPanel'
import { SelectionMenu } from './ai/SelectionMenu'
import { useDraftAssistant } from './ai/use-draft-assistant'
import { DesignPanel } from './DesignPanel'
import { PdfPreviewDialog } from './PdfPreviewDialog'
import { StudioCanvas } from './StudioCanvas'
import { StudioHeader, type StudioPanel } from './StudioHeader'
import { StudioToolbar } from './StudioToolbar'
import { studioExtensions } from './extensions'

/** Case facts for the model. Only what a drafter would put in a heading. */
export function buildMatter(doc: Pick<Document, 'court' | 'suit_number' | 'parties' | 'judge'>, linked: Case | undefined): string | null {
  const lines: string[] = []
  const add = (label: string, v: string | null | undefined) => {
    if (v && v.trim()) lines.push(`${label}: ${v.trim()}`)
  }
  if (linked) {
    add('Case', linked.title)
    add('Client', linked.client_name)
    add('Opposing party', linked.opposing_party)
    add('Practice area', linked.case_type)
    add('Stage', linked.case_stage)
    add('Next court date', linked.next_court_date)
    add('Summary', linked.description?.slice(0, 1500))
  }
  add('Court', doc.court || linked?.court)
  add('Suit number', doc.suit_number || linked?.suit_number)
  add('Parties', doc.parties)
  add('Judge', doc.judge)
  return lines.length ? lines.join('\n') : null
}

export function Studio({ doc }: { doc: Document }) {
  const router = useRouter()
  const firm = useLetterheadFirm()
  const isPhone = useIsPhone()
  const { data: cases } = useCases()
  const createMutation = useCreateDocument()
  const deleteMutation = useDeleteDocument()

  // ── Document fields (autosaved) ─────────────────────────────────────
  const [title, setTitle] = useState(doc.title === 'Untitled document' ? '' : doc.title)
  const [html, setHtml] = useState(doc.content ?? '')
  const [design, setDesign] = useState<DocumentDesign>(() => normaliseDesign(doc.design ?? null))
  const [caseId, setCaseId] = useState(doc.case_id ?? '')
  const [status, setStatus] = useState<DocumentStatus>(normaliseStatus(doc.status))
  const autosave = useAutosave(doc.id, {
    title: title.trim() || 'Untitled document',
    content: html,
    design: design as unknown as Record<string, unknown>,
    case_id: caseId,
    status,
  })

  // ── Panels ──────────────────────────────────────────────────────────
  const [panelPref, setPanel] = useState<StudioPanel | undefined>(undefined)
  // Desktop opens with the AI beside the page; phones keep the page clear.
  const panel: StudioPanel = panelPref === undefined ? (isPhone ? null : 'ai') : panelPref
  const [aiTab, setAiTab] = useState<AiTab>('draft')
  const [useAuthorities, setUseAuthorities] = useState(true)
  const aiRef = useRef<AiPanelHandle>(null)

  // ── Editor ──────────────────────────────────────────────────────────
  const extensions = useMemo(() => studioExtensions('Start writing, or ask the AI to draft it for you (Ctrl/Cmd + J).'), [])
  const editor = useEditor({
    extensions,
    content: doc.content ?? '',
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => setHtml(e.getHTML()),
  })

  const [hasSelection, setHasSelection] = useState(false)
  const [words, setWords] = useState(0)
  useEffect(() => {
    if (!editor) return
    const onSel = () => setHasSelection(!editor.state.selection.empty)
    const onUpd = () => setWords(countWords(editor.getText()))
    onUpd()
    editor.on('selectionUpdate', onSel)
    editor.on('update', onUpd)
    return () => {
      editor.off('selectionUpdate', onSel)
      editor.off('update', onUpd)
    }
  }, [editor])

  // ── AI ──────────────────────────────────────────────────────────────
  const linkedCase = cases?.find((c) => c.id === caseId)
  const contextRef = useRef({ title, matter: null as string | null, useAuthorities })
  useEffect(() => {
    contextRef.current = { title, matter: buildMatter(doc, linkedCase), useAuthorities }
  })
  const getContext = useCallback(() => contextRef.current, [])
  const assistant = useDraftAssistant(editor, getContext)

  const openAi = useCallback((tab?: AiTab) => {
    setPanel('ai')
    aiRef.current?.focus(tab)
  }, [])

  // "Draft with AI" from the home page: write the first version on arrival.
  const intentHandled = useRef(false)
  useEffect(() => {
    if (!editor || intentHandled.current) return
    intentHandled.current = true
    const intent = takeDraftIntent(doc.id)
    if (!intent) return
    // Wait for cases so the draft can use the linked case's facts.
    const t = setTimeout(() => assistant.generate(intent.instruction), 400)
    return () => clearTimeout(t)
  }, [editor, doc.id, assistant])

  // ── Keyboard ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const k = e.key.toLowerCase()
      if (k === 's') {
        e.preventDefault()
        void autosave.saveNow().then((ok) => ok && toast.success('Saved.'))
      } else if (k === 'j') {
        e.preventDefault()
        openAi(hasSelection ? 'draft' : undefined)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [autosave, openAi, hasSelection])

  // ── PDF ─────────────────────────────────────────────────────────────
  const [pdfBusy, setPdfBusy] = useState<'preview' | 'download' | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])
  const displayTitle = title.trim() || 'Untitled document'

  const renderPdf = useCallback(
    async (mode: 'preview' | 'download') => {
      if (!editor || editor.isEmpty) {
        toast.error('Write something before exporting.')
        return
      }
      setPdfBusy(mode)
      try {
        const blob = await renderDocumentPdf({ title: displayTitle, bodyHtml: editor.getHTML(), design, firm })
        if (mode === 'download') {
          saveBlob(blob, pdfFilename(displayTitle))
          toast.success('PDF downloaded.')
        } else {
          setPreviewBlob(blob)
          setPreviewUrl(URL.createObjectURL(blob))
        }
      } catch (err) {
        toast.error(err instanceof PdfExportError ? err.message : 'The PDF could not be generated.')
      } finally {
        setPdfBusy(null)
      }
    },
    [editor, displayTitle, design, firm],
  )

  // ── Other actions ───────────────────────────────────────────────────
  const saveAsTemplate = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Give the document a title to name the template.')
      return
    }
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        template_type: 'Firm template',
        content: html,
        design: design as unknown as Record<string, unknown>,
        is_template: true,
      })
      toast.success(`"${title.trim()}" saved to your templates.`)
    } catch {
      toast.error('Unable to save the template. Please try again.')
    }
  }, [title, html, design, createMutation])

  const moveToBin = useCallback(async () => {
    if (!confirm(`Move "${displayTitle}" to the bin?`)) return
    try {
      await deleteMutation.mutateAsync(doc.id)
      toast.success('Moved to the bin.')
      router.push('/documents')
    } catch {
      toast.error('Unable to delete the document. Please try again.')
    }
  }, [deleteMutation, doc.id, displayTitle, router])

  const changeStatus = useCallback((s: DocumentStatus) => {
    setStatus(s)
    toast.success(`Marked as ${STATUS_META[s].label.toLowerCase()}.`)
  }, [])

  const aiBusy = assistant.run?.phase === 'working'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ background: 'var(--surface-card)' }}>
      <StudioHeader
        title={title}
        onTitleChange={setTitle}
        status={status}
        onStatusChange={changeStatus}
        saveState={autosave.state}
        lastSavedAt={autosave.lastSavedAt}
        onRetrySave={() => void autosave.saveNow()}
        cases={cases ?? []}
        caseId={caseId}
        onCaseChange={setCaseId}
        panel={panel}
        onPanelChange={setPanel}
        pdfBusy={pdfBusy}
        onPreview={() => void renderPdf('preview')}
        onDownload={() => void renderPdf('download')}
        onSaveAsTemplate={() => void saveAsTemplate()}
        onDelete={() => void moveToBin()}
      />

      {editor ? (
        <>
          <StudioToolbar editor={editor} />
          <div className="relative flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              <StudioCanvas editor={editor} design={design} firm={firm} />
              <div
                className="flex shrink-0 items-center justify-between gap-3 border-t px-4 py-1.5 text-[11px]"
                style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}
              >
                <span>
                  {words.toLocaleString()} {words === 1 ? 'word' : 'words'}
                  {linkedCase ? ` · ${linkedCase.title}` : ''}
                </span>
                <span className="hidden sm:inline">Select text for AI rewrites · Ctrl/Cmd + J opens the assistant</span>
              </div>
            </div>
            {!isPhone && panel === 'ai' && (
              <AiPanel
                ref={aiRef}
                editor={editor}
                assistant={assistant}
                hasSelection={hasSelection}
                tab={aiTab}
                onTabChange={setAiTab}
                useAuthorities={useAuthorities}
                onUseAuthoritiesChange={setUseAuthorities}
                linkedCaseTitle={linkedCase?.title ?? null}
                documentTitle={displayTitle}
                onClose={() => setPanel(null)}
              />
            )}
            {!isPhone && panel === 'design' && (
              <DesignPanel design={design} onChange={setDesign} firmName={firm?.name ?? null} />
            )}
          </div>
          <SelectionMenu
            editor={editor}
            disabled={aiBusy}
            onRewrite={(how) => {
              setAiTab('draft')
              setPanel('ai')
              assistant.rewriteSelection(how)
            }}
          />
        </>
      ) : (
        <div className="flex-1 space-y-3 p-8" aria-busy aria-label="Loading editor">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="mx-auto h-[60vh] w-[210mm] max-w-full" />
        </div>
      )}

      {isPhone && editor && (
        <Dialog open={panel !== null} onOpenChange={(o) => !o && setPanel(null)}>
          <DialogContent className="max-h-[85dvh] gap-0 overflow-hidden p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>{panel === 'design' ? 'Design' : 'AI assistant'}</DialogTitle>
            </DialogHeader>
            {panel === 'design' ? (
              <DesignPanel design={design} onChange={setDesign} firmName={firm?.name ?? null} className="w-full" />
            ) : (
              <AiPanel
                ref={aiRef}
                editor={editor}
                assistant={assistant}
                hasSelection={hasSelection}
                tab={aiTab}
                onTabChange={setAiTab}
                useAuthorities={useAuthorities}
                onUseAuthoritiesChange={setUseAuthorities}
                linkedCaseTitle={linkedCase?.title ?? null}
                documentTitle={displayTitle}
                onClose={() => setPanel(null)}
                className="h-[80dvh] w-full border-l-0"
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      <PdfPreviewDialog
        url={previewUrl}
        title={displayTitle}
        onClose={() => {
          setPreviewUrl(null)
          setPreviewBlob(null)
        }}
        onDownload={() => {
          if (previewBlob) {
            saveBlob(previewBlob, pdfFilename(displayTitle))
            toast.success('PDF downloaded.')
          }
        }}
      />
    </div>
  )
}
