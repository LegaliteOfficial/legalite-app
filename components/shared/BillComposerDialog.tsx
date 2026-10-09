'use client'

/**
 * BillComposerDialog
 * ------------------
 * Create / edit a bill, with live-computed totals as the user adds
 * line items. A side drawer (full screen on phones) opened from the
 * /billing page ("New bill", row "View / Edit") and from the clients
 * table ("Create bill", with the client pre-selected).
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
  FormDrawer,
  FormDrawerBody,
  FormDrawerFooter,
  FormDrawerHeader,
  FormDrawerSection,
} from '@/components/ui/form-drawer'
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
  /** New bills only: start with this client (and case) selected. */
  defaultClientId?: string | null
  defaultCaseId?: string | null
  /** New bills only: called with the created bill after saving. */
  onCreated?: (bill: Bill) => void
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
  defaultClientId,
  defaultCaseId,
  onCreated,
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
      setClientId(defaultClientId ?? '')
      setCaseId(defaultClientId ? (defaultCaseId ?? '') : '')
      setIssueDate(defaultIssueDate())
      setDueDate(defaultDueDate())
      setPaymentTerms('Net 14')
      setItems([BLANK_LINE_ITEM()])
      setTaxRatePct(12.5)
      setNotes('')
    }
    setSubmitting(false)
  }, [open, editing, defaultClientId, defaultCaseId])

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
        onCreated?.(created)
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

  const lockedClient = !editing && !!defaultClientId
  const fieldClass =
    'h-10 w-full rounded-lg border px-3 text-[13px] bg-[var(--surface-card)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] disabled:opacity-60'

  return (
    <>
      <FormDrawer open={open} onOpenChange={onOpenChange} size="lg">
        <FormDrawerHeader
          title={editing ? `Edit ${editing.bill_number}` : 'New bill'}
          description={
            editing
              ? `${pickedClient?.full_name ?? 'Client'} · ${editing.status}`
              : lockedClient && pickedClient
                ? `Billing ${pickedClient.full_name}. Saved as a draft you can send from Billing.`
                : 'Saved as a draft you can review and send from Billing.'
          }
          onClose={() => onOpenChange(false)}
        />

        <FormDrawerBody>
          <FormDrawerSection title="Client">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="bill-client" className="text-[12.5px]">
                  Client <span style={{ color: 'var(--accent-danger)' }}>*</span>
                </Label>
                <select
                  id="bill-client"
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value)
                    setCaseId('')
                  }}
                  disabled={lockedClient}
                  className={fieldClass}
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
                <Label htmlFor="bill-case" className="inline-flex items-center gap-1.5 text-[12.5px]">
                  <Briefcase size={12} strokeWidth={1.75} />
                  Case (optional)
                </Label>
                <select
                  id="bill-case"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  disabled={!clientId}
                  className={fieldClass}
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
            {clientId && (
              <RateChip
                source={resolvedRate.source}
                rate={resolvedRate.rate}
                clientLabel={pickedClient?.full_name ?? ''}
              />
            )}
          </FormDrawerSection>

          <FormDrawerSection title="Dates and terms">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="bill-issue" className="text-[12.5px]">Issue date</Label>
                <Input id="bill-issue" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="h-10" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bill-due" className="text-[12.5px]">Due date</Label>
                <Input id="bill-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10" />
              </div>
              <div className="col-span-2 grid gap-1.5 sm:col-span-1">
                <Label htmlFor="bill-terms" className="text-[12.5px]">Payment terms</Label>
                <Input id="bill-terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Net 14" className="h-10" />
              </div>
            </div>
          </FormDrawerSection>

          <FormDrawerSection title="Line items">
            {/* Wide drawers: a compact table header. Phones: each item is a card. */}
            <div
              className="hidden grid-cols-[minmax(0,1fr)_72px_104px_100px_32px] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider sm:grid"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Rate (GHS)</span>
              <span className="text-right">Amount</span>
              <span />
            </div>
            <ul className="space-y-2">
              {items.map((it, index) => (
                <li
                  key={it.id}
                  className="rounded-xl border p-3 sm:grid sm:grid-cols-[minmax(0,1fr)_72px_104px_100px_32px] sm:items-center sm:gap-2 sm:rounded-lg sm:p-1.5"
                  style={{ borderColor: 'var(--border-default)', background: 'var(--surface-card)' }}
                >
                  <div className="mb-2 flex items-center justify-between sm:hidden">
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Item {index + 1}
                    </span>
                    <button
                      type="button"
                      aria-label="Remove line item"
                      onClick={() => removeItem(it.id)}
                      disabled={items.length === 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md disabled:opacity-30"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                  <Input
                    value={it.description}
                    onChange={(e) => updateItem(it.id, { description: e.target.value })}
                    placeholder="e.g. Discovery review (May)"
                    aria-label="Description"
                    className="h-10 text-[13px] sm:h-9 sm:border-transparent sm:shadow-none"
                  />
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:contents">
                    <label className="grid gap-1 sm:block">
                      <span className="text-[11px] sm:hidden" style={{ color: 'var(--text-muted)' }}>Qty</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={it.quantity}
                        onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) || 0 })}
                        aria-label="Quantity"
                        className="h-10 text-right text-[13px] tabular-nums sm:h-9"
                      />
                    </label>
                    <label className="grid gap-1 sm:block">
                      <span className="text-[11px] sm:hidden" style={{ color: 'var(--text-muted)' }}>Rate (GHS)</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={it.rate}
                        onChange={(e) => updateItem(it.id, { rate: Number(e.target.value) || 0 })}
                        aria-label="Rate in GHS"
                        className="h-10 text-right text-[13px] tabular-nums sm:h-9"
                      />
                    </label>
                    <div className="grid gap-1 sm:block">
                      <span className="text-[11px] sm:hidden" style={{ color: 'var(--text-muted)' }}>Amount</span>
                      <span className="flex h-10 items-center justify-end text-[13px] font-medium tabular-nums sm:h-9 sm:pr-1" style={{ color: 'var(--text-primary)' }}>
                        {(it.quantity * it.rate).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove line item"
                    onClick={() => removeItem(it.id)}
                    disabled={items.length === 1}
                    className="hidden h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-sunken)] disabled:opacity-30 sm:inline-flex"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash size={13} strokeWidth={1.75} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={addItem}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold sm:h-8"
                style={{ background: 'var(--accent-today-tint, rgba(201,151,43,0.12))', color: 'var(--gold-dark)' }}
              >
                <Plus size={13} strokeWidth={2.25} />
                Add line item
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold sm:h-8"
                style={{ background: 'rgba(13,27,42,0.06)', color: 'var(--navy)' }}
                title="Add a small reusable expense (paper, photocopy, filing fee...)"
              >
                <BookBookmark size={13} strokeWidth={2.25} />
                Add expense
              </button>
            </div>
          </FormDrawerSection>

          <FormDrawerSection title="Tax and notes">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
              <div className="grid gap-1.5 self-start">
                <Label htmlFor="bill-tax" className="text-[12.5px]">Tax rate (%)</Label>
                <Input
                  id="bill-tax"
                  type="number"
                  inputMode="decimal"
                  value={taxRatePct}
                  onChange={(e) => setTaxRatePct(Number(e.target.value) || 0)}
                  className="h-10"
                />
                <p className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>Ghana VAT is 12.5%.</p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bill-notes" className="text-[12.5px]">Notes (optional)</Label>
                <Textarea
                  id="bill-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment instructions, references…"
                  rows={3}
                />
              </div>
            </div>
          </FormDrawerSection>

          <FormDrawerSection title="Summary">
            <div
              className="rounded-xl border p-3 text-[13px] tabular-nums"
              style={{ borderColor: 'var(--border-default)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}
            >
              <SummaryRow label="Subtotal" amount={totals.subtotal} />
              <SummaryRow label={`Tax (${taxRatePct.toFixed(2)}%)`} amount={totals.tax_amount} />
              <div className="my-1 border-t" style={{ borderColor: 'var(--border-soft)' }} />
              <SummaryRow label="Total" amount={totals.total} emphasis />
              {editing && editing.paid > 0 && (
                <>
                  <SummaryRow label="Paid" amount={editing.paid} />
                  <SummaryRow label="Balance due" amount={totals.balance_due} emphasis />
                </>
              )}
            </div>
          </FormDrawerSection>
        </FormDrawerBody>

        {/* Sticky footer: the running total stays visible while editing. */}
        <FormDrawerFooter split>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {editing && editing.paid > 0 ? 'Balance due' : 'Total'}
            </p>
            <p className="truncate text-[16px] font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              GHS{' '}
              {(editing && editing.paid > 0 ? totals.balance_due : totals.total).toLocaleString('en-GH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="hidden sm:inline-flex">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave || submitting}
              className="h-10 sm:h-9"
              style={{ background: 'var(--gold)', color: 'var(--navy)' }}
            >
              <Check size={13} strokeWidth={2} />
              {editing ? 'Save changes' : 'Save as draft'}
            </Button>
          </div>
        </FormDrawerFooter>
      </FormDrawer>

      {/* Expense picker — separate dialog so opening it doesn't tear
          down the composer's local state. Hands a chosen catalog item
          + quantity back to addExpenseFromCatalog. */}
      <ExpensePickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onAdd={addExpenseFromCatalog} />
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
      className="inline-flex max-w-full items-start gap-1.5 rounded-md px-2 py-1.5 text-[11.5px] font-medium tabular-nums"
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
