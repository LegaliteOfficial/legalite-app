'use client'

/**
 * Full-screen attachment preview routed by file kind.
 *
 *   PDF      → <iframe> (browser-native viewer)
 *   image    → <img>
 *   video    → <video controls>
 *   audio    → <audio controls>
 *   text     → fetched and rendered in <pre> (capped at 1 MB)
 *   office / archive / other → "Preview unavailable" + DownloadSimple CTA
 *
 * The signed URL is fetched on open and re-fetched any time the
 * attachment id changes. The URL stays in memory only — no
 * pre-fetching, no list-level caching.
 */

import { useEffect, useState } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { DownloadSimple, ArrowSquareOut, FileText, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/shared/Spinner'
import type { Attachment } from '@/hooks/use-attachments'
import {
  getFileKind,
  iconForKind,
  isPreviewable,
  type FileKind,
} from '@/lib/attachments/file-kind'

const MAX_TEXT_BYTES = 1024 * 1024 // 1 MB

export function AttachmentPreviewDialog({
  attachment,
  open,
  onOpenChange,
  getUrl,
  onDownload,
}: {
  attachment: Attachment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  getUrl: (id: string) => Promise<string | undefined>
  onDownload: (a: Attachment) => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch the signed URL when the dialog opens for a new attachment.
  useEffect(() => {
    if (!open || !attachment) {
      setUrl(null)
      setError(null)
      return
    }
    let cancelled = false
    setUrl(null)
    setError(null)
    setLoading(true)
    getUrl(attachment.id)
      .then((u) => {
        if (cancelled) return
        if (!u) setError('Could not generate a preview link.')
        else setUrl(u)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Preview failed.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [open, attachment?.id, getUrl])

  if (!attachment) return null

  const kind = getFileKind(attachment.file_name, attachment.file_type)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-40 data-[open]:animate-in data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:fade-out-0"
          style={{ background: 'rgba(13,27,42,0.55)' }}
        />
        <DialogPrimitive.Popup
          className="fixed inset-4 z-50 flex flex-col rounded-2xl border outline-none overflow-hidden data-[open]:animate-in data-[open]:zoom-in-95 data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:zoom-out-95 data-[closed]:fade-out-0"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-soft)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <PreviewHeader
            attachment={attachment}
            kind={kind}
            onDownload={() => onDownload(attachment)}
            onClose={() => onOpenChange(false)}
          />
          <PreviewBody
            attachment={attachment}
            kind={kind}
            url={url}
            loading={loading}
            error={error}
            onDownload={() => onDownload(attachment)}
          />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ── Header ─────────────────────────────────────────────────────────────────

function PreviewHeader({
  attachment,
  kind,
  onDownload,
  onClose,
}: {
  attachment: Attachment
  kind: FileKind
  onDownload: () => void
  onClose: () => void
}) {
  const Icon = iconForKind(kind)
  return (
    <div
      className="flex items-center justify-between gap-3 px-5 py-3 border-b shrink-0"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--surface-sunken)' }}
        >
          <Icon size={15} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <DialogPrimitive.Title
          className="text-[14px] font-semibold truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {attachment.file_name}
        </DialogPrimitive.Title>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={onDownload}>
          <DownloadSimple size={13} strokeWidth={1.75} />
          DownloadSimple
        </Button>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md transition-colors cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-sunken)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
          aria-label="Close preview"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}

// ── Body — routes by file kind ─────────────────────────────────────────────

function PreviewBody({
  attachment,
  kind,
  url,
  loading,
  error,
  onDownload,
}: {
  attachment: Attachment
  kind: FileKind
  url: string | null
  loading: boolean
  error: string | null
  onDownload: () => void
}) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
        <Spinner size={16} />
        <span className="text-[13px]">Preparing preview…</span>
      </div>
    )
  }

  if (error || !url) {
    return <Fallback message={error ?? 'Preview unavailable.'} onDownload={onDownload} />
  }

  if (!isPreviewable(kind)) {
    return <UnsupportedFallback attachment={attachment} kind={kind} url={url} onDownload={onDownload} />
  }

  switch (kind) {
    case 'pdf':
      return (
        <iframe
          src={url}
          title={attachment.file_name}
          className="flex-1 w-full"
          style={{ border: 'none', background: 'var(--surface-sunken)' }}
        />
      )
    case 'image':
      return (
        <div className="flex-1 overflow-auto flex items-center justify-center p-6" style={{ background: 'var(--surface-sunken)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={attachment.file_name}
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ boxShadow: 'var(--shadow-md)' }}
          />
        </div>
      )
    case 'video':
      return (
        <div className="flex-1 flex items-center justify-center p-4" style={{ background: '#000' }}>
          <video
            src={url}
            controls
            className="max-w-full max-h-full"
            style={{ background: '#000' }}
          />
        </div>
      )
    case 'audio':
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <div
            className="h-20 w-20 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--surface-sunken)' }}
          >
            <FileText size={28} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
          </div>
          <audio src={url} controls className="w-full max-w-md" />
        </div>
      )
    case 'text':
      return <TextPreview url={url} onDownload={onDownload} />
  }
}

// ── Text preview — fetches the file and renders it inline ─────────────────

function TextPreview({ url, onDownload }: { url: string; onDownload: () => void }) {
  const [content, setContent] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setContent(null)
    setError(null)
    setTruncated(false)
    setLoading(true)
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load (${res.status})`)
        const blob = await res.blob()
        // Cap text reads at 1 MB so very large logs don't lock the tab.
        const sliced = blob.size > MAX_TEXT_BYTES ? blob.slice(0, MAX_TEXT_BYTES) : blob
        const text = await sliced.text()
        if (cancelled) return
        setContent(text)
        setTruncated(blob.size > MAX_TEXT_BYTES)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Could not read the file.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [url])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
        <Spinner size={14} /> <span className="text-[13px]">Loading…</span>
      </div>
    )
  }
  if (error || content == null) {
    return <Fallback message={error ?? 'Could not read the file.'} onDownload={onDownload} />
  }

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--surface-sunken)' }}>
      {truncated && (
        <div
          className="px-5 py-2 text-[12px] border-b"
          style={{
            background: 'var(--surface-card)',
            color: 'var(--text-muted)',
            borderColor: 'var(--border-soft)',
          }}
        >
          Showing the first {Math.round(MAX_TEXT_BYTES / 1024)} KB. DownloadSimple to read the whole file.
        </div>
      )}
      <pre
        className="p-5 text-[12.5px] leading-relaxed whitespace-pre-wrap break-words font-mono"
        style={{ color: 'var(--text-primary)' }}
      >
        {content}
      </pre>
    </div>
  )
}

// ── Fallbacks ──────────────────────────────────────────────────────────────

function UnsupportedFallback({
  attachment,
  kind,
  url,
  onDownload,
}: {
  attachment: Attachment
  kind: FileKind
  url: string
  onDownload: () => void
}) {
  const kindLabel = kindToLabel(kind)
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div
        className="h-14 w-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <FileText size={22} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
        {kindLabel} preview isn’t supported in the browser.
      </p>
      <p className="text-[12.5px] max-w-md" style={{ color: 'var(--text-muted)' }}>
        DownloadSimple the file to open it in {kindLabel === 'Office document' ? 'Word, Excel, or another desktop app' : 'a native app'}.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" onClick={onDownload}>
          <DownloadSimple size={13} strokeWidth={1.75} />
          DownloadSimple
        </Button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border text-[13px] font-medium transition-colors"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
          }}
        >
          <ArrowSquareOut size={12} strokeWidth={1.75} />
          Open in new tab
        </a>
      </div>
      <p className="mt-2 text-[11.5px]" style={{ color: 'var(--text-subtle)' }}>
        {attachment.file_name}
      </p>
    </div>
  )
}

function Fallback({ message, onDownload }: { message: string; onDownload: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-[13.5px]" style={{ color: 'var(--text-secondary)' }}>
        {message}
      </p>
      <Button variant="outline" size="sm" onClick={onDownload}>
        <DownloadSimple size={13} strokeWidth={1.75} />
        DownloadSimple instead
      </Button>
    </div>
  )
}

function kindToLabel(kind: FileKind): string {
  switch (kind) {
    case 'office-doc':   return 'Office document'
    case 'office-sheet': return 'Spreadsheet'
    case 'office-slide': return 'Presentation'
    case 'archive':      return 'Archive'
    default:             return 'This file'
  }
}
