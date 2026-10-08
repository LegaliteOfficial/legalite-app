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
 * Why one dialog (not Gear -> Billing page)? Partners reach for
 * the gear at the moment they realise a client should be billed in
 * USD or the firm rate is off. Putting it next to "New bill" keeps
 * the friction low. A future "Billing" tab on the global Gear
 * page can mount the same form.
 */

import { useEffect, useState } from 'react'
import { Check, Coins, CurrencyDollar, Percent } from '@phosphor-icons/react'
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
  const currentFlatFee = useClientRatesStore((s) => s.firm_default_flat_fee)
  const currentContingency = useClientRatesStore(
    (s) => s.firm_default_contingency_pct,
  )
  const setFirmCurrency = useClientRatesStore((s) => s.setFirmCurrency)
  const setFirmDefaultRate = useClientRatesStore((s) => s.setFirmDefaultRate)
  const setFirmDefaultFlatFee = useClientRatesStore((s) => s.setFirmDefaultFlatFee)
  const setFirmDefaultContingencyPct = useClientRatesStore(
    (s) => s.setFirmDefaultContingencyPct,
  )

  const [currency, setCurrency] = useState<CurrencyCode>(currentCurrency)
  const [rateStr, setRateStr] = useState<string>(
    currentRate != null ? String(currentRate) : '',
  )
  const [flatFeeStr, setFlatFeeStr] = useState<string>(
    currentFlatFee != null ? String(currentFlatFee) : '',
  )
  const [contingencyStr, setContingencyStr] = useState<string>(
    currentContingency != null ? String(currentContingency) : '',
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

    const flatTrimmed = flatFeeStr.trim()
    let parsedFlat: number | null = null
    if (flatTrimmed) {
      parsedFlat = Number(flatTrimmed)
      if (!Number.isFinite(parsedFlat) || parsedFlat <= 0) {
        toast.error('Enter a valid flat fee (positive number) or leave it blank.')
        return
      }
    }

    const pctTrimmed = contingencyStr.trim()
    let parsedPct: number | null = null
    if (pctTrimmed) {
      parsedPct = Number(pctTrimmed)
      if (!Number.isFinite(parsedPct) || parsedPct <= 0 || parsedPct > 100) {
        toast.error('Enter a contingency share between 1 and 100, or leave it blank.')
        return
      }
    }

    setFirmCurrency(currency)
    setFirmDefaultRate(parsedRate)
    setFirmDefaultFlatFee(parsedFlat)
    setFirmDefaultContingencyPct(parsedPct)

    // Name only what is actually set, so the confirmation does not imply
    // defaults the firm deliberately left blank.
    const parts = [`Billing currency set to ${currency}`]
    if (parsedRate != null) parts.push(`${currency} ${parsedRate.toLocaleString()} / hr`)
    if (parsedFlat != null) parts.push(`${currency} ${parsedFlat.toLocaleString()} flat`)
    if (parsedPct != null) parts.push(`${parsedPct}% contingency`)
    toast.success(
      parts.length > 1
        ? `${parts[0]} · ${parts.slice(1).join(' · ')}.`
        : `${parts[0]} · no firm default rates set.`,
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
              <CurrencyDollar size={12} strokeWidth={2} />
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

          {/* ── Firm default flat fee ───────────────────────── */}
          <div
            className="grid gap-2 border-t pt-4"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Label
              htmlFor="bs-flat"
              className="text-[13px] font-semibold inline-flex items-center gap-1.5"
            >
              <Coins size={12} strokeWidth={2} />
              Firm default flat fee
            </Label>
            <p className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
              Pre-fills flat fee and mixed matters when the client has no
              figure of their own. Typical for conveyancing, will drafting
              and trademark filings, where the work is quoted per matter
              rather than per hour. Leave blank to quote each one
              individually.
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
                id="bs-flat"
                type="number"
                inputMode="decimal"
                min={0}
                step={100}
                value={flatFeeStr}
                onChange={(e) => setFlatFeeStr(e.target.value)}
                placeholder="e.g. 8500"
                className="h-10 rounded-md text-[13px]"
              />
            </div>
          </div>

          {/* ── Firm default contingency share ──────────────── */}
          <div
            className="grid gap-2 border-t pt-4"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Label
              htmlFor="bs-contingency"
              className="text-[13px] font-semibold inline-flex items-center gap-1.5"
            >
              <Percent size={12} strokeWidth={2} />
              Firm default contingency share
            </Label>
            <p className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
              The share of recovery the firm takes when a matter is run on
              contingency and the client record does not set its own.
              Recorded for context on the bill: contingency realises at
              settlement, so line items are still entered manually.
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
                %
              </div>
              <Input
                id="bs-contingency"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step={1}
                value={contingencyStr}
                onChange={(e) => setContingencyStr(e.target.value)}
                placeholder="e.g. 25"
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
