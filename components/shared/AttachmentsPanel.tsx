'use client'

import { useRef, useState } from 'react'
import { Paperclip, Upload, Download, Trash2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Spinner } from '@/components/shared/Spinner'
import {
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  useAttachmentDownload,
  type EntityType,
  type Attachment,
} from '@/hooks/use-attachments'

/**
 * Reusable files panel for a client or case detail view. Uploads stream
 * straight to private Supabase Storage; the list + signed-URL downloads come
 * over GraphQL. Drop it in with `<AttachmentsPanel entityType="case" entityId={id} />`.
 */
export function AttachmentsPanel({
  entityType,
  entityId,
}: {
  entityType: EntityType
  entityId: string
}) {
  const { data, isLoading } = useAttachments(entityType, entityId)
  const upload = useUploadAttachment()
  const remove = useDeleteAttachment()
  const download = useAttachmentDownload()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const files = data ?? []

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return
    for (const file of Array.from(list)) {
      try {
        await upload.mutateAsync({ file, entityType, entityId })
        toast.success(`Uploaded ${file.name}.`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Couldn't upload ${file.name}.`)
      }
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDownload = async (a: Attachment) => {
    try {
      const url = await download.getUrl(a.id)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      else toast.error('Could not generate a download link.')
    } catch {
      toast.error('Could not generate a download link.')
    }
  }

  const handleDelete = async (a: Attachment) => {
    try {
      await remove.mutateAsync(a.id)
      toast.success(`Removed ${a.file_name}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete file.')
    }
  }

  return (
    <section
      className="rounded-2xl border p-6"
      style={{ background: 'var(--cream-white)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.05)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Paperclip size={16} strokeWidth={2} style={{ color: 'var(--navy)' }} />
          <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--navy)' }}>
            Attachments
          </h2>
          <span className="text-xs font-semibold tabular-nums" style={{ color: '#9CA3AF' }}>
            {files.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #C9972B 0%, #B8860B 100%)' }}
        >
          {upload.isPending ? <Spinner size={14} /> : <Upload size={14} strokeWidth={2.5} />}
          {upload.isPending ? 'Uploading…' : 'Upload'}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className="rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors mb-4"
        style={{
          borderColor: dragging ? 'var(--gold)' : 'var(--border)',
          background: dragging ? 'rgba(201,151,43,0.06)' : 'transparent',
        }}
      >
        <p className="text-[13px]" style={{ color: '#6B7280' }}>
          Drag and drop files here, or <span className="font-semibold" style={{ color: 'var(--gold-dark)' }}>browse</span>.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-6 justify-center" style={{ color: '#6B7280' }}>
          <Spinner size={14} /> <span className="text-sm">Loading files…</span>
        </div>
      ) : files.length === 0 ? (
        <p className="text-[13px] text-center py-4" style={{ color: '#9CA3AF' }}>
          No files yet.
        </p>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {files.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-3">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(13,27,42,0.06)' }}
              >
                <FileText size={16} strokeWidth={2} style={{ color: 'var(--navy)' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--navy)' }}>{a.file_name}</p>
                <p className="text-[12px]" style={{ color: '#9CA3AF' }}>
                  {formatBytes(a.file_size)} · {formatDate(a.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleDownload(a)}
                aria-label={`Download ${a.file_name}`}
                className="h-8 w-8 rounded-md flex items-center justify-center transition-colors hover:bg-black/[0.04]"
                style={{ color: 'var(--navy)' }}
              >
                <Download size={15} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(a)}
                aria-label={`Delete ${a.file_name}`}
                className="h-8 w-8 rounded-md flex items-center justify-center transition-colors hover:bg-black/[0.04]"
                style={{ color: '#B91C1C' }}
              >
                <Trash2 size={15} strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
