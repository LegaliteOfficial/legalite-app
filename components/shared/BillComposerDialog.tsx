'use client'

/**
 * BillComposerDialog
 * ------------------
 * Create / edit a bill, with live-computed totals as the user
 * adds line items. Used from the /billing page's "New bill"
 * action and from each row's "View / Edit" action.
 *
 * Fields:
 *   - Client          (required, select from useClients)
 *   - Case            (optional, narrowed to the client's cases)
 *   - Issue date / Due date
 *   - Payment terms   (free-form e.g. "Net 14")
 *   - Line items[]    (add / remove rows; auto-computed amount)
 *   - Tax rate        (percentage, default 12.5 — GH VAT)
 *   - Notes           (textarea)
 *
 * Save writes through `useBillsLocalStore.createBill` /
 * `updateBill` so the bills list re-renders immediately.
 */

import { useEffect, useMemo, useState } from 'react'
import { BookBookmark, Briefcase, Check, Info, Plus, Trash } from '@phosphor-icons/react'
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
import { useCases } from '@/hooks/use-cases'
import {
  recomputeTotals,
  useBillsLocalStore,
  type Bill,
  type BillLineItem,
} from '@/stores/bills-local.store'
import { useClientBillingRate } from '@/hooks/use-client-billing-rate'
import { useClientRatesStore } from '@/stores/client-rates-local.store'
import { ExpensePickerDialog } from '@/components/shared/ExpensePickerDialog'
import type { ExpenseItem } from '@/stores/expense-catalog-local.store'

interface BillComposerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: Bill | null
}

/** Stable temp-id minter for line-items being typed in the form. */
function newLineItemId(): string {
  return `li-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

const BLANK_LINE_ITEM = (): BillLineItem => ({
  id: newLineItemId(),
  description: '',
  quantity: 1,
  rate: 0,
  amount: 0,
})

function isoDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function defaultIssueDate(): string {
  return isoDateInput(new Date())
}

function defaultDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return isoDateInput(d)
}

export function BillComposerDialog({
  open,
  onOpenChange,
  editing,
}: BillComposerDialogProps) {
  const createBill = useBillsLocalStore((s) => s.createBill)
  const updateBill = useBillsLocalStore((s) => s.updateBill)

  const { data: clients } = useClients()
  const { data: cases } = useCases()

  // ── Form state ──────────────────────────────────────────────────
  const [clientId, setClientId] = useState('')
  const [caseId, setCaseId] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Net 14')
  const [items, setItems] = useState<BillLineItem[]>([BLANK_LINE_ITEM()])
  const [taxRatePct, setTaxRatePct] = useState(12.5)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Expense-picker dialog state. The picker lives as its own modal
  // mounted underneath the composer; opening it doesn't close the
  // composer so the partner can chain "add expense", "add expense",
  // "add line item" in any order.
  const [pickerOpen, setPickerOpen] = useState(false)

  // Resolved billing rate for the picked client. `rate` is the
  // GHS-per-hour number we pre-fill new line items with; `source`
  // tells us where it came from so we can render the right chip
  // ("Client rate" vs "Firm default" vs "Set a rate" CTA).
  const resolvedRate = useClientBillingRate(clientId || null)
  // The picked client object — used in the rate chip label so the
  // partner sees "AccraTech Ltd — GHS 1,200/hr" rather than just the
  // bare number.
  const pickedClient = useMemo(
    () => (clients ?? []).find((c) => c.id === clientId) ?? null,
    [clients, clientId],
  )

  // Reset / hydrate on open. Also rehydrate the client-rates store
  // since it uses skipHydration — without this the very first open
  // of the dialog in a tab would miss the persisted rates and
  // every prefill would be the firm default fallback (or 0).
  useEffect(() => {
    if (!open) return
    void useClientRatesStore.persist.rehydrate()
    if (editing) {
      setClientId(editing.client_id)
      setCaseId(editing.case_id ?? '')
      setIssueDate(editing.issue_date.slice(0, 10))
      setDueDate(editing.due_date.slice(0, 10))
      setPaymentTerms(editing.payment_terms)
      setItems(
        editing.line_items.length
          ? editing.line_items.map((li) => ({ ...li }))
          : [BLANK_LINE_ITEM()],
      )
      setTaxRatePct(editing.tax_rate * 100)
      setNotes(editing.notes ?? '')
    } else {
      setClientId('')
      setCaseId('')
      setIssueDate(defaultIssueDate())
      setDueDate(defaultDueDate())
      setPaymentTerms('Net 14')
      setItems([BLANK_LINE_ITEM()])
      setTaxRatePct(12.5)
      setNotes('')
    }
    setSubmitting(false)
  }, [open, editing])

  // When the picked client changes (or the resolved rate refreshes,
  // e.g. the partner edits the client's rate in another tab), pre-
  // fill any line items whose rate is still 0 with the resolved
  // hourly rate. We deliberately skip rows the partner has already
  // typed a rate into so a client change doesn't clobber manual
  // overrides on the in-progress bill.
  useEffect(() => {
    if (!open) return
    if (resolvedRate.rate == null) return
    setItems((prev) => {
      let changed = false
      const next = prev.map((li) => {
        if (li.rate > 0) return li
        changed = true
        return {
          ...li,
          rate: resolvedRate.rate!,
          amount: li.quantity * resolvedRate.rate!,
        }
      })
      return changed ? next : prev
    })
  }, [open, clientId, resolvedRate.rate])

  // Narrow the case dropdown to the picked client.
  const filteredCases = useMemo(
    () =>
      (cases ?? []).filter((c) =>
        clientId ? c.client_id === clientId : true,
      ),
    [cases, clientId],
  )

  // Live totals. Pulled into useMemo so the summary card recomputes
  // only when the inputs that drive it actually change.
  const totals = useMemo(() => {
    return recomputeTotals({
      line_items: items.map((it) => ({
        ...it,
        amount: it.quantity * it.rate,
      })),
      tax_rate: taxRatePct / 100,
      paid: editing?.paid ?? 0,
    })
  }, [items, taxRatePct, editing])

  // ── Line item helpers ───────────────────────────────────────────
  // A freshly-added row gets the resolved client/firm rate pre-set
  // so the partner doesn't have to re-type it. Multiplies through to
  // `amount` so the live summary tracks immediately.
  const addItem = () =>
    setItems((prev) => {
      const next = BLANK_LINE_ITEM()
      if (resolvedRate.rate != null) {
        next.rate = resolvedRate.rate
        next.amount = next.quantity * resolvedRate.rate
      }
      return [...prev, next]
    })

  /**
   * Append a catalog item as a line item. The description is the
   * catalog item name plus its unit-name in parentheses so the
   * client invoice reads naturally ("Paper (page)", "Photocopy
   * (copy)"). Quantity, rate, and amount come straight from the
   * catalog row + the partner's picked quantity.
   *
   * If the composer currently has only a blank starter line item,
   * we replace it rather than appending — keeping the table tidy.
   */
  const addExpenseFromCatalog = (item: ExpenseItem, quantity: number) => {
    const newLine: BillLineItem = {
      id: newLineItemId(),
      description: `${item.name} (${item.unit_name})`,
      quantity,
      rate: item.unit_price,
      amount:
        Math.round(quantity * item.unit_price * 100) / 100,
    }
    setItems((prev) => {
      const onlyBlank =
        prev.length === 1 &&
        prev[0].description.trim() === '' &&
        prev[0].rate === 0
      return onlyBlank ? [newLine] : [...prev, newLine]
    })
  }
  const removeItem = (id: string) =>
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((li) => li.id !== id),
    )
  const updateItem = (
    id: string,
    patch: Partial<Pick<BillLineItem, 'description' | 'quantity' | 'rate'>>,
  ) => {
    setItems((prev) =>
      prev.map((li) =>
        li.id !== id
          ? li
          : {
              ...li,
              ...patch,
              amount:
                (patch.quantity ?? li.quantity) * (patch.rate ?? li.rate),
            },
      ),
    )
  }

  const canSave =
    !!clientId &&
    !!issueDate &&
    !!dueDate &&
    items.some((it) => it.description.trim() && it.quantity > 0 && it.rate > 0)

  const handleSave = () => {
    if (!canSave) return
    setSubmitting(true)
    try {
      // Funnel out fully-blank rows so we don't persist noise.
      const trimmedItems = items
        .filter(
          (it) =>
            it.description.trim() && it.quantity > 0 && it.rate > 0,
        )
        .map((it) => ({
          ...it,
          amount: Math.round(it.quantity * it.rate * 100) / 100,
        }))

      const tax_rate = taxRatePct / 100
      const { subtotal, tax_amount, total, balance_due } = recomputeTotals({
        line_items: trimmedItems,
        tax_rate,
        paid: editing?.paid ?? 0,
      })

      const payload = {
        client_id: clientId,
        case_id: caseId || null,
        status: editing?.status ?? ('Draft' as const),
        issue_date: new Date(issueDate).toISOString(),
        due_date: new Date(dueDate).toISOString(),
        payment_terms: paymentTerms.trim() || 'Net 14',
        line_items: trimmedItems,
        subtotal,
        tax_rate,
        tax_amount,
        total,
        paid: editing?.paid ?? 0,
        balance_due,
        paid_at: editing?.paid_at ?? null,
        notes: notes.trim() || null,
      }

      if (editing) {
        updateBill(editing.id, payload)
        toast.success(`Updated ${editing.bill_number}.`)
      } else {
        const created = createBill(payload)
        toast.success(`Added ${created.bill_number} as Draft.`)
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Couldn't save: ${err.message}`
          : 'Save failed. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            {editing ? `Edit ${editing.bill_number}` : 'New bill'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Client + case */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="bill-client" className="text-[13px]">
                Client{' '}
                <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </Label>
              <select
                id="bill-client"
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value)
                  setCaseId('')
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
                htmlFor="bill-case"
                className="text-[13px] inline-flex items-center gap-1.5"
              >
                <Briefcase size={12} strokeWidth={1.75} />
                Case (optional)
              </Label>
              <select
                id="bill-case"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                disabled={!clientId}
                className="h-9 rounded-md border px-2 text-[13px] bg-transparent"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <option value="">No linked case</option>
                {filteredCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Issue + due + terms */}
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="bill-issue" className="text-[13px]">
                Issue date
              </Label>
              <Input
                id="bill-issue"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bill-due" className="text-[13px]">
                Due date
              </Label>
              <Input
                id="bill-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bill-terms" className="text-[13px]">
                Payment terms
              </Label>
              <Input
                id="bill-terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Net 14"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-[13px]">Line items</Label>
              <div className="flex items-center gap-2">
                {/*
                 * Rate chip: surfaces which rate is being pre-filled
                 * so the partner doesn't wonder why a line item lands
                 * at GHS 1,200 vs the firm default 600. Hidden until a
                 * client is picked because there's no rate to resolve
                 * without one.
                 *
                 * Three states:
                 *   - source 'client' : navy chip — this client has
                 *                       their own rate set; the value
                 *                       comes straight from the
                 *                       client record.
                 *   - source 'firm'   : muted chip — falling back to
                 *                       the firm-wide default because
                 *                       this client doesn't have one.
                 *   - source 'none'   : warning chip — no rate set
                 *                       anywhere, partner needs to
                 *                       type one (or set one on the
                 *                       client record).
                 */}
                {clientId && (
                  <RateChip
                    source={resolvedRate.source}
                    rate={resolvedRate.rate}
                    clientLabel={pickedClient?.full_name ?? ''}
                  />
                )}
                {/* Catalog picker — opens the ExpensePickerDialog
                    where the partner picks a reusable item + quantity.
                    Sits left of "Add line item" because catalog items
                    are the faster path for small disbursements. */}
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[12px] font-medium cursor-pointer"
                  style={{
                    background: 'rgba(13,27,42,0.06)',
                    color: 'var(--navy)',
                  }}
                  title="Add a small reusable expense (paper, photocopy, filing fee...)"
                >
                  <BookBookmark size={11} strokeWidth={2.25} />
                  Add expense
                </button>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[12px] font-medium cursor-pointer"
                  style={{
                    background: 'var(--accent-today-tint, rgba(201,151,43,0.12))',
                    color: 'var(--accent-today)',
                  }}
                >
                  <Plus size={11} strokeWidth={2.25} />
                  Add line item
                </button>
              </div>
            </div>
            <div
              className="rounded-md border overflow-hidden"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div
                className="grid border-b px-2 py-1.5 text-[11.5px] font-semibold uppercase tracking-wider"
                style={{
                  gridTemplateColumns: '1fr 80px 100px 100px 32px',
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Rate (GHS)</span>
                <span className="text-right">Amount</span>
                <span />
              </div>
              {items.map((it) => (
                <div
                  key={it.id}
                  className="grid items-center px-2 py-1.5 border-b last:border-b-0"
                  style={{
                    gridTemplateColumns: '1fr 80px 100px 100px 32px',
                    borderColor: 'var(--border-soft)',
                  }}
                >
                  <Input
                    value={it.description}
                    onChange={(e) =>
                      updateItem(it.id, { description: e.target.value })
                    }
                    placeholder="e.g. Discovery review (May)"
                    className="h-8 text-[13px] border-none focus-visible:ring-0"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={it.quantity}
                    onChange={(e) =>
                      updateItem(it.id, {
                        quantity: Number(e.target.value) || 0,
                      })
                    }
                    className="h-8 text-[13px] text-right border-none focus-visible:ring-0 tabular-nums"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={it.rate}
                    onChange={(e) =>
                      updateItem(it.id, {
                        rate: Number(e.target.value) || 0,
                      })
                    }
                    className="h-8 text-[13px] text-right border-none focus-visible:ring-0 tabular-nums"
                  />
                  <span
                    className="text-[13px] text-right tabular-nums pr-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {(it.quantity * it.rate).toLocaleString('en-GH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove line item"
                    onClick={() => removeItem(it.id)}
                    disabled={items.length === 1}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer disabled:opacity-30"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash size={12} strokeWidth={1.75} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tax + summary */}
          <div className="grid grid-cols-2 gap-3 items-start">
            <div className="grid gap-1.5">
              <Label htmlFor="bill-tax" className="text-[13px]">
                Tax rate (%)
              </Label>
              <Input
                id="bill-tax"
                type="number"
                inputMode="decimal"
                value={taxRatePct}
                onChange={(e) =>
                  setTaxRatePct(Number(e.target.value) || 0)
                }
              />
              <p
                className="text-[11.5px]"
                style={{ color: 'var(--text-muted)' }}
              >
                Ghana VAT is 12.5%. Override per bill as needed.
              </p>
            </div>
            <div
              className="rounded-md border p-3 text-[13px] tabular-nums"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-sunken)',
                color: 'var(--text-secondary)',
              }}
            >
              <SummaryRow label="Subtotal" amount={totals.subtotal} />
              <SummaryRow
                label={`Tax (${taxRatePct.toFixed(2)}%)`}
                amount={totals.tax_amount}
              />
              <div
                className="border-t my-1"
                style={{ borderColor: 'var(--border-soft)' }}
              />
              <SummaryRow
                label="Total"
                amount={totals.total}
                emphasis
              />
              {editing && editing.paid > 0 && (
                <>
                  <SummaryRow
                    label="Paid"
                    amount={editing.paid}
                  />
                  <SummaryRow
                    label="Balance due"
                    amount={totals.balance_due}
                    emphasis
                  />
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label htmlFor="bill-notes" className="text-[13px]">
              Notes (optional)
            </Label>
            <Textarea
              id="bill-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes, payment instructions, references…"
              rows={3}
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
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
            }}
          >
            <Check size={13} strokeWidth={2} />
            {editing ? 'Save changes' : 'Save as Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {/* Expense picker — separate dialog so opening it doesn't tear
        down the composer's local state. Hands a chosen catalog item
        + quantity back to addExpenseFromCatalog. */}
    <ExpensePickerDialog
      open={pickerOpen}
      onOpenChange={setPickerOpen}
      onAdd={addExpenseFromCatalog}
    />
    </>
  )
}

/**
 * Compact pill that tells the partner which rate is being applied
 * to fresh line items. Lives next to the "Add line item" button so
 * the answer to "where did GHS 1,200 come from?" is one glance away.
 */
function RateChip({
  source,
  rate,
  clientLabel,
}: {
  source: 'client' | 'firm' | 'none'
  rate: number | null
  clientLabel: string
}) {
  // Colour key:
  //   client -> navy   : this client has their own rate set
  //   firm   -> muted  : falling back to the firm default
  //   none   -> danger : nothing to pre-fill, partner needs to type
  const palette =
    source === 'client'
      ? { bg: 'rgba(13,27,42,0.08)', fg: 'var(--navy)' }
      : source === 'firm'
        ? { bg: 'rgba(0,0,0,0.04)', fg: 'var(--text-secondary)' }
        : { bg: 'rgba(190,53,52,0.10)', fg: 'var(--accent-danger)' }

  const label =
    source === 'client'
      ? `${clientLabel} rate · GHS ${rate?.toLocaleString('en-GH')}/hr`
      : source === 'firm'
        ? `Firm default · GHS ${rate?.toLocaleString('en-GH')}/hr`
        : 'No rate set — type or set one on the client'

  return (
    <span
      className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[11.5px] font-medium tabular-nums"
      style={{ background: palette.bg, color: palette.fg }}
      title={
        source === 'client'
          ? 'Pulled from this client&rsquo;s billing rate. Edit the client to change it.'
          : source === 'firm'
            ? 'No client-specific rate set — using the firm default. Set one on the client to override.'
            : 'No client rate and no firm default. Type a rate per line, or set one on the client.'
      }
    >
      <Info size={11} strokeWidth={1.75} />
      {label}
    </span>
  )
}

function SummaryRow({
  label,
  amount,
  emphasis,
}: {
  label: string
  amount: number
  emphasis?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between py-0.5"
      style={
        emphasis
          ? { color: 'var(--text-primary)', fontWeight: 600 }
          : undefined
      }
    >
      <span>{label}</span>
      <span>
        GHS{' '}
        {amount.toLocaleString('en-GH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </div>
  )
}
