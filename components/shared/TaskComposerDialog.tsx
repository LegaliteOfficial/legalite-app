'use client'

/**
 * TaskComposerDialog
 * ------------------
 * Slim, focused dialog used by the Tasks page to create or edit a
 * task. Replaces the legacy TaskForm modal so the new kanban can
 * surface labels and reminder presets without dragging the older
 * form's wider scope along.
 *
 * Fields (in render order):
 *   - Title              (required)
 *   - Notes              (textarea, multi-line markdown-light)
 *   - Priority           (segmented control: High / Medium / Low)
 *   - Due date + time    (split inputs — defaults to "tomorrow 9am")
 *   - Labels             (chip input with autocomplete from the
 *                         shared label palette; new labels get
 *                         deterministically coloured)
 *   - Reminder           (preset dropdown: None / 15m / 1h / 1d / 3d)
 *   - Linked case        (optional, select from useCases())
 *
 * Save writes through `useTasksLocalStore` so the kanban re-renders
 * immediately. When the GraphQL backend ships, swap the
 * mutate-store call for the matching mutation; the dialog's prop
 * shape doesn't need to change.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Briefcase,
  Check,
  Plus,
  X,
} from 'lucide-react'
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
import { useCases } from '@/hooks/use-cases'
import {
  colorForLabelName,
  REMINDER_OFFSET_OPTIONS,
  useTasksLocalStore,
  type LocalTask,
  type ReminderOffsetKey,
  type TaskLabel,
  type TaskPriority,
} from '@/stores/tasks-local.store'

interface TaskComposerDialogProps {
  /** Controlled open state. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-fill the form with an existing task to switch to edit mode. */
  editing?: LocalTask | null
  /**
   * Optional default status — used when the user clicks "Add task"
   * from inside a specific lane so the new task lands there.
   */
  defaultStatus?: LocalTask['status']
}

const PRIORITY_OPTIONS: TaskPriority[] = ['High', 'Medium', 'Low']

const PRIORITY_STYLE: Record<TaskPriority, { color: string; bg: string }> = {
  High: {
    color: 'var(--accent-danger, #C0392B)',
    bg: 'rgba(192, 57, 43, 0.12)',
  },
  Medium: {
    color: 'var(--accent-today, #C9972B)',
    bg: 'var(--accent-today-tint, rgba(201, 151, 43, 0.12))',
  },
  Low: {
    color: 'var(--text-secondary, #6B7280)',
    bg: 'var(--surface-sunken, rgba(0,0,0,0.04))',
  },
}

/**
 * Default due-at — tomorrow 9 am local. Set once when the dialog
 * opens for create mode so opening / closing without saving doesn't
 * keep advancing the default.
 */
function defaultDueAt(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d.toISOString()
}

/** Format ISO -> "YYYY-MM-DD" + "HH:MM" pair for the split inputs. */
function splitDueAt(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: '', time: '' }
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

/** Combine the date + time inputs back into an ISO string. */
function joinDueAt(date: string, time: string): string | null {
  if (!date) return null
  const t = time || '09:00'
  const candidate = new Date(`${date}T${t}:00`)
  if (Number.isNaN(candidate.getTime())) return null
  return candidate.toISOString()
}

export function TaskComposerDialog({
  open,
  onOpenChange,
  editing,
  defaultStatus = 'Pending',
}: TaskComposerDialogProps) {
  const createTask = useTasksLocalStore((s) => s.createTask)
  const updateTask = useTasksLocalStore((s) => s.updateTask)
  const ensureLabel = useTasksLocalStore((s) => s.ensureLabel)
  // Palette for autocomplete. Re-renders when a new label is added
  // anywhere in the app.
  const labelRevision = useTasksLocalStore((s) => s.revision)
  const allLabels = useMemo(
    () => useTasksLocalStore.getState().labels,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelRevision],
  )

  const { data: cases } = useCases()

  // ── Form state ──────────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [labels, setLabels] = useState<TaskLabel[]>([])
  const [labelDraft, setLabelDraft] = useState('')
  const [reminder, setReminder] = useState<ReminderOffsetKey>('none')
  const [caseId, setCaseId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // Reset / hydrate when the dialog opens. `open` flipping false
  // keeps the last values mounted briefly during the close animation
  // — which is fine because we re-hydrate on the next open.
  useEffect(() => {
    if (!open) return
    if (editing) {
      const { date: d, time: t } = splitDueAt(editing.due_at)
      setTitle(editing.title)
      setNotes(editing.notes ?? '')
      setPriority(editing.priority)
      setDate(d)
      setTime(t)
      setLabels(editing.labels)
      setLabelDraft('')
      setReminder(editing.reminder_offset)
      setCaseId(editing.case_id ?? '')
    } else {
      const def = splitDueAt(defaultDueAt())
      setTitle('')
      setNotes('')
      setPriority('Medium')
      setDate(def.date)
      setTime(def.time)
      setLabels([])
      setLabelDraft('')
      setReminder('none')
      setCaseId('')
    }
    setSubmitting(false)
  }, [open, editing])

  const isEditMode = !!editing
  const canSave = title.trim().length > 0

  // ── Label chip helpers ──────────────────────────────────────────
  /** Commit the current draft to the chip list. Idempotent. */
  const commitLabelDraft = () => {
    const trimmed = labelDraft.trim()
    if (!trimmed) return
    const existing = labels.find(
      (l) => l.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (existing) {
      setLabelDraft('')
      return
    }
    const persisted = ensureLabel(trimmed)
    setLabels((prev) => [...prev, persisted])
    setLabelDraft('')
  }
  const removeLabel = (id: string) =>
    setLabels((prev) => prev.filter((l) => l.id !== id))

  /**
   * Suggestions are palette labels that match the current draft
   * prefix and aren't already on the task. Cap to keep the popover
   * tight.
   */
  const labelSuggestions = useMemo(() => {
    if (!labelDraft.trim()) return []
    const q = labelDraft.trim().toLowerCase()
    return allLabels
      .filter(
        (l) =>
          l.name.toLowerCase().includes(q) &&
          !labels.some((picked) => picked.id === l.id),
      )
      .slice(0, 5)
  }, [allLabels, labelDraft, labels])

  // ── Save ────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!canSave) return
    setSubmitting(true)
    try {
      const due_at = joinDueAt(date, time)
      const payload = {
        title: title.trim(),
        notes: notes.trim() || null,
        status: editing?.status ?? defaultStatus,
        priority,
        due_at,
        reminder_offset: reminder,
        labels,
        case_id: caseId || null,
      }
      if (editing) {
        updateTask(editing.id, payload)
        toast.success(`Updated "${payload.title}".`)
      } else {
        createTask(payload)
        toast.success(`Added "${payload.title}" to ${payload.status}.`)
      }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            {isEditMode ? 'Edit task' : 'New task'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Title */}
          <div className="grid gap-1.5">
            <Label htmlFor="task-title" className="text-[13px]">
              Title{' '}
              <span style={{ color: 'var(--accent-danger)' }}>*</span>
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
                      color: active
                        ? style.color
                        : 'var(--text-secondary)',
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

          {/* Labels */}
          <div className="grid gap-1.5">
            <Label htmlFor="task-labels" className="text-[13px]">
              Labels
            </Label>
            <div
              className="rounded-md border px-2 py-1.5 flex flex-wrap items-center gap-1.5"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
              }}
              onClick={() => document.getElementById('task-labels')?.focus()}
            >
              {labels.map((l) => (
                <span
                  key={l.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-medium"
                  style={{
                    background: `${l.color}1F`, // hex + ~12% alpha
                    color: l.color,
                  }}
                >
                  {l.name}
                  <button
                    type="button"
                    aria-label={`Remove ${l.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeLabel(l.id)
                    }}
                    className="cursor-pointer"
                  >
                    <X size={10} strokeWidth={2.25} />
                  </button>
                </span>
              ))}
              <input
                id="task-labels"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    commitLabelDraft()
                  } else if (
                    e.key === 'Backspace' &&
                    labelDraft === '' &&
                    labels.length > 0
                  ) {
                    // Quick-pop the last chip on backspace if the
                    // draft is empty — feels native for chip inputs.
                    setLabels((prev) => prev.slice(0, -1))
                  }
                }}
                placeholder={labels.length === 0 ? 'Type and press Enter…' : ''}
                className="flex-1 min-w-[80px] bg-transparent outline-none text-[13px]"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
            {labelSuggestions.length > 0 && (
              <div
                className="rounded-md border p-1 flex flex-wrap gap-1"
                style={{
                  borderColor: 'var(--border-soft)',
                  background: 'var(--surface-sunken)',
                }}
              >
                {labelSuggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setLabels((prev) => [...prev, s])
                      setLabelDraft('')
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-medium cursor-pointer"
                    style={{
                      background: 'var(--surface-card)',
                      color: s.color,
                      border: `1px solid ${s.color}33`,
                    }}
                  >
                    <Plus size={9} strokeWidth={2.25} />
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            <p
              className="text-[11.5px]"
              style={{ color: 'var(--text-muted)' }}
            >
              Press Enter or comma to add. Labels colour-key
              automatically across the firm.
            </p>
          </div>

          {/* Reminder */}
          <div className="grid gap-1.5">
            <Label
              htmlFor="task-reminder"
              className="text-[13px] inline-flex items-center gap-1.5"
            >
              <Bell size={12} strokeWidth={1.75} />
              Reminder
            </Label>
            <select
              id="task-reminder"
              value={reminder}
              onChange={(e) =>
                setReminder(e.target.value as ReminderOffsetKey)
              }
              className="h-9 rounded-md border px-2 text-[13px] bg-transparent"
              style={{ borderColor: 'var(--border-default)' }}
              disabled={!date}
            >
              {REMINDER_OFFSET_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            {!date && (
              <p
                className="text-[11.5px]"
                style={{ color: 'var(--text-muted)' }}
              >
                Pick a due date first to enable reminders.
              </p>
            )}
          </div>

          {/* Linked case */}
          <div className="grid gap-1.5">
            <Label
              htmlFor="task-case"
              className="text-[13px] inline-flex items-center gap-1.5"
            >
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

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || submitting}
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          >
            <Check size={13} strokeWidth={2} />
            {isEditMode ? 'Save changes' : 'Add task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
