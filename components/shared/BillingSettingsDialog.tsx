'use client'

/**
 * BillingSettingsDialog
 * ---------------------
 * Firm-wide billing knobs. Two sections:
 *
 *   1. Currency — pick from the supported set (GHS / USD / EUR /
 *      GBP / NGN / XOF). Every formatter in the app routes through
 *      `formatCurrency`, so changing this here flips every label —
 *      bill rows, line items, statements, top-up emails, the
 *      timer widget — all in one go.
 *
 *   2. Firm default hourly rate — the fallback billing rate that
 *      the BillComposer pre-fills line items with when the picked
 *      client doesn't have a client-specific rate set. Captures
 *      the "standard rate card" most boutique firms keep.
 *
 * Why one dialog (not Settings -> Billing page)? Partners reach for
 * the gear at the moment they realise a client should be billed in
 * USD or the firm rate is off. Putting it next to "New bill" keeps
 * the friction low. A future "Billing" tab on the global Settings
 * page can mount the same form.
 */

import { useEffect, useState } from 'react'
import { Check, Coins, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CURRENCIES,
  useClientRatesStore,
  type CurrencyCode,
} from '@/stores/client-rates-local.store'

interface BillingSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BillingSettingsDialog({
  open,
  onOpenChange,
}: BillingSettingsDialogProps) {
  // The form lives inside `<SettingsForm/>`, which only mounts when
  // `open` flips to true. That way the form's local `useState`
  // initialisers capture the current store values *once at mount*
  // — no effect-based sync needed, no risk of running afoul of
  // React 19's "no setState in effect" rule.
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
            <Coins size={16} strokeWidth={1.75} />
            Billing settings
          </DialogTitle>
        </DialogHeader>
        {open && <SettingsForm onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Inner form. Splitting it out lets us use `useState` initialisers
 * that read the current store values on mount, sidestepping the
 * effect-sync pattern that mirroring props -> state would require.
 * Closing the dialog unmounts the form, which clears any pending
 * edits — the canonical "cancel" semantics.
 */
function SettingsForm({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void
}) {
  const currentCurrency = useClientRatesStore((s) => s.firm_default_currency)
  const currentRate = useClientRatesStore((s) => s.firm_default_hourly_rate)
  const setFirmCurrency = useClientRatesStore((s) => s.setFirmCurrency)
  const setFirmDefaultRate = useClientRatesStore((s) => s.setFirmDefaultRate)

  const [currency, setCurrency] = useState<CurrencyCode>(currentCurrency)
  const [rateStr, setRateStr] = useState<string>(
    currentRate != null ? String(currentRate) : '',
  )

  // Rehydrate the persisted store on first mount — the persist
  // middleware's skipHydration means the in-memory map can be
  // stale on a cold dialog open.
  useEffect(() => {
    void useClientRatesStore.persist.rehydrate()
  }, [])

  const handleSave = () => {
    // Validate the rate input before committing. Empty string clears
    // the firm default — that's a legitimate "we don't have a rate
    // card, every client is custom" position, so we don't gate it.
    const trimmed = rateStr.trim()
    let parsedRate: number | null = null
    if (trimmed) {
      parsedRate = Number(trimmed)
      if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
        toast.error('Enter a valid hourly rate (positive number) or leave it blank.')
        return
      }
    }
    setFirmCurrency(currency)
    setFirmDefaultRate(parsedRate)
    toast.success(
      parsedRate != null
        ? `Billing currency set to ${currency} · firm default ${currency} ${parsedRate.toLocaleString()} / hr.`
        : `Billing currency set to ${currency} · firm default rate cleared.`,
    )
    onOpenChange(false)
  }

  return (
      <>
        <div className="grid gap-4 py-2">
          {/* ── Currency section ────────────────────────────── */}
          <div className="grid gap-2">
            <Label className="text-[13px] font-semibold">
              Billing currency
            </Label>
            <p
              className="text-[11.5px]"
              style={{ color: 'var(--text-muted)' }}
            >
              Changes the currency code shown on every bill, line item,
              statement, and email. Existing amounts are not re-converted —
              if a bill was raised in GHS and the firm switches to USD,
              the historical numbers keep their original meaning.
            </p>
            <div
              className="grid grid-cols-2 gap-2 mt-1"
              role="radiogroup"
              aria-label="Billing currency"
            >
              {CURRENCIES.map((c) => {
                const active = currency === c.code
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCurrency(c.code)}
                    className="text-left rounded-md border px-3 py-2.5 cursor-pointer transition-colors"
                    style={{
                      borderColor: active
                        ? 'var(--gold)'
                        : 'var(--border-soft)',
                      background: active
                        ? 'rgba(201,151,43,0.06)'
                        : 'var(--surface-card)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="font-semibold text-[13px]"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {c.code}
                      </span>
                      <span
                        className="text-[11.5px] font-semibold tabular-nums"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {c.symbol}
                      </span>
                    </div>
                    <span
                      className="block text-[11.5px] mt-0.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {c.label.replace(`${c.code} — `, '')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Firm default rate section ───────────────────── */}
          <div
            className="grid gap-2 border-t pt-4"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Label
              htmlFor="bs-rate"
              className="text-[13px] font-semibold inline-flex items-center gap-1.5"
            >
              <DollarSign size={12} strokeWidth={2} />
              Firm default hourly rate
            </Label>
            <p
              className="text-[11.5px]"
              style={{ color: 'var(--text-muted)' }}
            >
              Pre-fills new bill line items when the picked client has no
              client-specific rate. Leave blank to require an explicit
              rate on every bill. Editing the rate here does not change
              the rate snapshotted onto past bills or stopped time entries.
            </p>
            <div className="grid grid-cols-[80px_1fr] gap-2 items-center mt-1">
              <div
                className="h-10 rounded-md border flex items-center justify-center text-[13px] font-semibold tabular-nums"
                style={{
                  borderColor: 'var(--border-soft)',
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-secondary)',
                }}
              >
                {currency}
              </div>
              <Input
                id="bs-rate"
                type="number"
                inputMode="decimal"
                min={0}
                step={50}
                value={rateStr}
                onChange={(e) => setRateStr(e.target.value)}
                placeholder="e.g. 600"
                className="h-10 rounded-md text-[13px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          >
            <Check size={13} strokeWidth={2} />
            Save settings
          </Button>
        </DialogFooter>
      </>
  )
}
