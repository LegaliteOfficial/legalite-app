'use client'

import { CaretDown } from '@phosphor-icons/react'
import { PERIODS, type PeriodId } from '../_lib/period'

/** Preset date-range selector that governs the whole page. */
export function PeriodSelector({
  value,
  onChange,
}: {
  value: PeriodId
  onChange: (id: PeriodId) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PeriodId)}
        aria-label="Reporting period"
        className="appearance-none rounded-lg border bg-white h-9 pl-3 pr-9 text-sm font-medium focus:outline-none focus:border-yellow-600"
        style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
      >
        {PERIODS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <CaretDown
        size={13}
        strokeWidth={2.25}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--text-muted)' }}
      />
    </div>
  )
}
