'use client'

/**
 * Drafting studio — the Editor tab. A TipTap editor on a page sized and
 * styled by the document's design, a design panel, and PDF preview /
 * download through the backend renderer (same HTML and CSS as on screen).
 *
 * The parent remounts this component (via `key`) whenever a different
 * document is opened, so the editor is created with that content.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useEditor } from '@tiptap/react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useIsPhone } from '@/hooks/use-media-query'
import type { DocumentDesign } from '@/lib/documents/design'
import { PdfExportError, pdfFilename, renderDocumentPdf, saveBlob } from '@/lib/documents/pdf'
import { useLetterheadFirm } from '../_hooks/use-letterhead-firm'
import { EditorHeader } from './EditorHeader'
import { DesignPanel } from './studio/DesignPanel'
import { PdfPreviewDialog } from './studio/PdfPreviewDialog'
import { StudioCanvas } from './studio/StudioCanvas'
import { StudioToolbar } from './studio/StudioToolbar'
import { studioExtensions } from './studio/extensions'

export function EditorTab({
  draftTitle,
  onTitleChange,
  court,
  suitNumber,
  editingDocId,
  isSaving,
  initialHTML,
  onContentChange,
  design,
  onDesignChange,
  onSave,
  onSaveAsTemplate,
}: {
  draftTitle: string
  onTitleChange: (v: string) => void
  court: string
  suitNumber: string
  editingDocId: string | null
  isSaving: boolean
  initialHTML: string
  onContentChange: (html: string) => void
  design: DocumentDesign
  onDesignChange: (d: DocumentDesign) => void
  onSave: () => void
  onSaveAsTemplate: () => void
}) {
  const firm = useLetterheadFirm()
  const isPhone = useIsPhone()
  const [designPref, setDesignOpen] = useState<boolean | null>(null)
  const designOpen = designPref ?? !isPhone
  const [pdfBusy, setPdfBusy] = useState<'preview' | 'download' | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)

  const extensions = useMemo(
    () => studioExtensions('Start writing, or open a template from the Templates tab.'),
    [],
  )
  const editor = useEditor({
    extensions,
    content: initialHTML,
    // Next renders on the server first; create the editor on the client.
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => onContentChange(e.getHTML()),
  })

  // Free the preview's object URL when it is replaced or closed.
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const title = draftTitle.trim() || 'Untitled document'

  const renderPdf = useCallback(
    async (mode: 'preview' | 'download') => {
      if (!editor || editor.isEmpty) {
        toast.error('Write something before exporting.')
        return
      }
      setPdfBusy(mode)
      try {
        const blob = await renderDocumentPdf({ title, bodyHtml: editor.getHTML(), design, firm })
        if (mode === 'download') {
          saveBlob(blob, pdfFilename(title))
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
    [editor, title, design, firm],
  )

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)', boxShadow: 'var(--shadow-xs)', height: isPhone ? 'calc(100dvh - 250px)' : 'calc(100vh - 220px)', minHeight: isPhone ? 420 : 560 }}
    >
      <EditorHeader
        draftTitle={draftTitle}
        onTitleChange={onTitleChange}
        court={court}
        suitNumber={suitNumber}
        isEditing={!!editingDocId}
        isSaving={isSaving}
        designOpen={designOpen}
        onToggleDesign={() => setDesignOpen(!designOpen)}
        pdfBusy={pdfBusy}
        onPreview={() => void renderPdf('preview')}
        onDownload={() => void renderPdf('download')}
        onSaveAsTemplate={onSaveAsTemplate}
        onSave={onSave}
      />

      {editor ? (
        <>
          <StudioToolbar editor={editor} />
          <div className="flex min-h-0 flex-1">
            <StudioCanvas editor={editor} design={design} firm={firm} />
            {designOpen && !isPhone && (
              <DesignPanel design={design} onChange={onDesignChange} firmName={firm?.name ?? null} />
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 space-y-3 p-8" aria-busy aria-label="Loading editor">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="mx-auto h-[60vh] w-[210mm] max-w-full" />
        </div>
      )}

      {isPhone && (
        <Dialog open={designOpen} onOpenChange={(o) => setDesignOpen(o)}>
          <DialogContent className="gap-0 p-0">
            <DialogHeader className="border-b px-4 py-3" style={{ borderColor: 'var(--border-soft)' }}>
              <DialogTitle className="font-heading text-[16px]">Design</DialogTitle>
            </DialogHeader>
            <DesignPanel
              design={design}
              onChange={onDesignChange}
              firmName={firm?.name ?? null}
              className="w-full"
            />
          </DialogContent>
        </Dialog>
      )}

      <PdfPreviewDialog
        url={previewUrl}
        title={title}
        onClose={() => { setPreviewUrl(null); setPreviewBlob(null) }}
        onDownload={() => {
          if (previewBlob) {
            saveBlob(previewBlob, pdfFilename(title))
            toast.success('PDF downloaded.')
          }
        }}
      />
    </div>
  )
}
