'use client'

/**
 * EventPreviewPopover
 * -------------------
 * Lightweight floating preview that appears when the partner clicks an
 * event block on the calendar. Anchors to the block via Base UI's
 * Popover (flip/shift handled by the positioner). For deeper edits,
 * the expand affordance hands off to the existing EventDialog.
 *
 * Visual reference: Microsoft Teams meeting peek. Adapted for a legal
 * workflow so the primary actions are case-aware ("Open case",
 * "Mark done", "Reschedule"), not meeting-aware ("Join", "Accept").
 *
 * Layout
 *   ┌──────────────────────────────────────────┐
 *   │ ▌ Title                          ⤢   ✕   │   gold accent + expand + close
 *   │   priority chip · status chip · reminder │
 *   │                                          │
 *   │ [ Open case ▾ ]   [ Edit details ]       │   primary actions
 *   │ ───────────────────────────────────────  │
 *   │ 🕐 date · time range                     │   info rows
 *   │ 📁 linked case (clickable)               │
 *   │ 📝 description (clamped to 3 lines)      │
 *   │ ───────────────────────────────────────  │
 *   │ ✓ Mark done   ⊘ Reschedule   ⋮ More      │   outcome row
 *   └──────────────────────────────────────────┘
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowSquareOut,
  ArrowsClockwise,
  Bell,
  Briefcase,
  CalendarBlank,
  Check,
  Clock,
  CornersOut,
  DotsThree,
  NotePencil,
  Trash,
  X,
} from '@phosphor-icons/react'
import { Popover } from '@base-ui/react/popover'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Deadline } from '@/hooks/use-deadlines'
import { useDeleteDeadline, useUpdateDeadline } from '@/hooks/use-deadlines'
import { EventBlock } from './EventBlock'

interface PriorityMeta {
  label: string
  color: string
  bg: string
}

const PRIORITY_META: Record<Deadline['priority'], PriorityMeta> = {
  High: { label: 'High priority', color: '#C0392B', bg: 'rgba(192, 57, 43, 0.10)' },
  Medium: { label: 'Medium priority', color: 'var(--gold-dark)', bg: 'rgba(201, 151, 43, 0.14)' },
  Low: { label: 'Low priority', color: 'var(--text-secondary)', bg: 'var(--surface-sunken)' },
}

const STATUS_META: Record<
  Deadline['status'],
  { label: string; color: string; bg: string }
> = {
  Pending: { label: 'Pending', color: 'var(--text-secondary)', bg: 'var(--surface-sunken)' },
  Done: { label: 'Completed', color: '#2E7D4F', bg: 'rgba(46, 125, 79, 0.10)' },
  Missed: { label: 'Missed', color: '#C0392B', bg: 'rgba(192, 57, 43, 0.10)' },
}

/**
 * Default span — there's no end_date on the Deadline model, so we
 * render the event as a single-point block plus a one-hour default
 * range in the preview. This mirrors what EventBlock does on the grid
 * and gives the partner a believable "Date · 10:00 AM – 11:00 AM"
 * line without inventing data.
 */
const DEFAULT_END_OFFSET_MIN = 60

export function EventPreviewPopover({
  deadline,
  onEdit,
  onDuplicate,
}: {
  deadline: Deadline
  /** Hand off to the full edit dialog (slide-in form). */
  onEdit: (d: Deadline) => void
  /** Optional — wired by the page state hook when duplication is supported. */
  onDuplicate?: (d: Deadline) => void
}) {
  const updateDeadline = useUpdateDeadline()
  const deleteDeadline = useDeleteDeadline()
  const [open, setOpen] = useState(false)

  const start = new Date(deadline.due_date)
  const end = new Date(start.getTime() + DEFAULT_END_OFFSET_MIN * 60_000)

  const dateLabel = start.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const timeLabel = `${formatTime(start)} – ${formatTime(end)}`

  const priority = PRIORITY_META[deadline.priority]
  const status = STATUS_META[deadline.status]
  const isDone = deadline.status === 'Done'

  const handleMarkDone = async () => {
    try {
      await updateDeadline.mutateAsync({
        id: deadline.id,
        data: { status: isDone ? 'Pending' : 'Done' },
      })
      toast.success(isDone ? 'Marked as pending.' : 'Marked as done.')
      setOpen(false)
    } catch {
      toast.error('Could not update this event. Please try again.')
    }
  }

  const handleReschedule = () => {
    setOpen(false)
    onEdit(deadline)
  }

  const handleEdit = () => {
    setOpen(false)
    onEdit(deadline)
  }

  const handleDelete = async () => {
    try {
      await deleteDeadline.mutateAsync(deadline.id)
      toast.success('Event deleted.')
      setOpen(false)
    } catch {
      toast.error('Could not delete this event.')
    }
  }

  const handleCopyIcs = () => {
    // Lightweight share affordance — copies the public iCal feed URL
    // for "my deadlines". A per-event .ics export is a bigger lift; the
    // feed link covers the same "see this in my external calendar"
    // intent without the backend work.
    const url = `${window.location.origin}/api/calendar/feeds/me`
    void navigator.clipboard?.writeText(url)
    toast.success('Subscription link copied — paste into your calendar app.')
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger render={<EventBlock deadline={deadline} />} />
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="center" side="right">
          <Popover.Popup
            className="outline-none"
            style={{
              animation: 'popover-in 140ms ease',
            }}
          >
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                width: 380,
                background: 'var(--surface-card)',
                borderColor: 'var(--border-default)',
                boxShadow: 'var(--shadow-lg, 0 12px 32px -8px rgba(13,27,42,0.18), 0 4px 12px -4px rgba(13,27,42,0.08))',
              }}
            >
              {/* Gold left accent + header */}
              <div
                className="relative flex items-start justify-between gap-3 px-5 pt-4 pb-3"
                style={{
                  background:
                    'linear-gradient(180deg, var(--accent-today-tint, rgba(201,151,43,0.06)) 0%, transparent 100%)',
                }}
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ background: 'var(--gold)' }}
                />
                <div className="min-w-0 flex-1">
                  <h3
                    className="font-heading text-[16px] font-semibold leading-snug tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {deadline.title}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <Chip color={priority.color} bg={priority.bg}>
                      <span
                        aria-hidden
                        className="w-1 h-1 rounded-full"
                        style={{ background: priority.color }}
                      />
                      {priority.label}
                    </Chip>
                    <ChipDivider />
                    <Chip color={status.color} bg={status.bg}>
                      {status.label}
                    </Chip>
                    {deadline.reminder_days != null && (
                      <>
                        <ChipDivider />
                        <Chip color="var(--text-muted)" bg="var(--surface-sunken)">
                          <Bell size={9} strokeWidth={1.75} />
                          {deadline.reminder_days}d
                        </Chip>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <IconBtn
                    onClick={handleEdit}
                    title="Open full editor"
                    aria-label="Open full editor"
                  >
                    <CornersOut size={13} strokeWidth={1.75} />
                  </IconBtn>
                  <IconBtn
                    onClick={() => setOpen(false)}
                    title="Close"
                    aria-label="Close"
                  >
                    <X size={13} strokeWidth={1.75} />
                  </IconBtn>
                </div>
              </div>

              {/* Primary actions */}
              <div className="px-5 pb-3 flex items-center gap-2">
                {deadline.case_id ? (
                  <Link
                    href={`/cases/${deadline.case_id}`}
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-[12.5px] font-semibold flex-1 transition-colors"
                    style={{ background: 'var(--gold)', color: 'var(--navy)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gold-dark)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--gold)')}
                  >
                    <Briefcase size={12} strokeWidth={2} />
                    Open case
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-[12.5px] font-semibold flex-1 transition-colors"
                    style={{ background: 'var(--gold)', color: 'var(--navy)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gold-dark)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--gold)')}
                  >
                    <NotePencil size={12} strokeWidth={2} />
                    Edit details
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-[12.5px] font-semibold border transition-colors"
                  style={{
                    background: 'var(--surface-card)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-overlay)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-card)')}
                >
                  <NotePencil size={12} strokeWidth={2} />
                  {deadline.case_id ? 'Edit' : 'Reschedule'}
                </button>
              </div>

              {/* Info rows */}
              <div
                className="px-5 py-3 border-t space-y-2.5"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <InfoRow icon={<Clock size={12} strokeWidth={1.75} />}>
                  <span style={{ color: 'var(--text-primary)' }}>{dateLabel}</span>
                  <span className="mx-1.5" style={{ color: 'var(--text-muted)' }}>·</span>
                  <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                    {timeLabel}
                  </span>
                </InfoRow>

                {deadline.case_title && (
                  <InfoRow icon={<Briefcase size={12} strokeWidth={1.75} />}>
                    {deadline.case_id ? (
                      <Link
                        href={`/cases/${deadline.case_id}`}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-1 hover:underline underline-offset-2"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {deadline.case_title}
                        <ArrowSquareOut size={10} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--text-primary)' }}>{deadline.case_title}</span>
                    )}
                  </InfoRow>
                )}

                {deadline.reminder_days != null && (
                  <InfoRow icon={<Bell size={12} strokeWidth={1.75} />}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Reminder{' '}
                      <span style={{ color: 'var(--text-primary)' }}>
                        {deadline.reminder_days === 0
                          ? 'on the day'
                          : `${deadline.reminder_days} day${deadline.reminder_days === 1 ? '' : 's'} before`}
                      </span>
                    </span>
                  </InfoRow>
                )}

                {deadline.description && (
                  <InfoRow icon={<NotePencil size={12} strokeWidth={1.75} />}>
                    <p
                      className="leading-relaxed line-clamp-3"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {deadline.description}
                    </p>
                  </InfoRow>
                )}
              </div>

              {/* Outcome row */}
              <div
                className="px-3 py-2 border-t flex items-center gap-1"
                style={{
                  borderColor: 'var(--border-soft)',
                  background: 'var(--surface-sunken)',
                }}
              >
                <OutcomeBtn
                  onClick={handleMarkDone}
                  disabled={updateDeadline.isPending}
                  active={isDone}
                  activeColor="#2E7D4F"
                  activeBg="rgba(46, 125, 79, 0.10)"
                  label={isDone ? 'Done' : 'Mark done'}
                >
                  <Check size={12} strokeWidth={2} />
                </OutcomeBtn>
                <OutcomeBtn
                  onClick={handleReschedule}
                  disabled={updateDeadline.isPending}
                  label="Reschedule"
                >
                  <ArrowsClockwise size={12} strokeWidth={2} />
                </OutcomeBtn>
                <span className="flex-1" />
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label="More options"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <DotsThree size={16} weight="bold" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={6}>
                    {onDuplicate && (
                      <DropdownMenuItem onClick={() => onDuplicate(deadline)}>
                        <NotePencil size={12} strokeWidth={1.75} />
                        Duplicate event
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleCopyIcs}>
                      <CalendarBlank size={12} strokeWidth={1.75} />
                      Copy calendar feed link
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={deleteDeadline.isPending}
                      style={{ color: '#C0392B' }}
                    >
                      <Trash size={12} strokeWidth={1.75} />
                      Delete event
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <style jsx>{`
              @keyframes popover-in {
                from {
                  opacity: 0;
                  transform: translateY(-4px) scale(0.98);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
            `}</style>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

// ── Atomic pieces ──────────────────────────────────────────────────────────

function Chip({
  color,
  bg,
  children,
}: {
  color: string
  bg: string
  children: React.ReactNode
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider"
      style={{ color, background: bg }}
    >
      {children}
    </span>
  )
}

function ChipDivider() {
  return (
    <span
      aria-hidden
      className="w-1 h-1 rounded-full"
      style={{ background: 'var(--text-subtle, var(--text-muted))' }}
    />
  )
}

function IconBtn({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors"
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-overlay)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      {...props}
    >
      {children}
    </button>
  )
}

function InfoRow({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5 text-[12.5px]">
      <span
        className="mt-0.5 shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function OutcomeBtn({
  children,
  label,
  active,
  activeColor,
  activeBg,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  active?: boolean
  activeColor?: string
  activeBg?: string
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[11.5px] font-semibold transition-colors disabled:opacity-50"
      style={{
        color: active ? (activeColor ?? 'var(--gold-dark)') : 'var(--text-secondary)',
        background: active ? (activeBg ?? 'rgba(201, 151, 43, 0.14)') : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (active) return
        e.currentTarget.style.background = 'var(--surface-overlay)'
      }}
      onMouseLeave={(e) => {
        if (active) return
        e.currentTarget.style.background = 'transparent'
      }}
      {...props}
    >
      {children}
      {label}
    </button>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(d: Date): string {
  return d
    .toLocaleTimeString('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
}

