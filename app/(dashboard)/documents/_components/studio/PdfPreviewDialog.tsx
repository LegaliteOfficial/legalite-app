'use client'

import { DownloadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/**
 * Shows the rendered PDF exactly as it will download (real pagination,
 * running header/footer, page numbers) in the browser's PDF viewer.
 */
export function PdfPreviewDialog({
  url,
  title,
  onClose,
  onDownload,
}: {
  url: string | null
  title: string
  onClose: () => void
  onDownload: () => void
}) {
  return (
    <Dialog open={url !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="flex h-[88vh] flex-col gap-3 rounded-2xl sm:max-w-5xl">
        <DialogHeader className="flex-row items-center justify-between gap-3 pr-8">
          <DialogTitle className="truncate font-heading text-lg" style={{ color: 'var(--text-primary)' }}>
            {title || 'Untitled document'}
          </DialogTitle>
          <Button size="sm" className="rounded-lg" onClick={onDownload}>
            <DownloadSimple size={14} weight="bold" />
            Download PDF
          </Button>
        </DialogHeader>
        {url && (
          <iframe
            src={url}
            title="PDF preview"
            className="min-h-0 w-full flex-1 rounded-lg border"
            style={{ borderColor: 'var(--border-default)', background: 'var(--surface-sunken)' }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
