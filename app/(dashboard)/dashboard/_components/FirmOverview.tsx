'use client'

import { useMemo, useState } from 'react'
import {
  CaretDown,
  CaretLeft,
  CaretRight,
  Question,
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import {
  MONTHS,
  UNIT_OPTIONS,
  UTILISATION_COLORS,
  Y_TICKS,
} from '../_constants'
import type { UnitId } from '../_types'
import { useFirmUtilisation } from '@/hooks/use-firm-utilisation'
import { useClientRatesStore } from '@/stores/client-rates-local.store'
import { formatCurrency } from '@/lib/format-currency'
import { SectionHeading } from './SectionHeading'
import { LegendSwatch } from './shared/LegendSwatch'
import { Pill } from './shared/Pill'
import { TotalsMini } from './shared/TotalsMini'

/**
 * Firm overview card — utilisation chart with year selector, unit
 * toggle (Hr / GHS / %), and a rate-average / totals side panel. The
 * data tier isn't wired yet so the body shows an empty-state message;
 * the chrome is structurally complete so it lights up the moment the
 * utilisation ledger ships.
 */
/** Hours read as "12.5h"; the GHS unit shows money instead. */
function hours(n: number): string {
  if (n <= 0) return '—'
  return `${n % 1 === 0 ? n : n.toFixed(1)}h`
}

export function FirmOverview() {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [unit, setUnit] = useState<UnitId>('hr')
  const [expanded, setExpanded] = useState(true)

  const data = useFirmUtilisation(year)
  const currency = useClientRatesStore((s) => s.firm_default_currency)

  // Hours, money or share of capacity — the same three series, measured
  // differently. Percent is of that month's total, so the bars read as a
  // split rather than three unrelated magnitudes.
  const series = useMemo(
    () =>
      data.months.map((m) => {
        if (unit === 'ghs') {
          return { billable: m.billableAmount, nonBillable: 0, untracked: 0 }
        }
        const total = m.billableHours + m.nonBillableHours + m.untrackedHours
        if (unit === 'pct') {
          if (total <= 0) return { billable: 0, nonBillable: 0, untracked: 0 }
          return {
            billable: m.billableHours / total,
            nonBillable: m.nonBillableHours / total,
            untracked: m.untrackedHours / total,
          }
        }
        return {
          billable: m.billableHours,
          nonBillable: m.nonBillableHours,
          untracked: m.untrackedHours,
        }
      }),
    [data.months, unit],
  )

  // Scale to the tallest stack so the chart uses its full height.
  const axisLabel = (fraction: number): string => {
    if (peak <= 0) return unit === 'pct' ? `${Math.round(fraction * 100)}%` : '0'
    const v = fraction * peak
    if (unit === 'pct') return `${Math.round(v * 100)}%`
    if (unit === 'ghs') {
      // Thousands keep the axis narrow; the tooltip carries the exact figure.
      return v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v))
    }
    return v >= 100 ? String(Math.round(v)) : v.toFixed(0)
  }

  const formatTotal = (h: number, amount: number) =>
    unit === 'ghs' ? (amount > 0 ? formatCurrency(amount, currency) : '—') : hours(h)

  // Scale to the tallest stack so the chart uses its full height. Left to
  // the React Compiler rather than a manual useMemo, which it could not
  // preserve once the helpers below closed over this value.
  const peak = series.reduce(
    (max, m) => Math.max(max, m.billable + m.nonBillable + m.untracked),
    0,
  )

  return (
    <section>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <SectionHeading title="Firm overview" />
          <p
            className="mt-1 text-[12px]"
            style={{ color: 'var(--text-muted)' }}
          >
            Data last refreshed 4 hours ago · 05/20/2026 10:00 PM GMT
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill>
            GHS (GH) <CaretDown size={12} strokeWidth={2} />
          </Pill>
          <Pill>
            All users <CaretDown size={12} strokeWidth={2} />
          </Pill>
          <div
            className="flex items-center rounded-lg border overflow-hidden"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
            }}
          >
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              aria-label="Previous year"
              className="px-2 py-1.5 hover:bg-black/5 transition-colors"
            >
              <CaretLeft
                size={13}
                strokeWidth={1.75}
                style={{ color: 'var(--text-secondary)' }}
              />
            </button>
            <span
              className="px-3 text-[13px] font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {year}
            </span>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              aria-label="Next year"
              className="px-2 py-1.5 hover:bg-black/5 transition-colors"
            >
              <CaretRight
                size={13}
                strokeWidth={1.75}
                style={{ color: 'var(--text-secondary)' }}
              />
            </button>
          </div>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-3.5 border-b"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2"
          >
            <CaretDown
              size={15}
              strokeWidth={2}
              style={{
                color: 'var(--text-secondary)',
                transform: expanded ? 'none' : 'rotate(-90deg)',
                transition: 'transform 180ms ease',
              }}
            />
            <span
              className="font-heading text-[15px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Utilisation
            </span>
            <Question
              size={12}
              strokeWidth={1.75}
              style={{ color: 'var(--text-subtle)' }}
            />
          </button>
          <div
            className="flex items-center gap-1.5 text-[12px]"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>
              Activities dated{' '}
              <span
                className="font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Jan 1 – May 21, {year}
              </span>
            </span>
            <Question
              size={12}
              strokeWidth={1.75}
              style={{ color: 'var(--text-subtle)' }}
            />
          </div>
        </div>

        {expanded && (
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]">
            <div
              className="p-6 border-r"
              style={{ borderColor: 'var(--border-soft)' }}
            >
              <div className="flex items-center gap-1.5 mb-3">
                <span
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Rate average
                </span>
                <Question
                  size={11}
                  strokeWidth={1.75}
                  style={{ color: 'var(--text-subtle)' }}
                />
              </div>
              <div className="flex h-24 flex-col items-center justify-center">
                {data.averageRate == null ? (
                  <p
                    className="text-[12px] text-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No billable time recorded for {year}
                  </p>
                ) : (
                  <>
                    <span
                      className="text-[26px] font-semibold tabular-nums leading-none"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {formatCurrency(data.averageRate, currency)}
                    </span>
                    <span
                      className="mt-1.5 text-[11.5px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      per billable hour
                    </span>
                    {data.utilisationRate != null && (
                      <span
                        className="mt-1 text-[11.5px] tabular-nums"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {Math.round(data.utilisationRate * 100)}% of recorded time
                        is billable
                      </span>
                    )}
                  </>
                )}
              </div>

              <div
                className="mt-5 pt-5 border-t"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <span
                    className="text-[11px] font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Totals
                  </span>
                  <Question
                    size={11}
                    strokeWidth={1.75}
                    style={{ color: 'var(--text-subtle)' }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <TotalsMini
                    label="Billable"
                    color={UTILISATION_COLORS.billable}
                    value={formatTotal(data.totals.billableHours, data.totals.billableAmount)}
                  />
                  <TotalsMini
                    label="Non-billable"
                    color={UTILISATION_COLORS.nonBillable}
                    value={formatTotal(data.totals.nonBillableHours, 0)}
                  />
                  <TotalsMini
                    label="Untracked"
                    color={UTILISATION_COLORS.untracked}
                    value={formatTotal(data.totals.untrackedHours, 0)}
                  />
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Monthly
                </span>
                <div
                  className="flex items-center rounded-lg border overflow-hidden text-[11px] font-medium"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  {UNIT_OPTIONS.map((opt) => {
                    const active = opt.id === unit
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setUnit(opt.id)}
                        className="px-3 py-1.5 transition-colors"
                        style={{
                          background: active ? 'var(--navy)' : 'transparent',
                          color: active ? 'white' : 'var(--text-secondary)',
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="relative h-56">
                <div
                  className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-right pr-2"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  {/* Ticks are fractions of the tallest column, so the
                      axis matches whatever the chart is actually showing
                      rather than a fixed 0–1 scale. */}
                  {Y_TICKS.map((t) => (
                    <span key={t}>{axisLabel(t)}</span>
                  ))}
                </div>
                <div
                  className="absolute left-8 right-0 top-0 bottom-6 border-l border-b"
                  style={{ borderColor: 'var(--border-soft)' }}
                >
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {Y_TICKS.map((t, i) => (
                      <div
                        key={i}
                        className="border-t"
                        style={{
                          borderColor:
                            i === Y_TICKS.length - 1
                              ? 'transparent'
                              : 'var(--border-soft)',
                        }}
                      />
                    ))}
                  </div>
                  {peak <= 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p
                        className="text-[12px]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Nothing recorded for {year} yet. Run a timer or raise a
                        bill and it will appear here.
                      </p>
                    </div>
                  ) : (
                    /* One stacked column per month: billable at the base,
                       then non-billable, then untracked capacity on top. */
                    <div className="absolute inset-0 flex items-end gap-[3%] px-[1.5%]">
                      {series.map((m, i) => {
                        const stack = [
                          { key: 'billable', v: m.billable, c: UTILISATION_COLORS.billable },
                          { key: 'nonBillable', v: m.nonBillable, c: UTILISATION_COLORS.nonBillable },
                          { key: 'untracked', v: m.untracked, c: UTILISATION_COLORS.untracked },
                        ]
                        const total = m.billable + m.nonBillable + m.untracked
                        return (
                          <div
                            key={MONTHS[i]}
                            className="flex h-full flex-1 flex-col justify-end"
                            title={`${MONTHS[i]} ${year}: ${
                              unit === 'ghs'
                                ? formatCurrency(m.billable, currency)
                                : unit === 'pct'
                                  ? `${Math.round(m.billable * 100)}% billable`
                                  : `${hours(m.billable)} billable`
                            }`}
                          >
                            {stack.map(({ key, v, c }) =>
                              v <= 0 ? null : (
                                <div
                                  key={key}
                                  style={{
                                    height: `${(v / peak) * 100}%`,
                                    background: c,
                                    // Round only the top of the stack.
                                    borderTopLeftRadius: key === 'untracked' || total === v ? 3 : 0,
                                    borderTopRightRadius: key === 'untracked' || total === v ? 3 : 0,
                                  }}
                                />
                              ),
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div
                  className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px]"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  {MONTHS.map((m) => (
                    <span
                      key={m}
                      className="flex flex-col items-center leading-tight"
                    >
                      <span>{m}</span>
                      <span>{year}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="mt-5 grid grid-cols-3 gap-x-6 gap-y-1.5 text-[10px] uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                <LegendSwatch
                  color={UTILISATION_COLORS.billable}
                  label="Billable"
                />
                <LegendSwatch
                  color={UTILISATION_COLORS.nonBillable}
                  label="Non-billable"
                />
                <LegendSwatch
                  color={UTILISATION_COLORS.untracked}
                  label="Untracked"
                />
                <LegendSwatch
                  color={UTILISATION_COLORS.billable}
                  label={`${year - 1} billable`}
                  dashed
                />
                <LegendSwatch
                  color={UTILISATION_COLORS.nonBillable}
                  label={`${year - 1} non-billable`}
                  dashed
                />
                <LegendSwatch
                  color={UTILISATION_COLORS.untracked}
                  label={`${year - 1} untracked`}
                  dashed
                />
              </div>
            </div>
          </div>
        )}
      </Card>
    </section>
  )
}
