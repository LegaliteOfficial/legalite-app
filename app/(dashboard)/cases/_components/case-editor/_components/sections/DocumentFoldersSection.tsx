'use client'

import { Plus, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '../primitives/FieldLabel'
import { NativeSelect } from '../primitives/NativeSelect'
import { DOC_CATEGORIES } from '../../_constants'
import type { DocFolderDraft, NewCaseForm, SetField } from '../../_types'

/**
 * Folder structure spawned on case open. Each row binds a folder name
 * to a category from DOC_CATEGORIES; the firm-settings screen will let
 * firms edit that list per practice area down the road.
 */
export function DocumentFoldersSection({
  form,
  setField,
}: {
  form: NewCaseForm
  setField: SetField
}) {
  const updateFolder = (id: string, patch: Partial<DocFolderDraft>) =>
    setField(
      'document_folders',
      form.document_folders.map((f) =>
        f.id === id ? { ...f, ...patch } : f,
      ),
    )
  const removeFolder = (id: string) =>
    setField(
      'document_folders',
      form.document_folders.filter((f) => f.id !== id),
    )
  const addFolder = () =>
    setField('document_folders', [
      ...form.document_folders,
      { id: crypto.randomUUID(), name: '', category: '' },
    ])

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {form.document_folders.map((folder, idx) => (
          <div
            key={folder.id}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-end"
          >
            <div>
              {idx === 0 && <FieldLabel>Folder name</FieldLabel>}
              <Input
                value={folder.name}
                onChange={(e) =>
                  updateFolder(folder.id, { name: e.target.value })
                }
                placeholder="e.g. Court filings"
                className="h-10 rounded-lg text-[13px]"
                style={{ borderColor: 'var(--border-default)' }}
              />
            </div>
            <div>
              {idx === 0 && <FieldLabel>Category</FieldLabel>}
              <NativeSelect
                value={folder.category}
                onChange={(v) => updateFolder(folder.id, { category: v })}
                placeholder="Find a document category"
                options={DOC_CATEGORIES}
              />
            </div>
            <button
              type="button"
              onClick={() => removeFolder(folder.id)}
              className="p-1.5 rounded-md transition-colors cursor-pointer self-end mb-1"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
                e.currentTarget.style.color = '#C0392B'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
              aria-label="Remove document folder"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addFolder}>
        <Plus size={13} strokeWidth={2} />
        Add a document folder
      </Button>
    </div>
  )
}
