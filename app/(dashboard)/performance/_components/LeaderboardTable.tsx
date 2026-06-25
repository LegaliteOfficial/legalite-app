'use client'

import { useState } from 'react'
import { CaretDown, CaretUp } from '@phosphor-icons/react'
import type { WorkerStats } from '../_hooks/use-performance'
import { NEGATIVE, POSITIVE } from '../_constants'

type SortKey =
  | 'name'
  | 'casesWon'
  | 'casesLost'
  | 'winRate'
  | 'clientsGained'
  | 'clientsLost'

/**
 * Per-worker leaderboard. Sortable by any measured column; defaults to
 * the order the hook provides (cases won, then clients). Revenue and
 * hours columns are present but stubbed until billing/time wiring.
 */
export function LeaderboardTable({ rows }: { rows: WorkerStats[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(
    null,
  )

  const sorted = sortRows(rows, sort)

  const toggle = (key: SortKey) =>
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
        : { key, dir: key === 'name' ? 'asc' : 'desc' },
    )

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border)',
        boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
      }}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="font-heading text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          By individual
        </h2>
        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          Revenue &amp; hours arrive once billing and time tracking are connected.
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              <Th label="Worker" sortKey="name" sort={sort} onSort={toggle} align="left" />
              <Th label="Cases won" sortKey="casesWon" sort={sort} onSort={toggle} />
              <Th label="Cases lost" sortKey="casesLost" sort={sort} onSort={toggle} />
              <Th label="Win rate" sortKey="winRate" sort={sort} onSort={toggle} />
              <Th label="Clients +" sortKey="clientsGained" sort={sort} onSort={toggle} />
              <Th label="Clients −" sortKey="clientsLost" sort={sort} onSort={toggle} />
              <ThStub label="Revenue" />
              <ThStub label="Hours" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const winPct = r.winRate === null ? null : Math.round(r.winRate * 100)
              return (
                <tr
                  key={r.worker.id}
                  style={{ borderBottom: i === sorted.length - 1 ? 'none' : '1px solid var(--border)' }}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full text-[12px] font-bold shrink-0"
                        style={{ background: 'var(--surface-overlay)', color: 'var(--navy)' }}
                      >
                        {initials(r.worker.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {r.worker.name}
                        </p>
                        <p className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>
                          {r.worker.title}
                        </p>
                      </div>
                    </div>
                  </td>
                  <Num value={r.casesWon} tone={r.casesWon > 0 ? POSITIVE : undefined} />
                  <Num value={r.casesLost} tone={r.casesLost > 0 ? NEGATIVE : undefined} />
                  <td className="px-4 py-3 text-[13px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                    {winPct === null ? '—' : `${winPct}%`}
                  </td>
                  <Num value={r.clientsGained} tone={r.clientsGained > 0 ? POSITIVE : undefined} prefix="+" />
                  <Num value={r.clientsLost} tone={r.clientsLost > 0 ? NEGATIVE : undefined} />
                  <td className="px-4 py-3 text-[13px]" style={{ color: 'var(--text-subtle)' }}>—</td>
                  <td className="px-4 py-3 text-[13px]" style={{ color: 'var(--text-subtle)' }}>—</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({
  label,
  sortKey,
  sort,
  onSort,
  align = 'right',
}: {
  label: string
  sortKey: SortKey
  sort: { key: SortKey; dir: 'asc' | 'desc' } | null
  onSort: (k: SortKey) => void
  align?: 'left' | 'right'
}) {
  const active = sort?.key === sortKey
  return (
    <th className={`${align === 'left' ? 'px-5 text-left' : 'px-4 text-right'} py-2.5`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${align === 'right' ? 'flex-row-reverse' : ''}`}
        style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        {label}
        {active &&
          (sort?.dir === 'desc' ? <CaretDown size={10} weight="bold" /> : <CaretUp size={10} weight="bold" />)}
      </button>
    </th>
  )
}

function ThStub({ label }: { label: string }) {
  return (
    <th className="px-4 py-2.5 text-right">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
        <span
          className="rounded px-1 py-0.5 text-[8.5px] font-bold tracking-wide"
          style={{ background: 'var(--gold-muted)', color: 'var(--gold-dark)' }}
        >
          SOON
        </span>
      </span>
    </th>
  )
}

function Num({ value, tone, prefix }: { value: number; tone?: string; prefix?: string }) {
  return (
    <td className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums" style={{ color: tone ?? 'var(--text-secondary)' }}>
      {value === 0 ? '0' : `${prefix ?? ''}${value}`}
    </td>
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

function sortRows(
  rows: WorkerStats[],
  sort: { key: SortKey; dir: 'asc' | 'desc' } | null,
): WorkerStats[] {
  if (!sort) return rows
  const dir = sort.dir === 'asc' ? 1 : -1
  const val = (r: WorkerStats): number | string => {
    switch (sort.key) {
      case 'name':
        return r.worker.name
      case 'winRate':
        return r.winRate ?? -1
      default:
        return r[sort.key]
    }
  }
  return [...rows].sort((a, b) => {
    const av = val(a)
    const bv = val(b)
    if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir
    return ((av as number) - (bv as number)) * dir
  })
}
