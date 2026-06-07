'use client'

/**
 * TaskComposerDialog
 * ------------------
 * Create / edit a task, wired to the GraphQL backend. A task can be
 * assigned to one or more firm members (MemberPicker); each assignee is
 * emailed when the task is assigned to them, and any reminders configured
 * here fire as emails to all assignees ahead of the due date (handled by
 * the task-reminders cron on the backend).
 *
 * Fields (in render order):
 *   - Title              (required)
 *   - Notes              (textarea)
 *   - Priority           (segmented: High / Medium / Low)
 *   - Due date + time    (split inputs)
 *   - Assignees          (firm-member multi-select)
 *   - Reminders          (offset rows — email, relative to the due date)
 *   - Linked case        (optional, select from useCases())
 */

import { useEffect, useState } from 'react'
import { Bell, Briefcase, Check, Plus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  FormDrawer,
  FormDrawerBody,
  FormDrawerFooter,
  FormDrawerHeader,
} from '@/components/ui/form-drawer'
import { useCases } from '@/hooks/use-cases'
import { useFirmMembers } from '@/hooks/use-firm-members'
import { useAuthStore } from '@/stores/auth.store'
import {
  TASK_REMINDER_PRESETS,
  useCreateTask,
  useUpdateTask,
  type Task,
} from '@/hooks/use-tasks'
import { MemberPicker, type PickedMember } from '@/components/shared/MemberPicker'

type TaskPriority = 'High' | 'Medium' | 'Low'
type TaskStatus = 'Pending' | 'In Progress' | 'Done'

interface TaskComposerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-fill the form with an existing task to switch to edit mode. */
  editing?: Task | null
  /** Lane the new task lands in when created from a specific column. */
  defaultStatus?: TaskStatus
}

interface ReminderRow {
  id: string
  minutes: number
}

const PRIORITY_OPTIONS: TaskPriority[] = ['High', 'Medium', 'Low']

const PRIORITY_STYLE: Record<TaskPriority, { color: string; bg: string }> = {
  High: { color: 'var(--accent-danger, #C0392B)', bg: 'rgba(192, 57, 43, 0.12)' },
  Medium: {
    color: 'var(--accent-today, #C9972B)',
    bg: 'var(--accent-today-tint, rgba(201, 151, 43, 0.12))',
  },
  Low: {
    color: 'var(--text-secondary, #6B7280)',
    bg: 'var(--surface-sunken, rgba(0,0,0,0.04))',
  },
}

function newRowId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Default due-at — tomorrow 9am local. */
function defaultDueAt(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d.toISOString()
}

/** ISO -> { date: "YYYY-MM-DD", time: "HH:MM" } for the split inputs. */
function splitDueAt(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: '', time: '' }
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

/** Combine date + time back into an ISO string (null when no date). */
function joinDueAt(date: string, time: string): string | null {
  if (!date) return null
  const candidate = new Date(`${date}T${time || '09:00'}:00`)
  if (Number.isNaN(candidate.getTime())) return null
  return candidate.toISOString()
}

export function TaskComposerDialog({
  open,
  onOpenChange,
  editing,
  defaultStatus = 'Pending',
}: TaskComposerDialogProps) {
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const { data: cases } = useCases()
  const { data: members } = useFirmMembers()
  const currentUserId = useAuthStore((s) => s.user?.id)

  // ── Form state ──────────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [assignees, setAssignees] = useState<PickedMember[]>([])
  const [reminders, setReminders] = useState<ReminderRow[]>([])
  const [caseId, setCaseId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // The signed-in user as a member (default assignee in create mode).
  const selfMember = (members ?? []).find(
    (m) => m.profile_id === currentUserId && m.status === 'active',
  )

  useEffect(() => {
    if (!open) return
    if (editing) {
      const { date: d, time: t } = splitDueAt(editing.due_date)
      setTitle(editing.title)
      setNotes(editing.notes ?? '')
      setPriority((editing.priority as TaskPriority) ?? 'Medium')
      setDate(d)
      setTime(t)
      setAssignees(
        editing.assignees.map((a) => ({
          id: a.member_id,
          name: a.name,
          title: a.professional_title,
        })),
      )
      setReminders(
        editing.reminders.map((r) => ({ id: newRowId(), minutes: r.minutes_before })),
      )
      setCaseId(editing.case_id ?? '')
    } else {
      const def = splitDueAt(defaultDueAt())
      setTitle('')
      setNotes('')
      setPriority('Medium')
      setDate(def.date)
      setTime(def.time)
      setAssignees(
        selfMember
          ? [{ id: selfMember.id, name: selfMember.name, title: selfMember.professional_title }]
          : [],
      )
      setReminders([])
      setCaseId('')
    }
    setSubmitting(false)
    // selfMember resolves async — the seed effect below back-fills it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  // Create mode: once members load, ensure the signed-in user is seeded.
  useEffect(() => {
    if (!open || editing || !selfMember) return
    setAssignees((prev) =>
      prev.some((p) => p.id === selfMember.id)
        ? prev
        : [{ id: selfMember.id, name: selfMember.name, title: selfMember.professional_title }, ...prev],
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, selfMember?.id])

  const isEditMode = !!editing
  const canSave = title.trim().length > 0 && !submitting

  const addReminder = () =>
    setReminders((prev) => [...prev, { id: newRowId(), minutes: 1440 }])
  const updateReminder = (id: string, minutes: number) =>
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, minutes } : r)))
  const removeReminder = (id: string) =>
    setReminders((prev) => prev.filter((r) => r.id !== id))

  const handleSave = async () => {
    if (!canSave) return
    setSubmitting(true)
    try {
      const due = joinDueAt(date, time)
      const input = {
        title: title.trim(),
        notes: notes.trim() || undefined,
        status: editing?.status ?? defaultStatus,
        priority,
        due_date: due ?? undefined,
        case_id: caseId || undefined,
        assignee_member_ids: assignees.map((a) => a.id),
        reminders: reminders.map((r) => ({ minutes_before: r.minutes, method: 'email' })),
      }

      if (editing) {
        await updateTask.mutateAsync({ id: editing.id, data: input })
      } else {
        await createTask.mutateAsync(input)
      }

      const bits = [
        assignees.length > 0
          ? `${assignees.length} assignee${assignees.length === 1 ? '' : 's'}`
          : null,
        reminders.length > 0
          ? `${reminders.length} reminder${reminders.length === 1 ? '' : 's'}`
          : null,
      ].filter(Boolean)
      const tail = bits.length ? ` · ${bits.join(' · ')}` : ''
      toast.success(
        editing ? `Updated “${input.title}”${tail}` : `Added “${input.title}”${tail}`,
      )
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error ? `Couldn't save: ${err.message}` : 'Failed to save task.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} size="md">
      <FormDrawerHeader
        title={isEditMode ? 'Edit task' : 'New task'}
        description={
          isEditMode
            ? 'Update the task, assignees and reminders below.'
            : 'Capture the next thing that needs doing — assign it to teammates and they’ll be emailed.'
        }
        onClose={() => onOpenChange(false)}
      />
      <FormDrawerBody className="space-y-0">
        <div className="grid gap-4">
          {/* Title */}
          <div className="grid gap-1.5">
            <Label htmlFor="task-title" className="text-[13px]">
              Title <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Draft Mensah affidavit"
              autoFocus
            />
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label htmlFor="task-notes" className="text-[13px]">
              Notes
            </Label>
            <Textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Context, references, sub-steps…"
              rows={4}
            />
          </div>

          {/* Priority */}
          <div className="grid gap-1.5">
            <Label className="text-[13px]">Priority</Label>
            <div
              className="inline-flex rounded-md p-0.5 self-start"
              style={{ background: 'var(--surface-sunken)' }}
              role="radiogroup"
              aria-label="Priority"
            >
              {PRIORITY_OPTIONS.map((p) => {
                const active = priority === p
                const style = PRIORITY_STYLE[p]
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPriority(p)}
                    className="inline-flex items-center gap-1.5 h-7 px-3 rounded text-[12.5px] font-medium cursor-pointer"
                    style={{
                      background: active ? style.bg : 'transparent',
                      color: active ? style.color : 'var(--text-secondary)',
                    }}
                  >
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: style.color }}
                    />
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Due date + time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="task-date" className="text-[13px]">
                Due date
              </Label>
              <Input
                id="task-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-time" className="text-[13px]">
                Due time
              </Label>
              <Input
                id="task-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={!date}
              />
            </div>
          </div>

          {/* Assignees */}
          <div className="grid gap-1.5">
            <Label className="text-[13px] inline-flex items-center gap-1.5">
              <Users size={12} strokeWidth={1.75} />
              Assignees
            </Label>
            <MemberPicker value={assignees} onChange={setAssignees} />
            <p className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
              Each assignee is emailed when the task is assigned to them.
            </p>
          </div>

          {/* Reminders */}
          <div className="grid gap-1.5">
            <Label className="text-[13px] inline-flex items-center gap-1.5">
              <Bell size={12} strokeWidth={1.75} />
              Reminders
            </Label>
            <div className="space-y-2">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg border p-2"
                  style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-card)' }}
                >
                  <select
                    value={r.minutes}
                    onChange={(e) => updateReminder(r.id, Number(e.target.value))}
                    className="flex-1 h-9 rounded-lg border px-3 text-[13px] bg-transparent cursor-pointer"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  >
                    {TASK_REMINDER_PRESETS.map((p) => (
                      <option key={p.minutes} value={p.minutes}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11.5px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                    Email
                  </span>
                  <button
                    type="button"
                    onClick={() => removeReminder(r.id)}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Remove reminder"
                  >
                    <X size={13} strokeWidth={1.75} />
                  </button>
                </div>
              ))}
              {reminders.length === 0 && (
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {date
                    ? 'No reminders set. Add one to email assignees before the due date.'
                    : 'Pick a due date to schedule email reminders.'}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={addReminder}
              disabled={!date}
              className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] font-medium cursor-pointer self-start disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: 'var(--gold-dark)' }}
            >
              <Plus size={13} strokeWidth={2} />
              Add reminder
            </button>
          </div>

          {/* Linked case */}
          <div className="grid gap-1.5">
            <Label htmlFor="task-case" className="text-[13px] inline-flex items-center gap-1.5">
              <Briefcase size={12} strokeWidth={1.75} />
              Linked case (optional)
            </Label>
            <select
              id="task-case"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="h-9 rounded-md border px-2 text-[13px] bg-transparent"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <option value="">No linked case</option>
              {(cases ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormDrawerBody>
      <FormDrawerFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!canSave}>
          <Check size={13} strokeWidth={2} />
          {submitting ? 'Saving…' : isEditMode ? 'Save changes' : 'Add task'}
        </Button>
      </FormDrawerFooter>
    </FormDrawer>
  )
}
