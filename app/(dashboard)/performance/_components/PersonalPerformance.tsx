'use client'

import type { Worker } from '@/stores/performance-local.store'
import type { PersonalPerformance as PersonalData } from '../_hooks/use-performance'
import type { PeriodId } from '../_lib/period'
import { OUTCOME_META, NEGATIVE, POSITIVE } from '../_constants'
import { SummaryStrip } from './SummaryStrip'

/**
 * One worker's performance — KPI tiles plus their recorded outcomes for
 * the period. Drives the member experience and an admin's "Mine" view.
 */
export function PersonalPerformance({
  worker,
  data,
  periodId,
  heading,
}: {
  worker: Worker
  data: PersonalData
  periodId: PeriodId
  /** Override the section heading (admin "Mine" vs member). */
  heading?: string
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center justify-center h-11 w-11 rounded-full text-[14px] font-bold shrink-0"
          style={{ background: 'var(--navy)', color: 'white' }}
        >
          {initials(worker.name)}
        </span>
        <div>
          <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
            {heading ?? 'Your performance'}
          </p>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {worker.name} · {worker.title}
          </p>
        </div>
      </div>

      <SummaryStrip totals={data.totals} prevTotals={data.prevTotals} periodId={periodId} />

      <section
        className="rounded-2xl border overflow-hidden"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
          boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
        }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-heading text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            Your recorded outcomes
          </h2>
        </div>
        {data.outcomes.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Nothing recorded in this period yet. Use “Record outcome” to add one.
          </p>
        ) : (
          <ul>
            {data.outcomes.map((o, i) => {
              const meta = OUTCOME_META[o.type]
              return (
                <li
                  key={o.id}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: i === data.outcomes.length - 1 ? 'none' : '1px solid var(--border)' }}
                >
                  <span
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-semibold shrink-0"
                    style={{
                      background: meta.tone === 'positive' ? 'rgba(33,106,67,0.12)' : 'rgba(192,57,43,0.12)',
                      color: meta.tone === 'positive' ? POSITIVE : NEGATIVE,
                    }}
                  >
                    {meta.label}
                  </span>
                  <span className="flex-1 text-[13.5px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {o.label}
                  </span>
                  <span className="text-[12.5px] tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {new Date(o.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
