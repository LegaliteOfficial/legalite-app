'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  ArrowClockwise,
  CheckCircle,
  CircleNotch,
  Copy,
  DownloadSimple,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  Warning,
  WarningCircle,
} from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialogView } from '@/components/shared/ConfirmDialog'
import {
  useArchiveDownload,
  useArchiveEntry,
  useDeleteArchiveEntry,
  useReprocessArchiveEntry,
  useUpdateArchiveEntry,
  type ArchiveEntryDetail,
} from '@/hooks/use-archive'
import type { Case } from '@/types'
import {
  ARCHIVE_TYPE_LABELS,
  EXTRACTION_LABELS,
  archiveTypeLabel,
  formatBytes,
  formatDate,
  needsReview,
} from './archive-meta'

const NO_CASE = 'none'

/** One archived document: what Legalite found, its checks, and the full text. */
export function ArchiveEntryDialog({
  id,
  cases,
  onClose,
}: {
  id: string | null
  cases: Case[]
  onClose: () => void
}) {
  const { entry, isLoading, error } = useArchiveEntry(id)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const close = () => {
    setEditing(false)
    onClose()
  }

  return (
    <>
      <Dialog open={Boolean(id)} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
          {isLoading || (!entry && !error) ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
              <CircleNotch size={16} className="animate-spin" /> Loading the archived document...
            </div>
          ) : !entry ? (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              This archive entry could not be loaded. It may have been removed.
            </div>
          ) : editing ? (
            <EditEntry entry={entry} cases={cases} onDone={() => setEditing(false)} />
          ) : (
            <EntryView entry={entry} onEdit={() => setEditing(true)} onDelete={() => setConfirmDelete(true)} />
          )}
        </DialogContent>
      </Dialog>
      {entry && (
        <DeleteEntryConfirm
          entry={entry}
          open={confirmDelete}
          onCancel={() => setConfirmDelete(false)}
          onDone={() => {
            setConfirmDelete(false)
            close()
          }}
        />
      )}
    </>
  )
}

function EntryView({
  entry,
  onEdit,
  onDelete,
}: {
  entry: NonNullable<ArchiveEntryDetail>
  onEdit: () => void
  onDelete: () => void
}) {
  const download = useArchiveDownload()
  const reprocess = useReprocessArchiveEntry()

  const onDownload = async () => {
    try {
      const url = await download.mutateAsync(entry.id)
      window.open(url, '_blank', 'noopener')
    } catch {
      toast.error('Unable to download the original file. Please try again.')
    }
  }

  const onReprocess = async () => {
    try {
      await reprocess.mutateAsync(entry.id)
      toast.success('Legalite is reading the document again.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not restart processing.')
    }
  }

  const ready = entry.status === 'ready'
  const facts: [string, ReactNode][] = [
    ['Type', archiveTypeLabel(entry.document_type)],
    ['Court', entry.court],
    ['Suit number', entry.suit_number],
    ['Document date', entry.document_date ? formatDate(entry.document_date) : null],
    ['Case', entry.case_title],
    ['File', [entry.file_name, formatBytes(entry.file_size)].filter(Boolean).join(', ')],
    ['Pages', entry.page_count ? String(entry.page_count) : null],
    ['Words', entry.word_count ? entry.word_count.toLocaleString() : null],
    ['Uploaded', [entry.uploaded_by_name, formatDate(entry.created_at)].filter(Boolean).join(', ')],
  ].filter(([, v]) => Boolean(v)) as [string, ReactNode][]

  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle className="pr-8 font-heading text-lg" style={{ color: 'var(--navy)' }}>
          {entry.title}
        </DialogTitle>
        <DialogDescription>
          {ready
            ? `${archiveTypeLabel(entry.document_type)}${entry.extraction_method ? ` · ${EXTRACTION_LABELS[entry.extraction_method] ?? entry.extraction_method}` : ''}`
            : entry.status === 'processing'
              ? 'Legalite is still reading this document.'
              : 'Legalite could not read this document.'}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => void onDownload()} disabled={download.isPending}>
          {download.isPending ? <CircleNotch className="animate-spin" /> : <DownloadSimple />} Original file
        </Button>
        {ready && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <PencilSimple /> Edit details
          </Button>
        )}
        {entry.status !== 'processing' && (
          <Button variant="outline" size="sm" onClick={() => void onReprocess()} disabled={reprocess.isPending}>
            {reprocess.isPending ? <CircleNotch className="animate-spin" /> : <ArrowClockwise />} Read again
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600">
          <Trash /> Remove
        </Button>
      </div>

      {entry.status === 'failed' && (
        <Callout tone="error" icon={<WarningCircle size={16} />} title="This document could not be read">
          {entry.error || 'Try reading it again, or upload a clearer copy (PDF or DOCX).'}
        </Callout>
      )}

      {entry.status === 'processing' && (
        <Callout tone="info" icon={<CircleNotch size={16} className="animate-spin" />} title="Reading the document">
          Legalite is extracting the text and checking the content. This usually takes under a minute; scanned
          documents take longer.
        </Callout>
      )}

      {ready && (
        <>
          <VerificationPanel entry={entry} />

          {entry.summary && (
            <Section title="Summary">
              <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {entry.summary}
              </p>
            </Section>
          )}

          {entry.key_points.length > 0 && (
            <Section title="Key points">
              <ul className="list-disc space-y-1 pl-5 text-[13px]" style={{ color: 'var(--text-primary)' }}>
                {entry.key_points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Details">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
              {facts.map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-28 shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {k}
                  </dt>
                  <dd className="min-w-0 break-words" style={{ color: 'var(--text-primary)' }}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          {entry.parties.length > 0 && (
            <Section title="Parties">
              <ul className="space-y-1 text-[13px]">
                {entry.parties.map((p) => (
                  <li key={`${p.name}-${p.role}`}>
                    <span style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                    {p.role && <span style={{ color: 'var(--text-muted)' }}> · {p.role}</span>}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(entry.key_dates.length > 0 || entry.amounts.length > 0) && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {entry.key_dates.length > 0 && (
                <Section title="Dates">
                  <ul className="space-y-1 text-[13px]">
                    {entry.key_dates.map((d) => (
                      <li key={`${d.date}-${d.description}`}>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {formatDate(d.date)}
                        </span>
                        {d.description && <span style={{ color: 'var(--text-secondary)' }}> {d.description}</span>}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {entry.amounts.length > 0 && (
                <Section title="Amounts">
                  <ul className="space-y-1 text-[13px]">
                    {entry.amounts.map((a) => (
                      <li key={`${a.amount}-${a.description}`}>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {a.amount}
                        </span>
                        {a.description && <span style={{ color: 'var(--text-secondary)' }}> {a.description}</span>}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          )}

          {entry.legal_references.length > 0 && (
            <Section title="Legal references">
              <ul className="list-disc space-y-1 pl-5 text-[13px]" style={{ color: 'var(--text-primary)' }}>
                {entry.legal_references.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </Section>
          )}

          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((t) => (
                <span
                  key={t}
                  className="rounded px-2 py-0.5 text-[11px]"
                  style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <ContentView content={entry.content ?? ''} />
        </>
      )}
    </div>
  )
}

function VerificationPanel({ entry }: { entry: NonNullable<ArchiveEntryDetail> }) {
  const notes = [...entry.verification_notes]
  if (entry.legibility === 'partial') notes.push('Parts of the document were hard to read.')
  if (entry.legibility === 'poor') notes.push('Most of the document was hard to read; check the original.')
  if (entry.completeness === 'partial') notes.push('The document appears incomplete (pages or sections missing).')
  if (entry.is_legal_document === false) notes.push('This does not look like a legal document.')
  const warnings = entry.warnings ?? []

  if (!needsReview(entry) && entry.is_legal_document !== false && warnings.length === 0) {
    return (
      <Callout tone="ok" icon={<CheckCircle size={16} />} title="Checked by Legalite">
        The text was read in full and nothing in the document needs flagging.
        {typeof entry.confidence === 'number' && ` Confidence ${Math.round(entry.confidence * 100)}%.`}
      </Callout>
    )
  }
  return (
    <Callout tone="warn" icon={<Warning size={16} />} title="Check before relying on this document">
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {[...notes, ...warnings].map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </Callout>
  )
}

/** The archived text, with find-in-text and copy. */
function ContentView({ content }: { content: string }) {
  const [find, setFind] = useState('')
  const term = find.trim()
  const parts = useMemo(() => {
    if (term.length < 2) return null
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return content.split(new RegExp(`(${escaped})`, 'gi'))
  }, [content, term])
  const matches = parts ? (parts.length - 1) / 2 : 0

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Text copied.')
    } catch {
      toast.error('Could not copy the text.')
    }
  }

  return (
    <Section
      title="Archived content"
      action={
        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlass size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={find}
              onChange={(e) => setFind(e.target.value)}
              placeholder="Find in text"
              className="h-8 w-40 pl-8 text-[12.5px]"
              aria-label="Find in the archived text"
            />
          </div>
          {term.length >= 2 && (
            <span className="text-[11.5px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {matches} match{matches === 1 ? '' : 'es'}
            </span>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => void copy()} aria-label="Copy text">
            <Copy />
          </Button>
        </div>
      }
    >
      {content ? (
        <div
          className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-lg border p-4 font-mono text-[12.5px] leading-relaxed"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-primary)' }}
        >
          {parts
            ? parts.map((p, i) =>
                i % 2 === 1 ? (
                  <mark key={i} className="rounded bg-amber-200 px-0.5">
                    {p}
                  </mark>
                ) : (
                  p
                ),
              )
            : content}
        </div>
      ) : (
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          No text could be extracted from this file.
        </p>
      )}
    </Section>
  )
}

function EditEntry({
  entry,
  cases,
  onDone,
}: {
  entry: NonNullable<ArchiveEntryDetail>
  cases: Case[]
  onDone: () => void
}) {
  const update = useUpdateArchiveEntry()
  const [title, setTitle] = useState(entry.title)
  const [type, setType] = useState(entry.document_type ?? 'other')
  const [summary, setSummary] = useState(entry.summary ?? '')
  const [tags, setTags] = useState(entry.tags.join(', '))
  const [caseId, setCaseId] = useState(entry.case_id ?? NO_CASE)

  const typeItems = Object.entries(ARCHIVE_TYPE_LABELS).map(([value, label]) => ({ value, label }))
  const caseItems = [
    { value: NO_CASE, label: 'Not filed under a case' },
    ...cases.map((c) => ({ value: c.id, label: c.title })),
  ]

  const save = async () => {
    if (!title.trim()) {
      toast.error('The title cannot be empty.')
      return
    }
    try {
      await update.mutateAsync(entry.id, {
        title: title.trim(),
        document_type: type,
        summary,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 12),
        case_id: caseId === NO_CASE ? null : caseId,
      })
      toast.success('Archive entry updated.')
      onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the changes.')
    }
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="font-heading text-lg" style={{ color: 'var(--navy)' }}>
          Edit archive details
        </DialogTitle>
        <DialogDescription>Correct anything Legalite got wrong. The archived text is not changed.</DialogDescription>
      </DialogHeader>
      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type">
          <Select items={typeItems} value={type} onValueChange={(v) => setType((v as string) || 'other')}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeItems.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Case">
          <Select items={caseItems} value={caseId} onValueChange={(v) => setCaseId((v as string) || NO_CASE)}>
            <SelectTrigger className="h-9 w-full">
              <span className="min-w-0 truncate">
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {caseItems.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Summary">
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} maxLength={4000} />
      </Field>
      <Field label="Tags (comma separated)">
        <Input value={tags} onChange={(e) => setTags(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone} disabled={update.isPending}>
          Cancel
        </Button>
        <Button onClick={() => void save()} disabled={update.isPending}>
          {update.isPending && <CircleNotch className="animate-spin" />} Save changes
        </Button>
      </div>
    </div>
  )
}

function DeleteEntryConfirm({
  entry,
  open,
  onCancel,
  onDone,
}: {
  entry: NonNullable<ArchiveEntryDetail>
  open: boolean
  onCancel: () => void
  onDone: () => void
}) {
  const remove = useDeleteArchiveEntry()
  return (
    <ConfirmDialogView
      open={open}
      tone="danger"
      title="Remove from the firm archive?"
      description={
        <>
          <strong style={{ color: 'var(--navy)' }}>{entry.title}</strong> and its archived content will be removed
          for everyone in the firm. This cannot be undone.
        </>
      }
      details={['A copy in your Legal Library, if there is one, is kept.']}
      confirmLabel="Remove"
      successLabel="Removed"
      onCancel={onCancel}
      onDone={onDone}
      action={async () => {
        try {
          await remove.mutateAsync(entry.id)
          toast.success('Removed from the firm archive.')
        } catch (err) {
          toast.error('Could not remove it from the archive.')
          throw err
        }
      }}
    />
  )
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

function Callout({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'ok' | 'warn' | 'error' | 'info'
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  const styles = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    info: 'border-slate-200 bg-slate-50 text-slate-800',
  }[tone]
  return (
    <div className={`flex gap-2.5 rounded-lg border p-3 text-[12.5px] ${styles}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  )
}
