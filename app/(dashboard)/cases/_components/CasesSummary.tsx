'use client'

/**
 * Practice snapshot above the cases table: active workload by status and
 * the two kinds of date that cannot be missed (court appearances this
 * week, limitation dates within 30 days). Status tiles filter the table.
 */

import { useMemo } from 'react'
import { CalendarBlank, Hourglass } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { Case } from '@/types'
import { daysUntil, parseCaseDetails } from '../[id]/_lib/case-details'
import type { StatusFilter } from '../_types'

export function useCaseSignals(cases: Case[]) {
  return useMemo(() => {
    let courtThisWeek = 0
    let limitationSoon = 0
    for (const c of cases) {
      if (c.status === 'Closed') continue
      const court = daysUntil(c.next_court_date)
      if (court !== null && court >= 0 && court <= 7) courtThisWeek++
      const d = parseCaseDetails(c.details)
      const sol = daysUntil(d.statute_of_limitations_date)
      if (sol !== null && !d.statute_of_limitations_satisfied && sol <= 30) limitationSoon++
    }
    return { courtThisWeek, limitationSoon }
  }, [cases])
}

export function CasesSummary({
  cases,
  counts,
  status,
  onStatus,
}: {
  cases: Case[]
  counts: Record<StatusFilter, number>
  status: StatusFilter
  onStatus: (s: StatusFilter) => void
}) {
  const { courtThisWeek, limitationSoon } = useCaseSignals(cases)
  const tiles: { key: StatusFilter; label: string; dot: string }[] = [
    { key: 'Open', label: 'Open', dot: '#12B76A' },
    { key: 'Pending', label: 'Pending', dot: '#F79009' },
    { key: 'Closed', label: 'Closed', dot: '#98A2B3' },
  ]
  return (
    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t) => {
        const active = status === t.key
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onStatus(active ? 'All' : t.key)}
            aria-pressed={active}
            className={cn('cases-tile rounded-2xl border px-4 py-3 text-left transition-all hover:-translate-y-px')}
            style={{
              background: 'var(--surface-card)',
              borderColor: active ? 'var(--gold)' : 'var(--border-soft)',
              boxShadow: active ? '0 0 0 3px var(--gold-muted)' : 'var(--shadow-xs)',
            }}
          >
            <span className="flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.dot }} /> {t.label}
            </span>
            <span className="mt-1 block font-heading text-[24px] leading-none tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {counts[t.key]}
            </span>
          </button>
        )
      })}
      <Signal icon={<CalendarBlank size={13} />} label="Court this week" value={courtThisWeek} hot={courtThisWeek > 0} />
      <Signal icon={<Hourglass size={13} />} label="Limitation in 30 days" value={limitationSoon} hot={limitationSoon > 0} danger />
    </div>
  )
}

function Signal({ icon, label, value, hot, danger }: { icon: React.ReactNode; label: string; value: number; hot: boolean; danger?: boolean }) {
  const fg = hot ? (danger ? '#B42318' : '#B54708') : 'var(--text-primary)'
  return (
    <div
      className="cases-tile rounded-2xl border px-4 py-3"
      style={{
        background: hot ? (danger ? 'rgba(217,45,32,0.05)' : 'rgba(247,144,9,0.06)') : 'var(--surface-card)',
        borderColor: hot ? (danger ? 'rgba(217,45,32,0.2)' : 'rgba(247,144,9,0.25)') : 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <span className="flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-[0.06em]" style={{ color: hot ? fg : 'var(--text-muted)' }}>
        {icon} {label}
      </span>
      <span className="mt-1 block font-heading text-[24px] leading-none tabular-nums" style={{ color: fg }}>
        {value}
      </span>
    </div>
  )
}
