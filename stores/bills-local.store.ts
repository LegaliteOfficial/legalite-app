/**
 * Bills-local store
 * -----------------
 * Persisted source-of-truth for the billing module in DEV_BYPASS
 * mode (and the parallel cache when the GraphQL backend is wired
 * up). Models three closely-related shapes:
 *
 *   Bill                — what gets sent to a client
 *   Payment             — money received against a bill or the
 *                         client's funds account
 *   ClientFundsRequest  — a "please pre-fund the matter" ask
 *
 * Each is keyed by id for cheap mutate-in-place updates. A
 * `revision` counter is bumped on every setter so subscribers can
 * subscribe to a stable primitive and re-render on any write —
 * same pattern as priority / tasks-local stores (avoids React's
 * "getServerSnapshot should be cached" warning that fires when an
 * Object/Map selector returns a fresh identity each render).
 *
 * The store also exposes derived helpers used across the billing
 * UI (status-bucketing the bills, computing a client's outstanding
 * balance, classifying high-revenue clients for the priority
 * suggestion). Keeping these here means the page components stay
 * presentational and the rules live in one place.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ──────────────────────────────────────────────────────────────

/**
 * Status terms surfaced in the bills table tabs. Matches the
 * billing reference closely:
 *   - Draft           — not yet sent, still being edited.
 *   - PendingApproval — waiting on partner sign-off before send.
 *   - Sent            — issued; could be unpaid, partially paid,
 *                       or paid in full (we keep the discriminator
 *                       on `balance_due` + `paid_at` so a single
 *                       state machine doesn't get hairy).
 *   - Paid            — fully reconciled.
 *   - Overdue         — derived flag: Sent + balance_due > 0 +
 *                       due_date in the past.
 *   - Archived        — soft-deleted; hidden by default but
 *                       reachable via the Archive tab for audit.
 */
export type BillStatus =
  | 'Draft'
  | 'PendingApproval'
  | 'Sent'
  | 'Paid'
  | 'Archived'

/** Single line on a bill — rate × quantity → amount. */
export interface BillLineItem {
  id: string
  description: string
  quantity: number
  rate: number
  /** Quantity × rate. Always recomputed before save; persisted for export. */
  amount: number
}

/** A bill itself. Money is stored as a number in the firm's base currency. */
/**
 * Audit entry for a payment reminder sent against a bill. Today
 * the channel is always 'manual' (the partner clicks "Send
 * reminder"); when the email integration ships, automated sends
 * use channel 'email'.
 */
export interface BillReminder {
  id: string
  sent_at: string
  /** Free-text note captured at send time. */
  notes: string | null
  channel: 'manual' | 'email'
}

export interface Bill {
  id: string
  bill_number: string
  client_id: string
  case_id: string | null
  status: BillStatus
  issue_date: string
  due_date: string
  /** Net business terms — "Net 14", "Due on receipt", etc. */
  payment_terms: string
  line_items: BillLineItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  /** subtotal + tax_amount. */
  total: number
  /** Sum of payments + write_offs allocated to this bill. */
  paid: number
  /** total - paid. Derived but persisted so subscribers don't recompute. */
  balance_due: number
  /** ISO timestamp when the bill flipped to fully paid. */
  paid_at: string | null
  notes: string | null
  /**
   * Reminder log — append-only audit trail of every nudge sent to
   * the client about this bill. Surfaced in the detail dialog so the
   * partner can see "last sent N days ago" before sending another.
   */
  reminders: BillReminder[]
  created_at: string
  updated_at: string
}

/**
 * A payment captured via the Record-Payment dialog. A single payment
 * may be allocated across multiple bills via the `allocations[]`
 * array — each allocation is an amount of the payment applied to
 * one bill (the rest, if any, lives on the client's funds account).
 */
export interface PaymentAllocation {
  bill_id: string
  amount: number
}

export interface Payment {
  id: string
  client_id: string
  payment_date: string
  payment_source: string
  deposit_account: string
  reference: string | null
  payer: string | null
  description: string | null
  /** Sum of allocations + unallocated remainder. */
  total: number
  allocations: PaymentAllocation[]
  created_at: string
}

/**
 * Channel used to ask a client for a top-up. "Phone" entries also
 * carry a `notes` body with the partner's call summary so the audit
 * trail stays useful even when nothing got typed into an email.
 */
export type FundsRequestChannel = 'email' | 'phone' | 'in_person'

export interface ClientFundsRequest {
  id: string
  client_id: string
  /**
   * Amount requested. `null` means "generic top-up, no specific
   * figure" — the firm just wants the client to keep the retainer
   * comfortable.
   */
  amount: number | null
  status: 'Pending' | 'Fulfilled' | 'Cancelled'
  /** How the request was delivered. */
  channel: FundsRequestChannel
  /** Subject line on the outgoing email (null for phone / in-person). */
  email_subject: string | null
  /**
   * Free-text body — either the email body the partner sent, or the
   * notes they typed after a phone call / in-person ask.
   */
  notes: string | null
  /** Snapshot of the trust balance when the request was raised. */
  trust_balance_at_request: number
  requested_at: string
}

// ── Client funds (Trust vs Operating) ─────────────────────────────────

/**
 * Per-client funds account balances. Ghana's Legal Council rules
 * (echoed in most common-law jurisdictions) require trust money to
 * sit separately from operating money. Modelled as two scalar
 * balances per client so the UI can render both lines on the
 * Client Funds tab and the Statement of Account.
 *
 * Movements (deposits, fee transfers, refunds) live in
 * `fund_movements` — a small audit ledger appended to on every
 * mutation. Today the only producer is the dev seed; once the real
 * client-funds workflow ships, the move-from-trust-to-operating
 * (i.e. "draw fees") flow appends to this.
 */
export type FundAccount = 'trust' | 'operating'

export interface ClientFundsBalance {
  client_id: string
  trust: number
  operating: number
  /** ISO timestamp of the most recent movement. */
  last_activity_at: string | null
}

export interface ClientFundsMovement {
  id: string
  client_id: string
  account: FundAccount
  kind: 'deposit' | 'withdrawal' | 'transfer_to_operating'
  amount: number
  occurred_at: string
  reference: string | null
}

// ── Computed helpers ──────────────────────────────────────────────────

/**
 * Derive the effective tab bucket for a bill, taking the Overdue
 * pseudo-status into account. The "Sent" status splits into
 * Unpaid / Overdue / Paid depending on dates + balance.
 */
export type BillTabKey =
  | 'Draft'
  | 'PendingApproval'
  | 'Unpaid'
  | 'Paid'
  | 'Archive'
  | 'All'

export function tabKeyFor(bill: Bill): Exclude<BillTabKey, 'All'> {
  if (bill.status === 'Archived') return 'Archive'
  if (bill.status === 'Draft') return 'Draft'
  if (bill.status === 'PendingApproval') return 'PendingApproval'
  if (bill.balance_due <= 0) return 'Paid'
  return 'Unpaid'
}

/** Recompute totals from line items. Side-effect free. */
export function recomputeTotals(input: {
  line_items: BillLineItem[]
  tax_rate: number
  paid?: number
}): { subtotal: number; tax_amount: number; total: number; balance_due: number } {
  const subtotal = input.line_items.reduce(
    (acc, li) => acc + li.quantity * li.rate,
    0,
  )
  const tax_amount = Math.round(subtotal * input.tax_rate * 100) / 100
  const total = subtotal + tax_amount
  const balance_due = Math.max(0, total - (input.paid ?? 0))
  return { subtotal, tax_amount, total, balance_due }
}

// ── Dev seed ───────────────────────────────────────────────────────────

function iso(days: number, h = 9, m = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

const DEV_SEED_BILLS: Bill[] = [
  // Paid in full — represents the happy path.
  {
    id: 'bill-dev-1',
    bill_number: 'B-0001',
    client_id: 'dev-client-1',
    case_id: 'dev-1',
    status: 'Paid',
    issue_date: iso(-21),
    due_date: iso(-7),
    payment_terms: 'Net 14',
    line_items: [
      {
        id: 'li-dev-1-a',
        description: 'Discovery review (April)',
        quantity: 12,
        rate: 450,
        amount: 5400,
      },
      {
        id: 'li-dev-1-b',
        description: 'Court filing fees',
        quantity: 1,
        rate: 1200,
        amount: 1200,
      },
    ],
    subtotal: 6600,
    tax_rate: 0.125,
    tax_amount: 825,
    total: 7425,
    paid: 7425,
    balance_due: 0,
    paid_at: iso(-5),
    notes: null,
    created_at: iso(-21),
    updated_at: iso(-5),
    reminders: [],
  },
  // Unpaid + nearly due.
  {
    id: 'bill-dev-2',
    bill_number: 'B-0002',
    client_id: 'dev-client-1',
    case_id: 'dev-1',
    status: 'Sent',
    issue_date: iso(-3),
    due_date: iso(11),
    payment_terms: 'Net 14',
    line_items: [
      {
        id: 'li-dev-2-a',
        description: 'Case management conference prep',
        quantity: 6,
        rate: 450,
        amount: 2700,
      },
      {
        id: 'li-dev-2-b',
        description: 'Affidavit drafting',
        quantity: 4,
        rate: 450,
        amount: 1800,
      },
    ],
    subtotal: 4500,
    tax_rate: 0.125,
    tax_amount: 562.5,
    total: 5062.5,
    paid: 0,
    balance_due: 5062.5,
    paid_at: null,
    notes: 'Issued via portal; awaiting client confirmation.',
    created_at: iso(-3),
    updated_at: iso(-3),
    reminders: [],
  },
  // Overdue (Sent + due_date in the past + balance_due > 0).
  {
    id: 'bill-dev-3',
    bill_number: 'B-0003',
    client_id: 'dev-client-2',
    case_id: 'dev-2',
    status: 'Sent',
    issue_date: iso(-45),
    due_date: iso(-12),
    payment_terms: 'Net 30',
    line_items: [
      {
        id: 'li-dev-3-a',
        description: 'Probate filing prep',
        quantity: 9,
        rate: 380,
        amount: 3420,
      },
    ],
    subtotal: 3420,
    tax_rate: 0.125,
    tax_amount: 427.5,
    total: 3847.5,
    paid: 0,
    balance_due: 3847.5,
    paid_at: null,
    notes: 'Follow-up sent. No response yet.',
    created_at: iso(-45),
    updated_at: iso(-12),
    reminders: [
      { id: "rem-dev-3a", sent_at: iso(-8), notes: "Initial nudge via portal.", channel: "manual" },
    ],
  },
  // Pending approval — partner needs to sign off.
  {
    id: 'bill-dev-4',
    bill_number: 'B-0004',
    client_id: 'dev-client-3',
    case_id: 'dev-3',
    status: 'PendingApproval',
    issue_date: iso(-1),
    due_date: iso(13),
    payment_terms: 'Net 14',
    line_items: [
      {
        id: 'li-dev-4-a',
        description: 'Settlement negotiation (May)',
        quantity: 18,
        rate: 500,
        amount: 9000,
      },
    ],
    subtotal: 9000,
    tax_rate: 0.125,
    tax_amount: 1125,
    total: 10125,
    paid: 0,
    balance_due: 10125,
    paid_at: null,
    notes: null,
    created_at: iso(-1),
    updated_at: iso(-1),
    reminders: [],
  },
  // Draft — being assembled.
  {
    id: 'bill-dev-5',
    bill_number: 'B-0005',
    client_id: 'dev-client-4',
    case_id: null,
    status: 'Draft',
    issue_date: iso(0),
    due_date: iso(14),
    payment_terms: 'Net 14',
    line_items: [
      {
        id: 'li-dev-5-a',
        description: 'Land title research',
        quantity: 3,
        rate: 350,
        amount: 1050,
      },
    ],
    subtotal: 1050,
    tax_rate: 0.125,
    tax_amount: 131.25,
    total: 1181.25,
    paid: 0,
    balance_due: 1181.25,
    paid_at: null,
    notes: 'Add the LR-7 schedule before sending.',
    created_at: iso(0),
    updated_at: iso(0),
    reminders: [],
  },
]

const DEV_SEED_PAYMENTS: Payment[] = [
  {
    id: 'pay-dev-1',
    client_id: 'dev-client-1',
    payment_date: iso(-5),
    payment_source: 'Bank transfer',
    deposit_account: 'Operating — GHS',
    reference: 'GTB-2026-0541',
    payer: 'Mensah Holdings Ltd',
    description: 'Settlement of B-0001',
    total: 7425,
    allocations: [{ bill_id: 'bill-dev-1', amount: 7425 }],
    created_at: iso(-5),
  },
]

const DEV_SEED_FUND_REQUESTS: ClientFundsRequest[] = [
  {
    id: 'cfr-dev-1',
    client_id: 'dev-client-3',
    amount: 5000,
    status: 'Pending',
    channel: 'email',
    email_subject: 'Retainer top-up — settlement matter',
    notes: 'Sent via portal email. Follow up if no reply by Friday.',
    trust_balance_at_request: 8000,
    requested_at: iso(-2),
  },
]

const DEV_SEED_FUND_BALANCES: ClientFundsBalance[] = [
  {
    client_id: 'dev-client-1',
    trust: 2500,
    operating: 0,
    last_activity_at: iso(-12),
  },
  {
    client_id: 'dev-client-2',
    trust: 1200,
    operating: 0,
    last_activity_at: iso(-30),
  },
  {
    client_id: 'dev-client-3',
    trust: 8000,
    operating: 1500,
    last_activity_at: iso(-4),
  },
  // client-4 (Asante) intentionally omitted to show the
  // "no funds on file" empty state for that client.
]

const DEV_SEED_FUND_MOVEMENTS: ClientFundsMovement[] = [
  {
    id: 'fm-dev-1',
    client_id: 'dev-client-3',
    account: 'trust',
    kind: 'deposit',
    amount: 10000,
    occurred_at: iso(-20),
    reference: 'Retainer — initial',
  },
  {
    id: 'fm-dev-2',
    client_id: 'dev-client-3',
    account: 'trust',
    kind: 'transfer_to_operating',
    amount: 1500,
    occurred_at: iso(-4),
    reference: 'Fee transfer — settlement work',
  },
]

// ── Store ──────────────────────────────────────────────────────────────

interface BillsLocalStore {
  bills: Record<string, Bill>
  payments: Record<string, Payment>
  fund_requests: Record<string, ClientFundsRequest>
  /**
   * Per-client funds balances keyed by client_id. Modelled
   * separately from the bills/payments tables because trust vs
   * operating accounting has different audit semantics.
   */
  fund_balances: Record<string, ClientFundsBalance>
  /** Append-only audit ledger of every movement against fund balances. */
  fund_movements: Record<string, ClientFundsMovement>
  revision: number

  // ── Bills ───────────────────────────────────────────────────────
  createBill: (
    input: Omit<
      Bill,
      'id' | 'bill_number' | 'created_at' | 'updated_at' | 'reminders'
    > & {
      bill_number?: string
      reminders?: BillReminder[]
    },
  ) => Bill
  updateBill: (
    id: string,
    patch: Partial<Omit<Bill, 'id' | 'created_at'>>,
  ) => Bill | null
  archiveBill: (id: string) => void
  /** Send a draft / pending → Sent. */
  issueBill: (id: string) => Bill | null
  /** Submit Draft → PendingApproval. */
  submitForApproval: (id: string) => Bill | null
  /**
   * Append a reminder log entry to the bill. Returns the new
   * reminder so the caller can surface it in the toast confirmation.
   * Today everything's `channel: 'manual'` — automated email sends
   * use `channel: 'email'` once the integration ships.
   */
  sendReminder: (
    id: string,
    notes?: string | null,
    channel?: BillReminder['channel'],
  ) => BillReminder | null

  // ── Payments ────────────────────────────────────────────────────
  recordPayment: (
    input: Omit<Payment, 'id' | 'created_at'>,
  ) => Payment

  // ── Client funds ────────────────────────────────────────────────
  createFundsRequest: (
    input: Omit<ClientFundsRequest, 'id' | 'requested_at'>,
  ) => ClientFundsRequest

  // ── Lifecycle ───────────────────────────────────────────────────
  reseedDev: () => void
}

const SEEDED_INITIAL: Pick<
  BillsLocalStore,
  | 'bills'
  | 'payments'
  | 'fund_requests'
  | 'fund_balances'
  | 'fund_movements'
  | 'revision'
> = {
  bills: Object.fromEntries(DEV_SEED_BILLS.map((b) => [b.id, b])),
  payments: Object.fromEntries(DEV_SEED_PAYMENTS.map((p) => [p.id, p])),
  fund_requests: Object.fromEntries(
    DEV_SEED_FUND_REQUESTS.map((r) => [r.id, r]),
  ),
  fund_balances: Object.fromEntries(
    DEV_SEED_FUND_BALANCES.map((b) => [b.client_id, b]),
  ),
  fund_movements: Object.fromEntries(
    DEV_SEED_FUND_MOVEMENTS.map((m) => [m.id, m]),
  ),
  revision: 0,
}

/** Sequential bill-number minter starting from the highest persisted. */
function nextBillNumber(bills: Record<string, Bill>): string {
  let maxN = 0
  for (const b of Object.values(bills)) {
    const m = /B-(\d+)/.exec(b.bill_number)
    if (m) {
      const n = Number(m[1])
      if (n > maxN) maxN = n
    }
  }
  return `B-${String(maxN + 1).padStart(4, '0')}`
}

export const useBillsLocalStore = create<BillsLocalStore>()(
  persist(
    (set, get) => ({
      ...SEEDED_INITIAL,

      createBill: (input) => {
        const id = `bill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const bill_number = input.bill_number ?? nextBillNumber(get().bills)
        const now = new Date().toISOString()
        const next: Bill = {
          ...input,
          // Default the reminders log to empty when the caller
          // doesn't pass one — keeps the composer call sites tidy.
          reminders: input.reminders ?? [],
          id,
          bill_number,
          created_at: now,
          updated_at: now,
        }
        set((s) => ({
          bills: { ...s.bills, [id]: next },
          revision: s.revision + 1,
        }))
        return next
      },

      updateBill: (id, patch) => {
        const existing = get().bills[id]
        if (!existing) return null
        const next: Bill = {
          ...existing,
          ...patch,
          updated_at: new Date().toISOString(),
        }
        set((s) => ({
          bills: { ...s.bills, [id]: next },
          revision: s.revision + 1,
        }))
        return next
      },

      archiveBill: (id) => {
        const existing = get().bills[id]
        if (!existing) return
        set((s) => ({
          bills: {
            ...s.bills,
            [id]: {
              ...existing,
              status: 'Archived',
              updated_at: new Date().toISOString(),
            },
          },
          revision: s.revision + 1,
        }))
      },

      issueBill: (id) => {
        const existing = get().bills[id]
        if (!existing) return null
        if (existing.status === 'Paid' || existing.status === 'Archived') {
          return existing
        }
        const next: Bill = {
          ...existing,
          status: 'Sent',
          updated_at: new Date().toISOString(),
        }
        set((s) => ({
          bills: { ...s.bills, [id]: next },
          revision: s.revision + 1,
        }))
        return next
      },

      submitForApproval: (id) => {
        const existing = get().bills[id]
        if (!existing || existing.status !== 'Draft') return existing ?? null
        const next: Bill = {
          ...existing,
          status: 'PendingApproval',
          updated_at: new Date().toISOString(),
        }
        set((s) => ({
          bills: { ...s.bills, [id]: next },
          revision: s.revision + 1,
        }))
        return next
      },

      sendReminder: (id, notes, channel) => {
        const existing = get().bills[id]
        if (!existing) return null
        const reminder: BillReminder = {
          id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sent_at: new Date().toISOString(),
          notes: notes?.trim() || null,
          channel: channel ?? 'manual',
        }
        set((s) => ({
          bills: {
            ...s.bills,
            [id]: {
              ...existing,
              reminders: [...(existing.reminders ?? []), reminder],
              updated_at: reminder.sent_at,
            },
          },
          revision: s.revision + 1,
        }))
        return reminder
      },

      recordPayment: (input) => {
        const id = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const created_at = new Date().toISOString()
        const payment: Payment = { ...input, id, created_at }
        set((s) => {
          // Apply each allocation to the linked bill's `paid` field
          // and recompute balance + status.
          const billsNext = { ...s.bills }
          for (const a of input.allocations) {
            const bill = billsNext[a.bill_id]
            if (!bill) continue
            const paid = Math.min(bill.total, bill.paid + a.amount)
            const balance_due = Math.max(0, bill.total - paid)
            const isPaid = balance_due <= 0
            billsNext[a.bill_id] = {
              ...bill,
              paid,
              balance_due,
              status: isPaid ? 'Paid' : bill.status,
              paid_at: isPaid ? created_at : bill.paid_at,
              updated_at: created_at,
            }
          }
          return {
            payments: { ...s.payments, [id]: payment },
            bills: billsNext,
            revision: s.revision + 1,
          }
        })
        return payment
      },

      createFundsRequest: (input) => {
        const id = `cfr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const requested_at = new Date().toISOString()
        const req: ClientFundsRequest = { ...input, id, requested_at }
        set((s) => ({
          fund_requests: { ...s.fund_requests, [id]: req },
          revision: s.revision + 1,
        }))
        return req
      },

      reseedDev: () =>
        set((s) => ({ ...SEEDED_INITIAL, revision: s.revision + 1 })),
    }),
    {
      name: 'll:bills-local',
      partialize: (state) => ({
        bills: state.bills,
        payments: state.payments,
        fund_requests: state.fund_requests,
        fund_balances: state.fund_balances,
        fund_movements: state.fund_movements,
      }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Backfill `reminders: []` on older persisted bills that
        // pre-date the reminder log addition — keeps the schema
        // forward-compatible without a localStorage migration.
        for (const id of Object.keys(state.bills)) {
          const b = state.bills[id]
          if (!Array.isArray(b.reminders)) {
            state.bills[id] = { ...b, reminders: [] }
          }
        }
        // Same idea for client-funds tables — older storage from
        // before this field landed gets seeded with the dev sample
        // so the Client Funds tab has data on first hydrate.
        if (
          !state.fund_balances ||
          Object.keys(state.fund_balances).length === 0
        ) {
          state.fund_balances = Object.fromEntries(
            DEV_SEED_FUND_BALANCES.map((b) => [b.client_id, b]),
          )
        }
        if (
          !state.fund_movements ||
          Object.keys(state.fund_movements).length === 0
        ) {
          state.fund_movements = Object.fromEntries(
            DEV_SEED_FUND_MOVEMENTS.map((m) => [m.id, m]),
          )
        }
        state.revision = state.revision + 1
      },
    },
  ),
)

// ── Selectors / derived ────────────────────────────────────────────────

/**
 * Outstanding balance for a single client — sum of unpaid bills'
 * balance_due less any uncollected payments sitting on their funds
 * account. Used by the Outstanding Balances tab and by the
 * priority-suggestion logic on the bills list.
 */
export function outstandingFor(clientId: string): number {
  const bills = useBillsLocalStore.getState().bills
  let out = 0
  for (const b of Object.values(bills)) {
    if (b.client_id !== clientId) continue
    if (b.status === 'Draft' || b.status === 'Archived') continue
    out += b.balance_due
  }
  return out
}

/** Total billed (gross) to a client in the last `days` days. Drives the
 * high-revenue-client priority suggestion. */
export function billedRecentlyFor(clientId: string, days = 90): number {
  const bills = useBillsLocalStore.getState().bills
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  let out = 0
  for (const b of Object.values(bills)) {
    if (b.client_id !== clientId) continue
    if (b.status === 'Draft' || b.status === 'Archived') continue
    if (new Date(b.issue_date).getTime() < cutoff) continue
    out += b.total
  }
  return out
}
