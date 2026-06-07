'use client'

import { useEffect, useState } from 'react'
import { Bell, Briefcase, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCases } from '@/hooks/use-cases'
import { useCreateCalendarEvent } from '@/hooks/use-calendar'
import type { ReminderChannel } from '../_constants'
import { toDateInput, toTimeInput } from '../_lib/date'
import { parseEmails } from '../_lib/reminders'

/**
 * Lightweight "Set a reminder" composer. Opens from the calendar
 * header's bell button and creates a Deadline configured to fire at
 * the chosen time. Intentionally smaller than the EventDialog — a
 * reminder is a single moment with a channel attached, not a window
 * with participants and a description.
 *
 * Persists via useCreateDeadline with `reminder_days = 0` so the
 * notification fires at the due-date itself.
 */
export function ReminderDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const createMutation = useCreateCalendarEvent()
  const { data: cases } = useCases()

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [caseId, setCaseId] = useState<string>('')
  const [channel, setChannel] = useState<ReminderChannel>('push')
  const [emails, setEmails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset to "next round hour from now" on every open so the default
  // doesn't drift while the dialog sits open.
  useEffect(() => {
    if (!open) return
    const target = new Date()
    target.setHours(target.getHours() + 1, 0, 0, 0)
    setTitle('')
    setDate(toDateInput(target))
    setTime(toTimeInput(target))
    setCaseId('')
    setChannel('push')
    setEmails('')
    setSubmitting(false)
  }, [open])

  const canSave = title.trim().length > 0 && date.length > 0 && time.length > 0

  const handleSave = async () => {
    if (!canSave) return

    let validEmails: string[] = []
    if (channel === 'email') {
      const { valid, invalid } = parseEmails(emails)
      if (invalid.length > 0) {
        toast.error(`These email addresses look wrong: ${invalid.join(', ')}.`)
        return
      }
      if (valid.length === 0) {
        toast.error('Add at least one email recipient for an email reminder.')
        return
      }
      validEmails = valid
    }

    setSubmitting(true)
    try {
      const start = new Date(`${date}T${time}:00`)
      const dueDate = start.toISOString()
      // A one-shot reminder is a short calendar event with a reminder that
      // fires at start time. The reminder email goes to the event's attendees
      // (the creator is auto-added).
      await createMutation.mutateAsync({
        title: title.trim(),
        description:
          channel === 'email'
            ? `Reminder via email${validEmails.length ? ` → ${validEmails.join(', ')}` : ''}`
            : 'Reminder via push notification',
        start_time: dueDate,
        end_time: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
        event_type: 'task',
        case_id: caseId || undefined,
        reminders: [
          { minutes_before: 0, method: channel === 'email' ? 'email' : 'in_app' },
        ],
      })

      const when = new Date(dueDate).toLocaleString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      const channelSummary =
        channel === 'email'
          ? `email to ${validEmails.length} recipient${validEmails.length === 1 ? '' : 's'}`
          : 'push notification'
      toast.success(`Reminder set for ${when} — ${channelSummary}.`)
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Couldn't set the reminder: ${err.message}`
          : "Couldn't set the reminder. Please try again.",
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
            style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)' }}
          >
            Set a reminder
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="rem-title" className="text-[13px]">
              What should we remind you about?{' '}
              <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </Label>
            <Input
              id="rem-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Call client about discovery responses"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="rem-date" className="text-[13px]">Date</Label>
              <Input id="rem-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rem-time" className="text-[13px]">Time</Label>
              <Input id="rem-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="rem-case" className="text-[13px] inline-flex items-center gap-1.5">
              <Briefcase size={12} strokeWidth={1.75} />
              Linked case (optional)
            </Label>
            <select
              id="rem-case"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="h-9 rounded-md border px-2 text-[13px] bg-transparent"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <option value="">No linked case</option>
              {(cases ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <ChannelSelector channel={channel} onChange={setChannel} />

          {channel === 'email' && (
            <div className="grid gap-1.5">
              <Label htmlFor="rem-emails" className="text-[13px]">Send to</Label>
              <Input
                id="rem-emails"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="recipient@firm.com, partner@example.com"
              />
              <p className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
                Comma-separated. We&apos;ll email each recipient at the reminder time.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || submitting}
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          >
            {submitting ? 'Setting…' : 'Set reminder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ChannelSelector({
  channel,
  onChange,
}: {
  channel: ReminderChannel
  onChange: (c: ReminderChannel) => void
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[13px]">Notify me via</Label>
      <div
        className="inline-flex rounded-md p-0.5 self-start"
        style={{ background: 'var(--surface-sunken)' }}
        role="radiogroup"
        aria-label="Reminder channel"
      >
        {(['push', 'email'] as const).map((c) => {
          const active = channel === c
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(c)}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded text-[12.5px] font-medium cursor-pointer"
              style={{
                background: active ? 'var(--accent-today-tint-strong)' : 'transparent',
                color: active ? 'var(--accent-today)' : 'var(--text-secondary)',
              }}
            >
              {c === 'push' ? <Bell size={12} strokeWidth={1.75} /> : <Users size={12} strokeWidth={1.75} />}
              {c === 'push' ? 'Push' : 'Email'}
            </button>
          )
        })}
      </div>
    </div>
  )
}
