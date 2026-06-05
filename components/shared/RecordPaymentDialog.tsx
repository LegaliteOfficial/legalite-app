'use client'

/**
 * RecordPaymentDialog
 * -------------------
 * The form behind the "Record payment" header action. Picks a
 * client, then surfaces their outstanding bills so the user can
 * allocate the payment amount across them (auto-prefills the
 * earliest-due bill first — same heuristic Apple Cash uses when
 * paying multiple invoices).
 *
 * Persists through `useBillsLocalStore.recordPayment`, which:
 *   1. Stores the Payment record
 *   2. Bumps each allocated bill's `paid` field
 *   3. Recomputes balance_due
 *   4. Flips status to Paid if balance_due hits zero
 *
 * On save the bills table re-renders immediately because the
 * store revision counter bumps.
 */

import { useEffect, useMemo, useState } from 'react'
import { Check, CreditCard, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useClients } from '@/hooks/use-clients'
import {
  tabKeyFor,
  useBillsLocalStore,
  type PaymentAllocation,
} from '@/stores/bills-local.store'
import {
  formatCurrency,
  useActiveCurrencyCode,
} from '@/lib/format-currency'

interface RecordPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Pre-fill the client picker. Used when the dialog is opened
   * from a bill row's "Apply payment" action.
   */
  defaultClientId?: string
  defaultBillId?: string
}

const PAYMENT_SOURCES = [
  'Bank transfer',
  'Cheque',
  'Cash',
  'Mobile money',
  'Card on file',
  'Client funds account',
] as const

const DEPOSIT_ACCOUNTS = [
  'Operating — GHS',
  'Client — GHS',
  'Trust — GHS',
  'Operating — USD',
] as const

function isoDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  defaultClientId,
  defaultBillId,
}: RecordPaymentDialogProps) {
  const recordPayment = useBillsLocalStore((s) => s.recordPayment)
  const revision = useBillsLocalStore((s) => s.revision)
  // Pull the bills slice fresh from the store on every revision bump
  // (without trigger SSR-snapshot warnings).
  const billsByClient = useMemo(() => {
    const map = new Map<string, ReturnType<typeof useBillsLocalStore.getState>['bills'][string][]>()
    for (const b of Object.values(useBillsLocalStore.getState().bills)) {
      if (tabKeyFor(b) !== 'Unpaid') continue
      const slot = map.get(b.client_id) ?? []
      slot.push(b)
      map.set(b.client_id, slot)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.due_date.localeCompare(b.due_date))
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision])

  const { data: clients } = useClients()

  const currencyCode = useActiveCurrencyCode()

  // ── Form state ──────────────────────────────────────────────────
  const [clientId, setClientId] = useState('')
  const [paymentSource, setPaymentSource] = useState<string>('Bank transfer')
  const [paymentDate, setPaymentDate] = useState('')
  const [depositAccount, setDepositAccount] =
    useState<string>('Operating — GHS')
  const [reference, setReference] = useState('')
  const [payer, setPayer] = useState('')
  const [description, setDescription] = useState('')
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  // Explicit "amount received" field — the source of truth for what
  // the partner received. The previous version derived the total
  // purely from the allocation rows, which meant the Save button
  // stayed disabled whenever (a) the client had no outstanding bills
  // or (b) the partner hadn't yet clicked "Pay all" / typed
  // amounts. Now the partner types the amount once, allocations
  // cascade from earliest-due, and any surplus banks against
  // client funds rather than disabling the save.
  const [amountStr, setAmountStr] = useState<string>('')

  // Reset / hydrate on open.
  useEffect(() => {
    if (!open) return
    setClientId(defaultClientId ?? '')
    setPaymentSource('Bank transfer')
    setPaymentDate(isoDateInput(new Date()))
    setDepositAccount('Operating — GHS')
    setReference('')
    setPayer('')
    setDescription('')
    // If we were opened from a specific bill, pre-allocate its
    // full balance into the allocation map AND seed the explicit
    // amount field so Save lights up immediately.
    if (defaultBillId) {
      const bill = useBillsLocalStore.getState().bills[defaultBillId]
      if (bill) {
        setAllocations({ [defaultBillId]: bill.balance_due })
        setClientId(bill.client_id)
        setAmountStr(String(bill.balance_due))
      } else {
        setAllocations({})
        setAmountStr('')
      }
    } else {
      setAllocations({})
      setAmountStr('')
    }
    setSubmitting(false)
  }, [open, defaultClientId, defaultBillId])

  const openBills = clientId ? billsByClient.get(clientId) ?? [] : []

  const totalAllocated = useMemo(
    () => Object.values(allocations).reduce((s, n) => s + n, 0),
    [allocations],
  )

  const amountReceived = useMemo(() => {
    const n = Number(amountStr)
    return Number.isFinite(n) && n > 0 ? n : 0
  }, [amountStr])

  /**
   * The unallocated portion — surplus the partner received above
   * what they distributed across bills. Lands on the client funds
   * account (we log it as a Payment with empty / partial allocations
   * and the store treats the remainder as a fund credit).
   */
  const unallocated = Math.max(0, amountReceived - totalAllocated)

  /** Auto-fill the allocation map starting with the earliest due bill. */
  const allocate = (total: number) => {
    let remaining = total
    const next: Record<string, number> = {}
    for (const b of openBills) {
      if (remaining <= 0) break
      const apply = Math.min(b.balance_due, remaining)
      next[b.id] = Math.round(apply * 100) / 100
      remaining -= apply
    }
    setAllocations(next)
  }

  /**
   * Whenever the amount received OR the client changes, cascade the
   * amount into the allocation rows from earliest-due. The partner
   * can still hand-tune each row afterwards — this just gives them
   * a sensible default without having to remember to click "Pay
   * all". Any surplus above the bill total stays unallocated and
   * surfaces as the "Banks to client funds" preview.
   */
  useEffect(() => {
    if (!open) return
    if (!clientId) return
    allocate(amountReceived)
    // openBills + allocate close over `openBills`, which changes
    // with the client id and the bills revision. Re-cascading on
    // every revision is intentional — if the partner records a
    // payment that pays off a bill and then opens this dialog
    // again, the next allocation should reflect the new state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clientId, amountReceived, revision])

  // Save is enabled the moment the partner has typed an amount,
  // regardless of whether the client has outstanding bills. A
  // client-funds-only deposit is a legitimate flow and used to be
  // blocked by the old `totalAllocated > 0` gate.
  const canSave =
    !!clientId &&
    !!paymentSource &&
    !!paymentDate &&
    !!depositAccount &&
    amountReceived > 0

  const handleSave = () => {
    if (!canSave) return
    setSubmitting(true)
    try {
      const allocs: PaymentAllocation[] = Object.entries(allocations)
        .filter(([, amt]) => amt > 0)
        .map(([bill_id, amount]) => ({ bill_id, amount }))

      recordPayment({
        client_id: clientId,
        payment_date: new Date(paymentDate).toISOString(),
        payment_source: paymentSource,
        deposit_account: depositAccount,
        reference: reference.trim() || null,
        payer: payer.trim() || null,
        description: description.trim() || null,
        // `total` is the amount the partner actually received —
        // independent of the per-bill allocations so a surplus
        // payment lands on the books even when allocations don't
        // sum to the total.
        total: amountReceived,
        allocations: allocs,
      })

      const clientName =
        (clients ?? []).find((c) => c.id === clientId)?.full_name ??
        'the client'
      const summary =
        unallocated > 0
          ? `${formatCurrency(amountReceived)} from ${clientName} — ${formatCurrency(totalAllocated)} applied to bills, ${formatCurrency(unallocated)} to client funds.`
          : allocs.length === 0
            ? `${formatCurrency(amountReceived)} from ${clientName} banked to client funds.`
            : `${formatCurrency(amountReceived)} from ${clientName} applied across ${allocs.length} bill${allocs.length === 1 ? '' : 's'}.`
      toast.success(summary)
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Couldn't record payment: ${err.message}`
          : 'Failed to record payment.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            Record payment
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Client + source */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label
                htmlFor="pay-client"
                className="text-[13px] inline-flex items-center gap-1.5"
              >
                <Users size={12} strokeWidth={1.75} />
                Client{' '}
                <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </Label>
              <select
                id="pay-client"
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value)
                  setAllocations({})
                }}
                className="h-9 rounded-md border px-2 text-[13px] bg-transparent"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <option value="">Pick a client…</option>
                {(clients ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label
                htmlFor="pay-source"
                className="text-[13px] inline-flex items-center gap-1.5"
              >
                <CreditCard size={12} strokeWidth={1.75} />
                Payment source{' '}
                <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </Label>
              <select
                id="pay-source"
                value={paymentSource}
                onChange={(e) => setPaymentSource(e.target.value)}
                className="h-9 rounded-md border px-2 text-[13px] bg-transparent"
                style={{ borderColor: 'var(--border-default)' }}
              >
                {PAYMENT_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/*
           * Amount received — the source of truth for what the
           * partner is recording. Bigger and bolder than the other
           * inputs because it's the headline number. The bottom
           * summary line tells the partner how this amount splits
           * between bills and client funds.
           */}
          <div className="grid gap-1.5">
            <Label
              htmlFor="pay-amount"
              className="text-[13px] font-semibold"
            >
              Amount received{' '}
              <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </Label>
            <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
              <div
                className="h-10 rounded-md border flex items-center justify-center text-[13px] font-semibold tabular-nums"
                style={{
                  borderColor: 'var(--border-soft)',
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-secondary)',
                }}
              >
                {currencyCode}
              </div>
              <Input
                id="pay-amount"
                type="number"
                inputMode="decimal"
                min={0}
                step={1}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="e.g. 1500.00"
                className="h-10 text-[14px] tabular-nums font-semibold"
              />
            </div>
          </div>

          {/* Date + deposit account */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="pay-date" className="text-[13px]">
                Payment date{' '}
                <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </Label>
              <Input
                id="pay-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pay-deposit" className="text-[13px]">
                Deposit account{' '}
                <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </Label>
              <select
                id="pay-deposit"
                value={depositAccount}
                onChange={(e) => setDepositAccount(e.target.value)}
                className="h-9 rounded-md border px-2 text-[13px] bg-transparent"
                style={{ borderColor: 'var(--border-default)' }}
              >
                {DEPOSIT_ACCOUNTS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ref + payer */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="pay-ref" className="text-[13px]">
                Reference
              </Label>
              <Input
                id="pay-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Bank reference #"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pay-payer" className="text-[13px]">
                Payer
              </Label>
              <Input
                id="pay-payer"
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
                placeholder="Who made the payment?"
              />
            </div>
          </div>

          {/* Outstanding bills + allocation */}
          {clientId && (
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[13px]">
                  Apply to outstanding bills
                </Label>
                {openBills.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      allocate(
                        openBills.reduce(
                          (s, b) => s + b.balance_due,
                          0,
                        ),
                      )
                    }
                    className="text-[11.5px] font-semibold underline underline-offset-2 cursor-pointer"
                    style={{ color: 'var(--accent-today)' }}
                  >
                    Pay all
                  </button>
                )}
              </div>
              {openBills.length === 0 ? (
                <p
                  className="text-[12.5px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No outstanding bills for this client. The payment will
                  land on their client-funds account.
                </p>
              ) : (
                <div
                  className="rounded-md border overflow-hidden"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  {openBills.map((b) => {
                    const value = allocations[b.id] ?? 0
                    return (
                      <div
                        key={b.id}
                        className="grid items-center px-2 py-1.5 border-b last:border-b-0"
                        style={{
                          gridTemplateColumns: '1fr 110px 130px',
                          borderColor: 'var(--border-soft)',
                        }}
                      >
                        <span
                          className="text-[12.5px] truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          <span className="font-mono font-semibold">
                            {b.bill_number}
                          </span>
                          <span
                            className="ml-2 text-[11.5px]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Due {new Date(b.due_date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </span>
                        <span
                          className="text-[12px] text-right tabular-nums"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Balance:{' '}
                          {b.balance_due.toLocaleString('en-GH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={b.balance_due}
                          value={value}
                          onChange={(e) => {
                            const n = Math.min(
                              b.balance_due,
                              Math.max(0, Number(e.target.value) || 0),
                            )
                            setAllocations((prev) => ({
                              ...prev,
                              [b.id]: n,
                            }))
                          }}
                          className="h-7 text-[12.5px] text-right tabular-nums"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
              {/*
               * Breakdown — the partner sees exactly how the
               * received amount splits across bills vs client
               * funds. The "to client funds" line only shows when
               * there's a surplus; the styling pulls attention to
               * it because it changes the meaning of the save.
               */}
              <div
                className="rounded-md border p-2.5 text-[12.5px] tabular-nums"
                style={{
                  borderColor: 'var(--border-soft)',
                  background: 'var(--surface-sunken)',
                }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span>Applied to bills</span>
                  <span className="font-semibold">
                    {formatCurrency(totalAllocated)}
                  </span>
                </div>
                {unallocated > 0 && (
                  <div
                    className="flex items-center justify-between mt-1"
                    style={{ color: 'var(--accent-today)' }}
                  >
                    <span>Banks to client funds</span>
                    <span className="font-semibold">
                      {formatCurrency(unallocated)}
                    </span>
                  </div>
                )}
                <div
                  className="flex items-center justify-between mt-1.5 pt-1.5 border-t"
                  style={{
                    borderColor: 'var(--border-soft)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span className="font-semibold">Amount received</span>
                  <span className="font-semibold">
                    {formatCurrency(amountReceived)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/*
           * When the client has no outstanding bills we still
           * surface a "Banks to client funds" preview so the
           * partner knows the payment will land somewhere
           * meaningful rather than vanishing into the void.
           */}
          {clientId && openBills.length === 0 && amountReceived > 0 && (
            <div
              className="rounded-md border p-2.5 text-[12.5px] tabular-nums"
              style={{
                borderColor: 'var(--border-soft)',
                background: 'var(--surface-sunken)',
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{ color: 'var(--accent-today)' }}
              >
                <span>Banks to client funds</span>
                <span className="font-semibold">
                  {formatCurrency(amountReceived)}
                </span>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="pay-desc" className="text-[13px]">
              Description (optional)
            </Label>
            <Textarea
              id="pay-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Internal memo, allocation notes…"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || submitting}
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          >
            <Check size={13} strokeWidth={2} />
            {submitting ? 'Recording…' : 'Record payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
