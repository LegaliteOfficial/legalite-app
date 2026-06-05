/**
 * useClientBillingRate
 * ====================
 * React hook wrapper around `getResolvedRate` from the client-rates
 * store. Reads the `revision` scalar so any rate change anywhere in
 * the app re-renders subscribers, then derives the resolved rate
 * snapshot via `getState()` lookup (cheap, doesn't subscribe to
 * each map entry).
 *
 * Returns the same shape as `getResolvedRate`:
 *   - `rate`   — number | null
 *   - `source` — 'client' | 'firm' | 'none'
 *   - `config` — ClientBillingRate | null  (the stored row, if any)
 *
 * Callers in dialogs / forms should be careful with the rehydration
 * gate — the store skips hydration so the BillComposer mounts a
 * `void useClientRatesStore.persist.rehydrate()` in a useEffect on
 * open, mirroring the bills-local rehydrate pattern.
 */

import { useMemo } from 'react'
import {
  getResolvedRate,
  useClientRatesStore,
  type ClientBillingRate,
  type ResolvedRate,
} from '@/stores/client-rates-local.store'

/** Empty-state placeholder when no clientId is selected yet. */
const NONE: ResolvedRate = { rate: null, source: 'none', config: null }

export function useClientBillingRate(
  clientId: string | null | undefined,
): ResolvedRate {
  const revision = useClientRatesStore((s) => s.revision)
  return useMemo(() => {
    if (!clientId) return NONE
    return getResolvedRate(clientId)
    // revision drives recomputation when any rate changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, revision])
}

/** Convenience: just the GHS-per-hour scalar with a sensible default. */
export function useDefaultLineItemRate(
  clientId: string | null | undefined,
): number {
  return useClientBillingRate(clientId).rate ?? 0
}

/** Convenience: the firm-wide default scalar, kept as its own hook so the Settings page can read it directly without joining a client. */
export function useFirmDefaultHourlyRate(): number | null {
  return useClientRatesStore((s) => s.firm_default_hourly_rate)
}

export type { ClientBillingRate, ResolvedRate }
