'use client'

/**
 * Studio header: back to the list, the title, workflow status and the
 * save indicator on the left; case link, panels, PDF and more on the right.
 * There is no Save button: the document saves itself (Ctrl/Cmd+S forces it).
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookmarkSimple,
  Briefcase,
  CaretDown,
  CheckCircle,
  CloudCheck,
  CloudSlash,
  DotsThree,
  DownloadSimple,
  Eye,
  Palette,
  Sparkle,
  Trash,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/shared/Spinner'
import { DOCUMENT_STATUSES, STATUS_META, type DocumentStatus } from '@/lib/documents/status'
import type { Case } from '@/types'
import type { SaveState } from '../../_hooks/use-autosave'
import { StatusBadge, relativeTime } from '../StatusBadge'

const NO_CASE = '__none__'

export type StudioPanel = 'ai' | 'design' | null

export function StudioHeader({
  title,
  onTitleChange,
  status,
  onStatusChange,
  saveState,
  lastSavedAt,
  onRetrySave,
  cases,
  caseId,
  onCaseChange,
  panel,
  onPanelChange,
  pdfBusy,
  onPreview,
  onDownload,
  onSaveAsTemplate,
  onDelete,
}: {
  title: string
  onTitleChange: (v: string) => void
  status: DocumentStatus
  onStatusChange: (s: DocumentStatus) => void
  saveState: SaveState
  lastSavedAt: number | null
  onRetrySave: () => void
  cases: Case[]
  caseId: string
  onCaseChange: (id: string) => void
  panel: StudioPanel
  onPanelChange: (p: StudioPanel) => void
  pdfBusy: 'preview' | 'download' | null
  onPreview: () => void
  onDownload: () => void
  onSaveAsTemplate: () => void
  onDelete: () => void
}) {
  const caseItems = useMemo(
    () => [
      { value: NO_CASE, label: 'No case' },
      ...cases.map((c) => ({ value: c.id, label: c.client_name ? `${c.title} · ${c.client_name}` : c.title })),
    ],
    [cases],
  )

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 sm:px-4" style={{ borderColor: 'var(--border-soft)' }}>
      <div className="flex min-w-0 basis-full items-center gap-2 sm:basis-auto sm:flex-1">
        <Link
          href="/documents"
          aria-label="Back to documents"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-[var(--surface-overlay)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} />
        </Link>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled document"
          aria-label="Document title"
          className="min-w-0 flex-1 border-b border-transparent bg-transparent font-heading text-[16px] font-semibold outline-none transition-colors focus:border-[var(--border-default)]"
          style={{ color: 'var(--text-primary)' }}
        />
        <StatusMenu status={status} onChange={onStatusChange} />
        <SaveIndicator state={saveState} lastSavedAt={lastSavedAt} onRetry={onRetrySave} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Select items={caseItems} value={caseId || NO_CASE} onValueChange={(v) => onCaseChange(!v || v === NO_CASE ? '' : (v as string))}>
          <SelectTrigger className="h-8 max-w-[200px] rounded-lg text-[12.5px]" aria-label="Case this document belongs to" title="Case this document belongs to">
            <Briefcase size={14} className="shrink-0" style={{ color: caseId ? 'var(--gold-dark)' : 'var(--text-muted)' }} />
            <span className="min-w-0 truncate">
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {caseItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-lg"
          aria-pressed={panel === 'design'}
          onClick={() => onPanelChange(panel === 'design' ? null : 'design')}
          style={panel === 'design' ? { borderColor: 'var(--gold)', color: 'var(--gold-dark)' } : undefined}
        >
          <Palette size={14} />
          <span className="hidden lg:inline">Design</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={pdfBusy !== null} onClick={onPreview}>
          {pdfBusy === 'preview' ? <Spinner size={13} /> : <Eye size={14} />}
          <span className="hidden lg:inline">Preview</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={pdfBusy !== null} onClick={onDownload}>
          {pdfBusy === 'download' ? <Spinner size={13} /> : <DownloadSimple size={14} />}
          <span className="hidden lg:inline">PDF</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="More actions"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border hover:bg-[var(--surface-overlay)]"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              >
                <DotsThree size={16} weight="bold" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer text-[13px]" onClick={onSaveAsTemplate}>
              <BookmarkSimple size={13} /> Save as template
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-[13px]" style={{ color: 'var(--accent-danger)' }} onClick={onDelete}>
              <Trash size={13} /> Move to bin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          className="h-8 rounded-lg"
          aria-pressed={panel === 'ai'}
          onClick={() => onPanelChange(panel === 'ai' ? null : 'ai')}
          title="AI assistant (Ctrl/Cmd + J)"
        >
          <Sparkle size={14} weight="fill" />
          AI
        </Button>
      </div>
    </div>
  )
}

function StatusMenu({ status, onChange }: { status: DocumentStatus; onChange: (s: DocumentStatus) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button type="button" className="inline-flex shrink-0 cursor-pointer items-center gap-0.5" aria-label={`Status: ${STATUS_META[status].label}`}>
            <StatusBadge status={status} />
            <CaretDown size={11} style={{ color: 'var(--text-muted)' }} />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-60">
        {DOCUMENT_STATUSES.map((s) => (
          <DropdownMenuItem key={s} className="cursor-pointer items-start py-2" onClick={() => onChange(s)}>
            <span className="mt-0.5 w-[13px]">{s === status && <CheckCircle size={13} weight="fill" />}</span>
            <span>
              <span className="block text-[13px] font-medium">{STATUS_META[s].label}</span>
              <span className="block text-[11.5px]" style={{ color: 'var(--text-muted)' }}>{STATUS_META[s].hint}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SaveIndicator({ state, lastSavedAt, onRetry }: { state: SaveState; lastSavedAt: number | null; onRetry: () => void }) {
  // Re-render every 30s so "Saved 2 min ago" stays true.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  if (state === 'error') {
    return (
      <button type="button" onClick={onRetry} className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-[11.5px] font-medium" style={{ color: '#C0392B' }}>
        <CloudSlash size={14} /> Not saved. Retry
      </button>
    )
  }
  const label =
    state === 'saving' ? 'Saving...' : state === 'pending' ? 'Unsaved changes' : lastSavedAt ? `Saved ${relativeTime(new Date(lastSavedAt).toISOString(), now)}` : 'All changes saved'
  return (
    <span className="hidden shrink-0 items-center gap-1 text-[11.5px] md:inline-flex" style={{ color: 'var(--text-muted)' }} aria-live="polite">
      {state === 'saving' ? <Spinner size={11} /> : <CloudCheck size={14} />}
      {label}
    </span>
  )
}
