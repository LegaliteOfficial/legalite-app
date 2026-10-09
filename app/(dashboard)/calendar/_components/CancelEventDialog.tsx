'use client'

import { useState } from 'react'
import { EnvelopeSimple, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCancelCalendarEvent, type CalendarEvent } from '@/hooks/use-calendar'

const REASON_MAX = 500

/**
 * Confirms cancelling an upcoming event. Everyone else on the invite —
 * firm members and clients — is emailed by the server once it's confirmed,
 * with the optional reason included. The event leaves the calendar but is
 * kept, with its history, for the record.
 */
export function CancelEventDialog({
  open,
  onOpenChange,
  event,
  selfMemberId,
  onCancelled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent
  /** The signed-in user's member id, so they aren't counted as notified. */
  selfMemberId?: string
  /** Runs after a successful cancel (e.g. to close the edit dialog). */
  onCancelled: () => void
}) {
  const cancelMutation = useCancelCalendarEvent()
  const [reason, setReason] = useState('')

  const others = event.attendees.filter(
    (a) => !(a.kind === 'member' && a.member_id === selfMemberId),
  )
  const names = others.map((a) => a.name).filter(Boolean)

  const handleConfirm = async () => {
    try {
      await cancelMutation.mutateAsync(event.id, reason)
      toast.success(
        others.length > 0
          ? `Event cancelled. ${others.length} participant${others.length === 1 ? ' has' : 's have'} been notified by email.`
          : 'Event cancelled.',
      )
      setReason('')
      onOpenChange(false)
      onCancelled()
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Could not cancel the event: ${err.message}`
          : 'Could not cancel the event. Please try again.',
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (cancelMutation.isPending) return
        onOpenChange(o)
      }}
    >
      <DialogContent
        className="sm:max-w-[480px] rounded-2xl"
        style={{ background: 'var(--surface-card)', borderColor: 'var(--border)' }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-[18px] font-semibold inline-flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Warning size={18} strokeWidth={1.75} style={{ color: '#C0392B' }} />
            Cancel this event?
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {event.title}
            </span>{' '}
            will be removed from the calendar and its reminders stopped. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        <div
          className="rounded-xl border px-3.5 py-3 text-[12.5px] flex items-start gap-2.5"
          style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-sunken)' }}
        >
          <EnvelopeSimple size={15} strokeWidth={1.75} className="mt-0.5 shrink-0" style={{ color: 'var(--gold-dark)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>
            {others.length === 0 ? (
              'No one else is invited, so no one will be emailed.'
            ) : (
              <>
                {others.length === 1 ? 'This participant' : `These ${others.length} participants`} will be
                emailed that it&apos;s cancelled:{' '}
                <span style={{ color: 'var(--text-primary)' }}>{names.join(', ')}</span>.
              </>
            )}
          </p>
        </div>

        <div>
          <Label
            htmlFor="cancel-reason"
            className="text-[12px] font-semibold mb-1.5 block"
            style={{ color: 'var(--text-primary)' }}
          >
            Reason <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional, included in the email)</span>
          </Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX))}
            rows={3}
            placeholder="e.g. The hearing has been adjourned."
            className="text-[13px]"
            disabled={cancelMutation.isPending}
          />
          <p className="mt-1 text-right text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {reason.length}/{REASON_MAX}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={cancelMutation.isPending}
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-[13px] font-medium cursor-pointer transition-colors disabled:opacity-50"
            style={{ color: 'var(--text-secondary)', background: 'transparent' }}
          >
            Keep event
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={cancelMutation.isPending}
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-wait"
            style={{ background: '#C0392B' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#A93226' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#C0392B' }}
          >
            {cancelMutation.isPending ? 'Cancelling…' : 'Cancel event'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
