import {
  CalendarBlank,
  Gavel,
  ListChecks,
  Receipt,
  Scales,
  Timer,
  type Icon,
} from '@phosphor-icons/react'
import type { AttentionBucket, AttentionKind } from '@/hooks/use-attention-feed'

export const KIND_META: Record<
  AttentionKind,
  { label: string; plural: string; Icon: Icon; color: string; tint: string }
> = {
  deadline: { label: 'Deadline', plural: 'Deadlines', Icon: Timer, color: '#A07A1E', tint: 'rgba(201,151,43,0.14)' },
  task: { label: 'Task', plural: 'Tasks', Icon: ListChecks, color: '#216A43', tint: 'rgba(33,106,67,0.12)' },
  hearing: { label: 'Hearing', plural: 'Hearings', Icon: Gavel, color: '#7C2D12', tint: 'rgba(124,45,18,0.12)' },
  court: { label: 'Court date', plural: 'Court dates', Icon: Scales, color: '#4338CA', tint: 'rgba(67,56,202,0.11)' },
  event: { label: 'Event', plural: 'Events', Icon: CalendarBlank, color: '#2563EB', tint: 'rgba(37,99,235,0.11)' },
  invoice: { label: 'Invoice', plural: 'Invoices', Icon: Receipt, color: '#0F766E', tint: 'rgba(15,118,110,0.12)' },
}

export const KIND_ORDER: AttentionKind[] = ['deadline', 'hearing', 'court', 'task', 'event', 'invoice']

export const BUCKET_META: Record<
  AttentionBucket,
  { label: string; hint: string; color: string; tint: string }
> = {
  overdue: { label: 'Overdue', hint: 'Past due and still open', color: '#C0392B', tint: 'rgba(192,57,43,0.10)' },
  today: { label: 'Today', hint: 'Due before the day ends', color: '#B4530A', tint: 'rgba(217,119,6,0.12)' },
  tomorrow: { label: 'Tomorrow', hint: 'Prepare today', color: '#A07A1E', tint: 'rgba(201,151,43,0.14)' },
  week: { label: 'This week', hint: 'Within the next seven days', color: '#243B55', tint: 'rgba(36,59,85,0.08)' },
  later: { label: 'On the horizon', hint: 'Within the next thirty days', color: '#8A8F99', tint: 'rgba(138,143,153,0.12)' },
}

export const BUCKET_ORDER: AttentionBucket[] = ['overdue', 'today', 'tomorrow', 'week', 'later']

/** Compact relative label: "in 3h", "2d overdue", "in 12m". */
export function relativeLabel(dueAt: number, now: number): string {
  const diff = dueAt - now
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60_000)
  const hours = Math.round(abs / 3_600_000)
  const days = Math.round(abs / 86_400_000)
  const span = mins < 60 ? `${Math.max(mins, 1)}m` : hours < 36 ? `${hours}h` : `${days}d`
  return diff < 0 ? `${span} overdue` : `in ${span}`
}

/** Splits a duration into the parts the countdown displays. */
export function countdownParts(ms: number) {
  const abs = Math.max(0, Math.abs(ms))
  return {
    days: Math.floor(abs / 86_400_000),
    hours: Math.floor((abs % 86_400_000) / 3_600_000),
    minutes: Math.floor((abs % 3_600_000) / 60_000),
    seconds: Math.floor((abs % 60_000) / 1000),
  }
}

export function formatDueTime(dueAt: number, allDay: boolean): string {
  const d = new Date(dueAt)
  const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  if (allDay) return date
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
}
