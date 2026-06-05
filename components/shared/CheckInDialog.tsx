'use client'

/**
 * CheckInDialog
 * -------------
 * The 30-minute "are you still working?" prompt. Mounted once at
 * the dashboard layout level (via TimeTrackerBoot) so it can pop
 * over whatever page the partner is on when the timer is due for
 * a check-in.
 *
 * Behaviour contract:
 *   - The dialog opens iff `pending_check_in_at` is set on the
 *     time-tracker store.
 *   - It is not dismissable via Esc / overlay click. The partner
 *     must either acknowledge ("Yes, still working") or end the
 *     timer ("Stop and save"). This is the whole point of the
 *     feature — if we let them dismiss it, we're back to the
 *     forgotten-timer failure mode.
 *   - The elapsed time + accrued amount keep ticking while the
 *     dialog is open, so the partner can see exactly how much
 *     hangs on their answer.
 *   - "Stale" check-in case: if the timer's been running for
 *     hours without responses (laptop closed overnight, etc.) we
 *     surface the elapsed total prominently with a "this looks
 *     long" hint so the partner doesn't accidentally accept it.
 */

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, OctagonX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useClients } from '@/hooks/use-clients'
import {
  CHECK_IN_INTERVAL_MS,
  formatDuration,
  getElapsedSeconds,
  useTimeTrackerStore,
} from '@/stores/time-tracker-local.store'
import { formatCurrency as fmtMoney } from '@/lib/format-currency'

// "Stale" threshold — when the running entry has been alive for
// more than 3 of the configured check-in intervals (default 90 mins)
// we treat the check-in as overdue and show the long-running hint.
const STALE_MULTIPLIER = 3

export function CheckInDialog() {
  // Subscribe to the scalars we care about so the dialog re-renders
  // exactly when relevant — not on every entry mutation.
  const pending = useTimeTrackerStore((s) => s.pending_check_in_at)
  const activeId = useTimeTrackerStore((s) => s.active_entry_id)
  const recordCheckIn = useTimeTrackerStore((s) => s.recordCheckIn)
  const revision = useTimeTrackerStore((s) => s.revision)

  // Pull the running entry by reading from getState() — we don't
  // want to subscribe to the entire entries map, just the one
  // entry; revision invalidates the memo when needed.
  const entry =
    activeId == null
      ? null
      : useTimeTrackerStore.getState().entries[activeId] ?? null

  // Tick once a second so the elapsed time + accrued amount
  // displayed in the dialog stays live. Cheap — the dialog is
  // only mounted while one is pending, and a one-second tick is
  // well within React's budget.
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!pending || !entry) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [pending, entry])

  const { data: clients } = useClients()
  const clientName =
    clients?.find((c) => c.id === entry?.client_id)?.full_name ?? '—'

  if (!pending || !entry) return null

  const elapsedSec = getElapsedSeconds(entry)
  const accruedAmount =
    Math.round((elapsedSec / 3600) * entry.rate_at_start * 100) / 100
  const isStale = elapsedSec * 1000 > STALE_MULTIPLIER * CHECK_IN_INTERVAL_MS

  // Suppress accidental re-trigger by reading `revision` so the
  // store re-evaluation propagates if a sibling tab stops the
  // timer first.
  void revision

  return (
    <Dialog
      open={true}
      // Disable accidental dismiss. The dialog is the feature — the
      // partner must answer. Three layers:
      //   1. `disablePointerDismissal` blocks outside-click closes
      //      (Base UI Root's pointer-press dismissal flag).
      //   2. `onOpenChange` is a no-op, so the Esc-key close request
      //      that Base UI emits is ignored (controlled mode + we
      //      never flip `open` to false).
      //   3. `showCloseButton={false}` removes the corner X.
      // Together those leave the two footer buttons as the only
      // legitimate exits.
      disablePointerDismissal
      onOpenChange={() => {
        /* intentionally no-op — partner must answer */
      }}
    >
      <DialogContent
        className="max-w-md"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2"
            style={{
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            <Clock size={16} strokeWidth={1.75} />
            Still working?
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div
            className="rounded-md border p-3"
            style={{
              borderColor: 'var(--border-soft)',
              background: 'var(--surface-sunken)',
            }}
          >
            <p
              className="text-[12.5px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              The timer for <strong>{clientName}</strong> has been
              running. Confirm you&rsquo;re still on the matter, or
              stop the timer to lock in the entry.
            </p>
            {entry.description && (
              <p
                className="text-[12px] mt-2 italic"
                style={{ color: 'var(--text-muted)' }}
              >
                &ldquo;{entry.description}&rdquo;
              </p>
            )}
          </div>

          <div
            className="rounded-md border p-3 grid grid-cols-2 gap-3"
            style={{
              borderColor: 'var(--border-soft)',
              background: 'var(--surface-card)',
            }}
          >
            <Stat
              label="Elapsed"
              value={formatDuration(elapsedSec)}
              accent={isStale ? 'var(--accent-danger)' : 'var(--text-primary)'}
            />
            <Stat
              label="Accrued so far"
              value={fmtMoney(accruedAmount)}
              accent={isStale ? 'var(--accent-danger)' : 'var(--text-primary)'}
            />
          </div>

          {isStale && (
            <p
              className="text-[11.5px] rounded-md border p-2.5"
              style={{
                borderColor: 'rgba(190,53,52,0.20)',
                background: 'rgba(190,53,52,0.06)',
                color: 'var(--accent-danger)',
              }}
            >
              This timer has been running for a long time without a
              check-in. If you stepped away or forgot to stop it, choose
              Stop now — you can correct the elapsed minutes on the
              entry afterwards if needed.
            </p>
          )}
        </div>

        <DialogFooter className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => recordCheckIn(entry.id, 'stop')}
            style={{
              borderColor: 'var(--accent-danger)',
              color: 'var(--accent-danger)',
            }}
          >
            <OctagonX size={13} strokeWidth={2} />
            Stop and save
          </Button>
          <Button
            onClick={() => recordCheckIn(entry.id, 'continue')}
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
            }}
          >
            <CheckCircle2 size={13} strokeWidth={2} />
            Yes, still working
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <div>
      <p
        className="text-[10.5px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <p
        className="text-[18px] font-semibold mt-0.5 tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </p>
    </div>
  )
}
