/**
 * Currency formatting helpers
 * ===========================
 *
 * The billing UI used to hardcode `GHS ` everywhere. When firms
 * with foreign-client desks need to bill in USD / EUR / GBP / NGN /
 * XOF, every one of those literals becomes a lie on the bill. This
 * module centralises the formatting so changing the firm's currency
 * once in Billing Settings flows through to every label.
 *
 * Three entry points:
 *
 *   - `formatCurrency(amount, code?)` — pure function. If `code` is
 *     omitted, reads the firm's current currency from the client-
 *     rates store snapshot. Use this in non-React contexts (store
 *     actions, plain helpers).
 *
 *   - `useFormatCurrency()` — React hook. Subscribes to the
 *     `revision` scalar on the client-rates store so any currency
 *     change re-renders subscribers. Returns a memoised
 *     `formatCurrency`-shape function bound to the current
 *     currency.
 *
 *   - `getActiveCurrencyCode()` — pulls the current code without
 *     formatting anything. Handy when a caller needs the bare code
 *     for non-display use (analytics, persisting alongside an
 *     amount, etc.).
 *
 * Format
 * ------
 * Standard "{CODE} {grouped-amount}" layout, e.g. "GHS 1,234.56" or
 * "USD 99.00". We deliberately prefix the code (not the symbol)
 * because legal invoices need to be unambiguous about currency —
 * "$1,000" reads as USD in Accra but could read as XAF in Douala
 * for an international invoice. The code is the safe choice.
 *
 * Locale-aware grouping comes from Intl.NumberFormat with the
 * currency's home locale baked into `CURRENCIES`. So GHS uses
 * en-GH grouping, EUR uses en-IE grouping, etc.
 */

import { useMemo } from 'react'
import {
  CURRENCY_BY_CODE,
  useClientRatesStore,
  type CurrencyCode,
} from '@/stores/client-rates-local.store'

/** Get the current firm currency code without formatting. */
export function getActiveCurrencyCode(): CurrencyCode {
  return useClientRatesStore.getState().firm_default_currency
}

/**
 * Format a number as currency. Pure — call from anywhere.
 *
 * @param amount  The number to format. Non-finite values render as a
 *                quiet em-dash; we never want NaN/Infinity to leak
 *                onto a client invoice.
 * @param code    Optional currency code override. If omitted, reads
 *                the current firm currency.
 */
export function formatCurrency(
  amount: number,
  code?: CurrencyCode,
): string {
  if (!Number.isFinite(amount)) return '—'
  const resolvedCode = code ?? getActiveCurrencyCode()
  const config = CURRENCY_BY_CODE[resolvedCode]
  const negative = amount < 0
  const abs = Math.abs(amount)
  const formatted = abs.toLocaleString(config.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${negative ? '-' : ''}${resolvedCode} ${formatted}`
}

/**
 * React hook variant — re-renders when the firm currency changes.
 * Returns the same shape as `formatCurrency` so call sites swap
 * one for the other without touching the body of their templates.
 */
export function useFormatCurrency(): (
  amount: number,
  code?: CurrencyCode,
) => string {
  const code = useClientRatesStore((s) => s.firm_default_currency)
  // Memoise the bound function so consumers using it in useMemo
  // dependency arrays don't churn on every render.
  return useMemo(() => {
    return (amount: number, override?: CurrencyCode) =>
      formatCurrency(amount, override ?? code)
  }, [code])
}

/**
 * Convenience hook for callers that just want the active code as a
 * reactive scalar — e.g. an input prefix that shows the currency.
 */
export function useActiveCurrencyCode(): CurrencyCode {
  return useClientRatesStore((s) => s.firm_default_currency)
}
