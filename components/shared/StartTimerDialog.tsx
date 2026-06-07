'use client'

/**
 * StartTimerDialog
 * ----------------
 * The "Time working hours" button hands control to this dialog.
 * Two paths:
 *
 *   1. Rate gate (only if the client has no usable hourly rate).
 *      The dialog refuses to start a timer until the partner sets
 *      one — billing without a rate produces unsigned invoices.
 *      The form is the same shape as the Billing & Rate section
 *      of the Client form (kind + value + optional note) so the
 *      rate config the partner sets here flows back to the client
 *      record and shows up everywhere else.
 *
 *   2. Start screen (rate present).
 *      Shows the resolved rate context, a description input
 *      ("What are you working on?"), and a Start button. On start,
 *      `useTimeTrackerStore.startTimer` runs — which auto-stops
 *      any other timer that was already running (single-active
 *      invariant), schedules the 30-min check-in, and surfaces the
 *      ActiveTimerWidget app-wide.
 */

import { useEffect, useMemo, useState } from 'react'
import { Clock, Pencil, Play, Receipt } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useClients } from '@/hooks/use-clients'
import { useClientBillingRate } from '@/hooks/use-client-billing-rate'
import {
  useClientRatesStore,
  type RateKind,
} from '@/stores/client-rates-local.store'
import { useTimeTrackerStore } from '@/stores/time-tracker-local.store'

interface StartTimerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string | null
  /** When started from a case detail page, pre-link the entry. */
  caseId?: string | null
  /** Optional starter description — e.g. case title prefix. */
  initialDescription?: string
}

export function StartTimerDialog({
  open,
  onOpenChange,
  clientId,
  caseId,
  initialDescription,
}: StartTimerDialogProps) {
  const { data: clients } = useClients()
  const client = useMemo(
    () => (clients ?? []).find((c) => c.id === clientId) ?? null,
    [clients, clientId],
  )

  const resolvedRate = useClientBillingRate(clientId)
  const setClientRate = useClientRatesStore((s) => s.setClientRate)
  const firmDefault = useClientRatesStore((s) => s.firm_default_hourly_rate)
  const startTimer = useTimeTrackerStore((s) => s.startTimer)

  /**
   * Whether the rate gate is open. A client is "gated" when the
   * resolver returned nothing usable — no client-specific hourly,
   * no firm default, no flat fee. We treat 'flat' / 'contingency'
   * as also gating *for the timer* because billing by the hour
   * needs an hourly number; we surface that distinction in the
   * gate copy.
   */
  const needsRate =
    resolvedRate.rate == null ||
    (resolvedRate.source === 'client' &&
      (resolvedRate.config?.rate_kind === 'flat' ||
        resolvedRate.config?.rate_kind === 'contingency' ||
        resolvedRate.config?.rate_kind === 'none'))

  // ── Form state ──────────────────────────────────────────────────
  const [phase, setPhase] = useState<'gate' | 'start'>('start')
  // Rate-gate fields
  const [rateKind, setRateKind] = useState<RateKind>('hourly')
  const [hourlyRate, setHourlyRate] = useState<string>('')
  const [rateNotes, setRateNotes] = useState<string>('')
  // Start fields
  const [description, setDescription] = useState('')

  // Reset state on (re-)open + re-evaluate which phase to land in.
  useEffect(() => {
    if (!open) return
    void useClientRatesStore.persist.rehydrate()
    void useTimeTrackerStore.persist.rehydrate()
    setPhase(needsRate ? 'gate' : 'start')
    setRateKind('hourly')
    setHourlyRate('')
    setRateNotes('')
    setDescription(initialDescription ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clientId])

  if (!client) {
    return (
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    )
  }

  // ── Handlers ───────────────────────────────────────────────────
  const handleSaveRateAndContinue = () => {
    const parsed = Number(hourlyRate)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Enter a valid hourly rate before starting the timer.')
      return
    }
    setClientRate(client.id, {
      rate_kind: rateKind,
      default_hourly_rate: parsed,
      notes: rateNotes.trim() || null,
    })
    toast.success(
      `Billing rate set: GHS ${parsed.toLocaleString('en-GH')} / hr for ${client.full_name}.`,
    )
    // The resolver is reactive (subscribes to revision), so on the
    // next render `needsRate` flips false. Transition to start phase
    // explicitly so the UI doesn't briefly flash a re-gate.
    setPhase('start')
  }

  const handleStart = () => {
    if (resolvedRate.rate == null) {
      // Defensive — by this point the rate gate should have handled it.
      toast.error("Can't start a timer without a billing rate.")
      setPhase('gate')
      return
    }
    const kind: RateKind =
      resolvedRate.config?.rate_kind ?? 'hourly'
    startTimer({
      client_id: client.id,
      case_id: caseId ?? null,
      description,
      rate: resolvedRate.rate,
      rate_kind: kind,
    })
    toast.success(
      `Timer started for ${client.full_name} at GHS ${resolvedRate.rate.toLocaleString('en-GH')}/hr.`,
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2"
            style={{
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            <Clock size={16} strokeWidth={1.75} />
            {phase === 'gate'
              ? 'Set a billing rate'
              : 'Time working hours'}
            <span
              className="text-[13px] font-normal"
              style={{ color: 'var(--text-muted)' }}
            >
              — {client.full_name}
            </span>
          </DialogTitle>
        </DialogHeader>

        {phase === 'gate' ? (
          <div className="grid gap-3 py-2">
            {/*
             * Rate gate. Spelled out in plain English so a partner
             * who hasn't set a rate yet understands why the timer
             * won't start: we can't bill against an unknown rate.
             */}
            <div
              className="rounded-md border p-3 text-[12.5px]"
              style={{
                borderColor: 'var(--border-soft)',
                background: 'var(--surface-sunken)',
                color: 'var(--text-secondary)',
              }}
            >
              <p>
                {client.full_name} doesn&rsquo;t have a billing rate set
                yet. Set one now to start the timer — the rate is
                snapshotted onto each time entry, so future rate changes
                won&rsquo;t rewrite past billed work.
              </p>
              {firmDefault != null && (
                <p className="mt-1.5">
                  Firm default for unset clients:{' '}
                  <strong>
                    GHS {firmDefault.toLocaleString('en-GH')} / hr
                  </strong>
                  . Use it as a starting point or set a client-specific rate.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="st-rate-kind" className="text-[13px]">
                  Rate type
                </Label>
                <Select
                  value={rateKind}
                  onValueChange={(v) => v && setRateKind(v as RateKind)}
                >
                  <SelectTrigger id="st-rate-kind" className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="mixed">Mixed (hourly + flat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="st-hourly" className="text-[13px]">
                  Hourly rate (GHS)
                </Label>
                <Input
                  id="st-hourly"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={50}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder={
                    firmDefault != null ? `e.g. ${firmDefault}` : 'e.g. 600'
                  }
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="st-rate-notes" className="text-[13px]">
                Rate notes (optional)
              </Label>
              <Textarea
                id="st-rate-notes"
                rows={2}
                value={rateNotes}
                onChange={(e) => setRateNotes(e.target.value)}
                placeholder="Why this rate? Locked through Q4, discount, etc."
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveRateAndContinue}
                style={{
                  background: 'var(--gold)',
                  color: 'var(--navy)',
                }}
              >
                <Pencil size={13} strokeWidth={2} />
                Save rate & continue
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="grid gap-3 py-2">
            {/*
             * Start screen — partner just confirms the rate (so the
             * starting context is explicit on screen) and adds an
             * optional description so the time entry makes sense
             * when it lands on the Unbilled Time table later.
             */}
            <div
              className="rounded-md border p-3 grid grid-cols-2 gap-3"
              style={{
                borderColor: 'var(--border-soft)',
                background: 'var(--surface-sunken)',
              }}
            >
              <Cell
                label="Billing at"
                value={
                  resolvedRate.rate != null
                    ? `GHS ${resolvedRate.rate.toLocaleString('en-GH')} / hr`
                    : '—'
                }
              />
              <Cell
                label="Source"
                value={
                  resolvedRate.source === 'client'
                    ? 'Client-specific rate'
                    : resolvedRate.source === 'firm'
                      ? 'Firm default rate'
                      : 'No rate'
                }
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="st-desc" className="text-[13px]">
                What are you working on? (optional)
              </Label>
              <Textarea
                id="st-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Drafting reply to Hagar's interrogatories"
              />
              <p
                className="text-[11px]"
                style={{ color: 'var(--text-muted)' }}
              >
                Becomes the line-item description when this entry is
                converted into a bill. You can edit it after stopping
                the timer too.
              </p>
            </div>

            {/*
             * Plain-English explainer of what happens next. Important
             * because the 30-minute prompt is the headline feature of
             * the timer and partners shouldn't be surprised by it.
             */}
            <div
              className="rounded-md border p-3 text-[11.5px] flex items-start gap-2"
              style={{
                borderColor: 'var(--border-soft)',
                background: 'rgba(201,151,43,0.06)',
                color: 'var(--text-secondary)',
              }}
            >
              <Receipt size={13} strokeWidth={1.75} className="shrink-0 mt-0.5" />
              <p>
                Every 30 minutes we&rsquo;ll ask if you&rsquo;re still
                working for {client.full_name}. Hit{' '}
                <strong>Continue</strong> to keep timing,{' '}
                <strong>Stop</strong> to end the session and queue the
                entry under Unbilled Time on the Billing page.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStart}
                disabled={resolvedRate.rate == null}
                style={{
                  background: 'var(--gold)',
                  color: 'var(--navy)',
                }}
              >
                <Play size={13} strokeWidth={2.25} />
                Start timer
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-[10.5px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <p
        className="text-[14px] font-semibold mt-0.5 tabular-nums"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </p>
    </div>
  )
}
