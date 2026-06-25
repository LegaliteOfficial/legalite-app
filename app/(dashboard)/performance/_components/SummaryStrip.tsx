'use client'

import { ArrowDown, ArrowUp, Minus } from '@phosphor-icons/react'
import { comparisonLabel, type PeriodId } from '../_lib/period'
import type { Totals } from '../_hooks/use-performance'
import { NEGATIVE, POSITIVE } from '../_constants'

/**
 * Firm-wide totals for the selected period as KPI tiles, each with a
 * delta vs. the prior period. Revenue and hours tiles are stubbed until
 * billing and time tracking are wired in.
 */
export function SummaryStrip({
  totals,
  prevTotals,
  periodId,
}: {
  totals: Totals
  prevTotals: Totals
  periodId: PeriodId
}) {
  const winPct = totals.winRate === null ? null : Math.round(totals.winRate * 100)
  const netClients = totals.clientsGained - totals.clientsLost

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <Tile
        label="Cases won"
        value={totals.casesWon}
        delta={totals.casesWon - prevTotals.casesWon}
        periodId={periodId}
        good="up"
      />
      <Tile
        label="Cases lost"
        value={totals.casesLost}
        delta={totals.casesLost - prevTotals.casesLost}
        periodId={periodId}
        good="down"
      />
      <Tile
        label="Win rate"
        value={winPct === null ? '—' : `${winPct}%`}
        periodId={periodId}
      />
      <Tile
        label="New clients"
        value={totals.clientsGained}
        delta={totals.clientsGained - prevTotals.clientsGained}
        periodId={periodId}
        good="up"
      />
      <Tile
        label="Clients lost"
        value={totals.clientsLost}
        delta={totals.clientsLost - prevTotals.clientsLost}
        periodId={periodId}
        good="down"
      />
      <Tile label="Net clients" value={netClients >= 0 ? `+${netClients}` : `${netClients}`} periodId={periodId} />
    </div>
  )
}

function Tile({
  label,
  value,
  delta,
  periodId,
  good,
}: {
  label: string
  value: string | number
  delta?: number
  periodId: PeriodId
  /** Which direction is favourable, for colouring the delta. */
  good?: 'up' | 'down'
}) {
  const cmp = comparisonLabel(periodId)
  const showDelta = delta !== undefined && periodId !== 'all_time' && cmp !== ''
  const up = (delta ?? 0) > 0
  const flat = (delta ?? 0) === 0
  const favorable = good ? (good === 'up' ? up : !up && !flat) : up
  const color = flat ? 'var(--text-muted)' : favorable ? POSITIVE : NEGATIVE

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border)',
        boxShadow: '0 2px 12px rgba(13,27,42,0.04)',
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="font-heading text-[26px] font-extrabold leading-tight mt-1 tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      {showDelta && (
        <p className="flex items-center gap-1 text-[11.5px] font-medium mt-0.5" style={{ color }}>
          {flat ? <Minus size={11} weight="bold" /> : up ? <ArrowUp size={11} weight="bold" /> : <ArrowDown size={11} weight="bold" />}
          {flat ? 'No change' : `${Math.abs(delta ?? 0)} vs ${cmp}`}
        </p>
      )}
    </div>
  )
}
