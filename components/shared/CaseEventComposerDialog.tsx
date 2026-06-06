'use client'

/**
 * CaseEventComposerDialog
 * -----------------------
 * Slim composer used by the case detail page's "Add event" button.
 * Pre-links the event to the case it's opened from, so the user
 * doesn't have to re-pick the case. Lives separately from the
 * weekly-calendar's EventDialog (which is heavier — multi-row
 * reminders, participants, etc.); this one is a single-field
 * focused affordance for adding hearing dates, filings, and
 * meetings straight from a case context.
 *
 * Fields:
 *   - Title              (required, e.g. "Case management conference")
 *   - Date + time        (split inputs; defaults to "tomorrow 9 am")
 *   - Description        (optional textarea)
 *   - Priority           (segmented control — drives the calendar
 *                         badge colour and the High-priority
 *                         reminder window if the user later flags
 *                         the case)
 *
 * Save calls `useCreateDeadline` with the case's id pre-set so the
 * new event surfaces immediately in the case-detail Calendar list
 * and on the weekly calendar's day column. In DEV_BYPASS the
 * mutation short-circuits with a mock record (see hooks/use-deadlines.ts)
 * so the success path runs without a backend.
 */

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
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
import { useCreateCalendarEvent } from '@/hooks/use-calendar'

type Priority = 'High' | 'Medium' | 'Low'

const PRIORITY_OPTIONS: Priority[] = ['High', 'Medium', 'Low']

const PRIORITY_STYLE: Record<Priority, { color: string; bg: string }> = {
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

interface CaseEventComposerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseId: string
  /** Used for the toast confirmation + dialog header context. */
  caseTitle: string
  /**
   * Optional success callback so the parent can refetch the
   * deadlines query and re-render the Calendar section without
   * waiting for a refetchQueries round-trip.
   */
  onSaved?: () => void
}

/** Tomorrow 9 am local as the default due-at. */
function defaultDueAt(): { date: string; time: string } {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

export function CaseEventComposerDialog({
  open,
  onOpenChange,
  caseId,
  caseTitle,
  onSaved,
}: CaseEventComposerDialogProps) {
  const createMutation = useCreateCalendarEvent()

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [submitting, setSubmitting] = useState(false)

  // Reset to a fresh default every time the dialog opens. Doing
  // this in an effect (not at useState init) keeps the default
  // "tomorrow" snapping to the actual moment of open rather than
  // the moment of first mount.
  useEffect(() => {
    if (!open) return
    const def = defaultDueAt()
    setTitle('')
    setDate(def.date)
    setTime(def.time)
    setDescription('')
    setPriority('Medium')
    setSubmitting(false)
  }, [open])

  const canSave = title.trim().length > 0 && date.length > 0

  const handleSave = async () => {
    if (!canSave) return
    setSubmitting(true)
    try {
      const t = time || '09:00'
      const start = new Date(`${date}T${t}:00`)
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: start.toISOString(),
        end_time: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
        event_type: 'meeting',
        // Pre-link the event to this case.
        case_id: caseId,
        // No reminder by default — the user can add one via the calendar.
      })
      toast.success(
        `Added "${title.trim()}" to ${caseTitle || 'the case'}.`,
      )
      onSaved?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Couldn't add event: ${err.message}`
          : 'Failed to add event. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            Add event
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Linked-case context — read-only, makes it obvious which
              case this event will land on. */}
          <div
            className="rounded-md px-3 py-2 text-[12.5px]"
            style={{
              background: 'var(--surface-sunken)',
              color: 'var(--text-secondary)',
            }}
          >
            Linked to{' '}
            <span
              className="font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {caseTitle || 'this case'}
            </span>
          </div>

          {/* Title */}
          <div className="grid gap-1.5">
            <Label htmlFor="case-event-title" className="text-[13px]">
              Title{' '}
              <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </Label>
            <Input
              id="case-event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Case management conference"
              autoFocus
            />
          </div>

          {/* Date + time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="case-event-date" className="text-[13px]">
                Date{' '}
                <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </Label>
              <Input
                id="case-event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="case-event-time" className="text-[13px]">
                Time
              </Label>
              <Input
                id="case-event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
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

          {/* Description */}
          <div className="grid gap-1.5">
            <Label
              htmlFor="case-event-description"
              className="text-[13px]"
            >
              Description (optional)
            </Label>
            <Textarea
              id="case-event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Agenda, dial-in info, prep notes…"
              rows={3}
            />
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
            {submitting ? 'Adding…' : 'Add event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
