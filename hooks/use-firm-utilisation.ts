'use client'

/**
 * Firm utilisation and billing, aggregated by month.
 *
 * The Firm overview card rendered a fixed "You have no data to display for
 * this period" and a chart with no series, regardless of what the firm had
 * actually recorded. Time entries and bills were already being captured;
 * nothing read them back.
 *
 * Sources, all local persisted stores today:
 *   - time entries  -> hours worked, split billable / non-billable
 *   - bills         -> invoiced, collected, outstanding
 *
 * When these move to the backend the component keeps reading this hook and
 * only the three store reads below change.
 */

import { useEffect, useMemo, useState } from 'react'
import { useBillsLocalStore, type Bill } from '@/stores/bills-local.store'
import {
  useTimeTrackerStore,
  type TimeEntry,
} from '@/stores/time-tracker-local.store'

/**
 * How often the figures advance while a timer is running. Hours are shown
 * to one decimal, so a second-by-second tick would redraw the chart far
 * more often than the numbers actually change.
 */
const TICK_MS = 15_000

/**
 * Working hours a full time fee earner is expected to record in a month.
 * Only applied to months that already have activity, so the figure never
 * manufactures unworked time for a quiet period.
 */
export const MONTHLY_CAPACITY_HOURS = 160

export interface MonthBuckets {
  /** Hours against a paying rate. */
  billableHours: number
  /** Hours recorded with no rate attached — written off, pro bono, admin. */
  nonBillableHours: number
  /** Capacity not accounted for by any entry. */
  untrackedHours: number
  /** Value of billable hours at the rate frozen when the work was done. */
  billableAmount: number
}

export interface FirmUtilisation {
  /** Twelve entries, January first, for the requested year. */
  months: MonthBuckets[]
  totals: MonthBuckets
  /** Billable value divided by billable hours; null when nothing is billable. */
  averageRate: number | null
  /** Billable hours as a share of all recorded hours; null when nothing recorded. */
  utilisationRate: number | null
  billing: {
    invoiced: number
    collected: number
    outstanding: number
    /** Bills raised but not yet fully paid. */
    openCount: number
    /** Past their due date with a balance still owing. */
    overdueCount: number
  }
  /** False when the firm has recorded nothing at all for the year. */
  hasData: boolean
  /** Earliest and latest activity actually recorded, or null if none. */
  span: { from: Date; to: Date } | null
}

const EMPTY_MONTH = (): MonthBuckets => ({
  billableHours: 0,
  nonBillableHours: 0,
  untrackedHours: 0,
  billableAmount: 0,
})

/**
 * Hours on an entry. A running timer has total_seconds 0 until it stops, so
 * its contribution is measured from when it started — otherwise work in
 * progress would be missing from the figures entirely.
 *
 * Elapsed time is measured against the `now` passed in rather than the real
 * clock, so the whole aggregation stays pure and a caller can ask what the
 * numbers were at any moment.
 */
function hoursFor(entry: TimeEntry, now: Date): number {
  if (entry.status !== 'running') return Math.max(0, entry.total_seconds) / 3600
  const started = new Date(entry.started_at).getTime()
  if (!Number.isFinite(started)) return 0
  return Math.max(0, now.getTime() - started) / 3_600_000
}

/** An entry earns money when a rate was attached at the time it was recorded. */
function isBillable(entry: TimeEntry): boolean {
  return entry.rate_at_start > 0
}

function monthOf(iso: string, year: number): number | null {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime()) || d.getFullYear() !== year) return null
  return d.getMonth()
}

/**
 * Pure aggregation, exported for tests. Keeping the arithmetic out of the
 * hook means the month bucketing and the capacity maths can be checked
 * without rendering anything.
 */
export function aggregateUtilisation(
  entries: TimeEntry[],
  bills: Bill[],
  year: number,
  now: Date = new Date(),
): FirmUtilisation {
  const months = Array.from({ length: 12 }, EMPTY_MONTH)

  for (const entry of entries) {
    const m = monthOf(entry.started_at, year)
    if (m === null) continue
    const hours = hoursFor(entry, now)
    if (hours <= 0) continue

    if (isBillable(entry)) {
      months[m].billableHours += hours
      months[m].billableAmount += hours * entry.rate_at_start
    } else {
      months[m].nonBillableHours += hours
    }
  }

  // Untracked is capacity minus what was recorded, and only for months that
  // have actually happened. Showing a full month of untracked time for next
  // November would read as a gap in the firm's work rather than a month that
  // has not arrived.
  const lastMonth =
    year < now.getFullYear() ? 11 : year > now.getFullYear() ? -1 : now.getMonth()

  months.forEach((m, i) => {
    if (i > lastMonth) return
    const recorded = m.billableHours + m.nonBillableHours
    // Only months with activity carry unused capacity. A month where the
    // firm recorded nothing at all is far more likely to mean nobody was
    // using the timer than that nobody worked, and filling it with 160
    // assumed hours buries the real figures under a quantity we invented.
    if (recorded <= 0) return
    m.untrackedHours = Math.max(0, MONTHLY_CAPACITY_HOURS - recorded)
  })

  const totals = months.reduce<MonthBuckets>((acc, m) => {
    acc.billableHours += m.billableHours
    acc.nonBillableHours += m.nonBillableHours
    acc.untrackedHours += m.untrackedHours
    acc.billableAmount += m.billableAmount
    return acc
  }, EMPTY_MONTH())

  const recordedHours = totals.billableHours + totals.nonBillableHours

  // Bills belong to the year they were issued in, which is the figure a
  // partner means by "what did we bill this year".
  let invoiced = 0
  let collected = 0
  let outstanding = 0
  let openCount = 0
  let overdueCount = 0
  const today = now.getTime()

  for (const bill of bills) {
    if (monthOf(bill.issue_date, year) === null) continue
    // Neither a draft nor one awaiting approval has been sent, so neither
    // is money the firm has actually asked for.
    if (bill.status === 'Draft' || bill.status === 'PendingApproval') continue

    invoiced += bill.total
    collected += bill.paid
    outstanding += bill.balance_due

    if (bill.balance_due > 0) {
      openCount += 1
      const due = new Date(bill.due_date).getTime()
      if (Number.isFinite(due) && due < today) overdueCount += 1
    }
  }

  // The real span of recorded work, so the card can say what it is
  // showing rather than printing a fixed range.
  let earliest: number | null = null
  let latest: number | null = null
  const note = (iso: string) => {
    const t = new Date(iso).getTime()
    if (!Number.isFinite(t) || new Date(t).getFullYear() !== year) return
    if (earliest === null || t < earliest) earliest = t
    if (latest === null || t > latest) latest = t
  }
  for (const e of entries) note(e.started_at)
  for (const b of bills) {
    if (b.status !== 'Draft' && b.status !== 'PendingApproval') note(b.issue_date)
  }

  return {
    span:
      earliest !== null && latest !== null
        ? { from: new Date(earliest), to: new Date(latest) }
        : null,
    months,
    totals,
    averageRate:
      totals.billableHours > 0 ? totals.billableAmount / totals.billableHours : null,
    utilisationRate: recordedHours > 0 ? totals.billableHours / recordedHours : null,
    billing: { invoiced, collected, outstanding, openCount, overdueCount },
    hasData: recordedHours > 0 || invoiced > 0,
  }
}

export function useFirmUtilisation(year: number): FirmUtilisation {
  // `revision` on each store is a cheap scalar that bumps on every write,
  // so the memo recomputes without subscribing to whole record maps.
  const entryMap = useTimeTrackerStore((s) => s.entries)
  const timeRevision = useTimeTrackerStore((s) => s.revision)
  const activeEntryId = useTimeTrackerStore((s) => s.active_entry_id)
  const billMap = useBillsLocalStore((s) => s.bills)
  const billRevision = useBillsLocalStore((s) => s.revision)

  // A running timer's hours grow between store writes, and `revision` only
  // bumps when something is written. Without a tick the billable total
  // would sit still for the whole session and only jump when the timer was
  // stopped. Ticking only while a timer runs keeps an idle dashboard
  // completely still.
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!activeEntryId) return
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS)
    return () => clearInterval(id)
  }, [activeEntryId])

  return useMemo(
    () =>
      aggregateUtilisation(Object.values(entryMap), Object.values(billMap), year),
    // `tick` is a deliberate dependency: it is what advances a running
    // timer's contribution to the totals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [year, timeRevision, billRevision, entryMap, billMap, tick],
  )
}
