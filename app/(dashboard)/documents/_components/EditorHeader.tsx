'use client'

import { useMemo } from 'react'
import { BookmarkSimple, Briefcase, DownloadSimple, Eye, FileText, Palette } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/shared/Spinner'
import type { Case } from '@/types'

/** Select value for "not linked" (Select items need a non-empty value). */
const NO_CASE = '__none__'

/**
 * Studio header: inline-editable title and court meta on the left; the
 * case link, design toggle, PDF preview/download and save actions on the
 * right. The case picker decides which case the draft is saved to.
 */
export function EditorHeader({
  draftTitle,
  onTitleChange,
  court,
  suitNumber,
  isEditing,
  isSaving,
  designOpen,
  onToggleDesign,
  pdfBusy,
  onPreview,
  onDownload,
  onSaveAsTemplate,
  onSave,
  cases,
  caseId,
  onCaseChange,
}: {
  draftTitle: string
  onTitleChange: (v: string) => void
  court: string
  suitNumber: string
  isEditing: boolean
  isSaving: boolean
  designOpen: boolean
  onToggleDesign: () => void
  pdfBusy: 'preview' | 'download' | null
  onPreview: () => void
  onDownload: () => void
  onSaveAsTemplate: () => void
  onSave: () => void
  cases: Case[]
  caseId: string
  onCaseChange: (id: string) => void
}) {
  const caseItems = useMemo(
    () => [
      { value: NO_CASE, label: 'No case' },
      ...cases.map((c) => ({ value: c.id, label: c.client_name ? `${c.title} · ${c.client_name}` : c.title })),
    ],
    [cases],
  )
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3" style={{ borderColor: 'var(--border-soft)' }}>
      <div className="flex min-w-0 basis-full items-center gap-3 sm:min-w-[220px] sm:basis-auto sm:flex-1">
        <FileText size={16} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
        <input
          value={draftTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled document"
          aria-label="Document title"
          className="min-w-0 flex-1 border-b border-transparent bg-transparent font-heading text-[15px] font-semibold outline-none transition-colors focus:border-[var(--border-default)]"
          style={{ color: 'var(--text-primary)' }}
        />
        {[court, suitNumber].filter(Boolean).map((meta) => (
          <span
            key={meta}
            className="hidden shrink-0 rounded-md px-2 py-0.5 text-[11.5px] xl:inline"
            style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}
          >
            {meta}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Select
          items={caseItems}
          value={caseId || NO_CASE}
          onValueChange={(v) => onCaseChange(!v || v === NO_CASE ? '' : (v as string))}
        >
          <SelectTrigger
            className="h-8 max-w-[220px] rounded-lg text-[12.5px]"
            aria-label="Case this draft is saved to"
            title="Case this draft is saved to"
          >
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
          aria-pressed={designOpen}
          onClick={onToggleDesign}
          style={designOpen ? { borderColor: 'var(--gold)', color: 'var(--gold-dark)' } : undefined}
        >
          <Palette size={14} />
          <span className="hidden sm:inline">Design</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={pdfBusy !== null} onClick={onPreview}>
          {pdfBusy === 'preview' ? <Spinner size={13} /> : <Eye size={14} />}
          <span className="hidden sm:inline">Preview</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={pdfBusy !== null} onClick={onDownload}>
          {pdfBusy === 'download' ? <Spinner size={13} /> : <DownloadSimple size={14} />}
          <span className="hidden sm:inline">Download PDF</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={isSaving} onClick={onSaveAsTemplate}>
          <BookmarkSimple size={14} />
          <span className="hidden sm:inline">Save as template</span>
        </Button>
        <Button size="sm" className="h-8 rounded-lg" disabled={isSaving} onClick={onSave}>
          {isSaving ? <><Spinner size={13} /> Saving</> : isEditing ? 'Save changes' : 'Save draft'}
        </Button>
      </div>
    </div>
  )
}
