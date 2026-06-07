'use client'

import type { RefObject } from 'react'
import { EditorCanvas } from './EditorCanvas'
import { EditorHeader } from './EditorHeader'
import { EditorToolbar } from './EditorToolbar'

/**
 * Editor tab — the card chrome that hosts the header, formatting
 * toolbar, and document canvas. State + handlers live in the page
 * hook; this component only wires props to its three sub-pieces.
 */
export function EditorTab({
  draftTitle,
  onTitleChange,
  court,
  suitNumber,
  editingDocId,
  isSaving,
  onExport,
  onPrint,
  onSave,
  exec,
  editorRef,
  initialHTML,
  onEditorInput,
}: {
  draftTitle: string
  onTitleChange: (v: string) => void
  court: string
  suitNumber: string
  editingDocId: string | null
  isSaving: boolean
  onExport: () => void
  onPrint: () => void
  onSave: () => void
  exec: (command: string, value?: string) => void
  editorRef: RefObject<HTMLDivElement | null>
  initialHTML: string
  onEditorInput: (html: string) => void
}) {
  return (
    <div
      className="rounded-2xl border flex flex-col overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <EditorHeader
        draftTitle={draftTitle}
        onTitleChange={onTitleChange}
        court={court}
        suitNumber={suitNumber}
        isEditing={!!editingDocId}
        isSaving={isSaving}
        onExport={onExport}
        onPrint={onPrint}
        onSave={onSave}
      />
      <EditorToolbar exec={exec} />
      <EditorCanvas
        ref={editorRef}
        initialHTML={initialHTML}
        onInput={onEditorInput}
      />
    </div>
  )
}
