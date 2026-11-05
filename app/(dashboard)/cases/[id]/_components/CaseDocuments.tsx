'use client'

/**
 * Documents section of the case page.
 *
 * Everything a case holds lives here: files uploaded straight to the case,
 * drafts started from it, and existing firm documents linked to it. Files
 * are organised into the case's folders (created from the case editor or
 * here), and every document can be opened, downloaded, moved between
 * folders or unlinked.
 *
 * Linking rules are enforced by the backend: a document on a case is filed
 * under the case's client, belongs to one case at a time, and leaves a case
 * folder when it leaves the case.
 *
 * Data is scoped to the case on the server (documents and folders filtered
 * by case id); the firm-wide library is only loaded when the link picker
 * opens.
 */

import { useMemo, useRef, useState, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  CaretDown,
  CaretRight,
  DotsThree,
  DownloadSimple,
  FilePlus,
  FileText,
  Folder,
  FolderPlus,
  FolderSimple,
  GridFour,
  LinkBreak,
  LinkSimple,
  List,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Trash,
  UploadSimple,
  X,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/shared/Spinner'
import {
  useCreateDocument,
  useCreateDocumentFolder,
  useDeleteDocumentFolder,
  useDocumentFolders,
  useDocuments,
  useLinkDocumentsToCase,
  useUpdateDocument,
  useUpdateDocumentFolder,
  useUploadDocumentFile,
} from '@/hooks/use-documents'
import { normaliseDesign } from '@/lib/documents/design'
import { PdfExportError, pdfFilename, renderDocumentPdf, saveBlob } from '@/lib/documents/pdf'
import { useLetterheadFirm } from '../../../documents/_hooks/use-letterhead-firm'
import { DOC_CATEGORIES } from '../../_components/case-editor/_constants'
import type { Case, Document, DocumentFolder } from '@/types'

type DocView = 'grid' | 'list'
type CaseRef = Pick<Case, 'id' | 'title' | 'client_id' | 'client_name'>

/** Select value for "no folder" (Select items need a non-empty value). */
const NO_FOLDER = '__none__'
/** Show the in-section search once a case has this many documents. */
const SEARCH_THRESHOLD = 6

const isUpload = (d: Document) => Boolean(d.file_url)

function kindLabel(d: Document): string {
  if (isUpload(d)) {
    const mime = d.file_mime_type ?? ''
    if (mime.includes('pdf')) return 'PDF'
    if (mime.includes('word') || mime.includes('document')) return 'Word'
    if (mime.startsWith('image/')) return 'Image'
    return 'File'
  }
  return d.template_type && d.template_type !== 'Custom' ? d.template_type : 'Draft'
}

function fileTint(d: Document): { bg: string; glyph: string } {
  const mime = d.file_mime_type ?? ''
  if (mime.includes('pdf')) return { bg: '#DC2626', glyph: 'PDF' }
  if (mime.includes('word') || mime.includes('document')) return { bg: '#2563EB', glyph: 'W' }
  if (mime.includes('sheet') || mime.includes('excel')) return { bg: '#16A34A', glyph: 'X' }
  if (mime.startsWith('image/')) return { bg: '#7C3AED', glyph: 'IMG' }
  return { bg: 'var(--gold-dark)', glyph: isUpload(d) ? 'F' : 'D' }
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** "Parent / Child" labels for nested case folders, sorted by that label. */
function folderLabels(folders: DocumentFolder[]): Array<{ folder: DocumentFolder; label: string }> {
  const byId = new Map(folders.map((f) => [f.id, f]))
  const label = (f: DocumentFolder) => {
    const parts = [f.name]
    const seen = new Set([f.id])
    let parent = f.parent_id ? byId.get(f.parent_id) : undefined
    while (parent && !seen.has(parent.id)) {
      seen.add(parent.id)
      parts.unshift(parent.name)
      parent = parent.parent_id ? byId.get(parent.parent_id) : undefined
    }
    return parts.join(' / ')
  }
  return folders
    .map((folder) => ({ folder, label: label(folder) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

// ── Section ──────────────────────────────────────────────────────────────

export function CaseDocumentsSection({ kase }: { kase: CaseRef }) {
  const router = useRouter()
  const { data: documents, isLoading } = useDocuments({ caseId: kase.id })
  const { data: folders } = useDocumentFolders({ caseId: kase.id })
  const actions = useDocumentActions()

  const [view, setView] = useState<DocView>('grid')
  const [query, setQuery] = useState('')
  const [upload, setUpload] = useState<{ files: File[]; folderId: string } | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [folderDialog, setFolderDialog] = useState<
    { mode: 'create' } | { mode: 'rename'; folder: DocumentFolder } | null
  >(null)
  const [folderToDelete, setFolderToDelete] = useState<DocumentFolder | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const pendingFolder = useRef('')

  // The server filters by case; the check guards a refetch in flight.
  const docs = useMemo(
    () => (documents ?? []).filter((d) => d.case_id === kase.id),
    [documents, kase.id],
  )
  const labelled = useMemo(() => folderLabels(folders ?? []), [folders])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return docs
    return docs.filter(
      (d) => d.title.toLowerCase().includes(q) || kindLabel(d).toLowerCase().includes(q),
    )
  }, [docs, query])

  const { byFolder, unfiled } = useMemo(() => {
    const known = new Set(labelled.map((l) => l.folder.id))
    const map = new Map<string, Document[]>()
    const loose: Document[] = []
    for (const d of visible) {
      if (d.folder_id && known.has(d.folder_id)) {
        map.set(d.folder_id, [...(map.get(d.folder_id) ?? []), d])
      } else {
        loose.push(d)
      }
    }
    return { byFolder: map, unfiled: loose }
  }, [visible, labelled])

  const pickFiles = (folderId = '') => {
    pendingFolder.current = folderId
    fileInput.current?.click()
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files ?? [])
    if (files.length > 0) setUpload({ files, folderId: '' })
  }

  const searching = query.trim().length > 0
  const hasFolders = labelled.length > 0

  return (
    <section className="border-b px-7 py-5" style={{ borderColor: 'var(--border-soft)' }}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[12.5px] font-medium" style={{ color: 'var(--text-muted)' }}>
          Documents
          {docs.length > 0 && (
            <span className="ml-1.5" style={{ color: 'var(--text-subtle)' }}>
              {docs.length}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <Plus size={13} weight="bold" />
                  New
                  <CaretDown size={11} />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer text-[12.5px]" onClick={() => pickFiles()}>
                <UploadSimple size={13} /> Upload files
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-[12.5px]"
                onClick={() => router.push(`/documents?case=${kase.id}`)}
              >
                <FilePlus size={13} /> New draft
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-[12.5px]"
                onClick={() => setFolderDialog({ mode: 'create' })}
              >
                <FolderPlus size={13} /> New folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => setLinkOpen(true)}>
            <LinkSimple size={13} weight="bold" />
            Link existing
          </Button>
        </div>
      </header>

      <input
        ref={fileInput}
        type="file"
        multiple
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (files.length > 0) setUpload({ files, folderId: pendingFolder.current })
        }}
      />

      <div
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes('Files')) return
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
        }}
        onDrop={onDrop}
        className="relative rounded-xl transition-shadow"
        style={dragging ? { boxShadow: '0 0 0 2px var(--gold)' } : undefined}
      >
        {dragging && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl text-[13px] font-medium"
            style={{ background: 'color-mix(in srgb, var(--surface-card) 88%, transparent)', color: 'var(--gold-dark)' }}
          >
            Drop files to upload them to this case
          </div>
        )}

        {docs.length >= SEARCH_THRESHOLD && (
          <div className="relative mb-3">
            <MagnifyingGlass
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-subtle)' }}
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this case's documents"
              className="h-9 pl-8 text-[13px]"
              aria-label="Search case documents"
            />
          </div>
        )}

        {isLoading && !documents ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Skeleton className="h-[60px] rounded-xl" />
            <Skeleton className="h-[60px] rounded-xl" />
          </div>
        ) : docs.length === 0 && !hasFolders ? (
          <EmptyState onUpload={() => pickFiles()} onLink={() => setLinkOpen(true)} />
        ) : (
          <div className="space-y-3">
            {labelled.map(({ folder, label }) => {
              const inFolder = byFolder.get(folder.id) ?? []
              if (searching && inFolder.length === 0) return null
              return (
                <FolderGroup
                  key={folder.id}
                  folder={folder}
                  label={label}
                  docs={inFolder}
                  view={view}
                  actions={actions}
                  folders={labelled}
                  onUploadHere={() => pickFiles(folder.id)}
                  onRename={() => setFolderDialog({ mode: 'rename', folder })}
                  onDelete={() => setFolderToDelete(folder)}
                />
              )
            })}

            {unfiled.length > 0 && (
              <div>
                {hasFolders && (
                  <div className="mb-2 text-[11.5px] font-medium" style={{ color: 'var(--text-subtle)' }}>
                    Not in a folder
                  </div>
                )}
                <DocumentItems docs={unfiled} view={view} actions={actions} folders={labelled} />
              </div>
            )}

            {searching && visible.length === 0 && (
              <p className="py-2 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
                No documents on this case match your search.
              </p>
            )}
          </div>
        )}
      </div>

      {upload && (
        <UploadToCaseDialog
          kase={kase}
          folders={labelled}
          initialFiles={upload.files}
          initialFolderId={upload.folderId}
          onClose={() => setUpload(null)}
        />
      )}

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-lg">
          {linkOpen && <LinkDocumentPicker kase={kase} onDone={() => setLinkOpen(false)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={folderDialog !== null} onOpenChange={(o) => !o && setFolderDialog(null)}>
        <DialogContent className="sm:max-w-md">
          {folderDialog && (
            <FolderNameForm
              kase={kase}
              folder={folderDialog.mode === 'rename' ? folderDialog.folder : null}
              onDone={() => setFolderDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={folderToDelete !== null} onOpenChange={(o) => !o && setFolderToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          {folderToDelete && (
            <DeleteFolderConfirm folder={folderToDelete} onDone={() => setFolderToDelete(null)} />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

function ViewToggle({ value, onChange }: { value: DocView; onChange: (v: DocView) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
      {(['grid', 'list'] as const).map((mode) => {
        const active = value === mode
        const Icon = mode === 'grid' ? GridFour : List
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center transition-colors"
            style={{
              background: active ? 'var(--surface-sunken)' : 'var(--surface-card)',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
            aria-label={`${mode} view`}
            aria-pressed={active}
          >
            <Icon size={13} />
          </button>
        )
      })}
    </div>
  )
}

function EmptyState({ onUpload, onLink }: { onUpload: () => void; onLink: () => void }) {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <FileText size={22} style={{ color: 'var(--text-subtle)' }} />
      <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        No documents on this case yet. Drop files here, upload them, or link documents already in your firm.
      </p>
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="sm" onClick={onUpload}>
          <UploadSimple size={13} /> Upload files
        </Button>
        <Button variant="outline" size="sm" onClick={onLink}>
          <LinkSimple size={13} /> Link existing
        </Button>
      </div>
    </div>
  )
}

// ── Folder groups ────────────────────────────────────────────────────────

function FolderGroup({
  folder,
  label,
  docs,
  view,
  actions,
  folders,
  onUploadHere,
  onRename,
  onDelete,
}: {
  folder: DocumentFolder
  label: string
  docs: Document[]
  view: DocView
  actions: DocumentActions
  folders: Array<{ folder: DocumentFolder; label: string }>
  onUploadHere: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-xl border" style={{ borderColor: 'var(--border-soft)' }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
          aria-expanded={open}
        >
          {open ? (
            <CaretDown size={12} style={{ color: 'var(--text-subtle)' }} />
          ) : (
            <CaretRight size={12} style={{ color: 'var(--text-subtle)' }} />
          )}
          <FolderSimple size={15} weight="fill" style={{ color: 'var(--gold)' }} />
          <span className="truncate text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {label}
          </span>
          <span className="shrink-0 text-[11.5px]" style={{ color: 'var(--text-subtle)' }}>
            {docs.length}
          </span>
          {folder.category && (
            <span
              className="hidden shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] sm:inline"
              style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}
            >
              {folder.category}
            </span>
          )}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-sunken)]"
                style={{ color: 'var(--text-muted)' }}
                aria-label={`Actions for folder ${folder.name}`}
              >
                <DotsThree size={16} weight="bold" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="cursor-pointer text-[12.5px]" onClick={onUploadHere}>
              <UploadSimple size={13} /> Upload here
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-[12.5px]" onClick={onRename}>
              <PencilSimple size={13} /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-[12.5px]" style={{ color: '#B42318' }} onClick={onDelete}>
              <Trash size={13} /> Delete folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {open && (
        <div className="border-t px-3 py-3" style={{ borderColor: 'var(--border-soft)' }}>
          {docs.length === 0 ? (
            <p className="text-[12px]" style={{ color: 'var(--text-subtle)' }}>
              This folder is empty.
            </p>
          ) : (
            <DocumentItems docs={docs} view={view} actions={actions} folders={folders} />
          )}
        </div>
      )}
    </div>
  )
}

// ── Document items ───────────────────────────────────────────────────────

function DocumentItems({
  docs,
  view,
  actions,
  folders,
}: {
  docs: Document[]
  view: DocView
  actions: DocumentActions
  folders: Array<{ folder: DocumentFolder; label: string }>
}) {
  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {docs.map((d) => (
          <div
            key={d.id}
            className="flex items-start gap-3 rounded-xl border p-3"
            style={{
              background: 'var(--surface-card)',
              borderColor: 'var(--border-soft)',
              opacity: actions.busyId === d.id ? 0.55 : 1,
            }}
          >
            <FileBadge doc={d} size="md" />
            <button type="button" onClick={() => actions.open(d)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[12.5px] font-semibold" style={{ color: 'var(--text-primary)' }} title={d.title}>
                {d.title}
              </span>
              <span className="mt-0.5 block text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
                {kindLabel(d)} · Edited {fmtDate(d.updated_at)}
              </span>
            </button>
            <DocumentMenu doc={d} actions={actions} folders={folders} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {docs.map((d) => (
        <li
          key={d.id}
          className="flex items-center gap-3 rounded-lg border px-3 py-2"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-soft)',
            opacity: actions.busyId === d.id ? 0.55 : 1,
          }}
        >
          <FileBadge doc={d} size="sm" />
          <button
            type="button"
            onClick={() => actions.open(d)}
            className="min-w-0 flex-1 truncate text-left text-[13px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {d.title}
          </button>
          <span className="hidden shrink-0 text-[11.5px] sm:inline" style={{ color: 'var(--text-muted)' }}>
            {kindLabel(d)} · Edited {fmtDate(d.updated_at)}
          </span>
          <DocumentMenu doc={d} actions={actions} folders={folders} />
        </li>
      ))}
    </ul>
  )
}

function FileBadge({ doc, size }: { doc: Document; size: 'sm' | 'md' }) {
  const tint = fileTint(doc)
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-bold text-white ${size === 'md' ? 'h-9 w-9 text-[10px]' : 'h-7 w-7 text-[9px]'}`}
      style={{ background: tint.bg }}
    >
      {tint.glyph}
    </span>
  )
}

// ── Row actions ──────────────────────────────────────────────────────────

type DocumentActions = ReturnType<typeof useDocumentActions>

function useDocumentActions() {
  const router = useRouter()
  const update = useUpdateDocument()
  const firm = useLetterheadFirm()
  const [busyId, setBusyId] = useState<string | null>(null)

  const open = (d: Document) => {
    if (d.file_url) window.open(d.file_url, '_blank', 'noopener,noreferrer')
    else router.push(`/documents?open=${d.id}`)
  }

  const download = async (d: Document) => {
    if (d.file_url) {
      window.open(d.file_url, '_blank', 'noopener,noreferrer')
      return
    }
    if (!d.content?.trim()) {
      toast.error('This draft is empty.')
      return
    }
    setBusyId(d.id)
    try {
      const blob = await renderDocumentPdf({
        title: d.title,
        bodyHtml: d.content,
        design: normaliseDesign(d.design),
        firm,
      })
      saveBlob(blob, pdfFilename(d.title))
      toast.success('PDF downloaded.')
    } catch (err) {
      toast.error(err instanceof PdfExportError ? err.message : 'The PDF could not be generated.')
    } finally {
      setBusyId(null)
    }
  }

  const moveToFolder = async (d: Document, folder: { id: string; label: string } | null) => {
    if ((d.folder_id ?? null) === (folder?.id ?? null)) return
    setBusyId(d.id)
    try {
      // An explicit empty string clears the folder; the backend stores NULL.
      await update.mutateAsync({ id: d.id, data: { folder_id: folder?.id ?? '' } })
      toast.success(folder ? `"${d.title}" moved to ${folder.label}.` : `"${d.title}" moved out of its folder.`)
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Unable to move the document.')
    } finally {
      setBusyId(null)
    }
  }

  const unlink = async (d: Document) => {
    setBusyId(d.id)
    try {
      // The document stays with the client; it also leaves any case folder.
      await update.mutateAsync({ id: d.id, data: { case_id: '' } })
      toast.success(`"${d.title}" unlinked from this case.`)
    } catch {
      toast.error('Unable to unlink the document.')
    } finally {
      setBusyId(null)
    }
  }

  return { busyId, open, download, moveToFolder, unlink }
}

function DocumentMenu({
  doc,
  actions,
  folders,
}: {
  doc: Document
  actions: DocumentActions
  folders: Array<{ folder: DocumentFolder; label: string }>
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={actions.busyId === doc.id}
        render={
          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-sunken)]"
            style={{ color: 'var(--text-muted)' }}
            aria-label={`Actions for ${doc.title}`}
          >
            <DotsThree size={16} weight="bold" />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem className="cursor-pointer text-[12.5px]" onClick={() => actions.open(doc)}>
          <FileText size={13} /> {doc.file_url ? 'Open file' : 'Open in editor'}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-[12.5px]" onClick={() => void actions.download(doc)}>
          <DownloadSimple size={13} /> {doc.file_url ? 'Download' : 'Download PDF'}
        </DropdownMenuItem>
        {folders.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer text-[12.5px]">
              <Folder size={13} /> Move to folder
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              {folders.map(({ folder, label }) => (
                <DropdownMenuItem
                  key={folder.id}
                  className="cursor-pointer text-[12.5px]"
                  disabled={doc.folder_id === folder.id}
                  onClick={() => void actions.moveToFolder(doc, { id: folder.id, label })}
                >
                  <FolderSimple size={13} /> <span className="truncate">{label}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-[12.5px]"
                disabled={!doc.folder_id}
                onClick={() => void actions.moveToFolder(doc, null)}
              >
                <X size={13} /> No folder
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-[12.5px]"
          style={{ color: '#B42318' }}
          onClick={() => void actions.unlink(doc)}
        >
          <LinkBreak size={13} /> Unlink from case
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Upload dialog ────────────────────────────────────────────────────────

type UploadStatus = 'queued' | 'uploading' | 'done' | 'failed'

/**
 * Uploads files straight to the case. Each file goes to Cloudinary (signed,
 * direct from the browser) and is then recorded as a document on the case,
 * filed under the case's client and, optionally, one of its folders. A
 * folder's category becomes the document category.
 */
function UploadToCaseDialog({
  kase,
  folders,
  initialFiles,
  initialFolderId,
  onClose,
}: {
  kase: CaseRef
  folders: Array<{ folder: DocumentFolder; label: string }>
  initialFiles: File[]
  initialFolderId: string
  onClose: () => void
}) {
  const { uploadFile } = useUploadDocumentFile()
  const create = useCreateDocument()
  const [files, setFiles] = useState<File[]>(initialFiles)
  const [folderId, setFolderId] = useState(initialFolderId || NO_FOLDER)
  const [status, setStatus] = useState<UploadStatus[]>(() => initialFiles.map(() => 'queued'))
  const [running, setRunning] = useState(false)
  const addInput = useRef<HTMLInputElement>(null)

  const folderItems = useMemo(
    () => [
      { value: NO_FOLDER, label: 'No folder' },
      ...folders.map(({ folder, label }) => ({ value: folder.id, label })),
    ],
    [folders],
  )
  const target = folders.find((f) => f.folder.id === folderId)?.folder ?? null

  const addFiles = (more: File[]) => {
    setFiles((prev) => [...prev, ...more])
    setStatus((prev) => [...prev, ...more.map((): UploadStatus => 'queued')])
  }
  const removeAt = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
    setStatus((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleUpload = async () => {
    setRunning(true)
    const next = [...status]
    // Sequential, so a failure is attributed to the right file and the
    // signature endpoint is not hit in a burst.
    for (let i = 0; i < files.length; i++) {
      if (next[i] === 'done') continue
      next[i] = 'uploading'
      setStatus([...next])
      try {
        const asset = await uploadFile(files[i])
        await create.mutateAsync({
          title: files[i].name,
          case_id: kase.id,
          client_id: kase.client_id ?? '',
          folder_id: target?.id ?? '',
          template_type: target?.category ?? '',
          file_url: asset.file_url,
          file_public_id: asset.file_public_id,
          file_thumbnail_url: asset.file_thumbnail_url,
          file_mime_type: asset.file_mime_type,
          file_size: asset.file_size ?? files[i].size,
        })
        next[i] = 'done'
      } catch {
        next[i] = 'failed'
      }
      setStatus([...next])
    }
    setRunning(false)

    const done = next.filter((s) => s === 'done').length
    const failed = next.filter((s) => s === 'failed').length
    if (failed === 0) {
      toast.success(`${plural(done, 'file')} uploaded to ${target ? target.name : kase.title}.`)
      onClose()
      return
    }
    // Keep only the failures so a retry does not duplicate uploaded files.
    setFiles((prev) => prev.filter((_, i) => next[i] !== 'done'))
    setStatus(next.filter((s) => s !== 'done').map(() => 'failed'))
    toast.error(
      `${plural(failed, 'file')} could not be uploaded${done ? `; ${done} uploaded` : ''}. Review the list and retry.`,
    )
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !running && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Upload to case</DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Files are added to {kase.title}
            {kase.client_name ? ` and filed under ${kase.client_name}` : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {folders.length > 0 && (
            <div className="grid gap-1.5">
              <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                Folder
              </span>
              <Select
                items={folderItems}
                value={folderId}
                onValueChange={(v) => setFolderId((v as string | null) ?? NO_FOLDER)}
                disabled={running}
              >
                <SelectTrigger className="h-9 w-full text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {folderItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <ul className="max-h-64 overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--border-soft)' }}>
            {files.length === 0 ? (
              <li className="px-3 py-5 text-center text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
                No files selected.
              </li>
            ) : (
              files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-3 border-t px-3 py-2 first:border-t-0"
                  style={{ borderColor: 'var(--border-soft)' }}
                >
                  <FileText size={15} className="shrink-0" style={{ color: 'var(--text-subtle)' }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]" style={{ color: 'var(--text-primary)' }}>
                      {file.name}
                    </span>
                    <span className="block text-[11px]" style={{ color: status[i] === 'failed' ? '#B42318' : 'var(--text-subtle)' }}>
                      {status[i] === 'failed' ? 'Upload failed' : formatBytes(file.size)}
                    </span>
                  </span>
                  {status[i] === 'uploading' ? (
                    <Spinner size={14} />
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      disabled={running}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-sunken)] disabled:opacity-40"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={12} />
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>

          <input
            ref={addInput}
            type="file"
            multiple
            className="hidden"
            aria-hidden
            tabIndex={-1}
            onChange={(e) => {
              const more = Array.from(e.target.files ?? [])
              e.target.value = ''
              if (more.length > 0) addFiles(more)
            }}
          />
          <div>
            <Button variant="outline" size="sm" disabled={running} onClick={() => addInput.current?.click()}>
              <Plus size={13} /> Add files
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={running}>
            Cancel
          </Button>
          <Button onClick={() => void handleUpload()} disabled={running || files.length === 0}>
            {running ? (
              <>
                <Spinner size={13} /> Uploading
              </>
            ) : (
              `Upload ${plural(files.length, 'file')}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Folder dialogs ───────────────────────────────────────────────────────

function FolderNameForm({
  kase,
  folder,
  onDone,
}: {
  kase: CaseRef
  folder: DocumentFolder | null
  onDone: () => void
}) {
  const create = useCreateDocumentFolder()
  const rename = useUpdateDocumentFolder()
  const [name, setName] = useState(folder?.name ?? '')
  const [category, setCategory] = useState('')
  const trimmed = name.trim()
  const error = trimmed.length > 120 ? 'Folder names can be at most 120 characters.' : null
  const pending = create.isPending || rename.isPending

  const categoryItems = useMemo(
    () => [{ value: '', label: 'No category' }, ...DOC_CATEGORIES.map((c) => ({ value: c, label: c }))],
    [],
  )

  const submit = async () => {
    if (!trimmed || error) return
    try {
      if (folder) {
        await rename.mutateAsync({ id: folder.id, name: trimmed })
        toast.success('Folder renamed.')
      } else {
        await create.mutateAsync({ name: trimmed, case_id: kase.id, category })
        toast.success(`Folder "${trimmed}" created.`)
      }
      onDone()
    } catch {
      toast.error(folder ? 'Unable to rename the folder.' : 'Unable to create the folder.')
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <DialogHeader>
        <DialogTitle className="font-heading">{folder ? 'Rename folder' : 'New folder'}</DialogTitle>
        {!folder && (
          <DialogDescription className="text-[12.5px]">
            Case folders also appear in {kase.client_name ? `${kase.client_name}'s` : "the client's"} Documents tab.
          </DialogDescription>
        )}
      </DialogHeader>
      <div className="my-4 grid gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="case-folder-name" className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            Folder name
          </label>
          <Input
            id="case-folder-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Court filings"
            className="h-9 text-[13px]"
            aria-invalid={error ? true : undefined}
          />
          {error && (
            <p className="text-[11.5px]" style={{ color: '#B42318' }}>
              {error}
            </p>
          )}
        </div>
        {!folder && (
          <div className="grid gap-1.5">
            <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              Category
            </span>
            <Select items={categoryItems} value={category} onValueChange={(v) => setCategory((v as string | null) ?? '')}>
              <SelectTrigger className="h-9 w-full text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryItems.map((item) => (
                  <SelectItem key={item.value || 'none'} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11.5px]" style={{ color: 'var(--text-subtle)' }}>
              Files uploaded into this folder take this category.
            </p>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || !trimmed || !!error}>
          {pending ? (
            <>
              <Spinner size={13} /> Saving
            </>
          ) : folder ? (
            'Rename'
          ) : (
            'Create folder'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

function DeleteFolderConfirm({ folder, onDone }: { folder: DocumentFolder; onDone: () => void }) {
  const remove = useDeleteDocumentFolder()
  const confirm = async () => {
    try {
      await remove.mutateAsync(folder.id)
      toast.success(`Folder "${folder.name}" deleted.`)
      onDone()
    } catch {
      toast.error('Unable to delete the folder.')
    }
  }
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading">Delete folder</DialogTitle>
        <DialogDescription className="text-[12.5px]">
          Delete &quot;{folder.name}&quot;? {folder.document_count > 0
            ? `The ${plural(folder.document_count, 'document')} inside stay on this case, outside any folder.`
            : 'The folder is empty.'}{' '}
          Sub-folders are deleted too.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={remove.isPending}>
          Cancel
        </Button>
        <Button
          onClick={() => void confirm()}
          disabled={remove.isPending}
          style={{ background: '#B42318', color: '#fff' }}
        >
          {remove.isPending ? (
            <>
              <Spinner size={13} /> Deleting
            </>
          ) : (
            'Delete folder'
          )}
        </Button>
      </DialogFooter>
    </>
  )
}

// ── Link existing documents ──────────────────────────────────────────────

function LinkDocumentPicker({ kase, onDone }: { kase: CaseRef; onDone: () => void }) {
  const router = useRouter()
  // The firm library is only needed here, so it loads when the picker opens.
  const { data: allDocuments, isLoading } = useDocuments()
  const link = useLinkDocumentsToCase()
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())

  // Linkable: live, non-template documents not already on this case.
  // Same-client documents first, then most recently edited.
  const linkable = useMemo(
    () => (allDocuments ?? []).filter((d) => !d.is_template && !d.deleted_at && d.case_id !== kase.id),
    [allDocuments, kase.id],
  )
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sameClient = (d: Document) => Number(!!kase.client_id && d.client_id === kase.client_id)
    return linkable
      .filter(
        (d) =>
          !q ||
          d.title.toLowerCase().includes(q) ||
          (d.client_name ?? '').toLowerCase().includes(q) ||
          (d.case_title ?? '').toLowerCase().includes(q),
      )
      .sort((a, b) => sameClient(b) - sameClient(a) || b.updated_at.localeCompare(a.updated_at))
  }, [linkable, kase.client_id, query])

  const selected = linkable.filter((d) => picked.has(d.id))
  const moving = selected.filter((d) => d.case_id)
  const refiling = selected.filter((d) => kase.client_id && d.client_id && d.client_id !== kase.client_id)

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleLink = async () => {
    try {
      await link.mutateAsync({ caseId: kase.id, documentIds: [...picked] })
      toast.success(`${plural(picked.size, 'document')} linked to ${kase.title}.`)
      onDone()
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'The documents could not be linked. Please try again.')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading">Link existing documents</DialogTitle>
        <DialogDescription className="text-[12.5px]">
          Attach drafts and files already in your firm to {kase.title}.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3">
        <div className="relative">
          <MagnifyingGlass
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-subtle)' }}
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, client or case"
            className="h-9 pl-8 text-[13px]"
            aria-label="Search documents"
          />
        </div>

        <ul className="max-h-80 overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--border-soft)' }}>
          {isLoading && !allDocuments ? (
            <li className="flex items-center justify-center gap-2 px-3 py-6 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
              <Spinner size={14} /> Loading documents
            </li>
          ) : candidates.length === 0 ? (
            <li className="px-3 py-5 text-center text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
              {linkable.length > 0 ? 'No documents match your search.' : 'No other documents in your firm yet.'}{' '}
              <button
                type="button"
                onClick={() => router.push('/documents')}
                className="font-semibold underline-offset-2 hover:underline"
                style={{ color: 'var(--gold-dark)' }}
              >
                Go to Documents
              </button>
            </li>
          ) : (
            candidates.map((d) => {
              const checked = picked.has(d.id)
              return (
                <li key={d.id} className="border-t first:border-t-0" style={{ borderColor: 'var(--border-soft)' }}>
                  <label
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
                    style={{ background: checked ? 'var(--accent-today-tint)' : 'transparent' }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(d.id)}
                      className="h-4 w-4 shrink-0 cursor-pointer rounded"
                      style={{ accentColor: 'var(--gold)' }}
                    />
                    <FileBadge doc={d} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                        {d.title}
                      </span>
                      <span className="block truncate text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
                        {[kindLabel(d), d.client_name, d.case_title ? `On ${d.case_title}` : 'Not on a case']
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })
          )}
        </ul>

        {(moving.length > 0 || refiling.length > 0) && (
          <div className="grid gap-1 text-[11.5px]" style={{ color: '#B4530A' }}>
            {moving.length > 0 && (
              <p>
                {moving.length === 1
                  ? `"${moving[0].title}" is on another case and will move to this one.`
                  : `${moving.length} selected documents are on other cases and will move to this one.`}
              </p>
            )}
            {refiling.length > 0 && (
              <p>
                {refiling.length === 1
                  ? `"${refiling[0].title}" belongs to another client and will be filed under ${kase.client_name ?? "this case's client"}.`
                  : `${refiling.length} selected documents belong to other clients and will be filed under ${kase.client_name ?? "this case's client"}.`}
              </p>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={link.isPending}>
          Cancel
        </Button>
        <Button onClick={() => void handleLink()} disabled={link.isPending || picked.size === 0}>
          {link.isPending ? (
            <>
              <Spinner size={13} /> Linking
            </>
          ) : picked.size > 0 ? (
            `Link ${plural(picked.size, 'document')}`
          ) : (
            'Link documents'
          )}
        </Button>
      </DialogFooter>
    </>
  )
}
