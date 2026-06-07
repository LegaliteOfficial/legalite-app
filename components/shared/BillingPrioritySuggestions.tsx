'use client'

/**
 * BillingPrioritySuggestions
 * --------------------------
 * Quiet banner on the bills page that surfaces clients in the
 * firm's top 20% by billed amount over the last 90 days who don't
 * yet have a cross-app priority flag. One-click applies "High"
 * priority via the shared `usePriorityStore`, so the client also
 * shows up on the dashboard priorities panel.
 *
 * Dismissals are stored in localStorage keyed by the client id +
 * the lookback window so the same suggestion can resurface if the
 * client's billing picks back up in a future quarter.
 *
 * Hidden when there's nothing useful to suggest — banner real
 * estate stays clean for users with a tight client list.
 */

import { useEffect, useMemo, useState } from 'react'
import { Sparkle, Star, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import {
  billedRecentlyFor,
  outstandingFor,
  useBillsLocalStore,
} from '@/stores/bills-local.store'
import { usePriorityStore } from '@/stores/priority.store'
import { useClients } from '@/hooks/use-clients'

/**
 * How far back to look for "recent" billing. 90 days is one fiscal
 * quarter — long enough to even out lumpy retainers, short enough
 * to react when a client's relationship shifts.
 */
const LOOKBACK_DAYS = 90

/**
 * Surface a client only when their billed amount lands in this
 * percentile or above. 20% is intentionally narrow — the panel is
 * supposed to highlight the obvious VIPs, not every client with a
 * bill.
 */
const TOP_PERCENTILE = 0.2

/** Cap suggestions per banner so it doesn't dominate the page. */
const MAX_SUGGESTIONS = 3

const DISMISSED_KEY = 'll:billing-priority-dismissed'

function loadDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function persistDismissed(set: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]))
  } catch {
    /* ignore quota errors */
  }
}

export function BillingPrioritySuggestions() {
  // Re-render whenever a bill is added / paid (revenue numbers
  // shift) or a priority flag changes (so dismissed clients drop
  // off automatically once they're flagged elsewhere).
  const billsRevision = useBillsLocalStore((s) => s.revision)
  const prioritiesRevision = usePriorityStore((s) => s.revision)
  const { data: clients } = useClients()
  const user = useAuthStore((s) => s.user)
  const setPriority = usePriorityStore((s) => s.setPriority)

  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  useEffect(() => {
    setDismissed(loadDismissed())
  }, [])

  const suggestions = useMemo(() => {
    if (!clients || clients.length === 0) return []

    // 1. Compute (client → recent billed) and (client → outstanding)
    //    for every client with at least one bill in the window.
    const ranked = clients
      .map((c) => ({
        client_id: c.id,
        client_name: c.full_name,
        billed: billedRecentlyFor(c.id, LOOKBACK_DAYS),
        outstanding: outstandingFor(c.id),
      }))
      .filter((r) => r.billed > 0)
      .sort((a, b) => b.billed - a.billed)

    if (ranked.length === 0) return []

    // 2. Pick the top percentile by billed amount. Round up so a
    //    firm with five clients still surfaces its single top-1
    //    instead of zero.
    const cutCount = Math.max(1, Math.ceil(ranked.length * TOP_PERCENTILE))
    const topSlice = ranked.slice(0, cutCount)

    // 3. Funnel out anyone already flagged (any level) or anyone
    //    the user has dismissed in this window.
    const records = usePriorityStore.getState().records
    return topSlice
      .filter((r) => !records[`client:${r.client_id}`])
      .filter((r) => !dismissed.has(suggestionKey(r.client_id)))
      .slice(0, MAX_SUGGESTIONS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, dismissed, billsRevision, prioritiesRevision])

  if (suggestions.length === 0) return null

  const flag = (clientId: string, clientName: string, billed: number) => {
    const userId = user?.id ?? 'dev-user'
    setPriority({
      entityType: 'client',
      entityId: clientId,
      level: 'high',
      label: clientName,
      userId,
      metadata: {
        billed_recent: billed,
        lookback_days: LOOKBACK_DAYS,
      },
    })
    toast.success(
      `${clientName} flagged High — they're in your top ${Math.round(
        TOP_PERCENTILE * 100,
      )}% by billing this quarter.`,
    )
  }

  const dismiss = (clientId: string) => {
    const next = new Set(dismissed)
    next.add(suggestionKey(clientId))
    persistDismissed(next)
    setDismissed(next)
  }

  const dismissAll = () => {
    const next = new Set(dismissed)
    for (const s of suggestions) next.add(suggestionKey(s.client_id))
    persistDismissed(next)
    setDismissed(next)
  }

  return (
    <div
      className="mt-4 rounded-xl border px-4 py-3"
      style={{
        background: 'var(--accent-today-tint, rgba(201,151,43,0.08))',
        borderColor: 'var(--accent-today-tint-strong, rgba(201,151,43,0.25))',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <Sparkle
            size={16}
            strokeWidth={1.75}
            className="mt-0.5 shrink-0"
            style={{ color: 'var(--accent-today)' }}
          />
          <div className="min-w-0">
            <p
              className="text-[13px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Suggested priorities
            </p>
            <p
              className="text-[12px] mt-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              These clients are in your top{' '}
              {Math.round(TOP_PERCENTILE * 100)}% by billing over the
              last {LOOKBACK_DAYS} days. Flagging them surfaces them on
              your dashboard priorities panel.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissAll}
          className="text-[11.5px] font-medium underline underline-offset-2 cursor-pointer shrink-0 mt-0.5"
          style={{ color: 'var(--text-muted)' }}
        >
          Dismiss all
        </button>
      </div>

      <ul className="mt-2 grid gap-1.5">
        {suggestions.map((s) => (
          <li
            key={s.client_id}
            className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md"
            style={{ background: 'var(--surface-card)' }}
          >
            <div className="min-w-0">
              <span
                className="text-[13px] font-semibold truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {s.client_name}
              </span>
              <span
                className="ml-2 text-[11.5px] tabular-nums"
                style={{ color: 'var(--text-muted)' }}
              >
                GHS{' '}
                {s.billed.toLocaleString('en-GH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                billed
                {s.outstanding > 0 && (
                  <>
                    {' · '}
                    <span style={{ color: 'var(--accent-danger)' }}>
                      GHS{' '}
                      {s.outstanding.toLocaleString('en-GH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      open
                    </span>
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => flag(s.client_id, s.client_name, s.billed)}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-semibold cursor-pointer"
                style={{
                  background: 'var(--accent-today-tint-strong, rgba(201,151,43,0.2))',
                  color: 'var(--accent-today)',
                }}
              >
                <Star
                  size={11}
                  strokeWidth={1.75}
                  fill="var(--accent-today)"
                />
                Flag High
              </button>
              <button
                type="button"
                onClick={() => dismiss(s.client_id)}
                aria-label={`Dismiss ${s.client_name}`}
                className="inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Dismiss key includes the lookback window so suggestions can
 * resurface in a different quarter without the user having to
 * manually re-arm anything.
 */
function suggestionKey(clientId: string): string {
  return `${clientId}:${LOOKBACK_DAYS}`
}
