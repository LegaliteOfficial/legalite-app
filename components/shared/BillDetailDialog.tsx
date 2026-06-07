'use client'

/**
 * BillDetailDialog
 * ----------------
 * Read-first view of a single bill. Opens when the user clicks
 * anywhere on a bill row in the /billing table — pre-emptively
 * surfaces everything they'd otherwise have to drill three clicks
 * to find:
 *
 *   - Header        — bill number, client, case, status badge.
 *   - Meta strip    — issue date, due date, payment terms, days
 *                     to / overdue counter.
 *   - Line items    — the same table the composer edits.
 *   - Totals card   — subtotal / tax / total / paid / balance,
 *                     with an "Overdue" banner when applicable.
 *   - Payments      — every payment allocated to this bill, with
 *                     source / deposit account / reference.
 *   - Notes         — free text from the composer.
 *
 * Footer actions are status-aware:
 *   - Draft               → Submit for approval, Edit, Issue, Archive
 *   - PendingApproval     → Issue, Edit, Archive
 *   - Sent (unpaid)       → Record payment, Edit, Archive
 *   - Paid                → Edit, Archive
 *   - Archived            → no actions (read-only).
 *
 * The dialog is deliberately separate from the composer so the
 * "view" and "edit" mental models stay distinct. Clicking Edit
 * closes this dialog and opens the composer pre-loaded with the
 * same bill.
 */

import { useMemo } from 'react'
import { Warning, Bell, Briefcase, Calendar, CheckCircle, CreditCard, PencilSimple, FileText, Receipt, PaperPlaneTilt, Trash, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
  tabKeyFor,
  useBillsLocalStore,
  type Bill,
} from '@/stores/bills-local.store'
import { formatCurrency } from '@/lib/format-currency'

interface BillDetailDialogProps {
  bill: Bill | null
  onOpenChange: (open: boolean) => void
  onEdit: (bill: Bill) => void
  onRecordPayment: (bill: Bill) => void
}

/**
 * Status badge palette — kept in sync with the table's row pills
 * so the visual reads identically across both surfaces.
 */
const STATUS_STYLE: Record<
  ReturnType<typeof tabKeyFor>,
  { label: string; color: string; bg: string }
> = {
  Draft: {
    label: 'Draft',
    color: 'var(--text-secondary, #6B7280)',
    bg: 'var(--surface-sunken, rgba(0,0,0,0.04))',
  },
  PendingApproval: {
    label: 'Pending approval',
    color: 'var(--accent-today, #C9972B)',
    bg: 'var(--accent-today-tint, rgba(201,151,43,0.12))',
  },
  Unpaid: {
    label: 'Unpaid',
    color: 'var(--accent-danger, #C0392B)',
    bg: 'rgba(192, 57, 43, 0.10)',
  },
  Paid: {
    label: 'Paid',
    color: '#2E7D4F',
    bg: 'rgba(46, 125, 79, 0.12)',
  },
  Archive: {
    label: 'Archived',
    color: 'var(--text-muted, #8A8F99)',
    bg: 'var(--surface-sunken, rgba(0,0,0,0.04))',
  },
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Money formatter. Delegates to the firm-currency-aware helper so
 * switching the firm's billing currency in Gear flows through
 * to every label inside the bill detail surface.
 */
function fmtMoney(n: number): string {
  return formatCurrency(n)
}

function daysBetween(target: Date): number {
  return Math.floor((target.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
}

export function BillDetailDialog({
  bill,
  onOpenChange,
  onEdit,
  onRecordPayment,
}: BillDetailDialogProps) {
  // Subscribe to the revision so a payment recorded elsewhere
  // updates the totals card while this dialog is open.
  const revision = useBillsLocalStore((s) => s.revision)
  const liveBill = useMemo(() => {
    if (!bill) return null
    return useBillsLocalStore.getState().bills[bill.id] ?? bill
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bill, revision])

  const submit = useBillsLocalStore((s) => s.submitForApproval)
  const issue = useBillsLocalStore((s) => s.issueBill)
  const archive = useBillsLocalStore((s) => s.archiveBill)
  const sendReminder = useBillsLocalStore((s) => s.sendReminder)

  const { data: clients } = useClients()
  const { data: cases } = useCases()

  const clientName = useMemo(() => {
    if (!liveBill) return '—'
    return (
      (clients ?? []).find((c) => c.id === liveBill.client_id)?.full_name ?? '—'
    )
  }, [clients, liveBill])
  const caseTitle = useMemo(() => {
    if (!liveBill?.case_id) return null
    return (cases ?? []).find((c) => c.id === liveBill.case_id)?.title ?? null
  }, [cases, liveBill])

  // Payments allocated to this bill, newest first.
  const paymentsAgainstBill = useMemo(() => {
    if (!liveBill) return []
    return Object.values(useBillsLocalStore.getState().payments)
      .filter((p) => p.allocations.some((a) => a.bill_id === liveBill.id))
      .map((p) => ({
        ...p,
        amount:
          p.allocations.find((a) => a.bill_id === liveBill.id)?.amount ?? 0,
      }))
      .sort(
        (a, b) => b.payment_date.localeCompare(a.payment_date),
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveBill, revision])

  if (!liveBill) {
    return (
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    )
  }

  const tabKey = tabKeyFor(liveBill)
  const style = STATUS_STYLE[tabKey]
  const isOverdue =
    tabKey === 'Unpaid' && new Date(liveBill.due_date).getTime() < Date.now()
  const daysToDue = daysBetween(new Date(liveBill.due_date))

  return (
    <Dialog open={!!liveBill} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle
                className="flex items-center gap-3 flex-wrap"
                style={{
                  fontFamily:
                    'var(--font-heading, "Playfair Display", serif)',
                }}
              >
                <span className="font-mono text-[18px] tracking-wide">
                  {liveBill.bill_number}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: style.bg, color: style.color }}
                >
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: style.color }}
                  />
                  {style.label}
                </span>
              </DialogTitle>
              <p
                className="text-[13px] mt-1.5 flex items-center gap-3 flex-wrap"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Users size={13} strokeWidth={1.75} />
                  {clientName}
                </span>
                {caseTitle && (
                  <>
                    <span style={{ color: 'var(--text-subtle)' }}>·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase size={13} strokeWidth={1.75} />
                      {caseTitle}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Overdue banner */}
        {isOverdue && (
          <div
            className="flex items-center gap-2 rounded-md px-3 py-2 mt-1"
            style={{
              background: 'rgba(192, 57, 43, 0.08)',
              border: '1px solid rgba(192, 57, 43, 0.25)',
            }}
          >
            <Warning
              size={14}
              strokeWidth={1.75}
              style={{ color: 'var(--accent-danger)' }}
            />
            <span
              className="text-[12.5px] font-semibold"
              style={{ color: 'var(--accent-danger)' }}
            >
              Overdue by {Math.abs(daysToDue)} day
              {Math.abs(daysToDue) === 1 ? '' : 's'}.
            </span>
            <span
              className="text-[12px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Consider sending a payment reminder.
            </span>
          </div>
        )}

        <div className="grid gap-5 py-2">
          {/* Meta strip */}
          <div
            className="grid grid-cols-3 gap-3 rounded-md border p-3"
            style={{
              borderColor: 'var(--border-soft)',
              background: 'var(--surface-sunken)',
            }}
          >
            <MetaCell
              icon={<Calendar size={13} strokeWidth={1.75} />}
              label="Issued"
              value={fmtDate(liveBill.issue_date)}
            />
            <MetaCell
              icon={<Calendar size={13} strokeWidth={1.75} />}
              label="Due"
              value={fmtDate(liveBill.due_date)}
              hint={
                tabKey === 'Paid'
                  ? 'Paid in full'
                  : daysToDue >= 0
                    ? `${daysToDue} day${daysToDue === 1 ? '' : 's'} away`
                    : `${Math.abs(daysToDue)} day${Math.abs(daysToDue) === 1 ? '' : 's'} overdue`
              }
              hintColor={
                tabKey === 'Paid'
                  ? '#2E7D4F'
                  : daysToDue < 0
                    ? 'var(--accent-danger)'
                    : 'var(--text-muted)'
              }
            />
            <MetaCell
              icon={<Receipt size={13} strokeWidth={1.75} />}
              label="Payment terms"
              value={liveBill.payment_terms}
            />
          </div>

          {/* Line items */}
          <div className="grid gap-2">
            <span
              className="text-[11.5px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Line items
            </span>
            <div
              className="rounded-md border overflow-hidden"
              style={{ borderColor: 'var(--border-soft)' }}
            >
              <div
                className="grid border-b px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wider"
                style={{
                  gridTemplateColumns: '1fr 60px 100px 110px',
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Amount</span>
              </div>
              {liveBill.line_items.length === 0 ? (
                <div
                  className="px-3 py-4 text-center text-[12.5px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No line items on this bill.
                </div>
              ) : (
                liveBill.line_items.map((li) => (
                  <div
                    key={li.id}
                    className="grid items-center px-3 py-2 border-b last:border-b-0"
                    style={{
                      gridTemplateColumns: '1fr 60px 100px 110px',
                      borderColor: 'var(--border-soft)',
                    }}
                  >
                    <span
                      className="text-[13px]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {li.description}
                    </span>
                    <span
                      className="text-[13px] text-right tabular-nums"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {li.quantity}
                    </span>
                    <span
                      className="text-[13px] text-right tabular-nums"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {fmtMoney(li.rate)}
                    </span>
                    <span
                      className="text-[13px] text-right tabular-nums font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {fmtMoney(li.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Totals card */}
          <div
            className="rounded-md border p-4"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-sunken)',
            }}
          >
            <SummaryLine label="Subtotal" value={fmtMoney(liveBill.subtotal)} />
            <SummaryLine
              label={`Tax (${(liveBill.tax_rate * 100).toFixed(2)}%)`}
              value={fmtMoney(liveBill.tax_amount)}
            />
            <div
              className="border-t my-1.5"
              style={{ borderColor: 'var(--border-soft)' }}
            />
            <SummaryLine
              label="Total"
              value={fmtMoney(liveBill.total)}
              emphasis
            />
            <SummaryLine label="Paid" value={fmtMoney(liveBill.paid)} />
            <SummaryLine
              label="Balance due"
              value={fmtMoney(liveBill.balance_due)}
              emphasis
              color={
                liveBill.balance_due > 0
                  ? 'var(--accent-danger)'
                  : '#2E7D4F'
              }
            />
            {liveBill.paid_at && (
              <p
                className="text-[11.5px] mt-2 text-right"
                style={{ color: 'var(--text-muted)' }}
              >
                Paid in full on {fmtDateTime(liveBill.paid_at)}
              </p>
            )}
          </div>

          {/* Payments history */}
          <div className="grid gap-2">
            <span
              className="text-[11.5px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Payment history ({paymentsAgainstBill.length})
            </span>
            {paymentsAgainstBill.length === 0 ? (
              <div
                className="rounded-md border border-dashed px-3 py-4 text-center text-[12.5px]"
                style={{
                  borderColor: 'var(--border-soft)',
                  color: 'var(--text-muted)',
                }}
              >
                No payments recorded against this bill yet.
              </div>
            ) : (
              <ul
                className="rounded-md border overflow-hidden"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                {paymentsAgainstBill.map((p) => (
                  <li
                    key={p.id}
                    className="grid items-center gap-3 px-3 py-2.5 border-b last:border-b-0"
                    style={{
                      gridTemplateColumns: '120px 1fr 120px',
                      borderColor: 'var(--border-soft)',
                    }}
                  >
                    <span
                      className="text-[12.5px] tabular-nums"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {fmtDate(p.payment_date)}
                    </span>
                    <div className="min-w-0">
                      <span
                        className="text-[12.5px] font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {p.payment_source}
                      </span>
                      <span
                        className="ml-2 text-[11.5px]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        → {p.deposit_account}
                      </span>
                      {(p.reference || p.payer) && (
                        <p
                          className="text-[11.5px] mt-0.5 truncate"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {[p.payer, p.reference]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-[13px] text-right tabular-nums font-semibold"
                      style={{ color: '#2E7D4F' }}
                    >
                      {fmtMoney(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Payment reminder log — append-only audit trail. Only
              shown when at least one reminder has been logged so
              empty bills stay quiet. */}
          {liveBill.reminders.length > 0 && (
            <div className="grid gap-2">
              <span
                className="text-[11.5px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Payment reminders ({liveBill.reminders.length})
              </span>
              <ul
                className="rounded-md border overflow-hidden"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                {liveBill.reminders
                  .slice()
                  .reverse()
                  .map((r) => (
                    <li
                      key={r.id}
                      className="grid items-center gap-3 px-3 py-2 border-b last:border-b-0"
                      style={{
                        gridTemplateColumns: '160px 1fr 80px',
                        borderColor: 'var(--border-soft)',
                      }}
                    >
                      <span
                        className="text-[12px] tabular-nums inline-flex items-center gap-1.5"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Bell size={11} strokeWidth={1.75} />
                        {fmtDateTime(r.sent_at)}
                      </span>
                      <span
                        className="text-[12.5px] truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {r.notes ?? 'Reminder sent.'}
                      </span>
                      <span
                        className="text-[11px] uppercase tracking-wider font-semibold text-right"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {r.channel === 'email' ? 'Email' : 'Manual'}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {liveBill.notes && (
            <div className="grid gap-1">
              <span
                className="text-[11.5px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Notes
              </span>
              <div
                className="rounded-md border px-3 py-2 text-[13px] whitespace-pre-wrap"
                style={{
                  borderColor: 'var(--border-soft)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                }}
              >
                {liveBill.notes}
              </div>
            </div>
          )}

          {/* Created / updated footer */}
          <p
            className="text-[11px] tabular-nums"
            style={{ color: 'var(--text-subtle)' }}
          >
            Created {fmtDateTime(liveBill.created_at)} · last updated{' '}
            {fmtDateTime(liveBill.updated_at)}
          </p>
        </div>

        <DialogFooter className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {liveBill.status === 'Draft' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  submit(liveBill.id)
                  toast.success(
                    `${liveBill.bill_number} sent for approval.`,
                  )
                }}
              >
                <FileText size={13} strokeWidth={1.75} />
                Submit for approval
              </Button>
              <Button
                onClick={() => {
                  issue(liveBill.id)
                  toast.success(`${liveBill.bill_number} issued.`)
                }}
                style={{ background: 'var(--gold)', color: 'var(--navy)' }}
              >
                <PaperPlaneTilt size={13} strokeWidth={1.75} />
                Issue
              </Button>
            </>
          )}
          {liveBill.status === 'PendingApproval' && (
            <Button
              onClick={() => {
                issue(liveBill.id)
                toast.success(`${liveBill.bill_number} issued.`)
              }}
              style={{ background: 'var(--gold)', color: 'var(--navy)' }}
            >
              <PaperPlaneTilt size={13} strokeWidth={1.75} />
              Issue
            </Button>
          )}
          {tabKey === 'Unpaid' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  sendReminder(liveBill.id)
                  // Read the count back fresh so the toast reflects
                  // the new size of the log.
                  const next =
                    useBillsLocalStore.getState().bills[liveBill.id]
                  const count = next?.reminders.length ?? 1
                  toast.success(
                    count === 1
                      ? `First reminder logged for ${liveBill.bill_number}.`
                      : `Reminder ${count} logged for ${liveBill.bill_number}.`,
                  )
                }}
              >
                <Bell size={13} strokeWidth={1.75} />
                Send reminder
              </Button>
              <Button
                onClick={() => onRecordPayment(liveBill)}
                style={{ background: 'var(--gold)', color: 'var(--navy)' }}
              >
                <CreditCard size={13} strokeWidth={1.75} />
                Record payment
              </Button>
            </>
          )}
          {liveBill.status !== 'Archived' && (
            <>
              <Button variant="outline" onClick={() => onEdit(liveBill)}>
                <PencilSimple size={13} strokeWidth={1.75} />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  archive(liveBill.id)
                  toast.success(`${liveBill.bill_number} archived.`)
                  onOpenChange(false)
                }}
                style={{ color: 'var(--accent-danger)' }}
              >
                <Trash size={13} strokeWidth={1.75} />
                Archive
              </Button>
            </>
          )}
          {liveBill.status === 'Paid' && (
            <span
              className="inline-flex items-center gap-1 text-[12.5px]"
              style={{ color: '#2E7D4F' }}
            >
              <CheckCircle size={13} strokeWidth={1.75} />
              Fully reconciled
            </span>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MetaCell({
  icon,
  label,
  value,
  hint,
  hintColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  hintColor?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span
        className="text-[11px] font-semibold uppercase tracking-wider inline-flex items-center gap-1.5"
        style={{ color: 'var(--text-muted)' }}
      >
        {icon}
        {label}
      </span>
      <span
        className="text-[13.5px] font-medium tabular-nums"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </span>
      {hint && (
        <span
          className="text-[11.5px] tabular-nums"
          style={{ color: hintColor ?? 'var(--text-muted)' }}
        >
          {hint}
        </span>
      )}
    </div>
  )
}

function SummaryLine({
  label,
  value,
  emphasis,
  color,
}: {
  label: string
  value: string
  emphasis?: boolean
  color?: string
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span
        className="text-[13px]"
        style={{
          color: color ?? (emphasis ? 'var(--text-primary)' : 'var(--text-secondary)'),
          fontWeight: emphasis ? 600 : undefined,
        }}
      >
        {label}
      </span>
      <span
        className="text-[13px] tabular-nums"
        style={{
          color: color ?? (emphasis ? 'var(--text-primary)' : 'var(--text-secondary)'),
          fontWeight: emphasis ? 600 : undefined,
        }}
      >
        {value}
      </span>
    </div>
  )
}
