/**
 * Subscription & billing account — local persisted store
 * ======================================================
 *
 * The firm's LegaLite subscription: which plan, billed how often, the
 * payment method on file, and the history of subscription invoices.
 * This backs the "Account and payment info" screen (plan + billing in
 * one place).
 *
 * This is firm-subscription billing — distinct from client billing
 * (bills-local.store), which is money the firm charges its own clients.
 *
 * Local persistence mirrors the other -local stores; when a billing
 * backend lands these route through mutations and the read shape holds.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PlanId = 'standard' | 'premium' | 'suite'
export type BillingPeriod = 'monthly' | 'annual'
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled'

export type PaymentMethod =
  | {
      kind: 'momo'
      /** Network label, e.g. "MTN Mobile Money". */
      network: string
      /** Last 4 digits of the wallet number. */
      last4: string
    }
  | {
      kind: 'card'
      /** Brand label, e.g. "Visa". */
      brand: string
      last4: string
      /** MM/YY expiry. */
      expiry: string
    }

export interface SubscriptionInvoice {
  id: string
  /** ISO date the invoice was issued. */
  date: string
  description: string
  amountGhs: number
  status: 'paid' | 'due'
}

export interface SubscriptionAccount {
  plan: PlanId
  period: BillingPeriod
  status: SubscriptionStatus
  /** Number of licensed seats — price is per seat / month. */
  seats: number
  /** ISO date the subscription next renews / charges. */
  renewsAt: string
  /** Where receipts are sent. */
  billingEmail: string
  paymentMethod: PaymentMethod | null
}

interface SubscriptionStore {
  account: SubscriptionAccount
  invoices: SubscriptionInvoice[]
  revision: number
  setPlan: (plan: PlanId, period: BillingPeriod) => void
  setBillingEmail: (email: string) => void
  setPaymentMethod: (method: PaymentMethod) => void
}

// ── Dev seed ──────────────────────────────────────────────────────
// An active Premium firm billed annually, so the screen renders a full
// plan + payment + history picture under a missing backend.
const DEV_ACCOUNT: SubscriptionAccount = {
  plan: 'premium',
  period: 'annual',
  status: 'active',
  seats: 5,
  renewsAt: '2027-01-15T00:00:00Z',
  billingEmail: 'accounts@mensahlaw.com.gh',
  paymentMethod: {
    kind: 'momo',
    network: 'MTN Mobile Money',
    last4: '4567',
  },
}

const DEV_INVOICES: SubscriptionInvoice[] = [
  {
    id: 'inv-2026-0001',
    date: '2026-01-15T00:00:00Z',
    description: 'Premium plan — annual (5 seats)',
    amountGhs: 26400,
    status: 'paid',
  },
  {
    id: 'inv-2025-0007',
    date: '2025-01-15T00:00:00Z',
    description: 'Premium plan — annual (4 seats)',
    amountGhs: 21120,
    status: 'paid',
  },
  {
    id: 'inv-2024-0003',
    date: '2024-01-15T00:00:00Z',
    description: 'Standard plan — annual (4 seats)',
    amountGhs: 13440,
    status: 'paid',
  },
]

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set) => ({
      account: DEV_ACCOUNT,
      invoices: DEV_INVOICES,
      revision: 0,
      setPlan: (plan, period) =>
        set((prev) => ({
          account: { ...prev.account, plan, period },
          revision: prev.revision + 1,
        })),
      setBillingEmail: (billingEmail) =>
        set((prev) => ({
          account: { ...prev.account, billingEmail },
          revision: prev.revision + 1,
        })),
      setPaymentMethod: (paymentMethod) =>
        set((prev) => ({
          account: { ...prev.account, paymentMethod },
          revision: prev.revision + 1,
        })),
    }),
    {
      name: 'll:subscription',
      partialize: (state) => ({
        account: state.account,
        invoices: state.invoices,
      }),
      skipHydration: true,
    },
  ),
)
