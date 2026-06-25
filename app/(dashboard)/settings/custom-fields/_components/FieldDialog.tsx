'use client'

import { useEffect, useState } from 'react'
import { Plus, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCustomFieldsStore,
  type CustomField,
  type FieldEntity,
  type FieldType,
} from '@/stores/custom-fields-local.store'
import { ENTITY_LABEL, FIELD_TYPES } from '../_constants'

interface FieldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The field being edited, or null when creating. */
  field: CustomField | null
}

type EditorState = {
  label: string
  entity: FieldEntity
  type: FieldType
  options: string[]
  required: boolean
  helpText: string
}

const BLANK: EditorState = {
  label: '',
  entity: 'client',
  type: 'text',
  options: [],
  required: false,
  helpText: '',
}

export function FieldDialog({ open, onOpenChange, field }: FieldDialogProps) {
  const upsertField = useCustomFieldsStore((s) => s.upsertField)
  const [editor, setEditor] = useState<EditorState>(BLANK)

  // Reset the form whenever the dialog opens — to the field being
  // edited, or a blank slate when creating.
  useEffect(() => {
    if (!open) return
    setEditor(
      field
        ? {
            label: field.label,
            entity: field.entity,
            type: field.type,
            options: field.options,
            required: field.required,
            helpText: field.helpText ?? '',
          }
        : BLANK,
    )
  }, [open, field])

  const patch = (next: Partial<EditorState>) =>
    setEditor((prev) => ({ ...prev, ...next }))

  const updateOption = (i: number, value: string) =>
    patch({ options: editor.options.map((o, idx) => (idx === i ? value : o)) })
  const addOption = () => patch({ options: [...editor.options, ''] })
  const removeOption = (i: number) =>
    patch({ options: editor.options.filter((_, idx) => idx !== i) })

  const handleSave = () => {
    const label = editor.label.trim()
    if (!label) {
      toast.error('Give the field a name.')
      return
    }

    let options: string[] = []
    if (editor.type === 'select') {
      options = editor.options.map((o) => o.trim()).filter(Boolean)
      if (options.length < 2) {
        toast.error('A dropdown needs at least two options.')
        return
      }
    }

    const saved = upsertField({
      id: field?.id,
      label,
      entity: editor.entity,
      type: editor.type,
      options,
      required: editor.required,
      helpText: editor.helpText.trim() || null,
      active: field?.active ?? true,
    })

    toast.success(
      field ? `Updated “${saved.label}”.` : `Added “${saved.label}”.`,
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {field ? 'Edit custom field' : 'New custom field'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="cf-label">Field name</Label>
            <Input
              id="cf-label"
              value={editor.label}
              onChange={(e) => patch({ label: e.target.value })}
              placeholder="e.g. Ghana Card number"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Applies to</Label>
              <Select
                value={editor.entity}
                onValueChange={(v) => v && patch({ entity: v as FieldEntity })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ENTITY_LABEL) as FieldEntity[]).map((e) => (
                    <SelectItem key={e} value={e}>
                      {ENTITY_LABEL[e]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Field type</Label>
              <Select
                value={editor.type}
                onValueChange={(v) =>
                  v &&
                  patch({
                    type: v as FieldType,
                    // Seed two empty option rows when switching to a
                    // dropdown so the user has somewhere to type.
                    options:
                      v === 'select' && editor.options.length === 0
                        ? ['', '']
                        : editor.options,
                  })
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {editor.type === 'select' && (
            <div className="space-y-2">
              <Label>Dropdown options</Label>
              <div className="space-y-2">
                {editor.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      aria-label={`Remove option ${i + 1}`}
                      className="h-9 w-9 shrink-0 rounded-md border flex items-center justify-center transition-colors hover:bg-black/[0.03]"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ color: 'var(--gold-dark)' }}
              >
                <Plus size={14} strokeWidth={2.5} /> Add option
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="cf-help">Help text (optional)</Label>
            <Textarea
              id="cf-help"
              value={editor.helpText}
              onChange={(e) => patch({ helpText: e.target.value })}
              placeholder="A short hint shown under the field."
              rows={2}
            />
          </div>

          <button
            type="button"
            onClick={() => patch({ required: !editor.required })}
            className="flex w-full items-center justify-between rounded-lg border px-3.5 py-3 text-left transition-colors hover:bg-black/[0.02]"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-sm">
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Required field
              </span>
              <span className="block text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                The record can’t be saved without a value.
              </span>
            </span>
            <ToggleSwitch on={editor.required} />
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            style={{ background: 'var(--gold)', color: 'white' }}
          >
            {field ? 'Save changes' : 'Create field'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Read-only visual switch — the parent button owns the click. */
function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <span
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
      style={{ background: on ? 'var(--gold)' : 'var(--border-strong)' }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        style={{ transform: on ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </span>
  )
}
