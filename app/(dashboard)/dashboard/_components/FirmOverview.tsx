'use client'

import { useState } from 'react'
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
export function FirmOverview() {
  const [year, setYear] = useState(2026)
  const [unit, setUnit] = useState<UnitId>('hr')
  const [expanded, setExpanded] = useState(true)

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
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]">
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
              <div className="h-24 flex items-center justify-center">
                <p
                  className="text-[12px] text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  You have no data to display for this period
                </p>
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
                  />
                  <TotalsMini
                    label="Non-billable"
                    color={UTILISATION_COLORS.nonBillable}
                  />
                  <TotalsMini
                    label="Untracked"
                    color={UTILISATION_COLORS.untracked}
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
                  {Y_TICKS.map((t) => (
                    <span key={t}>{t}</span>
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
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p
                      className="text-[12px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      You have no data to display for this period
                    </p>
                  </div>
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
