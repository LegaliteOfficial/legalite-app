'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Archive,
  ArrowClockwise,
  CheckCircle,
  CircleNotch,
  FileText,
  MagnifyingGlass,
  Warning,
  WarningCircle,
} from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileUploadZone } from '@/components/shared/FileUploadZone'
import { useArchiveEntries, type ArchiveListEntry } from '@/hooks/use-archive'
import { LIBRARY_ACCEPT, LIBRARY_MAX_MB } from '../../_constants'
import { ARCHIVE_TYPE_LABELS, archiveTypeLabel, formatDate, needsReview } from './archive-meta'

const ALL = 'all'

/**
 * Firm archive: every document the firm has uploaded, read and described by
 * Legalite AI. Search runs over the full text, titles, parties, suit
 * numbers and summaries. New uploads land here automatically.
 */
export function ArchiveTab({
  onUpload,
  isUploading,
}: {
  onUpload: (file: File) => Promise<unknown>
  isUploading: boolean
}) {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [type, setType] = useState<string>(ALL)

  // Debounce the full-text search.
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const { entries, isLoading, error, refetch, processingCount } = useArchiveEntries(
    search,
    type === ALL ? null : type,
  )

  const typeItems = useMemo(
    () => [
      { value: ALL, label: 'All types' },
      ...Object.entries(ARCHIVE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    ],
    [],
  )

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--navy)' }}>
            Firm archive
          </h2>
          <p className="mt-0.5 max-w-xl text-sm" style={{ color: '#6B7280' }}>
            Your firm&rsquo;s past documents, read and checked by Legalite. Search the content of every
            file, and ask Legalite AI about them.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 xl:w-auto">
          <div className="relative min-w-0 flex-1 xl:w-72 xl:flex-none">
            <MagnifyingGlass
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search names, suit numbers, content..."
              className="h-10 pl-9"
              aria-label="Search the firm archive"
            />
          </div>
          <Select items={typeItems} value={type} onValueChange={(v) => setType((v as string) || ALL)}>
            <SelectTrigger className="h-10 w-[150px] shrink-0 rounded-lg text-[12.5px]" aria-label="Filter by type">
              <span className="min-w-0 truncate">
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {typeItems.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6">
        <FileUploadZone
          category="document"
          accept={LIBRARY_ACCEPT.document}
          maxSizeMB={LIBRARY_MAX_MB.document}
          onUpload={async (file) => {
            await onUpload(file)
          }}
          isUploading={isUploading}
          multiple
          label="Drop your firm's documents here"
          sublabel="Case files, memos, opinions, contracts, letters: PDF, DOCX, TXT, EPUB, images up to 50MB"
        />
      </div>

      {processingCount > 0 && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px]"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}
          role="status"
        >
          <CircleNotch size={14} className="animate-spin" style={{ color: 'var(--gold)' }} />
          Legalite is reading {processingCount} document{processingCount === 1 ? '' : 's'}. This page updates
          when {processingCount === 1 ? 'it is' : 'they are'} done.
        </div>
      )}

      {error ? (
        <div className="rounded-xl border p-8 text-center" style={{ borderColor: 'var(--border)' }}>
          <WarningCircle size={28} className="mx-auto mb-2 text-red-400" />
          <p className="text-sm font-medium" style={{ color: 'var(--navy)' }}>
            The firm archive could not be loaded.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
            <ArrowClockwise size={14} /> Try again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border bg-white" style={{ borderColor: 'var(--border)' }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center" style={{ borderColor: 'var(--border)' }}>
          <Archive size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="mb-1 text-sm font-medium" style={{ color: '#6B7280' }}>
            {search || type !== ALL ? 'Nothing in the archive matches.' : 'The firm archive is empty.'}
          </p>
          <p className="text-[12px]" style={{ color: '#9CA3AF' }}>
            {search || type !== ALL
              ? 'Try other words: a party name, suit number, statute or phrase.'
              : 'Upload your existing case files, memos and opinions above. Legalite reads each one and files its content here.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id}>
              <ArchiveRow entry={e} />
            </li>
          ))}
        </ul>
      )}

    </div>
  )
}

function ArchiveRow({ entry }: { entry: ArchiveListEntry }) {
  const meta = [
    entry.suit_number,
    entry.court,
    entry.document_date ? formatDate(entry.document_date) : null,
    entry.case_title ? `Case: ${entry.case_title}` : null,
  ].filter(Boolean) as string[]
  const uploaded = [
    entry.uploaded_by_name ? `Uploaded by ${entry.uploaded_by_name}` : 'Uploaded',
    formatDate(entry.created_at),
  ].join(' on ')

  return (
    <Link
      href={`/documents/archive/${entry.id}`}
      className="block w-full rounded-xl border bg-white p-4 text-left transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: 'rgba(201,151,43,0.08)' }}
        >
          <FileText size={18} style={{ color: 'var(--gold-dark, #C9972B)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 truncate text-[14px] font-semibold" style={{ color: 'var(--navy)' }}>
              {entry.title}
            </p>
            <StatusChip entry={entry} />
          </div>
          {entry.status === 'ready' && entry.summary && (
            <p className="mt-1 line-clamp-2 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
              {entry.summary}
            </p>
          )}
          {entry.status === 'failed' && (
            <p className="mt-1 line-clamp-2 text-[12.5px] text-red-600">{entry.error || 'This document could not be read.'}</p>
          )}
          {entry.status === 'processing' && (
            <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
              Reading {entry.file_name}...
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
            {meta.map((m) => (
              <span key={m}>{m}</span>
            ))}
            <span>{uploaded}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function StatusChip({ entry }: { entry: ArchiveListEntry }) {
  const chip = 'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium'
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
  return (
    <>
      <span className={chip} style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}>
        {archiveTypeLabel(entry.document_type)}
      </span>
      {needsReview(entry) ? (
        <span className={`${chip} bg-amber-50 text-amber-800`} title="Legalite noted something to check">
          <Warning size={11} /> Check notes
        </span>
      ) : (
        <span className={`${chip} bg-emerald-50 text-emerald-700`}>
          <CheckCircle size={11} /> Verified
        </span>
      )}
    </>
  )
}
