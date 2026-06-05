/**
 * Client billing rates — local store
 * ==================================
 *
 * Why a separate store?
 * ---------------------
 * Different clients pay different rates. A senior litigator might
 * charge GHS 1,500/hr for the partner-tier work she does for a
 * corporate client, GHS 600/hr for the same kind of work for a
 * family client, and a flat fee per matter for an NGO doing pro-
 * bono adjacent work. The lawyer needs to set this rate once on
 * the client record and have it flow into every bill she creates
 * for that client — typing GHS 1,500 fresh on every line of every
 * bill is exactly the kind of friction that pushes firms back to
 * spreadsheets.
 *
 * The current backend `Client` shape (see `types/index.ts`) doesn't
 * carry rate fields yet, and we're not blocking on a schema
 * migration to ship the UX. So rate config lives in this local
 * persisted store, keyed by `client_id`, alongside bills /
 * priorities / tasks. When the backend gets a `client_billing_rate`
 * table the read API stays the same — only the writes need to
 * route through a mutation.
 *
 * Rate kinds
 * ----------
 * `hourly`       — classic billable hour. `default_hourly_rate` is
 *                  required; flat_fee is null.
 * `flat`         — fixed fee per matter. `flat_fee` is the headline
 *                  number; `default_hourly_rate` is null. Used by
 *                  conveyancing, will-drafting, NRC trademark work.
 * `mixed`        — both: hours for some work, flat for milestones.
 *                  Both fields are populated; the BillComposer
 *                  defaults to hourly but the lawyer can override
 *                  per line item.
 * `contingency`  — % of recovery. We capture the % in
 *                  `contingency_pct` so the rate context is
 *                  documented; line item rate stays manual because
 *                  contingency cuts realise at settlement, not on
 *                  each interim bill.
 * `none`         — explicitly "no standard rate for this client",
 *                  bills are quoted ad-hoc each time. Distinct from
 *                  "unset" — `none` is a deliberate choice we
 *                  remember and surface as such.
 *
 * Firm default rate
 * -----------------
 * A firm-wide hourly rate the BillComposer falls back to when a
 * client has no specific rate set. Most boutique firms have a
 * "standard rate card" they apply to walk-in matters; this is that
 * number. Lives on this store rather than firm.store because it's
 * billing config, not branding.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type RateKind = 'hourly' | 'flat' | 'mixed' | 'contingency' | 'none'

/**
 * Supported billing currencies. Ghana firms primarily bill in GHS,
 * but the corporate desks at Accra firms regularly invoice
 * international clients in USD / EUR / GBP, and the West African
 * regional practices use NGN (Nigeria) and XOF (Francophone West
 * Africa). Locale codes are picked to format thousands separators +
 * decimal points correctly for each currency's home market.
 */
export type CurrencyCode = 'GHS' | 'USD' | 'EUR' | 'GBP' | 'NGN' | 'XOF'

export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  /** Display label for pickers — e.g. "GHS — Ghana Cedi". */
  label: string
  /** BCP-47 locale used by Intl.NumberFormat for thousands/decimals. */
  locale: string
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'GHS', symbol: '₵', label: 'GHS — Ghana Cedi', locale: 'en-GH' },
  { code: 'USD', symbol: '$', label: 'USD — US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', label: 'EUR — Euro', locale: 'en-IE' },
  { code: 'GBP', symbol: '£', label: 'GBP — Pound Sterling', locale: 'en-GB' },
  { code: 'NGN', symbol: '₦', label: 'NGN — Nigerian Naira', locale: 'en-NG' },
  { code: 'XOF', symbol: 'CFA', label: 'XOF — West African CFA franc', locale: 'fr-CI' },
]

export const CURRENCY_BY_CODE: Record<CurrencyCode, CurrencyConfig> =
  CURRENCIES.reduce(
    (acc, c) => ({ ...acc, [c.code]: c }),
    {} as Record<CurrencyCode, CurrencyConfig>,
  )

export interface ClientBillingRate {
  client_id: string
  rate_kind: RateKind
  /**
   * GHS per billable hour. Populated for `hourly` and `mixed`
   * kinds; null otherwise.
   */
  default_hourly_rate: number | null
  /**
   * GHS flat fee for the whole matter. Populated for `flat` and
   * `mixed`; null otherwise.
   */
  flat_fee: number | null
  /**
   * Percentage (0-100) of recovery for contingency arrangements.
   * Captured for the audit log + future bill-narrative templating;
   * the BillComposer does not auto-fill rates from this.
   */
  contingency_pct: number | null
  /**
   * Free-text — "Reviewed 2026-04 partner meeting, locked through
   * year-end" or similar. Surfaced in the ClientForm + BillComposer
   * tooltip so whoever takes over the file knows the context.
   */
  notes: string | null
  /** ISO timestamp of the last rate update. Drives the "rate refreshed N days ago" badge. */
  updated_at: string
}

interface ClientRatesStore {
  /**
   * Keyed by client_id so reads are O(1). New clients return
   * `undefined` from `getRateForClient` — callers fall back to
   * `firm_default_hourly_rate` themselves so the precedence is
   * explicit at the call site.
   */
  client_rates: Record<string, ClientBillingRate>
  /**
   * Firm-wide hourly rate the BillComposer pre-fills when the
   * picked client has no client-specific rate. `null` means the
   * firm hasn't set one yet — line items default to 0 in that
   * case, same as today's behaviour.
   */
  firm_default_hourly_rate: number | null
  /**
   * Currency the firm bills in. Widened from a single GHS literal
   * to the full CurrencyCode union so firms with foreign-client
   * desks can flip the default. Surfaces in every billing UI
   * surface (composer, statements, bills list, rate chips) via the
   * shared `lib/format-currency` helper.
   */
  firm_default_currency: CurrencyCode
  /** Bumps on every write — lets selector hooks rerender via a cheap scalar. */
  revision: number

  // ── Writes ────────────────────────────────────────────────────
  /**
   * Upsert the rate config for a client. Pass only the fields you
   * want to change — others stay as they were. Bumps `updated_at`
   * automatically so callers don't need to track timestamps.
   */
  setClientRate: (
    clientId: string,
    patch: Partial<Omit<ClientBillingRate, 'client_id' | 'updated_at'>>,
  ) => void
  /** Remove a client's rate config — used by the "Reset to firm default" button on the form. */
  clearClientRate: (clientId: string) => void
  /** Set the firm-wide fallback rate. `null` clears it. */
  setFirmDefaultRate: (rate: number | null) => void
  /** Switch the firm's billing currency. */
  setFirmCurrency: (code: CurrencyCode) => void
}

// ── Dev seed ──────────────────────────────────────────────────────
// Pre-populate the dev sample clients with mixed rate configs so the
// Client form, BillComposer, Outstanding view, and Client Funds view
// all have something interesting to render under DEV_BYPASS without
// the user having to set up rates first.
const DEV_NOW = '2026-05-15T09:00:00Z'
const DEV_SEED_RATES: Record<string, ClientBillingRate> = {
  'dev-client-1': {
    // Corporate retainer — premium hourly rate.
    client_id: 'dev-client-1',
    rate_kind: 'hourly',
    default_hourly_rate: 1200,
    flat_fee: null,
    contingency_pct: null,
    notes:
      'Premium corporate rate locked through Q4 2026. Reviewed at the April partner meeting.',
    updated_at: DEV_NOW,
  },
  'dev-client-2': {
    // Family trust — discounted relationship rate.
    client_id: 'dev-client-2',
    rate_kind: 'hourly',
    default_hourly_rate: 450,
    flat_fee: null,
    contingency_pct: null,
    notes: 'Long-standing family client — discounted relationship rate.',
    updated_at: DEV_NOW,
  },
  'dev-client-3': {
    // Tech client — flat-fee matter (e.g. trademark filing).
    client_id: 'dev-client-3',
    rate_kind: 'flat',
    default_hourly_rate: null,
    flat_fee: 8500,
    contingency_pct: null,
    notes: 'Flat fee per matter for IP / trademark work. Hourly for general advisory.',
    updated_at: DEV_NOW,
  },
  // dev-client-4 deliberately left out so callers can see the
  // "uses firm default" fallback path in the UI.
}

export const useClientRatesStore = create<ClientRatesStore>()(
  persist(
    (set) => ({
      client_rates: DEV_SEED_RATES,
      firm_default_hourly_rate: 600,
      firm_default_currency: 'GHS',
      revision: 0,

      setClientRate: (clientId, patch) =>
        set((prev) => {
          const existing: ClientBillingRate = prev.client_rates[clientId] ?? {
            client_id: clientId,
            rate_kind: 'hourly',
            default_hourly_rate: null,
            flat_fee: null,
            contingency_pct: null,
            notes: null,
            updated_at: new Date().toISOString(),
          }
          const next: ClientBillingRate = {
            ...existing,
            ...patch,
            client_id: clientId,
            updated_at: new Date().toISOString(),
          }
          return {
            client_rates: { ...prev.client_rates, [clientId]: next },
            revision: prev.revision + 1,
          }
        }),

      clearClientRate: (clientId) =>
        set((prev) => {
          if (!(clientId in prev.client_rates)) return prev
          const next = { ...prev.client_rates }
          delete next[clientId]
          return { client_rates: next, revision: prev.revision + 1 }
        }),

      setFirmDefaultRate: (rate) =>
        set((prev) => ({
          firm_default_hourly_rate:
            rate === null || rate <= 0 ? null : rate,
          revision: prev.revision + 1,
        })),

      setFirmCurrency: (code) =>
        set((prev) => ({
          firm_default_currency: code,
          revision: prev.revision + 1,
        })),
    }),
    {
      name: 'll:client-rates',
      // Persist data only; setters re-derived each render.
      partialize: (state) => ({
        client_rates: state.client_rates,
        firm_default_hourly_rate: state.firm_default_hourly_rate,
        firm_default_currency: state.firm_default_currency,
      }),
      // Skip hydration so SSR + first paint match; the bills page /
      // BillComposer manually rehydrate on mount (same pattern as
      // bills-local.store).
      skipHydration: true,
    },
  ),
)

// ── Selectors ─────────────────────────────────────────────────────

/**
 * Pure selector — returns the resolved rate context for a client.
 * Used inside hooks (with `revision` as the trigger) and in unit
 * tests where calling React hooks isn't practical.
 *
 * Returns:
 *   - `rate`        — the GHS-per-hour number the BillComposer
 *                     should pre-fill. Null when the kind doesn't
 *                     have one (flat / contingency / none) and no
 *                     firm fallback is set either.
 *   - `source`      — where the rate came from. Drives the UI chip:
 *                       `'client'`  — client-specific
 *                       `'firm'`    — firm default fallback
 *                       `'none'`    — nothing set anywhere
 *   - `config`      — the underlying ClientBillingRate, when present.
 */
export interface ResolvedRate {
  rate: number | null
  source: 'client' | 'firm' | 'none'
  config: ClientBillingRate | null
}

export function getResolvedRate(clientId: string): ResolvedRate {
  const state = useClientRatesStore.getState()
  const config = state.client_rates[clientId] ?? null

  // Hourly + Mixed: client's own hourly rate takes precedence.
  if (
    config &&
    (config.rate_kind === 'hourly' || config.rate_kind === 'mixed') &&
    config.default_hourly_rate != null &&
    config.default_hourly_rate > 0
  ) {
    return { rate: config.default_hourly_rate, source: 'client', config }
  }

  // Flat / contingency / none / unset: no hourly rate to pre-fill,
  // but we still want the firm fallback so the line item isn't 0.
  if (state.firm_default_hourly_rate != null) {
    return { rate: state.firm_default_hourly_rate, source: 'firm', config }
  }

  return { rate: null, source: 'none', config }
}
