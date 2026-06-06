'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  useCreateCalendarEvent,
  useDeleteCalendarEvent,
  useUpdateCalendarEvent,
} from '@/hooks/use-calendar'
import type { Deadline } from '@/hooks/use-deadlines'
import { DEFAULT_EVENT_MINUTES, type SlotPrefill, type Reminder } from '../_constants'
import { minutesToHHMM } from '../_lib/date'
import {
  daysToOffsetKey,
  newReminderId,
  offsetMinutes,
  summariseReminders,
} from '../_lib/reminders'

/**
 * Encapsulates ALL form state and persistence for the event dialog.
 * The page component just passes `open`, `prefill`, `editing`, and the
 * close callback — everything else (fields, validation, mutations,
 * toasts) lives here.
 */
export function useEventDialogForm({
  open,
  prefill,
  editing,
  onClose,
}: {
  open: boolean
  prefill: SlotPrefill | null
  editing: Deadline | null
  onClose: () => void
}) {
  const createMutation = useCreateCalendarEvent()
  const updateMutation = useUpdateCalendarEvent()
  const deleteMutation = useDeleteCalendarEvent()

  const mode: 'create' | 'edit' = editing ? 'edit' : 'create'

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [caseId, setCaseId] = useState('')
  const [description, setDescription] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Reset on every open. Edit mode hydrates from the Deadline; create
  // mode falls back to prefill or "today + next round hour".
  useEffect(() => {
    if (!open) return

    if (editing) {
      const due = new Date(editing.due_date)
      const isoDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`
      setTitle(editing.title)
      setDescription(editing.description ?? '')
      setCaseId(editing.case_id ?? '')
      setDate(isoDate)
      setStartTime(`${String(due.getHours()).padStart(2, '0')}:${String(due.getMinutes()).padStart(2, '0')}`)
      const end = new Date(due.getTime() + DEFAULT_EVENT_MINUTES * 60 * 1000)
      setEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`)
      setParticipants([])
      setReminders([
        {
          id: newReminderId(),
          offset: daysToOffsetKey(editing.reminder_days),
          channel: 'push',
          emails: '',
        },
      ])
      return
    }

    setTitle('')
    setDescription('')
    setCaseId('')
    setParticipants([])
    setReminders([])

    if (prefill) {
      setDate(prefill.date.toISOString().slice(0, 10))
      setStartTime(minutesToHHMM(prefill.startMinutes))
      setEndTime(minutesToHHMM(prefill.endMinutes))
    } else {
      const now = new Date()
      now.setMinutes(0, 0, 0)
      now.setHours(now.getHours() + 1)
      setDate(now.toISOString().slice(0, 10))
      setStartTime(now.toTimeString().slice(0, 5))
      const end = new Date(now.getTime() + 60 * 60 * 1000)
      setEndTime(end.toTimeString().slice(0, 5))
    }
  }, [open, prefill, editing])

  const canSave = title.trim().length > 0 && !submitting && !deleting

  const handleSave = async () => {
    if (!canSave) return
    setSubmitting(true)
    try {
      const start = new Date(`${date}T${startTime}:00`)
      let end = new Date(`${date}T${endTime}:00`)
      // Guard against an end at/before start (e.g. crossing midnight is out of
      // scope here) — fall back to the default duration.
      if (end.getTime() <= start.getTime()) {
        end = new Date(start.getTime() + DEFAULT_EVENT_MINUTES * 60 * 1000)
      }

      // Map the form's reminder rows to the events API: offset → minutes_before,
      // channel → delivery method. Email reminders go to the event's attendees.
      const reminderInput = reminders.map((r) => ({
        minutes_before: offsetMinutes(r.offset),
        method: r.channel === 'email' ? 'email' : 'in_app',
      }))

      const base = {
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        case_id: caseId || undefined,
        reminders: reminderInput,
      }

      if (mode === 'edit' && editing) {
        await updateMutation.mutateAsync(editing.id, base)
      } else {
        await createMutation.mutateAsync({ ...base, event_type: 'meeting' })
      }

      const reminderSummary = summariseReminders(reminders)
      const participantSummary =
        participants.length > 0
          ? `${participants.length} participant${participants.length === 1 ? '' : 's'} notified`
          : null
      const tail = [participantSummary, reminderSummary].filter(Boolean).join(' · ')
      toast.success(
        mode === 'edit'
          ? `Event updated${tail ? '. ' + tail : '.'}`
          : `Event saved${tail ? '. ' + tail : '.'}`,
      )
      onClose()
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `${mode === 'edit' ? 'Update' : 'Save'} failed: ${err.message}`
          : 'Save failed. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editing) return
    if (!confirm(`Delete "${editing.title}"?`)) return
    setDeleting(true)
    try {
      await deleteMutation.mutateAsync(editing.id)
      toast.success('Event deleted.')
      onClose()
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Delete failed: ${err.message}`
          : 'Delete failed. Please try again.',
      )
    } finally {
      setDeleting(false)
    }
  }

  const addReminder = () =>
    setReminders((prev) => [
      ...prev,
      // Default new reminders to "15 minutes before, push" — the common case.
      { id: newReminderId(), offset: '15m', channel: 'push', emails: '' },
    ])

  const updateReminder = (id: string, patch: Partial<Reminder>) =>
    setReminders((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const removeReminder = (id: string) =>
    setReminders((prev) => prev.filter((x) => x.id !== id))

  return {
    mode,
    fields: {
      title, setTitle,
      date, setDate,
      startTime, setStartTime,
      endTime, setEndTime,
      caseId, setCaseId,
      description, setDescription,
      participants, setParticipants,
      reminders,
    },
    state: { submitting, deleting, canSave },
    actions: {
      handleSave,
      handleDelete,
      addReminder,
      updateReminder,
      removeReminder,
    },
  }
}
