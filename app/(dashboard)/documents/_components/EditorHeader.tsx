'use client'

import { Download, FileText, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/shared/Spinner'

/**
 * Editor card header. Inline-editable title on the left, optional
 * court/suit-number meta in the middle, and Export / Print / Save
 * actions on the right. Save label and disabled state depend on
 * whether we're editing an existing draft.
 */
export function EditorHeader({
  draftTitle,
  onTitleChange,
  court,
  suitNumber,
  isEditing,
  isSaving,
  onExport,
  onPrint,
  onSave,
}: {
  draftTitle: string
  onTitleChange: (v: string) => void
  court: string
  suitNumber: string
  isEditing: boolean
  isSaving: boolean
  onExport: () => void
  onPrint: () => void
  onSave: () => void
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-5 py-3 border-b shrink-0"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <FileText
          size={16}
          strokeWidth={1.75}
          style={{ color: 'var(--text-muted)' }}
          className="shrink-0"
        />
        <input
          value={draftTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled document"
          className="flex-1 min-w-0 font-heading text-[15px] font-semibold bg-transparent outline-none border-b border-transparent focus:border-[var(--border-default)] transition-colors"
          style={{ color: 'var(--text-primary)' }}
        />
        {(court || suitNumber) && (
          <div className="flex items-center gap-2 shrink-0">
            {court && (
              <span
                className="text-[11.5px] px-2 py-0.5 rounded-md"
                style={{
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-secondary)',
                }}
              >
                {court.split('(')[0].trim()}
              </span>
            )}
            {suitNumber && (
              <span
                className="font-mono text-[11px] tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                {suitNumber}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download size={13} strokeWidth={1.75} />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={onPrint}>
          <Printer size={13} strokeWidth={1.75} />
          Print
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Spinner size={13} /> Saving…
            </>
          ) : (
            isEditing ? 'Save changes' : 'Save draft'
          )}
        </Button>
      </div>
    </div>
  )
}
