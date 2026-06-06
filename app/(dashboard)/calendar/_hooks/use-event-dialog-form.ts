'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  useCreateCalendarEvent,
  useDeleteCalendarEvent,
  useUpdateCalendarEvent,
  useCalendarEvent,
} from '@/hooks/use-calendar'
import { useFirmMembers } from '@/hooks/use-firm-members'
import { useClients } from '@/hooks/use-clients'
import { useCases } from '@/hooks/use-cases'
import { useAuthStore } from '@/stores/auth.store'
import type { Deadline } from '@/hooks/use-deadlines'
import {
  DEFAULT_EVENT_MINUTES,
  REMINDER_OFFSETS,
  type SlotPrefill,
  type Reminder,
  type ReminderOffsetKey,
  type Participant,
} from '../_constants'
import { minutesToHHMM } from '../_lib/date'
import { newReminderId, offsetMinutes } from '../_lib/reminders'

// Map a reminder's minute lead time to the closest preset offset key.
function minutesToOffsetKey(minutes: number): ReminderOffsetKey {
  let bestKey: ReminderOffsetKey = REMINDER_OFFSETS[0].key
  let diff = Infinity
  for (const o of REMINDER_OFFSETS) {
    const d = Math.abs(o.minutes - minutes)
    if (d < diff) {
      diff = d
      bestKey = o.key
    }
  }
  return bestKey
}

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Encapsulates ALL form state + persistence for the event dialog. Participants
 * are firm members and/or clients: the signed-in user is added by default, and
 * a linked case auto-adds its client. Edit mode prefills exactly from the
 * stored event (times, attendees, reminders).
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

  const { data: members } = useFirmMembers()
  const { data: clients } = useClients()
  const { data: cases } = useCases()
  const currentUserId = useAuthStore((s) => s.user?.id)

  // In edit mode, pull the full event (attendees + reminders) to prefill from.
  const { data: fullEvent } = useCalendarEvent(editing?.id)

  const mode: 'create' | 'edit' = editing ? 'edit' : 'create'

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [caseId, setCaseId] = useState('')
  const [description, setDescription] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // The signed-in user as a member participant (default attendee).
  const selfParticipant = (() => {
    const me = (members ?? []).find(
      (m) => m.profile_id === currentUserId && m.status === 'active',
    )
    return me ? ({ kind: 'member', id: me.id, name: me.name } as Participant) : null
  })()

  // Reset scalar fields on open. Defaults: create → today/prefill + self
  // participant; edit → values from the adapted Deadline (exact values land
  // once `fullEvent` resolves, below).
  const hydratedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!open) return
    hydratedFor.current = null

    if (editing) {
      const due = new Date(editing.due_date)
      setTitle(editing.title)
      setDescription(editing.description ?? '')
      setCaseId(editing.case_id ?? '')
      setDate(due.toISOString().slice(0, 10))
      setStartTime(hhmm(due))
      setEndTime(hhmm(new Date(due.getTime() + DEFAULT_EVENT_MINUTES * 60 * 1000)))
      setParticipants([])
      setReminders([])
      return
    }

    setTitle('')
    setDescription('')
    setCaseId('')
    setParticipants(selfParticipant ? [selfParticipant] : [])
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
      setEndTime(new Date(now.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5))
    }
    // selfParticipant intentionally omitted: a late members fetch is handled
    // by the create-mode self-seed effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefill, editing])

  // Create mode: once members load, make sure the signed-in user is present.
  useEffect(() => {
    if (!open || editing || !selfParticipant) return
    setParticipants((prev) =>
      prev.some((p) => p.kind === 'member' && p.id === selfParticipant.id)
        ? prev
        : [selfParticipant, ...prev],
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, selfParticipant?.id])

  // Edit mode: prefill exact times, participants and reminders from the event.
  useEffect(() => {
    if (!open || !editing || !fullEvent || fullEvent.id !== editing.id) return
    if (hydratedFor.current === fullEvent.id) return
    hydratedFor.current = fullEvent.id

    const start = new Date(fullEvent.start_time)
    const end = new Date(fullEvent.end_time)
    setDate(start.toISOString().slice(0, 10))
    setStartTime(hhmm(start))
    setEndTime(hhmm(end))
    setCaseId(fullEvent.case_id ?? '')
    setParticipants(
      fullEvent.attendees.map((a) =>
        a.kind === 'client'
          ? { kind: 'client', id: a.client_id ?? '', name: a.name }
          : { kind: 'member', id: a.member_id ?? '', name: a.name },
      ),
    )
    setReminders(
      fullEvent.reminders.map((r) => ({
        id: newReminderId(),
        offset: minutesToOffsetKey(r.minutes_before),
        channel: r.method === 'email' ? 'email' : 'push',
        emails: '',
      })),
    )
  }, [open, editing, fullEvent])

  // When a case is linked, auto-add its client as a participant.
  useEffect(() => {
    if (!open || !caseId) return
    const kase = (cases ?? []).find((c) => c.id === caseId)
    const clientId = kase?.client_id
    if (!clientId) return
    const name =
      (clients ?? []).find((c) => c.id === clientId)?.full_name ??
      kase?.client_name ??
      'Client'
    setParticipants((prev) =>
      prev.some((p) => p.kind === 'client' && p.id === clientId)
        ? prev
        : [...prev, { kind: 'client', id: clientId, name }],
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, caseId, cases, clients])

  const canSave = title.trim().length > 0 && !submitting && !deleting

  const handleSave = async () => {
    if (!canSave) return
    setSubmitting(true)
    try {
      const start = new Date(`${date}T${startTime}:00`)
      let end = new Date(`${date}T${endTime}:00`)
      if (end.getTime() <= start.getTime()) {
        end = new Date(start.getTime() + DEFAULT_EVENT_MINUTES * 60 * 1000)
      }

      const reminderInput = reminders.map((r) => ({
        minutes_before: offsetMinutes(r.offset),
        method: r.channel === 'email' ? 'email' : 'in_app',
      }))

      const memberIds = participants
        .filter((p) => p.kind === 'member')
        .map((p) => p.id)
      const clientIds = participants
        .filter((p) => p.kind === 'client')
        .map((p) => p.id)

      const base = {
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        case_id: caseId || undefined,
        attendee_member_ids: memberIds,
        attendee_client_ids: clientIds,
        reminders: reminderInput,
      }

      if (mode === 'edit' && editing) {
        await updateMutation.mutateAsync(editing.id, base)
      } else {
        await createMutation.mutateAsync({ ...base, event_type: 'meeting' })
      }

      const bits = [
        participants.length > 0
          ? `${participants.length} participant${participants.length === 1 ? '' : 's'}`
          : null,
        reminders.length > 0
          ? `${reminders.length} reminder${reminders.length === 1 ? '' : 's'}`
          : null,
      ].filter(Boolean)
      const tail = bits.length ? `. ${bits.join(' · ')}` : '.'
      toast.success(mode === 'edit' ? `Event updated${tail}` : `Event saved${tail}`)
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
