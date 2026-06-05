/**
 * useLowBalanceAlerts
 * ===================
 *
 * Watches every client's *effective balance* and fires a toast
 * whenever it drops at or below zero. The effective balance is:
 *
 *     trust_balance
 *   + operating_balance
 *   - outstanding_billed
 *   - unbilled_time_amount
 *
 * The first three numbers already drive the Billing surfaces:
 *   - trust + operating come from `useBillsLocalStore.fund_balances`
 *   - outstanding_billed = sum of unpaid bills via `outstandingFor`
 * The fourth — `unbilled_time_amount` — is the new pressure source
 * the timer feature introduces. A partner who has timed 6 unbilled
 * hours at GHS 1,200/hr against a client with a GHS 5,000 retainer
 * is functionally negative; the retainer is gone the moment those
 * hours hit a bill. Surfacing that *now* — before the bill is
 * issued — lets the partner request a top-up while the conversation
 * is still about ongoing work, not about a fresh debt.
 *
 * Behaviour rules:
 *   - One toast per client per hour. The dedupe key is stored in
 *     localStorage so it survives reloads (we don't want to re-toast
 *     the same warning every time the partner refreshes the page).
 *   - Toast type is a Sonner `error` for "balance is negative" and
 *     `warning` for "balance is below threshold but still positive".
 *   - The hook is mounted once at the dashboard layout level (inside
 *     TimeTrackerBoot) so it runs app-wide and the toast can fire
 *     whatever page the partner is on.
 *
 * Why a hook (not a constant background interval)? Because we want
 * the check to run on the same events that change the inputs:
 *   - bills-local revision   (new bill issued, payment recorded)
 *   - time-tracker revision  (entry stopped)
 *   - client rates revision  (rate changed mid-stream, very rare
 *                             but cheap to subscribe to)
 * Re-running on revision change is the cheap, correct path.
 */

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useClients } from '@/hooks/use-clients'
import {
  outstandingFor,
  useBillsLocalStore,
} from '@/stores/bills-local.store'
import {
  unbilledTimeForClient,
  useTimeTrackerStore,
} from '@/stores/time-tracker-local.store'

/** Per-client toast dedupe key — keys live in localStorage. */
const TOAST_DEDUPE_KEY = 'll:low-balance-toasts'

/** Re-toast after 1 hour. Long enough that partners don't get nagged,
 *  short enough that a balance left negative resurfaces if they
 *  haven't acted on it within the working session. */
const DEDUPE_WINDOW_MS = 60 * 60 * 1000

/**
 * Per-client effective balance snapshot. Exported so other surfaces
 * (e.g. a future client-detail summary card) can reuse the same
 * calculation rather than reimplementing it.
 */
export interface EffectiveBalance {
  client_id: string
  trust: number
  operating: number
  outstanding: number
  unbilled_time: number
  /** trust + operating - outstanding - unbilled_time. */
  effective: number
  status: 'healthy' | 'warning' | 'negative'
}

const WARNING_THRESHOLD = 500 // GHS — surface a "running low" toast above this.

/** Pure derivation — usable from any context. */
export function computeEffectiveBalance(clientId: string): EffectiveBalance {
  const balances = useBillsLocalStore.getState().fund_balances[clientId]
  const trust = balances?.trust ?? 0
  const operating = balances?.operating ?? 0
  const outstanding = outstandingFor(clientId)
  const unbilled = unbilledTimeForClient(clientId).total_amount
  const effective = trust + operating - outstanding - unbilled
  const status: EffectiveBalance['status'] =
    effective <= 0
      ? 'negative'
      : effective < WARNING_THRESHOLD
        ? 'warning'
        : 'healthy'
  return {
    client_id: clientId,
    trust,
    operating,
    outstanding,
    unbilled_time: unbilled,
    effective,
    status,
  }
}

function readDedupeMap(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(TOAST_DEDUPE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed != null
      ? (parsed as Record<string, number>)
      : {}
  } catch {
    return {}
  }
}

function writeDedupeMap(map: Record<string, number>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TOAST_DEDUPE_KEY, JSON.stringify(map))
  } catch {
    // Quota / private-mode failures are non-fatal — worst case we
    // toast more often than once an hour, which is annoying but not
    // broken.
  }
}

export function useLowBalanceAlerts(): void {
  const { data: clients } = useClients()
  // Subscribe to every revision that could change a client's
  // effective balance. Scalars only, so the effect re-runs on real
  // changes and not on unrelated store mutations.
  const billsRevision = useBillsLocalStore((s) => s.revision)
  const timerRevision = useTimeTrackerStore((s) => s.revision)

  useEffect(() => {
    if (!clients || clients.length === 0) return
    const now = Date.now()
    const dedupe = readDedupeMap()
    let dirty = false

    for (const c of clients) {
      const snap = computeEffectiveBalance(c.id)
      if (snap.status === 'healthy') continue
      const lastFiredAt = dedupe[c.id] ?? 0
      if (now - lastFiredAt < DEDUPE_WINDOW_MS) continue

      if (snap.status === 'negative') {
        toast.error(
          `${c.full_name}'s effective balance is GHS ${snap.effective.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} — request a top-up before issuing the next bill.`,
          {
            duration: 8000,
            description: `Outstanding GHS ${snap.outstanding.toLocaleString('en-GH')} + unbilled time GHS ${snap.unbilled_time.toLocaleString('en-GH')} vs. funds on file GHS ${(snap.trust + snap.operating).toLocaleString('en-GH')}.`,
          },
        )
      } else {
        toast.warning(
          `${c.full_name} is running low — only GHS ${snap.effective.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} of cover left after outstanding + unbilled.`,
          {
            duration: 6000,
          },
        )
      }
      dedupe[c.id] = now
      dirty = true
    }

    if (dirty) writeDedupeMap(dedupe)
    // billsRevision + timerRevision drive recomputation; clients is
    // the iteration set.
  }, [clients, billsRevision, timerRevision])
}
