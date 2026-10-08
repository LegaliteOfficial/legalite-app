'use client'

/**
 * Docket brief — the lead card of the Deadline engine.
 *
 * Reads like the top of a practitioner's diary page rather than a
 * monitoring dashboard: today's date, a short written summary of what is
 * pressing, the single matter that needs attention first, and a two-week
 * court diary. Clicking a diary day (or the carried-forward line) focuses
 * the timeline below on those items.
 */

import Link from 'next/link'
import { ArrowRight, CheckCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { startOfDay, useAttentionItems, type AttentionItem } from '@/hooks/use-attention-feed'
import { PAST_DUE_FOCUS, useDeadlineEngineStore, type DayFocus } from '@/stores/deadline-engine.store'
import { BUCKET_META, KIND_META, KIND_ORDER, countWords, duePhrase } from '../_lib/attention-meta'
import { useAttentionActions } from '../_hooks/use-attention-actions'
import { DateLeaf } from './DateLeaf'
import { DocketBriefSkeleton } from './skeletons'

const DAY_MS = 86_400_000
const DIARY_WEEKS = 2
const MAX_MARKS = 3

const PAST_COLUMN = PAST_DUE_FOCUS

/**
 * Suspends on the attention feed. Reads its own data and view state, so
 * it re-renders only when the feed, the clock or the day focus changes.
 */
export function DocketBrief() {
  const { activeItems, ready, now } = useAttentionItems()
  const focusDay = useDeadlineEngineStore((s) => s.focusDay)
  const setFocusDay = useDeadlineEngineStore((s) => s.setFocusDay)
  const busyKey = useDeadlineEngineStore((s) => s.busyKey)
  const { complete } = useAttentionActions()

  if (!ready) return <DocketBriefSkeleton />
  return (
    <DocketBriefView
      items={activeItems}
      now={now}
      focusDay={focusDay}
      onFocusDay={setFocusDay}
      busyKey={busyKey}
      onComplete={complete}
    />
  )
}

interface DocketBriefProps {
  items: AttentionItem[]
  now: number
  focusDay: DayFocus
  onFocusDay: (day: DayFocus) => void
  busyKey: string | null
  onComplete: (item: AttentionItem) => unknown
}

function DocketBriefView({ items, now, focusDay, onFocusDay, busyKey, onComplete }: DocketBriefProps) {
  const lead = items[0]

  return (
    <section
      className="overflow-hidden rounded-2xl border"
      style={{
        background: 'var(--cream-white)',
        borderColor: 'var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="px-4 py-5 sm:px-7 sm:py-6">
          <p className="text-[12px] font-medium" style={{ color: 'var(--gold-dark)' }}>
            {new Date(now).toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <h2
            className="mt-1 font-heading text-[22px] font-semibold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {greeting(now)}
          </h2>
          <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {briefSentence(items, now)}
          </p>

          {lead ? (
            <LeadEntry
              item={lead}
              now={now}
              busy={busyKey === lead.key}
              onComplete={onComplete}
            />
          ) : (
            <p
              className="mt-6 rounded-xl border border-dashed px-4 py-5 text-[13px]"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
            >
              Deadlines, hearings, court dates, tasks and invoices due in the
              next thirty days will be listed here as they arise.
            </p>
          )}
        </div>

        <div
          className="border-t px-4 py-5 sm:px-7 sm:py-6 lg:border-l lg:border-t-0"
          style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-card)' }}
        >
          <Diary items={items} now={now} focusDay={focusDay} onFocusDay={onFocusDay} />
        </div>
      </div>
    </section>
  )
}

// ── Lead entry ───────────────────────────────────────────────────────────

function LeadEntry({
  item, now, busy, onComplete,
}: { item: AttentionItem; now: number; busy: boolean; onComplete: (item: AttentionItem) => unknown }) {
  const kind = KIND_META[item.kind]
  const urgency = BUCKET_META[item.bucket]
  const late = item.bucket === 'overdue'

  return (
    <div className="mt-6">
      <p
        className="mb-2 text-[11.5px] font-semibold"
        style={{ color: 'var(--text-muted)' }}
      >
        {late ? 'Requires attention first' : 'Next on your docket'}
      </p>
      <div
        className="flex gap-4 rounded-xl border p-4"
        style={{
          background: 'var(--surface-card)',
          borderColor: late ? 'rgba(192,57,43,0.25)' : 'var(--border-default)',
        }}
      >
        <DateLeaf ts={item.dueAt} tone={urgency.color} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: kind.color }}>
            <kind.Icon size={14} weight="duotone" />
            {item.kind === 'event' && item.detail ? item.detail : kind.label}
          </div>
          <h3
            className="mt-1 font-heading text-[17px] font-semibold leading-snug line-clamp-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {item.title}
          </h3>
          {item.context && (
            <p className="mt-0.5 truncate text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
              {item.context}
            </p>
          )}
          <p className="mt-2 text-[13px] font-semibold" style={{ color: urgency.color }}>
            {duePhrase(item, now)}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={item.href}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--navy)', color: 'var(--cream-white)' }}
            >
              {item.kind === 'invoice' ? 'Open billing' : item.kind === 'task' ? 'Open tasks' : 'Open matter'}
              <ArrowRight size={13} weight="bold" />
            </Link>
            {item.completable && (
              <Button
                variant="outline"
                className="h-8 rounded-lg text-[12.5px]"
                disabled={busy}
                onClick={() => onComplete(item)}
              >
                <CheckCircle size={14} style={{ color: '#2E7D4F' }} />
                {item.kind === 'invoice' ? 'Mark paid' : 'Mark done'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Two-week diary ───────────────────────────────────────────────────────

interface DiaryDay {
  key: number
  date: Date
  isToday: boolean
  isPast: boolean
  isWeekend: boolean
  items: AttentionItem[]
}

function Diary({
  items, now, focusDay, onFocusDay,
}: Pick<DocketBriefProps, 'items' | 'now' | 'focusDay' | 'onFocusDay'>) {
  const today = startOfDay(now)
  // Start on the Monday of the current week so columns line up with
  // weekdays the way a printed diary does.
  const monday = new Date(today)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))

  const days: DiaryDay[] = Array.from({ length: DIARY_WEEKS * 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const key = date.getTime()
    return {
      key,
      date,
      isToday: key === today,
      isPast: key < today,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      items: items.filter((it) => it.bucket !== 'overdue' && startOfDay(it.dueAt) === key),
    }
  })

  const overdue = items.filter((i) => i.bucket === 'overdue')
  const rangeLabel = `${days[0].date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${days[days.length - 1].date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h3 className="font-heading text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          The fortnight ahead
        </h3>
        {focusDay !== null ? (
          <button
            type="button"
            onClick={() => onFocusDay(null)}
            className="text-[12px] font-semibold hover:underline underline-offset-2"
            style={{ color: 'var(--gold-dark)' }}
          >
            Show all
          </button>
        ) : (
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{rangeLabel}</span>
        )}
      </div>

      {overdue.length > 0 && (
        <button
          type="button"
          onClick={() => onFocusDay(focusDay === PAST_COLUMN ? null : PAST_COLUMN)}
          aria-pressed={focusDay === PAST_COLUMN}
          className="mt-3 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12.5px] transition-colors"
          style={{
            background: focusDay === PAST_COLUMN ? 'rgba(192,57,43,0.14)' : 'rgba(192,57,43,0.07)',
            color: '#A93226',
          }}
        >
          <span className="font-semibold">
            {countWords(overdue.length, 'item').replace(/^./, (c) => c.toUpperCase())} carried forward, past due
          </span>
          <ArrowRight size={13} weight="bold" />
        </button>
      )}

      <div className="mt-3 grid grid-cols-7 gap-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span
            key={i}
            className="pb-1 text-center text-[10.5px] font-semibold"
            style={{ color: i >= 5 ? 'var(--text-subtle)' : 'var(--text-muted)' }}
          >
            {d}
          </span>
        ))}
        {days.map((day) => (
          <DiaryCell
            key={day.key}
            day={day}
            active={focusDay === day.key}
            dimmed={focusDay !== null && focusDay !== day.key}
            onSelect={() => onFocusDay(focusDay === day.key ? null : day.key)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
        {KIND_ORDER.map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: KIND_META[k].color }} />
            {KIND_META[k].plural}
          </span>
        ))}
      </div>
    </div>
  )
}

function DiaryCell({
  day, active, dimmed, onSelect,
}: { day: DiaryDay; active: boolean; dimmed: boolean; onSelect: () => void }) {
  const count = day.items.length
  const marks = day.items.slice(0, MAX_MARKS)
  const label = `${day.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}: ${count ? countWords(count, 'item') : 'nothing listed'}`

  return (
    <button
      type="button"
      disabled={count === 0}
      onClick={onSelect}
      aria-pressed={active}
      aria-label={label}
      title={count ? day.items.map((i) => i.title).join('\n') : undefined}
      className="flex h-[54px] flex-col items-center justify-start rounded-lg border pt-1.5 transition-colors enabled:hover:border-[var(--gold)] disabled:cursor-default"
      style={{
        background: active
          ? 'var(--accent-today-tint-strong)'
          : day.isToday
            ? 'var(--accent-today-tint)'
            : day.isWeekend
              ? 'var(--surface-sunken)'
              : 'var(--surface-card)',
        borderColor: day.isToday || active ? 'var(--gold)' : 'var(--border-soft)',
        opacity: dimmed ? 0.45 : day.isPast ? 0.5 : 1,
      }}
    >
      <span
        className="text-[12.5px] font-semibold tabular-nums leading-none"
        style={{ color: day.isToday ? 'var(--gold-dark)' : 'var(--text-primary)' }}
      >
        {day.date.getDate()}
      </span>
      {count > 0 && (
        <span className="mt-1.5 flex items-center gap-[3px]">
          {marks.map((m) => (
            <span
              key={m.key}
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: KIND_META[m.kind].color }}
            />
          ))}
        </span>
      )}
      {count > MAX_MARKS && (
        <span className="mt-0.5 text-[9.5px] font-semibold" style={{ color: 'var(--text-muted)' }}>
          +{count - MAX_MARKS}
        </span>
      )}
    </button>
  )
}

// ── Written summary ──────────────────────────────────────────────────────

function greeting(now: number): string {
  const h = new Date(now).getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function briefSentence(items: AttentionItem[], now: number): string {
  const overdue = items.filter((i) => i.bucket === 'overdue').length
  const today = items.filter((i) => i.bucket === 'today').length
  const weekEnd = startOfDay(now) + 7 * DAY_MS
  const listings = items.filter(
    (i) => (i.kind === 'hearing' || i.kind === 'court') && i.bucket !== 'overdue' && i.dueAt < weekEnd,
  ).length
  const upcoming = items.filter((i) => i.bucket !== 'overdue').length

  const parts: string[] = []
  if (overdue) parts.push(`${countWords(overdue, 'item')} past due`)
  if (today) parts.push(`${countWords(today, 'item')} due today`)
  if (listings) parts.push(`${countWords(listings, 'hearing')} listed in the next seven days`)

  if (parts.length === 0) {
    return upcoming
      ? `Nothing is past due or due today. ${capitalise(countWords(upcoming, 'item'))} ${upcoming === 1 ? 'falls' : 'fall'} within the next thirty days.`
      : 'Nothing is past due and your diary is clear for the next thirty days.'
  }
  const joined =
    parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
  return `You have ${joined}.`
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
