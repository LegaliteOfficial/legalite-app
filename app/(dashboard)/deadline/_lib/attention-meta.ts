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
  overdue: { label: 'Past due', hint: 'Still open after the due date', color: '#C0392B', tint: 'rgba(192,57,43,0.10)' },
  today: { label: 'Today', hint: 'Due before close of day', color: '#B4530A', tint: 'rgba(217,119,6,0.12)' },
  tomorrow: { label: 'Tomorrow', hint: 'Prepare today', color: '#A07A1E', tint: 'rgba(201,151,43,0.14)' },
  week: { label: 'This week', hint: 'Within the next seven days', color: '#243B55', tint: 'rgba(36,59,85,0.08)' },
  later: { label: 'Later this month', hint: 'Within the next thirty days', color: '#8A8F99', tint: 'rgba(138,143,153,0.12)' },
}

export const BUCKET_ORDER: AttentionBucket[] = ['overdue', 'today', 'tomorrow', 'week', 'later']

const MIN_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function span(ms: number): string {
  const mins = Math.round(ms / MIN_MS)
  if (mins < 60) return plural(Math.max(mins, 1), 'minute')
  const hours = Math.round(ms / HOUR_MS)
  if (hours < 36) return plural(hours, 'hour')
  return plural(Math.round(ms / DAY_MS), 'day')
}

/** Short relative phrase for list rows: "in 3 hours", "2 days late". */
export function relativeLabel(dueAt: number, now: number): string {
  const diff = dueAt - now
  return diff < 0 ? `${span(-diff)} late` : `in ${span(diff)}`
}

/** "3 hours ago" — for events that have already ended. */
export function agoLabel(ts: number, now: number): string {
  return `${span(Math.max(0, now - ts))} ago`
}

function startOfLocalDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const time = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

const longDate = (ts: number) =>
  new Date(ts).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

/**
 * Plain-language due phrase in the register a practitioner would use:
 * "Overdue by 3 days", "Listed for tomorrow at 09:00", "Due Tuesday 14 October".
 */
export function duePhrase(
  item: { kind: AttentionKind; dueAt: number; allDay: boolean },
  now: number,
): string {
  const listed = item.kind === 'hearing' || item.kind === 'court'
  const scheduled = listed || item.kind === 'event'
  const dayDiff = Math.round((startOfLocalDay(item.dueAt) - startOfLocalDay(now)) / DAY_MS)
  const at = item.allDay ? '' : ` at ${time(item.dueAt)}`

  if (item.dueAt < now) {
    if (dayDiff === 0) return item.allDay ? 'Due today' : `Overdue since ${time(item.dueAt)}`
    return `Overdue by ${plural(-dayDiff, 'day')}`
  }
  const lead = listed ? 'Listed for' : scheduled ? '' : 'Due'
  const phrase = (when: string) => (lead ? `${lead} ${when}` : when.charAt(0).toUpperCase() + when.slice(1))
  if (dayDiff === 0) return phrase(`today${at}`)
  if (dayDiff === 1) return phrase(`tomorrow${at}`)
  return phrase(`${longDate(item.dueAt)}${at}`)
}

export function formatDueTime(dueAt: number, allDay: boolean): string {
  const d = new Date(dueAt)
  const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  if (allDay) return date
  return `${date}, ${time(dueAt)}`
}

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

/** Spells small counts the way a written brief would: "two items". */
export function countWords(n: number, singular: string, pluralForm = `${singular}s`): string {
  const num = n <= 10 ? NUMBER_WORDS[n] : String(n)
  return `${num} ${n === 1 ? singular : pluralForm}`
}
