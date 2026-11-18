'use client'

/**
 * The firm's documents: "Continue where you left off" cards for the most
 * recently edited drafts, then the full list with search and filters by
 * workflow status and case. Editor drafts open in the studio; uploaded
 * files open the file itself.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowSquareOut,
  CheckCircle,
  DotsThree,
  FileText,
  MagnifyingGlass,
  PencilSimpleLine,
  Paperclip,
  Trash,
} from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DOCUMENT_STATUSES, STATUS_META, normaliseStatus, type DocumentStatus } from '@/lib/documents/status'
import { htmlToText } from '@/lib/documents/text'
import type { Case, Document } from '@/types'
import { StatusBadge, relativeTime } from '../StatusBadge'

const ALL = '__all__'
const RECENT_COUNT = 4

type StatusFilter = DocumentStatus | typeof ALL

export function DocumentsList({
  documents,
  cases,
  onSetStatus,
  onDelete,
  onStartBlank,
}: {
  documents: Document[]
  cases: Case[]
  onSetStatus: (doc: Document, status: DocumentStatus) => void
  onDelete: (doc: Document) => void
  onStartBlank: () => void
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>(ALL)
  const [caseId, setCaseId] = useState<string>(ALL)

  const sorted = useMemo(
    () => [...documents].sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [documents],
  )
  const recent = useMemo(() => sorted.filter((d) => !d.file_url).slice(0, RECENT_COUNT), [sorted])

  const counts = useMemo(() => {
    const c: Record<string, number> = { [ALL]: documents.length }
    for (const d of documents) {
      const s = normaliseStatus(d.status)
      c[s] = (c[s] ?? 0) + 1
    }
    return c
  }, [documents])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sorted.filter((d) => {
      if (status !== ALL && normaliseStatus(d.status) !== status) return false
      if (caseId !== ALL && d.case_id !== caseId) return false
      if (!q) return true
      return [d.title, d.template_type, d.case_title, d.client_name, d.court, d.suit_number]
        .some((v) => (v ?? '').toLowerCase().includes(q))
    })
  }, [sorted, search, status, caseId])

  const caseItems = useMemo(() => {
    const linked = new Set(documents.map((d) => d.case_id).filter(Boolean))
    return [
      { value: ALL, label: 'All cases' },
      ...cases.filter((c) => linked.has(c.id)).map((c) => ({ value: c.id, label: c.title })),
    ]
  }, [cases, documents])

  if (documents.length === 0) return <EmptyState onStartBlank={onStartBlank} />

  return (
    <div className="space-y-8">
      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-[17px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Continue where you left off
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {recent.map((d) => (
              <RecentCard key={d.id} doc={d} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Filter by status">
            {[ALL, ...DOCUMENT_STATUSES].map((s) => {
              const active = status === s
              return (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatus(s as StatusFilter)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[var(--surface-overlay)]"
                  style={{
                    background: active ? 'var(--surface-sunken)' : undefined,
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {s === ALL ? 'All documents' : STATUS_META[s as DocumentStatus].label}
                  <span className="tabular-nums text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {counts[s] ?? 0}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            {caseItems.length > 1 && (
              <Select items={caseItems} value={caseId} onValueChange={(v) => setCaseId((v as string) || ALL)}>
                <SelectTrigger className="h-9 w-[180px] rounded-lg text-[12.5px]" aria-label="Filter by case">
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
            )}
            <div className="relative w-full lg:w-64">
              <MagnifyingGlass size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents" className="h-9 pl-9" aria-label="Search documents" />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Document</TableHead>
                <TableHead className="hidden md:table-cell">Case</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Last edited</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    No documents match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d) => (
                  <DocumentRow key={d.id} doc={d} onSetStatus={onSetStatus} onDelete={onDelete} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}

function docHref(d: Document): string {
  return d.file_url ? d.file_url : `/documents/${d.id}`
}

function RecentCard({ doc }: { doc: Document }) {
  const excerpt = useMemo(() => htmlToText(doc.content ?? '').slice(0, 160), [doc.content])
  return (
    <Link
      href={docHref(doc)}
      className="group flex h-[150px] flex-col rounded-xl border p-3.5 transition-all hover:-translate-y-0.5 hover:border-[var(--gold)]"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)', boxShadow: 'var(--shadow-xs)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 font-heading text-[14px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
          {doc.title || 'Untitled document'}
        </span>
        <StatusBadge status={doc.status} />
      </div>
      <p className="mt-1.5 line-clamp-3 flex-1 text-[11.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {excerpt || 'Empty document'}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <span className="min-w-0 truncate">{doc.case_title ?? doc.template_type ?? ''}</span>
        <span className="shrink-0">{relativeTime(doc.updated_at)}</span>
      </div>
    </Link>
  )
}

function DocumentRow({
  doc,
  onSetStatus,
  onDelete,
}: {
  doc: Document
  onSetStatus: (doc: Document, status: DocumentStatus) => void
  onDelete: (doc: Document) => void
}) {
  const isFile = !!doc.file_url
  const current = normaliseStatus(doc.status)
  return (
    <TableRow className="group">
      <TableCell className="max-w-0 pl-4">
        <Link
          href={docHref(doc)}
          target={isFile ? '_blank' : undefined}
          rel={isFile ? 'noopener noreferrer' : undefined}
          className="flex min-w-0 items-center gap-2.5"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--surface-sunken)', color: isFile ? 'var(--text-muted)' : 'var(--gold-dark)' }}
          >
            {isFile ? <Paperclip size={15} /> : <FileText size={15} />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-medium group-hover:underline" style={{ color: 'var(--text-primary)' }}>
              {doc.title || 'Untitled document'}
            </span>
            <span className="block truncate text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
              {isFile ? 'Uploaded file' : doc.template_type || 'Document'}
              {doc.suit_number ? ` · ${doc.suit_number}` : ''}
            </span>
          </span>
        </Link>
      </TableCell>
      <TableCell className="hidden max-w-[220px] truncate text-[12.5px] md:table-cell" style={{ color: 'var(--text-secondary)' }}>
        {doc.case_title ?? <span style={{ color: 'var(--text-subtle)' }}>Not linked</span>}
      </TableCell>
      <TableCell>
        <StatusBadge status={doc.status} />
      </TableCell>
      <TableCell className="hidden whitespace-nowrap text-[12.5px] sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
        {relativeTime(doc.updated_at)}
      </TableCell>
      <TableCell className="pr-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label={`Actions for ${doc.title}`}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-[var(--surface-overlay)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <DotsThree size={16} weight="bold" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer text-[13px]" onClick={() => window.open(docHref(doc), isFile ? '_blank' : '_self')}>
              {isFile ? <ArrowSquareOut size={13} /> : <PencilSimpleLine size={13} />}
              {isFile ? 'Open file' : 'Open in studio'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[11px]">Mark as</DropdownMenuLabel>
              {DOCUMENT_STATUSES.map((s) => (
                <DropdownMenuItem key={s} className="cursor-pointer text-[13px]" disabled={s === current} onClick={() => onSetStatus(doc, s)}>
                  {s === current ? <CheckCircle size={13} weight="fill" /> : <span className="w-[13px]" />}
                  {STATUS_META[s].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-[13px]" style={{ color: 'var(--accent-danger)' }} onClick={() => onDelete(doc)}>
              <Trash size={13} />
              Move to bin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

function EmptyState({ onStartBlank }: { onStartBlank: () => void }) {
  return (
    <div className="rounded-xl border px-6 py-14 text-center" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)' }}>
      <FileText size={36} className="mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
      <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
        No documents yet
      </p>
      <p className="mx-auto mt-1 max-w-sm text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        Describe what you need above and the AI will write a first draft, or start from a template or a blank page.
      </p>
      <button
        type="button"
        onClick={onStartBlank}
        className="mt-4 cursor-pointer text-[12.5px] font-medium underline-offset-2 hover:underline"
        style={{ color: 'var(--gold-dark)' }}
      >
        Start a blank document
      </button>
    </div>
  )
}
