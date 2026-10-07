'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/shared/Spinner'
import { useCases } from '@/hooks/use-cases'
import { useCreateDeadline, useUpdateDeadline, type Deadline } from '@/hooks/use-deadlines'

type DeadlinePriority = Deadline['priority']

interface DeadlineForm {
  title: string
  description: string
  due_date: string
  priority: DeadlinePriority
  case_id: string
  reminder_days: number
}

const EMPTY_FORM: DeadlineForm = {
  title: '',
  description: '',
  due_date: '',
  priority: 'Medium',
  case_id: '',
  reminder_days: 3,
}

function toForm(d: Deadline | null): DeadlineForm {
  if (!d) return EMPTY_FORM
  return {
    title: d.title,
    description: d.description ?? '',
    due_date: d.due_date?.split('T')[0] ?? '',
    priority: d.priority,
    case_id: d.case_id ?? '',
    reminder_days: d.reminder_days ?? 3,
  }
}

/**
 * The parent remounts this dialog (via `key`) each time it opens, so the
 * form state is seeded once from `deadline` instead of synced in an effect.
 */
interface DeadlineFormDialogProps {
  open: boolean
  /** Deadline being edited, or null to create a new one. */
  deadline: Deadline | null
  onClose: () => void
}

export function DeadlineFormDialog({ open, deadline, onClose }: DeadlineFormDialogProps) {
  const [form, setForm] = useState<DeadlineForm>(() => toForm(deadline))
  const { data: cases } = useCases()
  const createMutation = useCreateDeadline()
  const updateMutation = useUpdateDeadline()
  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Please enter a title.'); return }
    if (!form.due_date) { toast.error('Please select a due date.'); return }
    const data = { ...form, case_id: form.case_id || null }
    try {
      if (deadline) {
        await updateMutation.mutateAsync({ id: deadline.id, data })
        toast.success('Deadline updated.')
      } else {
        await createMutation.mutateAsync({ ...data, status: 'Pending' })
        toast.success('Deadline created.')
      }
      onClose()
    } catch {
      toast.error('Unable to save deadline. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg" style={{ color: 'var(--text-primary)' }}>
            {deadline ? 'Edit deadline' : 'New deadline'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. File Statement of Defence"
              className="h-10"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due date">
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                className="h-10"
              />
            </Field>
            <Field label="Priority">
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((p) => ({ ...p, priority: (v ?? 'Medium') as DeadlinePriority }))}
              >
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Linked case">
            <Select value={form.case_id} onValueChange={(v) => setForm((p) => ({ ...p, case_id: v ?? '' }))}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select case" /></SelectTrigger>
              <SelectContent>
                {(cases ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional notes"
              rows={3}
            />
          </Field>
        </div>
        <DialogFooter className="pt-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? <><Spinner size={14} /> Saving</> : deadline ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label
        className="text-[11px] font-medium uppercase tracking-wider mb-1.5 block"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </Label>
      {children}
    </div>
  )
}
