'use client'

/**
 * Documents linked to a case.
 *
 * "Link document" attaches existing firm documents (studio drafts and
 * uploaded files) to the case by setting their `case_id`; a document can
 * belong to one case, so linking one already on another case moves it.
 * Each linked document can be opened, downloaded or unlinked.
 *
 * - Open: uploaded files open their stored file; drafts open in the
 *   drafting studio (/documents?open=<id>).
 * - Download: uploaded files download as stored; drafts download as a
 *   PDF rendered with their own design.
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DotsThree,
  DownloadSimple,
  FileText,
  LinkSimple,
  LinkBreak,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/shared/Spinner'
import { useUpdateDocument } from '@/hooks/use-documents'
import { normaliseDesign } from '@/lib/documents/design'
import { PdfExportError, pdfFilename, renderDocumentPdf, saveBlob } from '@/lib/documents/pdf'
import { useLetterheadFirm } from '../../../documents/_hooks/use-letterhead-firm'
import type { Document } from '@/types'

type DocView = 'grid' | 'list'

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

// ── List of linked documents ─────────────────────────────────────────────

export function CaseDocumentList({
  caseId,
  documents,
  view,
}: {
  caseId: string
  documents: Document[]
  view: DocView
}) {
  const actions = useDocumentActions(caseId)

  if (documents.length === 0) {
    return (
      <p className="py-2 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        No documents linked to this case yet. Use Link document to attach a draft or uploaded file.
      </p>
    )
  }

  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {documents.map((d) => (
          <div
            key={d.id}
            className="flex items-start gap-3 rounded-xl border p-3"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)', opacity: actions.busyId === d.id ? 0.55 : 1 }}
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
            <DocumentMenu doc={d} actions={actions} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {documents.map((d) => (
        <li
          key={d.id}
          className="flex items-center gap-3 rounded-lg border px-3 py-2"
          style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)', opacity: actions.busyId === d.id ? 0.55 : 1 }}
        >
          <FileBadge doc={d} size="sm" />
          <button type="button" onClick={() => actions.open(d)} className="min-w-0 flex-1 truncate text-left text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {d.title}
          </button>
          <span className="hidden shrink-0 text-[11.5px] sm:inline" style={{ color: 'var(--text-muted)' }}>
            {kindLabel(d)} · Edited {fmtDate(d.updated_at)}
          </span>
          <DocumentMenu doc={d} actions={actions} />
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

function useDocumentActions(caseId: string) {
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

  const unlink = async (d: Document) => {
    setBusyId(d.id)
    try {
      // An explicit empty string detaches; the backend stores NULL.
      await update.mutateAsync({ id: d.id, data: { case_id: '' } })
      toast.success(`"${d.title}" unlinked from this case.`)
    } catch {
      toast.error('Unable to unlink the document.')
    } finally {
      setBusyId(null)
    }
  }

  return { caseId, busyId, open, download, unlink }
}

function DocumentMenu({ doc, actions }: { doc: Document; actions: DocumentActions }) {
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
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem className="cursor-pointer text-[12.5px]" onClick={() => actions.open(doc)}>
          <FileText size={13} /> {doc.file_url ? 'Open file' : 'Open in editor'}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-[12.5px]" onClick={() => void actions.download(doc)}>
          <DownloadSimple size={13} /> {doc.file_url ? 'Download' : 'Download PDF'}
        </DropdownMenuItem>
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

// ── Link document dialog ─────────────────────────────────────────────────

export function LinkDocumentButton(props: {
  caseId: string
  caseTitle: string
  caseClientId: string | null
  allDocuments: Document[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <LinkSimple size={13} weight="bold" />
        Link document
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          {open && <LinkDocumentPicker {...props} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

function LinkDocumentPicker({
  caseId,
  caseTitle,
  caseClientId,
  allDocuments,
  onDone,
}: {
  caseId: string
  caseTitle: string
  caseClientId: string | null
  allDocuments: Document[]
  onDone: () => void
}) {
  const router = useRouter()
  const update = useUpdateDocument()
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  // Linkable: live documents and files that are not templates and not
  // already on this case. Same-client documents first, then most recent.
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allDocuments
      .filter((d) => !d.is_template && !d.deleted_at && d.case_id !== caseId)
      .filter(
        (d) =>
          !q ||
          d.title.toLowerCase().includes(q) ||
          (d.client_name ?? '').toLowerCase().includes(q) ||
          (d.case_title ?? '').toLowerCase().includes(q),
      )
      .sort(
        (a, b) =>
          Number(b.client_id === caseClientId && !!caseClientId) -
            Number(a.client_id === caseClientId && !!caseClientId) ||
          b.updated_at.localeCompare(a.updated_at),
      )
  }, [allDocuments, caseId, caseClientId, query])

  const moving = candidates.filter((d) => picked.has(d.id) && d.case_id)

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleLink = async () => {
    const docs = allDocuments.filter((d) => picked.has(d.id))
    setSaving(true)
    const results = await Promise.allSettled(
      docs.map((d) =>
        update.mutateAsync({
          id: d.id,
          data: {
            case_id: caseId,
            // Fill in the case's client when the document has none.
            ...(d.client_id || !caseClientId ? {} : { client_id: caseClientId }),
          },
        }),
      ),
    )
    setSaving(false)
    const failed = results.filter((r) => r.status === 'rejected').length
    const linked = docs.length - failed
    if (linked > 0) {
      toast.success(`${linked} document${linked === 1 ? '' : 's'} linked to ${caseTitle}.`)
    }
    if (failed > 0) {
      toast.error(`${failed} document${failed === 1 ? '' : 's'} could not be linked. Please try again.`)
      return
    }
    onDone()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading">Link documents</DialogTitle>
      </DialogHeader>

      <div className="grid gap-3">
        <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
          Attach existing drafts and files to <span style={{ color: 'var(--text-primary)' }}>{caseTitle}</span>.
        </p>

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
          {candidates.length === 0 ? (
            <li className="px-3 py-5 text-center text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
              {allDocuments.some((d) => !d.is_template && d.case_id !== caseId)
                ? 'No documents match your search.'
                : 'No other documents in your firm yet.'}{' '}
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
                        {[kindLabel(d), d.client_name, d.case_title ? `On ${d.case_title}` : 'Not linked'].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })
          )}
        </ul>

        {moving.length > 0 && (
          <p className="text-[11.5px]" style={{ color: '#B4530A' }}>
            {moving.length === 1
              ? `"${moving[0].title}" is linked to another case and will move to this one.`
              : `${moving.length} selected documents are linked to other cases and will move to this one.`}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleLink} disabled={saving || picked.size === 0}>
          {saving ? (
            <><Spinner size={13} /> Linking</>
          ) : (
            `Link ${picked.size || ''} document${picked.size === 1 ? '' : 's'}`.replace('  ', ' ')
          )}
        </Button>
      </DialogFooter>
    </>
  )
}
