'use client'

/**
 * Pipeline view: the filtered cases grouped into columns by case stage,
 * so a partner can see where work is piling up. Cases without a stage
 * collect in their own column at the end. Cards open the case.
 */

import Link from 'next/link'
import { useMemo } from 'react'
import { CalendarBlank, Kanban } from '@phosphor-icons/react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { displayCaseCode } from '@/lib/reference-code'
import type { Case } from '@/types'
import { daysUntil, relativeDays, urgencyOf, URGENCY_STYLE } from '../[id]/_lib/case-details'

const NO_STAGE = 'No stage'

export function StagesBoard({ cases }: { cases: Case[] }) {
  const columns = useMemo(() => {
    const map = new Map<string, Case[]>()
    for (const c of cases) {
      const key = c.case_stage?.trim() || NO_STAGE
      map.set(key, [...(map.get(key) ?? []), c])
    }
    return [...map.entries()].sort(([a, ca], [b, cb]) => {
      if (a === NO_STAGE) return 1
      if (b === NO_STAGE) return -1
      return cb.length - ca.length || a.localeCompare(b)
    })
  }, [cases])

  if (cases.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center rounded-2xl border px-6 py-16 text-center" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)' }}>
        <Kanban size={28} weight="duotone" style={{ color: 'var(--gold)' }} />
        <p className="mt-2 text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>No cases match</p>
        <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>Change the status or filters to see cases here.</p>
      </div>
    )
  }

  return (
    <div className="mt-4 flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">
      {columns.map(([stage, items]) => (
        <section
          key={stage}
          className="flex max-h-full w-[290px] shrink-0 flex-col rounded-2xl border"
          style={{ background: 'rgba(13,27,42,0.025)', borderColor: 'var(--border-soft)' }}
        >
          <header className="flex items-center gap-2 px-3.5 py-3">
            <h3 className="truncate text-[13px] font-semibold" style={{ color: stage === NO_STAGE ? 'var(--text-muted)' : 'var(--text-primary)' }}>
              {stage}
            </h3>
            <span className="rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)' }}>
              {items.length}
            </span>
          </header>
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2.5 pb-2.5">
            {items.map((c) => <StageCard key={c.id} kase={c} />)}
          </ul>
        </section>
      ))}
    </div>
  )
}

function StageCard({ kase }: { kase: Case }) {
  const days = kase.status === 'Closed' ? null : daysUntil(kase.next_court_date)
  const u = URGENCY_STYLE[urgencyOf(days)]
  const code = displayCaseCode(kase.case_code)
  return (
    <li>
      <Link
        href={`/cases/${kase.id}`}
        className="block rounded-xl border p-3 transition-all hover:-translate-y-px hover:shadow-md"
        style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-[13px] font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{kase.title}</p>
          <StatusBadge status={kase.status} />
        </div>
        <p className="mt-1 truncate text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {[kase.client_name, code].filter(Boolean).join(' · ') || 'No client'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {kase.case_type && (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}>
              {kase.case_type}
            </span>
          )}
          {days !== null && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: u.fg, background: u.bg }}>
              <CalendarBlank size={11} /> Court {relativeDays(days)}
            </span>
          )}
        </div>
        {kase.assigned_lawyer && (
          <p className="mt-2 truncate text-[11.5px]" style={{ color: 'var(--text-muted)' }}>{kase.assigned_lawyer}</p>
        )}
      </Link>
    </li>
  )
}
