'use client'

/**
 * Tag settings dialog
 * -------------------
 * Mirrors the the standard pattern "Tag settings" modal: a description, a colour + name
 * input for creating new tags, and a list of existing tags with edit /
 * delete affordances. Persists via the local tags store (Zustand) until
 * the backend ships a tags table.
 *
 * Triggered from both the /cases toolbar's "Manage tags" button and from
 * the inline "Manage tags" link inside the TagsField on /cases/new.
 */

import { useEffect, useState } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { Check, Pencil, Plus, Tag as TagIcon, Trash, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  TAG_COLOURS,
  useTagsStore,
  type Tag,
} from '@/stores/tags.store'

export function TagSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const tags = useTagsStore((s) => s.tags)
  const addTag = useTagsStore((s) => s.addTag)
  const updateTag = useTagsStore((s) => s.updateTag)
  const removeTag = useTagsStore((s) => s.removeTag)

  const [name, setName] = useState('')
  const [colour, setColour] = useState<string>(TAG_COLOURS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColour, setEditColour] = useState<string>(TAG_COLOURS[0])

  // Reset the create-tag inputs every time the dialog opens so the
  // previous draft doesn't reappear two sessions later.
  useEffect(() => {
    if (open) {
      setName('')
      setColour(TAG_COLOURS[0])
      setEditingId(null)
    }
  }, [open])

  const handleCreate = () => {
    const created = addTag(name, colour)
    if (!created) return
    setName('')
    setColour(TAG_COLOURS[0])
  }

  const beginEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColour(tag.color)
  }
  const saveEdit = () => {
    if (!editingId) return
    const trimmed = editName.trim()
    if (!trimmed) return
    updateTag(editingId, { name: trimmed, color: editColour })
    setEditingId(null)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-40 data-[open]:animate-in data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:fade-out-0"
          style={{ background: 'rgba(13,27,42,0.32)', backdropFilter: 'blur(4px)' }}
        />
        <DialogPrimitive.Popup
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[560px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)] flex flex-col rounded-2xl border outline-none data-[open]:animate-in data-[open]:fade-in-0 data-[open]:zoom-in-95 data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-soft)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <DialogPrimitive.Title
              className="text-[16px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Tag settings
            </DialogPrimitive.Title>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-md transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
              aria-label="Close tag settings"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <p
              className="text-[13px] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Tags help you categorize and locate cases and contacts. Using
              shorter tags and keeping the number of total tags your firm uses
              to a minimum will make this categorization more effective.
            </p>

            {/* Create new tag */}
            <div>
              <div
                className="text-[13px] font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Create new tag
              </div>
              <div className="flex items-center gap-2">
                <ColourSwatchPicker value={colour} onChange={setColour} />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) {
                      e.preventDefault()
                      handleCreate()
                    }
                  }}
                  placeholder="Name your new tag"
                  className="h-10 rounded-lg text-[13px] flex-1"
                  style={{ borderColor: 'var(--border-default)' }}
                />
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!name.trim()}
                >
                  Create tag
                </Button>
              </div>
            </div>

            {/* Manage existing tags */}
            <div>
              <div
                className="text-[13px] font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Manage existing tags
              </div>
              {tags.length === 0 ? (
                <div
                  className="rounded-xl border-2 border-dashed px-5 py-6 text-center"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <TagIcon
                    size={18}
                    strokeWidth={1.5}
                    className="mx-auto mb-2"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <p
                    className="text-[12.5px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No tags yet. Create your first tag above.
                  </p>
                </div>
              ) : (
                <ul
                  className="rounded-xl border divide-y"
                  style={{
                    borderColor: 'var(--border-soft)',
                    background: 'var(--surface-card)',
                  }}
                >
                  {tags.map((tag) => (
                    <li
                      key={tag.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                      style={{ borderColor: 'var(--border-soft)' }}
                    >
                      {editingId === tag.id ? (
                        <>
                          <ColourSwatchPicker
                            value={editColour}
                            onChange={setEditColour}
                            compact
                          />
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                saveEdit()
                              }
                              if (e.key === 'Escape') {
                                setEditingId(null)
                              }
                            }}
                            autoFocus
                            className="h-9 rounded-lg text-[13px] flex-1"
                            style={{ borderColor: 'var(--border-default)' }}
                          />
                          <Button size="sm" onClick={saveEdit}>
                            <Check size={13} strokeWidth={2} />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0"
                            style={{ background: tag.color }}
                            aria-hidden
                          />
                          <span
                            className="flex-1 text-[13px] font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {tag.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => beginEdit(tag)}
                            className="p-1.5 rounded-md transition-colors cursor-pointer"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--surface-sunken)'
                              e.currentTarget.style.color = 'var(--text-primary)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = 'var(--text-muted)'
                            }}
                            aria-label={`Edit tag ${tag.name}`}
                          >
                            <Pencil size={13} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeTag(tag.id)}
                            className="p-1.5 rounded-md transition-colors cursor-pointer"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(192, 57, 43, 0.08)'
                              e.currentTarget.style.color = '#C0392B'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = 'var(--text-muted)'
                            }}
                            aria-label={`Delete tag ${tag.name}`}
                          >
                            <Trash size={13} strokeWidth={1.75} />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-2 px-6 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function ColourSwatchPicker({
  value,
  onChange,
  compact = false,
}: {
  value: string
  onChange: (next: string) => void
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const size = compact ? 'w-7 h-7' : 'w-10 h-10'
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${size} rounded-full border-2 transition-transform cursor-pointer hover:scale-105`}
        style={{
          background: value,
          borderColor: 'var(--surface-card)',
          boxShadow: `0 0 0 1px var(--border-default), 0 1px 2px rgba(0,0,0,0.06)`,
        }}
        aria-label="Choose tag colour"
      />
      {open && (
        <>
          {/* Click-outside catcher — invisible full-screen overlay that
              closes the popover. Cheaper than wiring up a real outside-
              click hook for this dialog-local control. */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute z-20 top-full left-0 mt-2 grid grid-cols-4 gap-2 p-2 rounded-xl border"
            style={{
              background: 'var(--surface-card)',
              borderColor: 'var(--border-default)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {TAG_COLOURS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c)
                  setOpen(false)
                }}
                className="w-7 h-7 rounded-full transition-transform cursor-pointer hover:scale-110"
                style={{
                  background: c,
                  boxShadow:
                    c === value
                      ? `0 0 0 2px var(--surface-card), 0 0 0 4px ${c}`
                      : '0 1px 2px rgba(0,0,0,0.08)',
                }}
                aria-label={`Pick colour ${c}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
