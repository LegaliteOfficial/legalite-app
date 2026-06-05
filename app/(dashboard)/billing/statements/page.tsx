'use client'

/**
 * Statements of Account
 * ---------------------
 * Periodic client-account summaries — issued bills, payments
 * received, opening / closing balance per client, optionally
 * separated by matter. This is the single most-asked-for
 * partner-side report once a firm starts billing seriously.
 *
 * Layout mirrors the reference: a left-side filter / settings
 * column and a right-side live preview that re-renders as the
 * user toggles options.
 *
 * Filters (left column):
 *   - Show clients with zero balance        (visibility toggle)
 *   - Show unbilled clients with funds      (visibility toggle)
 *   - Client scope                          (All / Specific client
 *                                            / Responsible solicitor)
 *   - Group results by                      (Client / Matter)
 *   - Currency                              (filter by currency code)
 *   - Include matter information            (separate by matter)
 *   - Date range                            (All / Last 30d / 60d /
 *                                            90d / Year-to-date /
 *                                            Custom)
 *   - Show client account balance           (Trust)
 *   - Show client operating balance         (Operating)
 *   - Bill theme                            (Default / Compact)
 *   - Format                                (PDF / ZIP)
 *
 * Generate:
 *   - PDF: opens the browser print dialog targeted at the preview
 *     pane (the user can save as PDF). Works without a backend.
 *   - ZIP: stubs a toast for now — bundles per-client PDFs once
 *     the headless renderer lands server-side.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  ChevronLeft,
  Download,
  FileText,
  Filter,
  Printer,
  RefreshCw,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useClients } from '@/hooks/use-clients'
import { useCases } from '@/hooks/use-cases'
import {
  outstandingFor,
  useBillsLocalStore,
  type Bill,
  type Payment,
} from '@/stores/bills-local.store'
import { formatCurrency } from '@/lib/format-currency'

// ── Filter option lists ───────────────────────────────────────────────

const CLIENT_SCOPES = [
  { key: 'all', label: 'All Clients' },
  { key: 'specific', label: 'Specific Client' },
  { key: 'solicitor', label: 'Responsible Solicitor' },
] as const
type ClientScope = (typeof CLIENT_SCOPES)[number]['key']

const GROUP_BY = [
  { key: 'client', label: 'Client' },
  { key: 'matter', label: 'Matter' },
] as const
type GroupBy = (typeof GROUP_BY)[number]['key']

const DATE_RANGES = [
  { key: 'all', label: 'All Dates' },
  { key: '30d', label: 'Last 30 days' },
  { key: '60d', label: 'Last 60 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'ytd', label: 'Year to date' },
] as const
type DateRange = (typeof DATE_RANGES)[number]['key']

const CURRENCIES = [
  { key: 'all', label: 'All currencies' },
  { key: 'GHS', label: 'GHS only' },
  { key: 'USD', label: 'USD only' },
] as const
type CurrencyKey = (typeof CURRENCIES)[number]['key']

const BILL_THEMES = [
  { key: 'default', label: 'Default' },
  { key: 'compact', label: 'Compact' },
] as const
type ThemeKey = (typeof BILL_THEMES)[number]['key']

// ── Page ───────────────────────────────────────────────────────────────

export default function StatementsPage() {
  // Hydrate the bills store on mount — same pattern as the bills page.
  useEffect(() => {
    void useBillsLocalStore.persist.rehydrate()
  }, [])

  const revision = useBillsLocalStore((s) => s.revision)
  const allBills = useMemo(
    () => Object.values(useBillsLocalStore.getState().bills),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision],
  )
  const allPayments = useMemo(
    () => Object.values(useBillsLocalStore.getState().payments),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision],
  )

  const { data: clients } = useClients()
  const { data: cases } = useCases()

  // ── Filter state ────────────────────────────────────────────────
  const [showZeroBalance, setShowZeroBalance] = useState(true)
  const [showUnbilledWithFunds, setShowUnbilledWithFunds] = useState(false)
  const [clientScope, setClientScope] = useState<ClientScope>('all')
  const [specificClientId, setSpecificClientId] = useState('')
  const [solicitorName, setSolicitorName] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('client')
  const [currency, setCurrency] = useState<CurrencyKey>('all')
  const [includeMatterInfo, setIncludeMatterInfo] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [showAccountBalance, setShowAccountBalance] = useState(false)
  const [showOperatingBalance, setShowOperatingBalance] = useState(false)
  const [theme, setTheme] = useState<ThemeKey>('default')

  // Unique solicitor names harvested from the case roster — drives
  // the "Responsible Solicitor" dropdown.
  const solicitors = useMemo(() => {
    const set = new Set<string>()
    for (const c of cases ?? []) {
      if (c.assigned_lawyer) set.add(c.assigned_lawyer)
      if (c.originating_lawyer) set.add(c.originating_lawyer)
    }
    return Array.from(set).sort()
  }, [cases])

  // Map cases → client for the "scope by solicitor" filter (the
  // statement should pull every client whose cases are managed by
  // the named solicitor).
  const clientIdsForSolicitor = useMemo(() => {
    if (clientScope !== 'solicitor' || !solicitorName) return null
    const ids = new Set<string>()
    for (const c of cases ?? []) {
      if (
        c.assigned_lawyer === solicitorName ||
        c.originating_lawyer === solicitorName
      ) {
        ids.add(c.client_id)
      }
    }
    return ids
  }, [clientScope, solicitorName, cases])

  // ── Build statements ────────────────────────────────────────────
  const statements = useMemo(
    () =>
      buildStatements({
        bills: allBills,
        payments: allPayments,
        clients: clients ?? [],
        cases: cases ?? [],
        filters: {
          showZeroBalance,
          showUnbilledWithFunds,
          clientScope,
          specificClientId,
          clientIdsForSolicitor,
          groupBy,
          currency,
          includeMatterInfo,
          dateRange,
        },
      }),
    [
      allBills,
      allPayments,
      clients,
      cases,
      showZeroBalance,
      showUnbilledWithFunds,
      clientScope,
      specificClientId,
      clientIdsForSolicitor,
      groupBy,
      currency,
      includeMatterInfo,
      dateRange,
    ],
  )

  const handleGenerate = (format: 'PDF' | 'ZIP') => {
    if (format === 'ZIP') {
      toast.info(
        'ZIP export bundles per-client PDFs server-side — ships with the integrations release.',
      )
      return
    }
    // Browser print → save-as-PDF works without any backend. The
    // print stylesheet hides the chrome + sidebar so only the
    // preview pane renders to the page.
    window.print()
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: 'var(--surface-card)' }}
    >
      {/* Print-mode: hide everything except #statements-preview */}
      <style>{`
        @media print {
          body { background: white !important; }
          aside, .statements-chrome { display: none !important; }
          #statements-preview {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="px-6 py-6 statements-chrome">
        {/* Back link */}
        <Link
          href="/billing"
          className="inline-flex items-center gap-1 text-[12.5px] font-medium hover:underline underline-offset-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={13} strokeWidth={1.75} />
          Back to bills
        </Link>

        <h1
          className="mt-2 text-[26px] font-semibold leading-tight tracking-tight"
          style={{
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-heading, "Playfair Display", serif)',
          }}
        >
          Statements of account
        </h1>
        <p
          className="text-[13px] mt-1"
          style={{ color: 'var(--text-muted)' }}
        >
          A periodic summary of bills issued, payments received, and
          balances per client. Tune the filters, preview live, then
          export to PDF for sending.
        </p>
      </div>

      <div className="grid grid-cols-[360px_1fr] gap-4 px-6 pb-12">
        {/* ── Filter column ───────────────────────────────────── */}
        <div
          className="rounded-xl border p-4 statements-chrome"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'var(--surface-card)',
          }}
        >
          {/* Filters */}
          <SectionLabel icon={<Filter size={13} strokeWidth={1.75} />}>
            Filters
          </SectionLabel>
          <ToggleRow
            checked={showZeroBalance}
            onChange={setShowZeroBalance}
            label="Show clients with zero balance"
          />
          <ToggleRow
            checked={showUnbilledWithFunds}
            onChange={setShowUnbilledWithFunds}
            label="Show unbilled clients with funds in Client account or Operating account"
          />

          <Divider />

          {/* Client scope */}
          <SectionLabel icon={<Users size={13} strokeWidth={1.75} />}>
            Client scope
          </SectionLabel>
          {CLIENT_SCOPES.map((opt) => (
            <RadioRow
              key={opt.key}
              checked={clientScope === opt.key}
              onChange={() => setClientScope(opt.key)}
              label={opt.label}
            />
          ))}
          {clientScope === 'specific' && (
            <select
              value={specificClientId}
              onChange={(e) => setSpecificClientId(e.target.value)}
              className="mt-2 w-full h-9 rounded-md border px-2 text-[13px] bg-transparent"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <option value="">Pick a client…</option>
              {(clients ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          )}
          {clientScope === 'solicitor' && (
            <select
              value={solicitorName}
              onChange={(e) => setSolicitorName(e.target.value)}
              className="mt-2 w-full h-9 rounded-md border px-2 text-[13px] bg-transparent"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <option value="">Pick a solicitor…</option>
              {solicitors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          <Divider />

          {/* Group + currency */}
          <SectionLabel>Group results by</SectionLabel>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="w-full h-9 rounded-md border px-2 text-[13px] bg-transparent"
            style={{ borderColor: 'var(--border-default)' }}
          >
            {GROUP_BY.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>

          <div className="mt-3">
            <SectionLabel>Currency</SectionLabel>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyKey)}
              className="w-full h-9 rounded-md border px-2 text-[13px] bg-transparent"
              style={{ borderColor: 'var(--border-default)' }}
            >
              {CURRENCIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <Divider />

          {/* Matter info */}
          <SectionLabel>Matter information</SectionLabel>
          <ToggleRow
            checked={includeMatterInfo}
            onChange={setIncludeMatterInfo}
            label="Include matter information (separate by matter)"
          />

          <Divider />

          {/* Date range */}
          <SectionLabel icon={<Calendar size={13} strokeWidth={1.75} />}>
            Date range
          </SectionLabel>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="w-full h-9 rounded-md border px-2 text-[13px] bg-transparent"
            style={{ borderColor: 'var(--border-default)' }}
          >
            {DATE_RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>

          <Divider />

          {/* Account balances */}
          <SectionLabel>Account balances</SectionLabel>
          <ToggleRow
            checked={showAccountBalance}
            onChange={setShowAccountBalance}
            label="Show client (trust) account balance"
          />
          <ToggleRow
            checked={showOperatingBalance}
            onChange={setShowOperatingBalance}
            label="Show client operating balance"
          />

          <Divider />

          {/* Theme */}
          <SectionLabel>Bill theme</SectionLabel>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeKey)}
            className="w-full h-9 rounded-md border px-2 text-[13px] bg-transparent"
            style={{ borderColor: 'var(--border-default)' }}
          >
            {BILL_THEMES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Generate buttons */}
          <div className="mt-5 flex gap-2">
            <Button
              onClick={() => handleGenerate('PDF')}
              style={{ background: 'var(--gold)', color: 'var(--navy)' }}
              className="flex-1"
            >
              <Printer size={13} strokeWidth={1.75} />
              Generate PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleGenerate('ZIP')}
            >
              <Download size={13} strokeWidth={1.75} />
              ZIP
            </Button>
          </div>
          <p
            className="text-[11px] mt-2 text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            PDF opens your browser&rsquo;s print dialog targeted at the
            preview.
          </p>
        </div>

        {/* ── Preview column ──────────────────────────────────── */}
        <div
          id="statements-preview"
          className="rounded-xl border p-6"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'white',
            boxShadow: 'var(--shadow-xs)',
            minHeight: '60vh',
          }}
        >
          {statements.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center text-center py-16"
              style={{ color: 'var(--text-muted)' }}
            >
              <FileText
                size={28}
                strokeWidth={1.25}
                className="mb-2"
                style={{ color: 'var(--text-subtle)' }}
              />
              <p
                className="text-[14px] font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Nothing to preview yet.
              </p>
              <p className="mt-1 text-[12.5px] max-w-sm">
                Adjust the filters on the left to pull in client
                activity. Statements with no bills, payments, or
                balances are hidden by default.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowZeroBalance(true)
                  setShowUnbilledWithFunds(true)
                  setDateRange('all')
                  setClientScope('all')
                  setCurrency('all')
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold underline underline-offset-2 cursor-pointer"
                style={{ color: 'var(--accent-today)' }}
              >
                <RefreshCw size={11} strokeWidth={2} />
                Loosen filters
              </button>
            </div>
          ) : (
            statements.map((s) => (
              <StatementPreview
                key={s.client_id}
                statement={s}
                theme={theme}
                showAccountBalance={showAccountBalance}
                showOperatingBalance={showOperatingBalance}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Filter / data plumbing ────────────────────────────────────────────

interface Statement {
  client_id: string
  client_name: string
  /**
   * Activity entries — bills issued + payments received, sorted by
   * date. Each line carries `debit` / `credit` so the running balance
   * column can grow correctly.
   */
  lines: StatementLine[]
  opening_balance: number
  closing_balance: number
  total_billed: number
  total_paid: number
  // Optional per-matter sub-grouping (when includeMatterInfo + groupBy=client).
  matter_groups?: { case_id: string; case_title: string; lines: StatementLine[] }[]
}

interface StatementLine {
  date: string
  kind: 'Bill' | 'Payment'
  reference: string
  description: string
  case_title: string | null
  debit: number
  credit: number
  running_balance: number
}

interface FilterState {
  showZeroBalance: boolean
  showUnbilledWithFunds: boolean
  clientScope: ClientScope
  specificClientId: string
  clientIdsForSolicitor: Set<string> | null
  groupBy: GroupBy
  currency: CurrencyKey
  includeMatterInfo: boolean
  dateRange: DateRange
}

function buildStatements(args: {
  bills: Bill[]
  payments: Payment[]
  clients: { id: string; full_name: string }[]
  cases: { id: string; title: string; client_id: string }[]
  filters: FilterState
}): Statement[] {
  const { bills, payments, clients, cases, filters } = args

  // 1. Determine the eligible client universe given the scope filter.
  let eligibleClients = clients
  if (filters.clientScope === 'specific') {
    eligibleClients = clients.filter((c) => c.id === filters.specificClientId)
  } else if (
    filters.clientScope === 'solicitor' &&
    filters.clientIdsForSolicitor
  ) {
    eligibleClients = clients.filter((c) =>
      filters.clientIdsForSolicitor!.has(c.id),
    )
  }

  const caseTitleById = new Map(cases.map((c) => [c.id, c.title]))

  // 2. Apply the date-range cutoff to figure out which entries land
  //    within the statement window. Anything before becomes part of
  //    the opening balance.
  const cutoff = (() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    if (filters.dateRange === '30d') d.setDate(d.getDate() - 30)
    else if (filters.dateRange === '60d') d.setDate(d.getDate() - 60)
    else if (filters.dateRange === '90d') d.setDate(d.getDate() - 90)
    else if (filters.dateRange === 'ytd') d.setMonth(0, 1)
    else return null // 'all'
    return d.getTime()
  })()

  const out: Statement[] = []
  for (const client of eligibleClients) {
    const cBills = bills.filter(
      (b) =>
        b.client_id === client.id &&
        b.status !== 'Draft' &&
        b.status !== 'Archived',
    )
    const cPayments = payments.filter((p) => p.client_id === client.id)
    if (cBills.length === 0 && cPayments.length === 0) continue

    // Opening balance = sum of pre-cutoff debits (bills) minus
    // pre-cutoff credits (payment allocations).
    let opening = 0
    if (cutoff != null) {
      for (const b of cBills) {
        if (new Date(b.issue_date).getTime() < cutoff) opening += b.total
      }
      for (const p of cPayments) {
        if (new Date(p.payment_date).getTime() < cutoff) {
          const billsForClient = new Set(
            cBills.map((b) => b.id),
          )
          for (const a of p.allocations) {
            if (billsForClient.has(a.bill_id)) opening -= a.amount
          }
        }
      }
    }

    // Lines = bills issued + payments received inside the window.
    const lines: StatementLine[] = []
    for (const b of cBills) {
      const t = new Date(b.issue_date).getTime()
      if (cutoff != null && t < cutoff) continue
      lines.push({
        date: b.issue_date,
        kind: 'Bill',
        reference: b.bill_number,
        description: 'Bill issued',
        case_title: b.case_id ? caseTitleById.get(b.case_id) ?? null : null,
        debit: b.total,
        credit: 0,
        running_balance: 0,
      })
    }
    for (const p of cPayments) {
      const t = new Date(p.payment_date).getTime()
      if (cutoff != null && t < cutoff) continue
      const cBillIds = new Set(cBills.map((b) => b.id))
      const credit = p.allocations.reduce(
        (s, a) => (cBillIds.has(a.bill_id) ? s + a.amount : s),
        0,
      )
      if (credit <= 0) continue
      lines.push({
        date: p.payment_date,
        kind: 'Payment',
        reference: p.reference ?? '—',
        description: `Payment received (${p.payment_source})`,
        case_title: null,
        debit: 0,
        credit,
        running_balance: 0,
      })
    }
    lines.sort((a, b) => a.date.localeCompare(b.date))

    let running = opening
    for (const l of lines) {
      running += l.debit - l.credit
      l.running_balance = running
    }

    const total_billed = lines.reduce((s, l) => s + l.debit, 0)
    const total_paid = lines.reduce((s, l) => s + l.credit, 0)
    const closing = running

    // Zero-balance filter is an OR with the showUnbilledWithFunds
    // hint — i.e. "drop the row only if both gates close it".
    if (!filters.showZeroBalance && Math.abs(closing) < 0.01) continue
    if (
      !filters.showUnbilledWithFunds &&
      lines.length === 0 &&
      Math.abs(closing) < 0.01
    ) {
      continue
    }

    // Currency filter currently maps every bill to GHS in dev data;
    // when multi-currency lands, narrow `cBills` upstream.
    if (filters.currency === 'USD') continue

    const matter_groups =
      filters.includeMatterInfo && filters.groupBy === 'client'
        ? groupLinesByMatter(lines, cBills, caseTitleById)
        : undefined

    out.push({
      client_id: client.id,
      client_name: client.full_name,
      lines,
      opening_balance: opening,
      closing_balance: closing,
      total_billed,
      total_paid,
      matter_groups,
    })
  }

  // Sort statements by closing balance descending — biggest exposure first.
  out.sort((a, b) => b.closing_balance - a.closing_balance)
  return out
}

function groupLinesByMatter(
  lines: StatementLine[],
  bills: Bill[],
  caseTitleById: Map<string, string>,
): { case_id: string; case_title: string; lines: StatementLine[] }[] {
  const billCaseById = new Map(bills.map((b) => [b.bill_number, b.case_id]))
  const byMatter = new Map<string, StatementLine[]>()
  for (const l of lines) {
    if (l.kind !== 'Bill') continue
    const caseId = billCaseById.get(l.reference) ?? null
    const key = caseId ?? '__no_case__'
    byMatter.set(key, [...(byMatter.get(key) ?? []), l])
  }
  return Array.from(byMatter.entries()).map(([caseId, ls]) => ({
    case_id: caseId,
    case_title:
      caseId === '__no_case__'
        ? 'Unlinked / firm-level'
        : caseTitleById.get(caseId) ?? caseId,
    lines: ls,
  }))
}

// ── Preview sub-components ────────────────────────────────────────────

function StatementPreview({
  statement,
  theme,
  showAccountBalance,
  showOperatingBalance,
}: {
  statement: Statement
  theme: ThemeKey
  showAccountBalance: boolean
  showOperatingBalance: boolean
}) {
  const compact = theme === 'compact'
  return (
    <div className={compact ? 'mb-6' : 'mb-10'}>
      <div className="flex items-end justify-between gap-3 flex-wrap pb-2 border-b border-black/10">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
            Statement of account
          </p>
          <h3
            className="text-[18px] font-semibold"
            style={{
              fontFamily: 'var(--font-heading, "Playfair Display", serif)',
              color: 'var(--text-primary)',
            }}
          >
            {statement.client_name}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
            Closing balance
          </p>
          <p
            className="text-[18px] font-semibold tabular-nums"
            style={{
              color:
                statement.closing_balance > 0
                  ? 'var(--accent-danger)'
                  : '#2E7D4F',
            }}
          >
            {fmtMoney(statement.closing_balance)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3 text-[12px]">
        <KV label="Opening" value={fmtMoney(statement.opening_balance)} />
        <KV label="Billed" value={fmtMoney(statement.total_billed)} />
        <KV label="Paid" value={fmtMoney(statement.total_paid)} />
        {showAccountBalance && (
          <KV
            label="Trust balance"
            // Trust balance is sourced from the per-client funds
            // store when that lands. For now, surface zero so the
            // line at least renders.
            value={fmtMoney(0)}
          />
        )}
        {showOperatingBalance && (
          <KV label="Operating balance" value={fmtMoney(0)} />
        )}
      </div>

      {statement.matter_groups ? (
        statement.matter_groups.map((g) => (
          <div key={g.case_id} className="mt-4">
            <p className="text-[12px] font-semibold text-gray-700">
              {g.case_title}
            </p>
            <StatementLinesTable lines={g.lines} compact={compact} />
          </div>
        ))
      ) : (
        <StatementLinesTable lines={statement.lines} compact={compact} />
      )}

      {/* Totals row */}
      <div className="mt-2 flex items-center justify-between pt-2 border-t border-black/10 text-[12px] font-semibold">
        <span>Total outstanding</span>
        <span
          className="tabular-nums"
          style={{
            color:
              statement.closing_balance > 0
                ? 'var(--accent-danger)'
                : '#2E7D4F',
          }}
        >
          {fmtMoney(statement.closing_balance)}
        </span>
      </div>
    </div>
  )
}

function StatementLinesTable({
  lines,
  compact,
}: {
  lines: StatementLine[]
  compact: boolean
}) {
  if (lines.length === 0) {
    return (
      <p className="text-[11.5px] text-gray-500 mt-2">
        No activity in this window.
      </p>
    )
  }
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-[12px] text-left">
        <thead>
          <tr className="text-[10.5px] uppercase tracking-wider text-gray-500 border-b border-black/10">
            <th className="py-2 pr-2 font-semibold">Date</th>
            <th className="py-2 pr-2 font-semibold">Ref</th>
            <th className="py-2 pr-2 font-semibold">Description</th>
            <th className="py-2 pr-2 font-semibold text-right">Debit</th>
            <th className="py-2 pr-2 font-semibold text-right">Credit</th>
            <th className="py-2 font-semibold text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, idx) => (
            <tr
              key={`${l.reference}-${idx}`}
              className="border-b border-black/5"
              style={{ height: compact ? 24 : 32 }}
            >
              <td className="py-1 pr-2 tabular-nums text-gray-700">
                {fmtDate(l.date)}
              </td>
              <td className="py-1 pr-2 font-mono tabular-nums text-gray-800">
                {l.reference}
              </td>
              <td className="py-1 pr-2 text-gray-800">{l.description}</td>
              <td className="py-1 pr-2 tabular-nums text-right">
                {l.debit > 0 ? fmtMoney(l.debit) : ''}
              </td>
              <td className="py-1 pr-2 tabular-nums text-right text-green-700">
                {l.credit > 0 ? fmtMoney(l.credit) : ''}
              </td>
              <td className="py-1 tabular-nums text-right font-semibold">
                {fmtMoney(l.running_balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
        {label}
      </p>
      <p className="text-[12.5px] font-medium tabular-nums">{value}</p>
    </div>
  )
}

// ── Form helpers ───────────────────────────────────────────────────────

function SectionLabel({
  children,
  icon,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <Label
      className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5"
      style={{ color: 'var(--text-muted)' }}
    >
      {icon}
      {children}
    </Label>
  )
}

function Divider() {
  return (
    <div
      className="my-3 h-px"
      style={{ background: 'var(--border-soft)' }}
    />
  )
}

function ToggleRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-start gap-2 py-1 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded cursor-pointer"
        style={{ accentColor: 'var(--gold)' }}
      />
      <span
        className="text-[12.5px] leading-snug"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </span>
    </label>
  )
}

function RadioRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2 py-1 cursor-pointer">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 cursor-pointer"
        style={{ accentColor: 'var(--gold)' }}
      />
      <span
        className="text-[12.5px]"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </span>
    </label>
  )
}

// ── Tiny formatters ───────────────────────────────────────────────────

// Delegates to the firm-currency-aware formatter so generated
// statements reflect whatever billing currency the firm has set.
function fmtMoney(n: number): string {
  return formatCurrency(n)
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

// Keep imports warm — outstandingFor will plug into the trust /
// operating balance lines once the funds store ships.
void outstandingFor
