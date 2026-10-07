'use client'

/**
 * Pressure hero — the top band of the Deadline engine.
 *
 * Left: the single most pressing item with a live countdown. Right: a
 * fourteen-day horizon where each column is a day and its stacked bar
 * shows how much lands on it, coloured by source. The leading "Past"
 * column carries everything overdue. Clicking a column focuses the
 * timeline below on that day.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, SealCheck } from '@phosphor-icons/react'
import type { AttentionItem } from '@/hooks/use-attention-feed'
import { startOfDay } from '@/hooks/use-attention-feed'
import { KIND_META, KIND_ORDER, countdownParts, formatDueTime } from '../_lib/attention-meta'

const HORIZON_COLUMNS = 14
const DAY_MS = 86_400_000
const BAR_MAX_PX = 64

/** Day key used for horizon focus: start-of-day epoch, or -1 for "Past". */
export type DayFocus = number | null
export const PAST_COLUMN = -1

interface PressureHeroProps {
  items: AttentionItem[]
  now: number
  focusDay: DayFocus
  onFocusDay: (day: DayFocus) => void
}

export function PressureHero({ items, now, focusDay, onFocusDay }: PressureHeroProps) {
  const next = items[0]
  const overdue = items.filter((i) => i.bucket === 'overdue').length
  const today = items.filter((i) => i.bucket === 'today').length
  const week = items.filter((i) => i.bucket !== 'overdue' && i.bucket !== 'later').length

  return (
    <section
      className="relative overflow-hidden rounded-3xl"
      style={{
        background: 'var(--navy)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Soft gold glow anchored behind the countdown. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(201,151,43,0.28), transparent 65%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, #F8F4EE 0 1px, transparent 1px 56px)',
        }}
      />

      <div className="relative grid gap-8 p-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {next ? <NextUp item={next} /> : <AllClear />}

        <div className="flex flex-col justify-between gap-6">
          <div className="grid grid-cols-3 gap-3">
            <HeroMetric label="Overdue" value={overdue} tone={overdue ? '#F1948A' : undefined} />
            <HeroMetric label="Due today" value={today} tone={today ? 'var(--gold-light)' : undefined} />
            <HeroMetric label="Next 7 days" value={week} />
          </div>
          <Horizon items={items} now={now} focusDay={focusDay} onFocusDay={onFocusDay} />
        </div>
      </div>
    </section>
  )
}

// ── Next up + countdown ──────────────────────────────────────────────────

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function NextUp({ item }: { item: AttentionItem }) {
  const now = useNow(1000)
  const diff = item.dueAt - now
  const late = diff < 0
  const { days, hours, minutes, seconds } = countdownParts(diff)
  const meta = KIND_META[item.kind]

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-1.5 w-1.5 rounded-full animate-pulse"
          style={{ background: late ? '#F1948A' : 'var(--gold-light)' }}
        />
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: 'rgba(248,244,238,0.6)' }}
        >
          {late ? 'Most overdue' : 'Next up'}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: 'rgba(248,244,238,0.08)', color: 'var(--cream)' }}
        >
          <meta.Icon size={12} weight="bold" />
          {item.detail && item.kind !== 'deadline' ? item.detail : meta.label}
        </span>
        <span className="text-[12px] truncate" style={{ color: 'rgba(248,244,238,0.55)' }}>
          {formatDueTime(item.dueAt, item.allDay)}
        </span>
      </div>

      <h2
        className="mt-3 font-heading text-[24px] font-semibold leading-snug tracking-tight line-clamp-2"
        style={{ color: 'var(--cream-white)' }}
      >
        {item.title}
      </h2>
      {item.context && (
        <p className="mt-1 text-[13px] truncate" style={{ color: 'rgba(248,244,238,0.6)' }}>
          {item.context}
        </p>
      )}

      <div className="mt-6 flex items-end gap-2" aria-live="off">
        {late && (
          <span
            className="mb-1.5 mr-1 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: '#F1948A' }}
          >
            Late by
          </span>
        )}
        <CountdownUnit value={days} unit="days" late={late} />
        <CountdownColon />
        <CountdownUnit value={hours} unit="hrs" late={late} />
        <CountdownColon />
        <CountdownUnit value={minutes} unit="min" late={late} />
        <CountdownColon />
        <CountdownUnit value={seconds} unit="sec" late={late} dim />
      </div>

      <Link
        href={item.href}
        className="mt-6 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-90"
        style={{ background: 'var(--gold)', color: 'var(--navy)' }}
      >
        Open
        <ArrowUpRight size={12} weight="bold" />
      </Link>
    </div>
  )
}

function CountdownUnit({
  value, unit, late, dim,
}: { value: number; unit: string; late: boolean; dim?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="font-heading text-[40px] font-semibold leading-none tabular-nums tracking-tight"
        style={{
          color: late ? '#F1948A' : 'var(--gold-light)',
          opacity: dim ? 0.55 : 1,
        }}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span
        className="mt-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: 'rgba(248,244,238,0.45)' }}
      >
        {unit}
      </span>
    </div>
  )
}

function CountdownColon() {
  return (
    <span
      className="mb-[22px] font-heading text-[28px] leading-none"
      style={{ color: 'rgba(248,244,238,0.25)' }}
    >
      :
    </span>
  )
}

function AllClear() {
  return (
    <div className="flex flex-col justify-center">
      <span
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(201,151,43,0.16)' }}
      >
        <SealCheck size={22} weight="fill" style={{ color: 'var(--gold-light)' }} />
      </span>
      <h2
        className="mt-4 font-heading text-[24px] font-semibold tracking-tight"
        style={{ color: 'var(--cream-white)' }}
      >
        Nothing is pressing
      </h2>
      <p className="mt-1 max-w-sm text-[13px]" style={{ color: 'rgba(248,244,238,0.6)' }}>
        No overdue work and nothing due in the next thirty days across deadlines,
        tasks, hearings, court dates or invoices.
      </p>
    </div>
  )
}

function HeroMetric({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ background: 'rgba(248,244,238,0.05)', border: '1px solid rgba(248,244,238,0.08)' }}
    >
      <div
        className="font-heading text-[26px] font-semibold leading-none tabular-nums"
        style={{ color: tone ?? 'var(--cream-white)' }}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[11px] font-medium" style={{ color: 'rgba(248,244,238,0.55)' }}>
        {label}
      </div>
    </div>
  )
}

// ── Fourteen-day horizon ─────────────────────────────────────────────────

interface HorizonColumn {
  key: number
  label: string
  sub: string
  isToday: boolean
  isPast: boolean
  counts: Partial<Record<keyof typeof KIND_META, number>>
  total: number
}

function Horizon({ items, now, focusDay, onFocusDay }: PressureHeroProps) {
  const columns = useMemo<HorizonColumn[]>(() => {
    const sod = startOfDay(now)
    const cols: HorizonColumn[] = [
      { key: PAST_COLUMN, label: 'Past', sub: 'due', isToday: false, isPast: true, counts: {}, total: 0 },
    ]
    for (let i = 0; i < HORIZON_COLUMNS - 1; i++) {
      const d = new Date(sod + i * DAY_MS)
      cols.push({
        key: d.getTime(),
        label: i === 0 ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short' }),
        sub: String(d.getDate()),
        isToday: i === 0,
        isPast: false,
        counts: {},
        total: 0,
      })
    }
    for (const item of items) {
      const col =
        item.bucket === 'overdue'
          ? cols[0]
          : cols.find((c) => !c.isPast && c.key === startOfDay(item.dueAt))
      if (!col) continue
      col.counts[item.kind] = (col.counts[item.kind] ?? 0) + 1
      col.total += 1
    }
    return cols
  }, [items, now])

  const peak = Math.max(3, ...columns.map((c) => c.total))

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: 'rgba(248,244,238,0.6)' }}
        >
          Two-week horizon
        </span>
        {focusDay !== null && (
          <button
            type="button"
            onClick={() => onFocusDay(null)}
            className="text-[11px] font-semibold underline-offset-2 hover:underline"
            style={{ color: 'var(--gold-light)' }}
          >
            Clear day focus
          </button>
        )}
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((col) => {
          const active = focusDay === col.key
          const dimmed = focusDay !== null && !active
          return (
            <button
              key={col.key}
              type="button"
              disabled={col.total === 0}
              onClick={() => onFocusDay(active ? null : col.key)}
              aria-label={`${col.label} ${col.sub}: ${col.total} item${col.total === 1 ? '' : 's'}`}
              aria-pressed={active}
              className="group flex flex-col items-center rounded-xl px-0.5 pb-1.5 pt-2 transition-all disabled:cursor-default"
              style={{
                background: active ? 'rgba(201,151,43,0.18)' : 'transparent',
                opacity: dimmed ? 0.4 : 1,
              }}
            >
              <span
                className="mb-1 text-[10px] font-semibold tabular-nums"
                style={{
                  color: col.total ? 'var(--cream)' : 'transparent',
                }}
              >
                {col.total || '0'}
              </span>
              <div
                className="flex w-full max-w-[18px] flex-col-reverse overflow-hidden rounded-md"
                style={{
                  height: BAR_MAX_PX,
                  background: 'rgba(248,244,238,0.06)',
                }}
              >
                {col.isPast
                  ? col.total > 0 && (
                      <div style={{ height: (col.total / peak) * BAR_MAX_PX, background: '#E2725B' }} />
                    )
                  : KIND_ORDER.map((k) => {
                      const n = col.counts[k] ?? 0
                      if (!n) return null
                      return (
                        <div
                          key={k}
                          style={{
                            height: (n / peak) * BAR_MAX_PX,
                            background: HORIZON_KIND_COLOR[k],
                            borderTop: '1px solid var(--navy)',
                          }}
                        />
                      )
                    })}
              </div>
              <span
                className="mt-1.5 text-[9.5px] font-semibold uppercase tracking-wide"
                style={{
                  color: col.isToday
                    ? 'var(--gold-light)'
                    : col.isPast
                      ? '#F1948A'
                      : 'rgba(248,244,238,0.5)',
                }}
              >
                {col.label}
              </span>
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: col.isToday ? 'var(--gold-light)' : 'rgba(248,244,238,0.75)' }}
              >
                {col.sub}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {KIND_ORDER.map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[10.5px]" style={{ color: 'rgba(248,244,238,0.55)' }}>
            <span className="h-2 w-2 rounded-sm" style={{ background: HORIZON_KIND_COLOR[k] }} />
            {KIND_META[k].plural}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Brighter variants of the kind colours that read on the navy band. */
const HORIZON_KIND_COLOR: Record<keyof typeof KIND_META, string> = {
  deadline: '#E8B84B',
  task: '#6FCF97',
  hearing: '#F2A65A',
  court: '#A5B4FC',
  event: '#7DB3F5',
  invoice: '#5EEAD4',
}
