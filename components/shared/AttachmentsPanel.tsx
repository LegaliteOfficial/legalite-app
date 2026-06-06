'use client'

import { useRef, useState } from 'react'
import { Download, Eye, Paperclip, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Spinner } from '@/components/shared/Spinner'
import { AttachmentPreviewDialog } from '@/components/shared/AttachmentPreviewDialog'
import {
  useAttachments,
  useAttachmentDownload,
  useDeleteAttachment,
  useUploadAttachment,
  type Attachment,
  type EntityType,
} from '@/hooks/use-attachments'
import { getFileKind, iconForKind } from '@/lib/attachments/file-kind'

/**
 * Reusable files panel for a client or case detail view. Uploads stream
 * straight to private Supabase Storage; the list + signed-URL downloads
 * come over GraphQL. Drop it in with
 * `<AttachmentsPanel entityType="case" entityId={id} />`.
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
  const [previewing, setPreviewing] = useState<Attachment | null>(null)

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
      // If the deleted row is currently being previewed, close the dialog.
      if (previewing?.id === a.id) setPreviewing(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete file.')
    }
  }

  return (
    <section
      className="rounded-2xl border p-6"
      style={{
        background: 'var(--cream-white)',
        borderColor: 'var(--border)',
        boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
      }}
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

      <DropZone
        dragging={dragging}
        onDragOver={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDrop={(files) => {
          setDragging(false)
          void handleFiles(files)
        }}
        onPick={() => inputRef.current?.click()}
      />

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
            <AttachmentRow
              key={a.id}
              attachment={a}
              onPreview={() => setPreviewing(a)}
              onDownload={() => void handleDownload(a)}
              onDelete={() => void handleDelete(a)}
            />
          ))}
        </ul>
      )}

      <AttachmentPreviewDialog
        attachment={previewing}
        open={previewing !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewing(null)
        }}
        getUrl={download.getUrl}
        onDownload={(a) => void handleDownload(a)}
      />
    </section>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function DropZone({
  dragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onPick,
}: {
  dragging: boolean
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: (files: FileList) => void
  onPick: () => void
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver() }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files) }}
      onClick={onPick}
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
  )
}

function AttachmentRow({
  attachment,
  onPreview,
  onDownload,
  onDelete,
}: {
  attachment: Attachment
  onPreview: () => void
  onDownload: () => void
  onDelete: () => void
}) {
  const kind = getFileKind(attachment.file_name, attachment.file_type)
  const Icon = iconForKind(kind)
  return (
    <li
      onClick={onPreview}
      className="group flex items-center gap-3 py-3 cursor-pointer transition-colors rounded-lg px-2 -mx-2 hover:bg-black/[0.02]"
    >
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'rgba(13,27,42,0.06)' }}
      >
        <Icon size={16} strokeWidth={2} style={{ color: 'var(--navy)' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--navy)' }}>
          {attachment.file_name}
        </p>
        <p className="text-[12px]" style={{ color: '#9CA3AF' }}>
          {formatBytes(attachment.file_size)} · {formatDate(attachment.created_at)}
        </p>
      </div>
      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        <RowButton
          icon={<Eye size={15} strokeWidth={2} />}
          color="var(--navy)"
          ariaLabel={`Preview ${attachment.file_name}`}
          onClick={onPreview}
        />
        <RowButton
          icon={<Download size={15} strokeWidth={2} />}
          color="var(--navy)"
          ariaLabel={`Download ${attachment.file_name}`}
          onClick={onDownload}
        />
        <RowButton
          icon={<Trash2 size={15} strokeWidth={2} />}
          color="#B91C1C"
          ariaLabel={`Delete ${attachment.file_name}`}
          onClick={onDelete}
        />
      </div>
    </li>
  )
}

function RowButton({
  icon,
  color,
  ariaLabel,
  onClick,
}: {
  icon: React.ReactNode
  color: string
  ariaLabel: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="h-8 w-8 rounded-md flex items-center justify-center transition-colors hover:bg-black/[0.04]"
      style={{ color }}
    >
      {icon}
    </button>
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
