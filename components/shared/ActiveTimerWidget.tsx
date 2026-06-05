'use client'

/**
 * ActiveTimerWidget
 * -----------------
 * Floating bottom-right indicator that shows whenever a billable
 * timer is running. Three jobs:
 *
 *   1. Constant visibility — so the partner can't forget the
 *      timer is on. The forgotten-timer failure mode is the whole
 *      reason for the 30-min prompt; this widget is the passive
 *      version of the same defence.
 *   2. Live readout — client name, elapsed time (ticking), accrued
 *      amount. Glance-able context without having to navigate
 *      anywhere.
 *   3. One-click stop — for partners who just want to end the
 *      session without waiting for the next prompt.
 *
 * Mounted at the dashboard layout level (via TimeTrackerBoot) so
 * it persists across navigations. Disappears whenever
 * `active_entry_id` is null — i.e. no timer running.
 *
 * Positioning is fixed bottom-right with a small offset so it
 * doesn't sit on top of toasts (which Sonner places top-center by
 * default). Z-index is below the CheckInDialog overlay so the
 * prompt always wins.
 */

import { useEffect, useState } from 'react'
import { Clock, OctagonX } from 'lucide-react'
import { toast } from 'sonner'
import { useClients } from '@/hooks/use-clients'
import {
  formatDuration,
  getElapsedSeconds,
  useTimeTrackerStore,
} from '@/stores/time-tracker-local.store'

// Use the shared currency formatter so changing the firm currency
// in Billing Settings flows through to the floating timer widget
// without per-file maintenance.
import { formatCurrency as fmtMoney } from '@/lib/format-currency'

export function ActiveTimerWidget() {
  // Scalar subscriptions only — re-render when the active entry
  // changes, not on every tick of every other entry.
  const activeId = useTimeTrackerStore((s) => s.active_entry_id)
  const stopTimer = useTimeTrackerStore((s) => s.stopTimer)
  // revision lets us pick up rate/description edits to the running
  // entry, if those happen later.
  const revision = useTimeTrackerStore((s) => s.revision)
  void revision

  const entry =
    activeId == null
      ? null
      : useTimeTrackerStore.getState().entries[activeId] ?? null

  // 1-second tick for the live duration + amount. Only runs while
  // a timer is actually active — when activeId flips to null the
  // effect cleans up its interval.
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!activeId) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [activeId])

  const { data: clients } = useClients()
  const clientName =
    entry == null
      ? '—'
      : clients?.find((c) => c.id === entry.client_id)?.full_name ?? '—'

  if (!entry) return null

  const elapsedSec = getElapsedSeconds(entry)
  const accrued =
    Math.round((elapsedSec / 3600) * entry.rate_at_start * 100) / 100

  const handleStop = () => {
    stopTimer(entry.id)
    toast.success(
      `Timer stopped. ${formatDuration(elapsedSec)} logged against ${clientName} (${fmtMoney(accrued)}).`,
    )
  }

  return (
    <div
      role="status"
      aria-label="Active billable timer"
      // Positioned fixed bottom-right with a comfortable offset
      // from the viewport edges. zIndex 40 keeps us above page
      // content but below the dialog overlay (which sits at 50).
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 40,
        boxShadow: '0 14px 42px rgba(13,27,42,0.22)',
        background: 'var(--navy)',
        color: 'white',
        borderRadius: 14,
        padding: '10px 12px 10px 14px',
        minWidth: 260,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Pulsing dot — communicates "live" without animating any
          actual numbers (which would distract from real-time UI). */}
      <span
        aria-hidden
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: 'var(--gold)',
          boxShadow: '0 0 0 0 rgba(201,151,43,0.6)',
          animation: 'll-timer-pulse 1.6s ease-in-out infinite',
          flexShrink: 0,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span
          style={{
            fontSize: 10.5,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.65)',
            fontWeight: 600,
          }}
        >
          Timing
        </span>
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: 'white',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 220,
          }}
          title={clientName}
        >
          {clientName}
        </span>
        <span
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.78)',
            fontVariantNumeric: 'tabular-nums',
            marginTop: 1,
          }}
        >
          <Clock
            size={10}
            strokeWidth={2}
            style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }}
          />
          {formatDuration(elapsedSec)} · {fmtMoney(accrued)}
        </span>
      </div>

      <button
        type="button"
        onClick={handleStop}
        aria-label="Stop timer"
        title="Stop timer"
        style={{
          marginLeft: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.16)',
          color: 'white',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(190,53,52,0.32)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
        }}
      >
        <OctagonX size={14} strokeWidth={2} />
      </button>

      {/* Inline keyframes scoped via a unique animation name so we
          don't pollute the global animation namespace. */}
      <style>{`
        @keyframes ll-timer-pulse {
          0% { box-shadow: 0 0 0 0 rgba(201,151,43,0.55); }
          70% { box-shadow: 0 0 0 12px rgba(201,151,43,0); }
          100% { box-shadow: 0 0 0 0 rgba(201,151,43,0); }
        }
      `}</style>
    </div>
  )
}
