'use client'

import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { CircleNotch } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialogView } from '@/components/shared/ConfirmDialog'
import { useDeleteArchiveEntry, useUpdateArchiveEntry, type ArchiveEntryDetail } from '@/hooks/use-archive'
import { errorMessage } from '@/lib/errors'
import type { Case } from '@/types'
import { ARCHIVE_TYPE_LABELS } from './archive-meta'

type Entry = NonNullable<ArchiveEntryDetail>

const NO_CASE = 'none'

/** Correct what Legalite read: title, type, case, summary and tags. */
export function EditArchiveEntryDialog({
  entry,
  cases,
  open,
  onClose,
}: {
  entry: Entry
  cases: Case[]
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        {/* Keyed so the form starts from the saved values each time it opens. */}
        {open && <EditForm key={entry.id} entry={entry} cases={cases} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function EditForm({ entry, cases, onDone }: { entry: Entry; cases: Case[]; onDone: () => void }) {
  const update = useUpdateArchiveEntry()
  const [title, setTitle] = useState(entry.title)
  const [type, setType] = useState(entry.document_type ?? 'other')
  const [summary, setSummary] = useState(entry.summary ?? '')
  const [tags, setTags] = useState(entry.tags.join(', '))
  const [caseId, setCaseId] = useState(entry.case_id ?? NO_CASE)

  const typeItems = Object.entries(ARCHIVE_TYPE_LABELS).map(([value, label]) => ({ value, label }))
  const caseItems = [
    { value: NO_CASE, label: 'Not filed under a case' },
    ...cases.map((c) => ({ value: c.id, label: c.title })),
  ]

  const save = async () => {
    if (!title.trim()) {
      toast.error('The title cannot be empty.')
      return
    }
    const id = toast.loading('Saving changes...')
    try {
      await update.mutateAsync(entry.id, {
        title: title.trim(),
        document_type: type,
        summary,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 12),
        case_id: caseId === NO_CASE ? null : caseId,
      })
      toast.success('Archive details updated.', { id })
      onDone()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save the changes.'), { id })
    }
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="font-heading text-lg" style={{ color: 'var(--navy)' }}>
          Edit archive details
        </DialogTitle>
        <DialogDescription>Correct anything Legalite got wrong. The archived text is not changed.</DialogDescription>
      </DialogHeader>
      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type">
          <Select items={typeItems} value={type} onValueChange={(v) => setType((v as string) || 'other')}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeItems.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Case">
          <Select items={caseItems} value={caseId} onValueChange={(v) => setCaseId((v as string) || NO_CASE)}>
            <SelectTrigger className="h-9 w-full">
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
        </Field>
      </div>
      <Field label="Summary">
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} maxLength={4000} />
      </Field>
      <Field label="Tags (comma separated)">
        <Input value={tags} onChange={(e) => setTags(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone} disabled={update.isPending}>
          Cancel
        </Button>
        <Button onClick={() => void save()} disabled={update.isPending}>
          {update.isPending && <CircleNotch className="animate-spin" />} Save changes
        </Button>
      </div>
    </div>
  )
}

/** Confirm removing an entry from the firm archive. */
export function RemoveArchiveEntryDialog({
  entry,
  open,
  onCancel,
  onDone,
}: {
  entry: Entry
  open: boolean
  onCancel: () => void
  onDone: () => void
}) {
  const remove = useDeleteArchiveEntry()
  return (
    <ConfirmDialogView
      open={open}
      tone="danger"
      title="Remove from the firm archive?"
      description={
        <>
          <strong style={{ color: 'var(--navy)' }}>{entry.title}</strong> and its archived content will be removed
          for everyone in the firm. This cannot be undone.
        </>
      }
      details={['A copy in your Legal Library, if there is one, is kept.']}
      confirmLabel="Remove"
      successLabel="Removed"
      onCancel={onCancel}
      onDone={onDone}
      action={async () => {
        try {
          await remove.mutateAsync(entry.id)
          toast.success('Removed from the firm archive.')
        } catch (err) {
          toast.error(errorMessage(err, 'Could not remove it from the archive.'))
          throw err
        }
      }}
    />
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}
