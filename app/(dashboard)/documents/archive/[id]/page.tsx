'use client'

/**
 * /documents/archive/[id] - one document in the firm archive: what Legalite
 * read from it, the checks a lawyer should know about, the people, dates and
 * sums it mentions, and the full text with find.
 */

import { use, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { RequirePermission } from '@/components/shared/RequirePermission'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowClockwise,
  ArrowLeft,
  CaretDown,
  CaretUp,
  CheckCircle,
  CircleNotch,
  Copy,
  DotsThree,
  DownloadSimple,
  FileText,
  LinkSimple,
  MagnifyingGlass,
  PencilSimple,
  Scales,
  Trash,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useArchiveDownload, useArchiveEntry, useReprocessArchiveEntry, type ArchiveEntryDetail } from '@/hooks/use-archive'
import { useCases } from '@/hooks/use-cases'
import { errorMessage } from '@/lib/errors'
import { DEV_BYPASS, useCan } from '@/lib/access'
import { useAuthStore } from '@/stores/auth.store'
import {
  EXTRACTION_LABELS,
  archiveTypeLabel,
  formatBytes,
  formatDate,
  needsReview,
} from '../../_components/archive/archive-meta'
import { EditArchiveEntryDialog, RemoveArchiveEntryDialog } from '../../_components/archive/ArchiveEntryActions'

type Entry = NonNullable<ArchiveEntryDetail>

const BACK_HREF = '/documents?tab=archive'

export default function ArchiveEntryPage(props: { params: Promise<{ id: string }> }) {
  return (
    <RequirePermission permission="view-archive" what="the firm archive">
      <ArchiveEntryPageInner {...props} />
    </RequirePermission>
  )
}

function ArchiveEntryPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { entry, isLoading, error } = useArchiveEntry(id)
  const { data: cases } = useCases()
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)

  if (isLoading) return <LoadingView />
  if (error || !entry) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'var(--surface-sunken)' }}>
          <FileText size={22} style={{ color: 'var(--text-muted)' }} />
        </div>
        <h1 className="font-heading text-lg font-bold" style={{ color: 'var(--navy)' }}>
          Archive entry not found
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          {error ? errorMessage(error, 'It could not be loaded.') : 'It may have been removed from the firm archive.'}
        </p>
        <Link href={BACK_HREF} className="mt-5 text-sm font-semibold hover:underline" style={{ color: 'var(--gold-dark)' }}>
          Back to the firm archive
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <Header entry={entry} onEdit={() => setEditing(true)} onRemove={() => setRemoving(true)} />

        {entry.status === 'processing' && (
          <Callout tone="info" icon={<CircleNotch size={16} className="animate-spin" />} title="Reading the document" className="mt-6">
            Legalite is extracting the text and checking the content. This page updates on its own; scanned documents
            take a little longer.
          </Callout>
        )}
        {entry.status === 'failed' && (
          <Callout tone="error" icon={<WarningCircle size={16} />} title="This document could not be read" className="mt-6">
            {entry.error || 'Read it again, or upload a clearer copy (PDF or DOCX).'}
          </Callout>
        )}

        {entry.status === 'ready' && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-6">
              <Verification entry={entry} />
              <Overview entry={entry} />
              <Parties entry={entry} />
              <DatesAndAmounts entry={entry} />
              <References entry={entry} />
              <FullText content={entry.content ?? ''} wordCount={entry.word_count} />
            </div>
            <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              <DetailsCard entry={entry} />
              <FileCard entry={entry} />
            </aside>
          </div>
        )}
      </div>

      <EditArchiveEntryDialog entry={entry} cases={cases ?? []} open={editing} onClose={() => setEditing(false)} />
      <RemoveArchiveEntryDialog
        entry={entry}
        open={removing}
        onCancel={() => setRemoving(false)}
        onDone={() => {
          setRemoving(false)
          router.push(BACK_HREF)
        }}
      />
    </div>
  )
}

// ── Header ───────────────────────────────────────────────────────────────

function Header({ entry, onEdit, onRemove }: { entry: Entry; onEdit: () => void; onRemove: () => void }) {
  const download = useArchiveDownload()
  const reprocess = useReprocessArchiveEntry()
  // The backend allows changes only to the uploader or a firm owner/admin;
  // mirror that so people are not offered actions that would be refused.
  const userId = useAuthStore((s) => s.user?.id)
  const firmRole = useAuthStore((s) => s.activeMembership?.firm_role)
  const canManageAll = useCan('manage-archive')
  const canManage =
    DEV_BYPASS || canManageAll || firmRole === 'owner' || firmRole === 'admin' || (!!userId && entry.uploaded_by === userId)
  const ready = entry.status === 'ready'

  const onDownload = async () => {
    const id = toast.loading('Preparing the original file...')
    try {
      const url = await download.mutateAsync(entry.id)
      window.open(url, '_blank', 'noopener')
      toast.success('Original file opened in a new tab.', { id })
    } catch (err) {
      toast.error(errorMessage(err, 'Unable to download the original file. Please try again.'), { id })
    }
  }

  const onReprocess = async () => {
    const id = toast.loading('Sending the document to be read again...')
    try {
      await reprocess.mutateAsync(entry.id)
      toast.success('Legalite is reading the document again.', { id })
    } catch (err) {
      toast.error(errorMessage(err, 'Could not restart processing.'), { id })
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied.')
    } catch {
      toast.error('Could not copy the link.')
    }
  }

  const subtitle = [
    entry.suit_number,
    entry.court,
    entry.document_date ? formatDate(entry.document_date) : null,
  ].filter(Boolean) as string[]

  return (
    <header>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        <Link href={BACK_HREF} className="inline-flex items-center gap-1 font-medium hover:underline">
          <ArrowLeft size={13} /> Firm archive
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate">{archiveTypeLabel(entry.document_type)}</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:flex"
            style={{ background: 'rgba(201,151,43,0.1)' }}
          >
            <FileText size={26} weight="duotone" style={{ color: 'var(--gold-dark)' }} />
          </div>
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <Chip>{archiveTypeLabel(entry.document_type)}</Chip>
              <StatusChip entry={entry} />
            </div>
            <h1 className="font-heading text-2xl font-bold leading-tight sm:text-[28px]" style={{ color: 'var(--navy)' }}>
              {entry.title}
            </h1>
            {subtitle.length > 0 && (
              <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                {subtitle.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void onDownload()} disabled={download.isPending}>
            {download.isPending ? <CircleNotch className="animate-spin" /> : <DownloadSimple />} Original file
          </Button>
          {ready && canManage && (
            <Button size="sm" onClick={onEdit}>
              <PencilSimple /> Edit details
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="icon-sm" aria-label="More actions">
                  <DotsThree weight="bold" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer text-[13px]" onClick={() => void copyLink()}>
                <LinkSimple size={14} /> Copy link
              </DropdownMenuItem>
              {canManage && entry.status !== 'processing' && (
                <DropdownMenuItem
                  className="cursor-pointer text-[13px]"
                  disabled={reprocess.isPending}
                  onClick={() => void onReprocess()}
                >
                  <ArrowClockwise size={14} /> Read again
                </DropdownMenuItem>
              )}
              {canManage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-[13px]" style={{ color: '#B42318' }} onClick={onRemove}>
                    <Trash size={14} /> Remove from archive
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

// ── Main column ──────────────────────────────────────────────────────────

function Verification({ entry }: { entry: Entry }) {
  const notes = [...entry.verification_notes]
  if (entry.legibility === 'partial') notes.push('Parts of the document were hard to read.')
  if (entry.legibility === 'poor') notes.push('Most of the document was hard to read; check the original.')
  if (entry.completeness === 'partial') notes.push('The document appears incomplete (pages or sections missing).')
  if (entry.is_legal_document === false) notes.push('This does not look like a legal document.')
  const all = [...notes, ...(entry.warnings ?? [])]

  if (!needsReview(entry) && entry.is_legal_document !== false && all.length === 0) {
    return (
      <Callout tone="ok" icon={<CheckCircle size={16} weight="fill" />} title="Checked by Legalite">
        The text was read in full and nothing in the document needs flagging.
      </Callout>
    )
  }
  return (
    <Callout tone="warn" icon={<Warning size={16} weight="fill" />} title="Check before relying on this document">
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {all.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </Callout>
  )
}

function Overview({ entry }: { entry: Entry }) {
  if (!entry.summary && entry.key_points.length === 0) return null
  return (
    <Card title="Summary">
      {entry.summary && (
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {entry.summary}
        </p>
      )}
      {entry.key_points.length > 0 && (
        <div className={entry.summary ? 'mt-5' : ''}>
          <h3 className="mb-2 text-[12px] font-semibold" style={{ color: 'var(--navy)' }}>
            Key points
          </h3>
          <ol className="space-y-2">
            {entry.key_points.map((p, i) => (
              <li key={p} className="flex gap-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold tabular-nums"
                  style={{ background: 'rgba(201,151,43,0.12)', color: 'var(--gold-dark)' }}
                >
                  {i + 1}
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  )
}

function Parties({ entry }: { entry: Entry }) {
  if (entry.parties.length === 0) return null
  return (
    <Card title="Parties" count={entry.parties.length}>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {entry.parties.map((p) => (
          <li
            key={`${p.name}-${p.role}`}
            className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
            style={{ borderColor: 'var(--border-soft, var(--border))' }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{ background: 'var(--surface-sunken)', color: 'var(--navy)' }}
            >
              {initials(p.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
                {p.name}
              </span>
              {p.role && (
                <span className="block truncate text-[12px] capitalize" style={{ color: 'var(--text-muted)' }}>
                  {p.role}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function DatesAndAmounts({ entry }: { entry: Entry }) {
  const dates = [...entry.key_dates].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  if (dates.length === 0 && entry.amounts.length === 0) return null
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {dates.length > 0 && (
        <Card title="Key dates" count={dates.length}>
          <ol className="relative space-y-4 border-l pl-5" style={{ borderColor: 'var(--border)' }}>
            {dates.map((d) => (
              <li key={`${d.date}-${d.description}`} className="relative">
                <span
                  className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 bg-white"
                  style={{ borderColor: 'var(--gold)' }}
                  aria-hidden
                />
                <p className="text-[12.5px] font-semibold tabular-nums" style={{ color: 'var(--navy)' }}>
                  {formatDate(d.date)}
                </p>
                {d.description && (
                  <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                    {d.description}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}
      {entry.amounts.length > 0 && (
        <Card title="Amounts" count={entry.amounts.length}>
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {entry.amounts.map((a) => (
              <li key={`${a.amount}-${a.description}`} className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0">
                <span className="min-w-0 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  {a.description || 'Amount'}
                </span>
                <span className="shrink-0 text-[13.5px] font-semibold tabular-nums" style={{ color: 'var(--navy)' }}>
                  {a.amount}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function References({ entry }: { entry: Entry }) {
  if (entry.legal_references.length === 0) return null
  return (
    <Card title="Legal references" count={entry.legal_references.length}>
      <ul className="space-y-2">
        {entry.legal_references.map((r) => (
          <li key={r} className="flex items-start gap-2.5 text-[13.5px]" style={{ color: 'var(--text-primary)' }}>
            <Scales size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--gold-dark)' }} />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** The archived text, with find (next / previous match) and copy. */
function FullText({ content, wordCount }: { content: string; wordCount: number | null | undefined }) {
  const [find, setFind] = useState('')
  const [current, setCurrent] = useState(0)
  const marks = useRef<(HTMLElement | null)[]>([])
  const term = find.trim()

  const parts = useMemo(() => {
    if (term.length < 2) return null
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return content.split(new RegExp(`(${escaped})`, 'gi'))
  }, [content, term])
  const matches = parts ? (parts.length - 1) / 2 : 0
  const active = matches > 0 ? Math.min(current, matches - 1) : 0

  useEffect(() => {
    if (matches > 0) marks.current[active]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [active, matches, term])

  const step = (delta: number) => {
    if (matches === 0) return
    setCurrent((active + delta + matches) % matches)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Text copied.')
    } catch {
      toast.error('Could not copy the text.')
    }
  }

  let matchIndex = -1
  return (
    <Card
      title="Full text"
      subtitle={wordCount ? `${wordCount.toLocaleString()} words` : undefined}
      action={
        content ? (
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <MagnifyingGlass size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <Input
                value={find}
                onChange={(e) => {
                  setFind(e.target.value)
                  setCurrent(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    step(e.shiftKey ? -1 : 1)
                  }
                }}
                placeholder="Find in text"
                className="h-8 w-44 pl-8 pr-7 text-[12.5px]"
                aria-label="Find in the archived text"
              />
              {find && (
                <button
                  type="button"
                  onClick={() => setFind('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                  aria-label="Clear search"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
            {term.length >= 2 && (
              <>
                <span className="min-w-[52px] text-center text-[11.5px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {matches === 0 ? 'No match' : `${active + 1} of ${matches}`}
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => step(-1)} disabled={matches === 0} aria-label="Previous match">
                  <CaretUp />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => step(1)} disabled={matches === 0} aria-label="Next match">
                  <CaretDown />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon-sm" onClick={() => void copy()} aria-label="Copy text">
              <Copy />
            </Button>
          </div>
        ) : undefined
      }
    >
      {content ? (
        <div
          className="max-h-[640px] overflow-y-auto whitespace-pre-wrap rounded-xl border px-6 py-5 font-serif text-[14px] leading-[1.8]"
          style={{ borderColor: 'var(--border)', background: 'var(--cream-white, #FDFBF7)', color: 'var(--text-primary)' }}
        >
          {parts
            ? parts.map((p, i) => {
                if (i % 2 === 0) return p
                matchIndex += 1
                const idx = matchIndex
                return (
                  <mark
                    key={i}
                    ref={(el) => {
                      marks.current[idx] = el
                    }}
                    className={`rounded px-0.5 ${idx === active ? 'bg-amber-400' : 'bg-amber-200'}`}
                  >
                    {p}
                  </mark>
                )
              })
            : content}
        </div>
      ) : (
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          No text could be extracted from this file. Download the original to read it.
        </p>
      )}
    </Card>
  )
}

// ── Side column ──────────────────────────────────────────────────────────

function DetailsCard({ entry }: { entry: Entry }) {
  const rows: [string, ReactNode][] = [
    ['Type', archiveTypeLabel(entry.document_type)],
    ['Court', entry.court],
    ['Suit number', entry.suit_number],
    ['Document date', entry.document_date ? formatDate(entry.document_date) : null],
    [
      'Case',
      entry.case_id ? (
        <Link href={`/cases/${entry.case_id}`} className="font-medium hover:underline" style={{ color: 'var(--gold-dark)' }}>
          {entry.case_title ?? 'Open case'}
        </Link>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>Not filed under a case</span>
      ),
    ],
  ].filter(([, v]) => Boolean(v)) as [string, ReactNode][]

  return (
    <Card title="Details">
      <DefinitionList rows={rows} />
      {entry.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          {entry.tags.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      )}
    </Card>
  )
}

function FileCard({ entry }: { entry: Entry }) {
  const confidence = typeof entry.confidence === 'number' ? Math.round(entry.confidence * 100) : null
  const rows: [string, ReactNode][] = [
    ['File', <span key="f" className="break-all">{entry.file_name}</span>],
    ['Size', formatBytes(entry.file_size) || null],
    ['Pages', entry.page_count ? String(entry.page_count) : null],
    ['Read', entry.extraction_method ? EXTRACTION_LABELS[entry.extraction_method] ?? entry.extraction_method : null],
    ['Uploaded by', entry.uploaded_by_name],
    ['Uploaded', formatDate(entry.created_at)],
    ['Processed', entry.processed_at ? formatDate(entry.processed_at) : null],
  ].filter(([, v]) => Boolean(v)) as [string, ReactNode][]

  return (
    <Card title="File and record">
      <DefinitionList rows={rows} />
      {confidence !== null && (
        <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span style={{ color: 'var(--text-muted)' }}>Reading confidence</span>
            <span className="font-semibold tabular-nums" style={{ color: 'var(--navy)' }}>
              {confidence}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-sunken)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${confidence}%`,
                background: confidence >= 80 ? '#059669' : confidence >= 60 ? '#D97706' : '#DC2626',
              }}
            />
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Building blocks ──────────────────────────────────────────────────────

function Card({
  title,
  subtitle,
  count,
  action,
  children,
}: {
  title: string
  subtitle?: string
  count?: number
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: 'var(--border)' }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="font-heading text-[16px] font-semibold" style={{ color: 'var(--navy)' }}>
            {title}
          </h2>
          {typeof count === 'number' && (
            <span className="text-[12px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {count}
            </span>
          )}
          {subtitle && (
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </span>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function DefinitionList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="space-y-2.5 text-[13px]">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
          <dt style={{ color: 'var(--text-muted)' }}>{k}</dt>
          <dd className="min-w-0 break-words" style={{ color: 'var(--text-primary)' }}>
            {v}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}
    >
      {children}
    </span>
  )
}

function StatusChip({ entry }: { entry: Entry }) {
  const chip = 'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium'
  if (entry.status === 'processing') {
    return (
      <span className={chip} style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
        <CircleNotch size={11} className="animate-spin" /> Reading
      </span>
    )
  }
  if (entry.status === 'failed') {
    return (
      <span className={`${chip} bg-red-50 text-red-700`}>
        <WarningCircle size={11} /> Could not read
      </span>
    )
  }
  return needsReview(entry) ? (
    <span className={`${chip} bg-amber-50 text-amber-800`}>
      <Warning size={11} /> Check notes
    </span>
  ) : (
    <span className={`${chip} bg-emerald-50 text-emerald-700`}>
      <CheckCircle size={11} /> Verified
    </span>
  )
}

function Callout({
  tone,
  icon,
  title,
  className = '',
  children,
}: {
  tone: 'ok' | 'warn' | 'error' | 'info'
  icon: ReactNode
  title: string
  className?: string
  children: ReactNode
}) {
  const styles = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    info: 'border-slate-200 bg-slate-50 text-slate-800',
  }[tone]
  return (
    <div className={`flex gap-3 rounded-2xl border px-4 py-3.5 text-[13px] ${styles} ${className}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <div className="mt-0.5 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function LoadingView() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6" aria-busy aria-label="Loading the archived document">
      <Skeleton className="h-4 w-40" />
      <div className="flex gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
