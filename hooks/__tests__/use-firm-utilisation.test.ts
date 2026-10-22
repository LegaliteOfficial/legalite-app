import { describe, it, expect } from 'vitest'
import {
  aggregateUtilisation,
  MONTHLY_CAPACITY_HOURS,
} from '../use-firm-utilisation'
import type { TimeEntry } from '@/stores/time-tracker-local.store'
import type { Bill } from '@/stores/bills-local.store'

const NOW = new Date('2026-06-15T12:00:00Z')

function entry(over: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: 'e1',
    client_id: 'c1',
    case_id: null,
    description: null,
    rate_at_start: 600,
    rate_kind_at_start: 'hourly',
    started_at: '2026-02-10T09:00:00Z',
    ended_at: '2026-02-10T11:00:00Z',
    total_seconds: 7200, // 2h
    total_amount: 1200,
    status: 'stopped',
    check_ins: [],
    bill_id: null,
    bill_line_item_id: null,
    created_at: '2026-02-10T09:00:00Z',
    ...over,
  } as TimeEntry
}

function bill(over: Partial<Bill> = {}): Bill {
  return {
    id: 'b1',
    bill_number: 'INV-001',
    client_id: 'c1',
    case_id: null,
    status: 'Sent',
    issue_date: '2026-03-01T00:00:00Z',
    due_date: '2026-03-15T00:00:00Z',
    payment_terms: 'Net 14',
    line_items: [],
    subtotal: 1000,
    tax_rate: 0,
    tax_amount: 0,
    total: 1000,
    paid: 0,
    balance_due: 1000,
    paid_at: null,
    notes: null,
    reminders: [],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...over,
  } as Bill
}

describe('aggregateUtilisation — hours', () => {
  it('buckets an entry into the month it started in', () => {
    const r = aggregateUtilisation([entry()], [], 2026, NOW)
    expect(r.months[1].billableHours).toBe(2) // February
    expect(r.months[0].billableHours).toBe(0)
  })

  it('separates billable from non-billable by whether a rate was attached', () => {
    const r = aggregateUtilisation(
      [entry({ id: 'a' }), entry({ id: 'b', rate_at_start: 0, total_amount: 0 })],
      [],
      2026,
      NOW,
    )
    expect(r.totals.billableHours).toBe(2)
    expect(r.totals.nonBillableHours).toBe(2)
  })

  it('values billable work at the rate frozen when it was recorded', () => {
    // 2h at 600 plus 2h at 1200 is 3600, not 4 hours at either rate.
    const r = aggregateUtilisation(
      [entry({ id: 'a' }), entry({ id: 'b', rate_at_start: 1200 })],
      [],
      2026,
      NOW,
    )
    expect(r.totals.billableAmount).toBe(3600)
    expect(r.averageRate).toBe(900)
  })

  it('ignores entries from another year', () => {
    const r = aggregateUtilisation(
      [entry({ started_at: '2025-02-10T09:00:00Z' })],
      [],
      2026,
      NOW,
    )
    expect(r.totals.billableHours).toBe(0)
    expect(r.hasData).toBe(false)
  })

  it('leaves a month with no activity empty rather than inventing capacity', () => {
    // Nothing recorded all year: no month should claim 160 unworked hours,
    // which would bury the real figures under a number we made up.
    const r = aggregateUtilisation([], [], 2026, NOW)
    expect(r.months.every((m) => m.untrackedHours === 0)).toBe(true)
  })

  it('counts untracked capacity only for months that have happened', () => {
    // One hour in February and one in December; December has not arrived.
    const r = aggregateUtilisation(
      [
        entry({ id: 'feb', total_seconds: 3600 }),
        entry({ id: 'dec', started_at: '2026-12-02T09:00:00Z', total_seconds: 3600 }),
      ],
      [],
      2026,
      NOW,
    )
    expect(r.months[1].untrackedHours).toBe(MONTHLY_CAPACITY_HOURS - 1)
    expect(r.months[11].untrackedHours).toBe(0)
  })

  it('reduces untracked capacity by what was recorded', () => {
    const r = aggregateUtilisation(
      [entry({ total_seconds: 3600 * 10 })], // 10h in February
      [],
      2026,
      NOW,
    )
    expect(r.months[1].untrackedHours).toBe(MONTHLY_CAPACITY_HOURS - 10)
  })

  it('never reports negative untracked time', () => {
    const r = aggregateUtilisation(
      [entry({ total_seconds: 3600 * 500 })], // well past capacity
      [],
      2026,
      NOW,
    )
    expect(r.months[1].untrackedHours).toBe(0)
  })

  it('gives a finished year capacity in its active months', () => {
    const r = aggregateUtilisation(
      [entry({ started_at: '2025-12-02T09:00:00Z', total_seconds: 3600 })],
      [],
      2025,
      NOW,
    )
    expect(r.months[11].untrackedHours).toBe(MONTHLY_CAPACITY_HOURS - 1)
  })

  it('reports utilisation as the billable share of recorded hours', () => {
    const r = aggregateUtilisation(
      [entry({ id: 'a' }), entry({ id: 'b', rate_at_start: 0 })],
      [],
      2026,
      NOW,
    )
    expect(r.utilisationRate).toBe(0.5)
  })

  it('returns null rather than zero when nothing is recorded', () => {
    const r = aggregateUtilisation([], [], 2026, NOW)
    expect(r.averageRate).toBeNull()
    expect(r.utilisationRate).toBeNull()
    expect(r.hasData).toBe(false)
  })
})

describe('aggregateUtilisation — billing', () => {
  it('sums invoiced, collected and outstanding', () => {
    const r = aggregateUtilisation(
      [],
      [bill({ total: 1000, paid: 400, balance_due: 600 })],
      2026,
      NOW,
    )
    expect(r.billing.invoiced).toBe(1000)
    expect(r.billing.collected).toBe(400)
    expect(r.billing.outstanding).toBe(600)
  })

  it('excludes drafts and bills awaiting approval', () => {
    // Neither has been sent, so neither is money the firm has asked for.
    const r = aggregateUtilisation(
      [],
      [bill({ id: 'd', status: 'Draft' }), bill({ id: 'p', status: 'PendingApproval' })],
      2026,
      NOW,
    )
    expect(r.billing.invoiced).toBe(0)
  })

  it('counts a bill overdue only once past its due date with a balance', () => {
    const r = aggregateUtilisation(
      [],
      [
        bill({ id: 'late', due_date: '2026-03-15T00:00:00Z', balance_due: 600 }),
        bill({ id: 'future', due_date: '2026-12-31T00:00:00Z', balance_due: 600 }),
        bill({ id: 'settled', due_date: '2026-01-01T00:00:00Z', balance_due: 0, paid: 1000 }),
      ],
      2026,
      NOW,
    )
    expect(r.billing.openCount).toBe(2)
    expect(r.billing.overdueCount).toBe(1)
  })

  it('ignores bills issued in another year', () => {
    const r = aggregateUtilisation([], [bill({ issue_date: '2025-03-01T00:00:00Z' })], 2026, NOW)
    expect(r.billing.invoiced).toBe(0)
  })

  it('counts billing alone as having data', () => {
    const r = aggregateUtilisation([], [bill()], 2026, NOW)
    expect(r.hasData).toBe(true)
  })
})
