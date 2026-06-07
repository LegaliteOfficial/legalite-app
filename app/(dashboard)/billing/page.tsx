'use client'

/**
 * Billing — bills management
 * --------------------------
 * The /billing route used to render the subscription pricing
 * page; that's been moved to /billing/plans. This page is the
 * day-to-day bills surface — list, filter, record payments, raise
 * funds requests.
 *
 * Three sub-views live in this single page (per the reference):
 *
 *   - Bills              — the table of bills with status filters
 *                          (Draft / Pending approval / Unpaid /
 *                          Paid / All / Archive).
 *   - Outstanding        — bills bucketed by client showing net
 *                          balance + last activity.
 *   - Job Status         — a lightweight pipeline view for batched
 *                          bill issuance (queued / sending / sent
 *                          / failed). Today this is a placeholder
 *                          surface that explains where the live
 *                          job view will plug in.
 *
 * State is sourced from `useBillsLocalStore` — the bills shape
 * here is richer than the legacy `Invoice` type, so the page
 * deliberately doesn't fall back to `useInvoices`. When the
 * GraphQL backend gains the bill / line-item / payment tables,
 * the store's mutate functions become the success-path callsites
 * for the matching mutations; the page contract doesn't change.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowsDownUp, Bell, BookBookmark, CalendarDots, Check, CaretDown, Coins, CreditCard, PencilSimple, Eye, FileText, Funnel, DotsThree, Plus, Receipt, MagnifyingGlass, PaperPlaneTilt, GearSix, Sparkle, Trash, Users, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useClients } from '@/hooks/use-clients'
import { useCases } from '@/hooks/use-cases'
import {
  outstandingFor,
  recomputeTotals,
  tabKeyFor,
  useBillsLocalStore,
  type Bill,
  type BillTabKey,
  type ClientFundsBalance,
  type ClientFundsMovement,
} from '@/stores/bills-local.store'
import { BillComposerDialog } from '@/components/shared/BillComposerDialog'
import { BillDetailDialog } from '@/components/shared/BillDetailDialog'
import { RecordPaymentDialog } from '@/components/shared/RecordPaymentDialog'
import { TopUpRequestDialog } from '@/components/shared/TopUpRequestDialog'
import { PriorityButton } from '@/components/shared/PriorityButton'
import { BillingPrioritySuggestions } from '@/components/shared/BillingPrioritySuggestions'
import { BillingSettingsDialog } from '@/components/shared/BillingSettingsDialog'
import { ExpenseCatalogDialog } from '@/components/shared/ExpenseCatalogDialog'
import { useExpenseCatalogStore } from '@/stores/expense-catalog-local.store'
import {
  getResolvedRate,
  useClientRatesStore,
  type ResolvedRate,
} from '@/stores/client-rates-local.store'
import {
  formatDuration,
  unbilledTimeForClient,
  useTimeTrackerStore,
  type TimeEntry,
} from '@/stores/time-tracker-local.store'
import { formatCurrency } from '@/lib/format-currency'

// ── Sub-nav + filter tabs ──────────────────────────────────────────────

type SubNavKey = 'bills' | 'outstanding' | 'time' | 'funds' | 'jobs'

const SUB_NAV: { key: SubNavKey; label: string }[] = [
  { key: 'bills', label: 'Bills' },
  { key: 'outstanding', label: 'Outstanding Balances' },
  // Unbilled Time slots between Outstanding and Client Funds because
  // it's the pipeline that *creates* outstanding balances — the
  // partner timed an hour, hasn't billed it yet, that hour belongs
  // here until they convert it into a draft bill.
  { key: 'time', label: 'Unbilled Time' },
  { key: 'funds', label: 'Client Funds' },
  { key: 'jobs', label: 'Job Status' },
]

const STATUS_TABS: { key: BillTabKey; label: string }[] = [
  { key: 'Draft', label: 'Draft' },
  { key: 'PendingApproval', label: 'Pending approval' },
  { key: 'Unpaid', label: 'Unpaid' },
  { key: 'Paid', label: 'Paid' },
  { key: 'All', label: 'All' },
  { key: 'Archive', label: 'Archive' },
]

const STATUS_LABEL: Record<Exclude<BillTabKey, 'All'>, string> = {
  Draft: 'Draft',
  PendingApproval: 'Pending approval',
  Unpaid: 'Unpaid',
  Paid: 'Paid',
  Archive: 'Archived',
}

const STATUS_STYLE: Record<
  Exclude<BillTabKey, 'All'>,
  { color: string; bg: string }
> = {
  Draft: {
    color: 'var(--text-secondary, #6B7280)',
    bg: 'var(--surface-sunken, rgba(0,0,0,0.04))',
  },
  PendingApproval: {
    color: 'var(--accent-today, #C9972B)',
    bg: 'var(--accent-today-tint, rgba(201,151,43,0.12))',
  },
  Unpaid: {
    color: 'var(--accent-danger, #C0392B)',
    bg: 'rgba(192, 57, 43, 0.10)',
  },
  Paid: {
    color: '#2E7D4F',
    bg: 'rgba(46, 125, 79, 0.12)',
  },
  Archive: {
    color: 'var(--text-muted, #8A8F99)',
    bg: 'var(--surface-sunken, rgba(0,0,0,0.04))',
  },
}

// ── Columns ────────────────────────────────────────────────────────────

const TOGGLEABLE_COLUMNS = [
  { key: 'case', label: 'Case' },
  { key: 'issue', label: 'Issue date' },
  { key: 'due', label: 'Due date' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total' },
  { key: 'balance', label: 'Balance due' },
] as const
type ColumnKey = (typeof TOGGLEABLE_COLUMNS)[number]['key']

type SortKey = 'issue' | 'due' | 'total' | 'balance'
type SortDir = 'asc' | 'desc'

// ── Page ───────────────────────────────────────────────────────────────

export default function BillingPage() {
  const router = useRouter()

  // Hydrate the bills-local store once on mount. Skipping hydration
  // at the store layer keeps SSR and the first CSR render aligned,
  // so we don't trip React's "getServerSnapshot" warning. Same
  // pattern for the client-rates store — Outstanding / Funds
  // surface a Rate column that reads from it, and the BillComposer
  // pulls from it for line-item prefill.
  useEffect(() => {
    void useBillsLocalStore.persist.rehydrate()
    void useClientRatesStore.persist.rehydrate()
    void useTimeTrackerStore.persist.rehydrate()
    void useExpenseCatalogStore.persist.rehydrate()
  }, [])

  const revision = useBillsLocalStore((s) => s.revision)
  const bills = useMemo(
    () => Object.values(useBillsLocalStore.getState().bills),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision],
  )

  const { data: clients } = useClients()
  const { data: cases } = useCases()
  const clientNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of clients ?? []) m.set(c.id, c.full_name)
    return m
  }, [clients])
  const caseTitleById = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of cases ?? []) m.set(c.id, c.title)
    return m
  }, [cases])

  const [subNav, setSubNav] = useState<SubNavKey>('bills')
  const [tab, setTab] = useState<BillTabKey>('Unpaid')
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey | null; dir: SortDir }>({
    key: 'due',
    dir: 'asc',
  })
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    () => new Set(TOGGLEABLE_COLUMNS.map((c) => c.key)),
  )

  const [composer, setComposer] = useState<{ open: boolean; editing: Bill | null }>(
    { open: false, editing: null },
  )
  const [viewingBill, setViewingBill] = useState<Bill | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentBillId, setPaymentBillId] = useState<string | null>(null)
  // Billing-settings + expense-catalog dialog state. Both are
  // top-level firm-wide controls reachable from the header so
  // partners can tweak currency / rate / catalog without leaving
  // the billing surface.
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)

  // ── Derived bills list ──────────────────────────────────────────
  const filteredBills = useMemo(() => {
    let list = bills
    // Status tab — All shows everything except Archived; Archive
    // shows only Archived. Everything else uses tabKeyFor() so
    // Sent + overdue still surfaces under Unpaid.
    if (tab !== 'All') {
      list = list.filter((b) => tabKeyFor(b) === tab)
    } else {
      list = list.filter((b) => b.status !== 'Archived')
    }
    // MagnifyingGlass by bill number or client name.
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((b) => {
        const clientName = clientNameById.get(b.client_id) ?? ''
        return (
          b.bill_number.toLowerCase().includes(q) ||
          clientName.toLowerCase().includes(q)
        )
      })
    }
    if (sort.key) {
      const dir = sort.dir === 'asc' ? 1 : -1
      list = [...list].sort((a, b) => {
        const va = sortValue(a, sort.key!)
        const vb = sortValue(b, sort.key!)
        if (va === vb) return 0
        return va < vb ? -dir : dir
      })
    }
    return list
  }, [bills, tab, search, sort, clientNameById])

  // ── Per-tab counts (drives the status badge numbers) ────────────
  const countsByTab = useMemo(() => {
    const out: Record<BillTabKey, number> = {
      Draft: 0,
      PendingApproval: 0,
      Unpaid: 0,
      Paid: 0,
      All: 0,
      Archive: 0,
    }
    for (const b of bills) {
      out[tabKeyFor(b)] += 1
      if (b.status !== 'Archived') out.All += 1
    }
    return out
  }, [bills])

  // ── Sort header helpers ─────────────────────────────────────────
  const toggleSort = (key: SortKey) =>
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return { key: null, dir: 'asc' }
    })

  const toggleColumn = (k: ColumnKey) =>
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  const showColumn = (k: ColumnKey) => visibleColumns.has(k)

  // ── Actions ─────────────────────────────────────────────────────
  const openCreate = () =>
    setComposer({ open: true, editing: null })
  const openEdit = (bill: Bill) =>
    setComposer({ open: true, editing: bill })
  const openView = (bill: Bill) => setViewingBill(bill)
  const closeView = () => setViewingBill(null)
  const closeComposer = () =>
    setComposer((s) => ({ ...s, open: false }))

  /**
   * Bridge from the detail dialog to the payment dialog — closes
   * the read-first view, opens the payment composer pre-filled
   * with the bill (its full balance auto-allocated).
   */
  const recordPaymentForBill = (bill: Bill) => {
    setViewingBill(null)
    setPaymentBillId(bill.id)
    setPaymentDialogOpen(true)
  }

  /**
   * Bridge from the detail dialog's Edit button — closes the view
   * and opens the composer in edit mode for the same bill.
   */
  const editFromView = (bill: Bill) => {
    setViewingBill(null)
    openEdit(bill)
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: 'var(--surface-card)' }}
    >
      <div className="px-6 py-6">
        {/* ─── Title + header actions ──────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-[26px] font-semibold leading-tight tracking-tight"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-heading, "Playfair Display", serif)',
              }}
            >
              Billing
            </h1>
            <p
              className="text-[13px] mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Issue bills, record payments, and track outstanding balances.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/*
             * Catalog + Gear — firm-wide billing controls. Live
             * inline with Record payment / New bill because partners
             * tend to reach for them in the same flow (set currency
             * before issuing the first foreign-currency bill, edit
             * the expense catalog before drafting an expense-heavy
             * conveyancing bill).
             */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCatalogOpen(true)}
              title="Manage reusable line items"
            >
              <BookBookmark size={13} strokeWidth={1.75} />
              Expense catalog
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              title="Currency + firm default rate"
            >
              <Coins size={13} strokeWidth={1.75} />
              Billing settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentDialogOpen(true)}
            >
              <Receipt size={13} strokeWidth={1.75} />
              Record payment
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer"
                    style={{
                      background: 'var(--gold)',
                      color: 'var(--navy)',
                      boxShadow:
                        '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
                    }}
                  >
                    <Plus size={14} strokeWidth={2.25} />
                    New bills
                    <CaretDown size={13} strokeWidth={1.75} />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={openCreate}
                  className="text-[13px] cursor-pointer"
                >
                  <FileText size={13} strokeWidth={1.75} />
                  New bill
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    toast.info('Client-funds request — wire-up next sprint.')
                  }
                  className="text-[13px] cursor-pointer"
                >
                  <CreditCard size={13} strokeWidth={1.75} />
                  New client funds request
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/billing/statements')}
                  className="text-[13px] cursor-pointer"
                >
                  <FileText size={13} strokeWidth={1.75} />
                  Generate statement of account
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push('/billing/plans')
                  }
                  className="text-[13px] cursor-pointer"
                >
                  <Sparkle size={13} strokeWidth={1.75} />
                  Upgrade plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ─── Sub-nav ────────────────────────────────────────── */}
        <div
          className="mt-5 flex items-center gap-1 border-b"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          {SUB_NAV.map((n) => {
            const active = subNav === n.key
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => setSubNav(n.key)}
                className="inline-flex items-center px-4 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px cursor-pointer transition-colors"
                style={{
                  color: active
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                  borderColor: active ? 'var(--gold)' : 'transparent',
                  fontWeight: active ? 600 : 500,
                }}
              >
                {n.label}
              </button>
            )
          })}
        </div>

        {/* ─── Bills sub-view ────────────────────────────────── */}
        {subNav === 'bills' && (
          <>
            {/* Quiet auto-suggestion banner — surfaces clients in
                the firm's top 20% by recent billing who don't yet
                have a cross-app priority flag. Hidden when nothing
                useful to suggest. */}
            <BillingPrioritySuggestions />
            <BillsSubView
            tab={tab}
            setTab={setTab}
            countsByTab={countsByTab}
            search={search}
            setSearch={setSearch}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            visibleColumns={visibleColumns}
            showColumn={showColumn}
            toggleColumn={toggleColumn}
            sort={sort}
            toggleSort={toggleSort}
            bills={filteredBills}
            clientNameById={clientNameById}
            caseTitleById={caseTitleById}
            onOpenCreate={openCreate}
            onOpenEdit={openEdit}
            onOpenView={openView}
          />
          </>
        )}

        {subNav === 'outstanding' && (
          <OutstandingBalances
            bills={bills}
            clients={clients ?? []}
          />
        )}

        {subNav === 'funds' && (
          <ClientFundsView clients={clients ?? []} />
        )}

        {subNav === 'time' && (
          <UnbilledTimeView clients={clients ?? []} />
        )}

        {subNav === 'jobs' && <JobStatusView bills={bills} />}

        <BillComposerDialog
          open={composer.open}
          onOpenChange={(o) => (o ? null : closeComposer())}
          editing={composer.editing}
        />
        <BillDetailDialog
          bill={viewingBill}
          onOpenChange={(o) => (o ? null : closeView())}
          onEdit={editFromView}
          onRecordPayment={recordPaymentForBill}
        />
        <RecordPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={(o) => {
            setPaymentDialogOpen(o)
            if (!o) setPaymentBillId(null)
          }}
          defaultBillId={paymentBillId ?? undefined}
        />
        {/* Firm-wide billing controls — wired to the toolbar
            buttons in the header. Mounted here so opening either
            doesn't depend on a particular sub-nav being active. */}
        <BillingSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
        <ExpenseCatalogDialog
          open={catalogOpen}
          onOpenChange={setCatalogOpen}
        />
      </div>
    </div>
  )
}

// ── Bills sub-view ─────────────────────────────────────────────────────

function BillsSubView({
  tab,
  setTab,
  countsByTab,
  search,
  setSearch,
  searchOpen,
  setSearchOpen,
  visibleColumns,
  showColumn,
  toggleColumn,
  sort,
  toggleSort,
  bills,
  clientNameById,
  caseTitleById,
  onOpenCreate,
  onOpenEdit,
  onOpenView,
}: {
  tab: BillTabKey
  setTab: (t: BillTabKey) => void
  countsByTab: Record<BillTabKey, number>
  search: string
  setSearch: (v: string) => void
  searchOpen: boolean
  setSearchOpen: (v: boolean) => void
  visibleColumns: Set<ColumnKey>
  showColumn: (k: ColumnKey) => boolean
  toggleColumn: (k: ColumnKey) => void
  sort: { key: SortKey | null; dir: SortDir }
  toggleSort: (k: SortKey) => void
  bills: Bill[]
  clientNameById: Map<string, string>
  caseTitleById: Map<string, string>
  onOpenCreate: () => void
  onOpenEdit: (bill: Bill) => void
  onOpenView: (bill: Bill) => void
}) {
  return (
    <>
      {/* Status filter pills + columns / filters / search */}
      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <div
          className="inline-flex items-center gap-1 rounded-lg p-0.5"
          style={{ background: 'var(--surface-sunken)' }}
        >
          {STATUS_TABS.map((t) => {
            const active = tab === t.key
            const count = countsByTab[t.key]
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12.5px] font-medium cursor-pointer"
                style={{
                  background: active
                    ? 'var(--surface-card)'
                    : 'transparent',
                  color: active
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                  boxShadow: active
                    ? '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)'
                    : undefined,
                }}
              >
                {t.label}
                {count > 0 && (
                  <span
                    className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10.5px] font-semibold tabular-nums"
                    style={{
                      background: active
                        ? 'var(--accent-today-tint-strong)'
                        : 'var(--surface-card)',
                      color: active
                        ? 'var(--accent-today)'
                        : 'var(--text-muted)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="relative w-56">
              <MagnifyingGlass
                size={13}
                strokeWidth={1.75}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-subtle)' }}
              />
              <Input
                autoFocus
                placeholder="Search by bill ID or client…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => {
                  if (!search) setSearchOpen(false)
                }}
                className="pl-9 pr-8 h-9 text-[13px] rounded-lg"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-5 w-5 rounded-md cursor-pointer"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  <X size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border cursor-pointer"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-secondary)',
              }}
            >
              <MagnifyingGlass size={13} strokeWidth={1.75} />
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] font-medium cursor-pointer"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <GearSix size={13} strokeWidth={1.75} />
                  Columns
                  {visibleColumns.size < TOGGLEABLE_COLUMNS.length && (
                    <span
                      className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10.5px] font-semibold"
                      style={{
                        background: 'var(--accent-today-tint-strong)',
                        color: 'var(--accent-today)',
                      }}
                    >
                      {TOGGLEABLE_COLUMNS.length - visibleColumns.size}
                    </span>
                  )}
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              {TOGGLEABLE_COLUMNS.map((col) => {
                const v = showColumn(col.key)
                return (
                  <DropdownMenuItem
                    key={col.key}
                    onClick={(e) => {
                      e.preventDefault?.()
                      toggleColumn(col.key)
                    }}
                    className="text-[13px] cursor-pointer"
                  >
                    {col.label}
                    {v && (
                      <Check
                        size={12}
                        strokeWidth={2}
                        className="ml-auto"
                        style={{ color: 'var(--text-muted)' }}
                      />
                    )}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={() =>
              toast.info('Saved-filters dropdown ships with the next pass.')
            }
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] font-medium cursor-pointer"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
            }}
          >
            <Funnel size={13} strokeWidth={1.75} />
            Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="mt-4 rounded-xl border overflow-hidden"
        style={{
          borderColor: 'var(--border-soft)',
          background: 'var(--surface-card)',
        }}
      >
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr
              className="border-b"
              style={{
                background: 'var(--surface-sunken)',
                borderColor: 'var(--border-soft)',
                color: 'var(--text-secondary)',
              }}
            >
              <th className="px-4 py-3 font-medium">Bill</th>
              <th className="px-4 py-3 font-medium">Client</th>
              {showColumn('case') && (
                <th className="px-4 py-3 font-medium">Case</th>
              )}
              {showColumn('issue') && (
                <SortHeader
                  label="Issue date"
                  active={sort.key === 'issue'}
                  dir={sort.dir}
                  onClick={() => toggleSort('issue')}
                />
              )}
              {showColumn('due') && (
                <SortHeader
                  label="Due date"
                  active={sort.key === 'due'}
                  dir={sort.dir}
                  onClick={() => toggleSort('due')}
                />
              )}
              {showColumn('status') && (
                <th className="px-4 py-3 font-medium">Status</th>
              )}
              {showColumn('total') && (
                <SortHeader
                  label="Total"
                  active={sort.key === 'total'}
                  dir={sort.dir}
                  onClick={() => toggleSort('total')}
                  align="right"
                />
              )}
              {showColumn('balance') && (
                <SortHeader
                  label="Balance due"
                  active={sort.key === 'balance'}
                  dir={sort.dir}
                  onClick={() => toggleSort('balance')}
                  align="right"
                />
              )}
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td
                  colSpan={3 + visibleColumns.size}
                  className="px-6 py-16 text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Receipt
                      size={32}
                      strokeWidth={1.25}
                      style={{ color: 'var(--text-subtle)' }}
                    />
                    <div>
                      <p
                        className="text-[14px] font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {search.trim()
                          ? `No bills matching "${search}".`
                          : tab === 'Archive'
                            ? 'No archived bills.'
                            : 'No bills or client funds requests found.'}
                      </p>
                      <p className="mt-1 text-[12.5px]">
                        Start billing your clients or collect client funds deposits upfront.
                      </p>
                    </div>
                    {tab !== 'Archive' && !search.trim() && (
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={onOpenCreate}
                          style={{
                            background: 'var(--gold)',
                            color: 'var(--navy)',
                          }}
                        >
                          <Plus size={13} strokeWidth={2.25} />
                          New bill
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toast.info('Client-funds request — next sprint.')
                          }
                        >
                          New client funds request
                        </Button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              bills.map((b) => (
                <BillRow
                  key={b.id}
                  bill={b}
                  clientName={clientNameById.get(b.client_id) ?? '—'}
                  caseTitle={
                    b.case_id
                      ? caseTitleById.get(b.case_id) ?? null
                      : null
                  }
                  showColumn={showColumn}
                  onView={() => onOpenView(b)}
                  onEdit={() => onOpenEdit(b)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

function sortValue(b: Bill, key: SortKey): string | number {
  if (key === 'issue') return b.issue_date
  if (key === 'due') return b.due_date
  if (key === 'total') return b.total
  return b.balance_due
}

// ── Row ────────────────────────────────────────────────────────────────

function BillRow({
  bill,
  clientName,
  caseTitle,
  showColumn,
  onView,
  onEdit,
}: {
  bill: Bill
  clientName: string
  caseTitle: string | null
  showColumn: (k: ColumnKey) => boolean
  onView: () => void
  onEdit: () => void
}) {
  const submit = useBillsLocalStore((s) => s.submitForApproval)
  const issue = useBillsLocalStore((s) => s.issueBill)
  const archive = useBillsLocalStore((s) => s.archiveBill)
  const sendReminder = useBillsLocalStore((s) => s.sendReminder)

  const tabKey = tabKeyFor(bill)
  const style = STATUS_STYLE[tabKey]
  const isOverdue =
    tabKey === 'Unpaid' && new Date(bill.due_date).getTime() < Date.now()

  return (
    <tr
      // The whole row is clickable — opens the bill-detail dialog.
      // PriorityButton + row menu cells stopPropagation so their
      // own clicks don't trigger this navigation.
      onClick={onView}
      className="border-t transition-colors cursor-pointer"
      style={{ borderColor: 'var(--border-soft)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-sunken)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <td className="px-4 py-3">
        <span
          className="font-mono text-[12.5px] font-semibold tracking-wide"
          style={{ color: 'var(--text-primary)' }}
        >
          {bill.bill_number}
        </span>
      </td>
      <td
        className="px-4 py-3 truncate"
        style={{ color: 'var(--text-primary)' }}
      >
        {clientName}
      </td>
      {showColumn('case') && (
        <td
          className="px-4 py-3 truncate"
          style={{ color: 'var(--text-secondary)' }}
        >
          {caseTitle ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </td>
      )}
      {showColumn('issue') && (
        <td
          className="px-4 py-3 tabular-nums"
          style={{ color: 'var(--text-secondary)' }}
        >
          {formatDate(bill.issue_date)}
        </td>
      )}
      {showColumn('due') && (
        <td
          className="px-4 py-3 tabular-nums"
          style={{
            color: isOverdue
              ? 'var(--accent-danger)'
              : 'var(--text-secondary)',
            fontWeight: isOverdue ? 600 : undefined,
          }}
        >
          {formatDate(bill.due_date)}
          {isOverdue && (
            <span
              className="ml-1 text-[10.5px] font-semibold uppercase tracking-wide"
              style={{ color: 'var(--accent-danger)' }}
            >
              · Overdue
            </span>
          )}
        </td>
      )}
      {showColumn('status') && (
        <td className="px-4 py-3">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ background: style.bg, color: style.color }}
          >
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: style.color }}
            />
            {STATUS_LABEL[tabKey]}
          </span>
        </td>
      )}
      {showColumn('total') && (
        <td
          className="px-4 py-3 text-right tabular-nums font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {formatMoney(bill.total)}
        </td>
      )}
      {showColumn('balance') && (
        <td
          className="px-4 py-3 text-right tabular-nums font-semibold"
          style={{
            color:
              bill.balance_due > 0
                ? 'var(--accent-danger)'
                : 'var(--text-muted)',
          }}
        >
          {formatMoney(bill.balance_due)}
        </td>
      )}
      <td
        className="px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 justify-end">
          <PriorityButton
            entityType="invoice"
            entityId={bill.id}
            label={`${bill.bill_number} — ${clientName}`}
            metadata={{
              total: bill.total,
              balance_due: bill.balance_due,
              due_date: bill.due_date,
            }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label={`Actions for ${bill.bill_number}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <DotsThree size={15} strokeWidth={2} />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={onEdit}
                className="text-[13px] cursor-pointer"
              >
                <Eye size={13} strokeWidth={1.75} />
                View / Edit
              </DropdownMenuItem>
              {bill.status === 'Draft' && (
                <DropdownMenuItem
                  onClick={() => {
                    submit(bill.id)
                    toast.success(`${bill.bill_number} sent for approval.`)
                  }}
                  className="text-[13px] cursor-pointer"
                >
                  <PencilSimple size={13} strokeWidth={1.75} />
                  Submit for approval
                </DropdownMenuItem>
              )}
              {(bill.status === 'Draft' ||
                bill.status === 'PendingApproval') && (
                <DropdownMenuItem
                  onClick={() => {
                    issue(bill.id)
                    toast.success(`${bill.bill_number} issued.`)
                  }}
                  className="text-[13px] cursor-pointer"
                >
                  <PaperPlaneTilt size={13} strokeWidth={1.75} />
                  Issue bill
                </DropdownMenuItem>
              )}
              {tabKey === 'Unpaid' && (
                <DropdownMenuItem
                  onClick={() => {
                    sendReminder(bill.id)
                    const lastSent = bill.reminders?.[bill.reminders.length - 1]
                    const since = lastSent
                      ? Math.floor(
                          (Date.now() - new Date(lastSent.sent_at).getTime()) /
                            (24 * 60 * 60 * 1000),
                        )
                      : null
                    toast.success(
                      since != null
                        ? `Reminder logged. Last sent ${since === 0 ? 'today' : `${since}d ago`}.`
                        : `Reminder logged for ${bill.bill_number}.`,
                    )
                  }}
                  className="text-[13px] cursor-pointer"
                >
                  <Bell size={13} strokeWidth={1.75} />
                  PaperPlaneTilt payment reminder
                </DropdownMenuItem>
              )}
              {bill.status !== 'Archived' && (
                <DropdownMenuItem
                  onClick={() => {
                    archive(bill.id)
                    toast.success(`${bill.bill_number} archived.`)
                  }}
                  className="text-[13px] cursor-pointer"
                  style={{ color: 'var(--accent-danger)' }}
                >
                  <Trash size={13} strokeWidth={1.75} />
                  Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  )
}

// ── Outstanding Balances sub-view ──────────────────────────────────────

/**
 * View modes inside Outstanding Balances:
 *   - summary : one row per client, total open balance + last due.
 *   - aging   : open balance split across the four standard aging
 *               buckets (0–30 / 31–60 / 61–90 / 90+ days past due).
 *               Without this, partners can't prioritise collections.
 */
type OutstandingView = 'summary' | 'aging'

/**
 * Aging buckets, days-past-due relative to the bill's due date.
 * Same buckets used by every legal-billing system the partner has
 * ever seen, so the numbers are immediately legible.
 */
const AGING_BUCKETS: { key: string; label: string; min: number; max: number | null }[] = [
  { key: 'current', label: 'Current', min: -Infinity, max: 0 },
  { key: '0_30', label: '0–30 days', min: 0, max: 30 },
  { key: '31_60', label: '31–60 days', min: 30, max: 60 },
  { key: '61_90', label: '61–90 days', min: 60, max: 90 },
  { key: '90_plus', label: '90+ days', min: 90, max: null },
]

function bucketFor(due_date: string): string {
  const daysPastDue = Math.floor(
    (Date.now() - new Date(due_date).getTime()) / (24 * 60 * 60 * 1000),
  )
  for (const b of AGING_BUCKETS) {
    const matches =
      daysPastDue > b.min && (b.max === null || daysPastDue <= b.max)
    if (matches) return b.key
  }
  return AGING_BUCKETS[0].key
}

function OutstandingBalances({
  bills,
  clients,
}: {
  bills: Bill[]
  clients: { id: string; full_name: string }[]
}) {
  const [view, setView] = useState<OutstandingView>('summary')

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        client_id: string
        client_name: string
        bill_count: number
        outstanding: number
        most_recent_due: string | null
        buckets: Record<string, number>
      }
    >()
    const nameById = new Map(clients.map((c) => [c.id, c.full_name]))
    for (const b of bills) {
      if (b.status === 'Draft' || b.status === 'Archived') continue
      if (b.balance_due <= 0) continue
      const slot = map.get(b.client_id) ?? {
        client_id: b.client_id,
        client_name: nameById.get(b.client_id) ?? 'Unknown client',
        bill_count: 0,
        outstanding: 0,
        most_recent_due: null,
        buckets: Object.fromEntries(AGING_BUCKETS.map((bk) => [bk.key, 0])),
      }
      slot.bill_count += 1
      slot.outstanding += b.balance_due
      slot.buckets[bucketFor(b.due_date)] += b.balance_due
      if (
        !slot.most_recent_due ||
        new Date(b.due_date).getTime() > new Date(slot.most_recent_due).getTime()
      ) {
        slot.most_recent_due = b.due_date
      }
      map.set(b.client_id, slot)
    }
    return Array.from(map.values()).sort(
      (a, b) => b.outstanding - a.outstanding,
    )
  }, [bills, clients])

  // Firm-wide aging totals — surfaced as a footer row in the aging
  // view so partners can see the overall risk in one glance.
  const totals = useMemo(() => {
    const acc: Record<string, number> = Object.fromEntries(
      AGING_BUCKETS.map((b) => [b.key, 0]),
    )
    let total = 0
    for (const g of grouped) {
      for (const k of Object.keys(acc)) acc[k] += g.buckets[k]
      total += g.outstanding
    }
    return { byBucket: acc, total }
  }, [grouped])

  if (grouped.length === 0) {
    return (
      <div
        className="mt-6 rounded-xl border px-6 py-12 text-center"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border-soft)',
        }}
      >
        <Users
          size={32}
          strokeWidth={1.25}
          className="mx-auto mb-3"
          style={{ color: 'var(--text-subtle)' }}
        />
        <p
          className="text-[14px] font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          No outstanding balances.
        </p>
        <p
          className="mt-1 text-[12.5px]"
          style={{ color: 'var(--text-muted)' }}
        >
          Every issued bill has been paid. Nice work.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* View toggle — Summary vs Aging. Same data, different lens. */}
      <div
        className="mt-4 inline-flex items-center gap-1 rounded-lg p-0.5"
        style={{ background: 'var(--surface-sunken)' }}
      >
        {[
          { key: 'summary' as const, label: 'Summary' },
          { key: 'aging' as const, label: 'Aging' },
        ].map((opt) => {
          const active = view === opt.key
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setView(opt.key)}
              className="h-8 px-3 rounded-md text-[12.5px] font-medium cursor-pointer"
              style={{
                background: active ? 'var(--surface-card)' : 'transparent',
                color: active
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
                boxShadow: active
                  ? '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)'
                  : undefined,
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      <div
        className="mt-3 rounded-xl border overflow-hidden"
        style={{
          borderColor: 'var(--border-soft)',
          background: 'var(--surface-card)',
        }}
      >
        {view === 'summary' ? (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr
                className="border-b"
                style={{
                  background: 'var(--surface-sunken)',
                  borderColor: 'var(--border-soft)',
                  color: 'var(--text-secondary)',
                }}
              >
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Open bills</th>
                <th className="px-4 py-3 font-medium">Most recent due</th>
                {/*
                 * Rate column. Lets partners spot at a glance which
                 * client is on a custom rate vs the firm default
                 * fallback, without having to open each client
                 * record. Useful when chasing collections — knowing
                 * who's paying GHS 1,500/hr vs GHS 450/hr shapes how
                 * hard you push.
                 */}
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium text-right">
                  Outstanding
                </th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((g) => (
                <tr
                  key={g.client_id}
                  className="border-t"
                  style={{ borderColor: 'var(--border-soft)' }}
                >
                  <td
                    className="px-4 py-3 font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {g.client_name}
                  </td>
                  <td
                    className="px-4 py-3 tabular-nums"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {g.bill_count}
                  </td>
                  <td
                    className="px-4 py-3 tabular-nums"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {g.most_recent_due
                      ? formatDate(g.most_recent_due)
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ClientRateBadge clientId={g.client_id} />
                  </td>
                  <td
                    className="px-4 py-3 text-right tabular-nums font-semibold"
                    style={{ color: 'var(--accent-danger)' }}
                  >
                    {formatMoney(g.outstanding)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr
                className="border-b"
                style={{
                  background: 'var(--surface-sunken)',
                  borderColor: 'var(--border-soft)',
                  color: 'var(--text-secondary)',
                }}
              >
                <th className="px-4 py-3 font-medium">Client</th>
                {AGING_BUCKETS.map((b) => (
                  <th
                    key={b.key}
                    className="px-3 py-3 font-medium text-right"
                  >
                    {b.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((g) => (
                <tr
                  key={g.client_id}
                  className="border-t"
                  style={{ borderColor: 'var(--border-soft)' }}
                >
                  <td
                    className="px-4 py-3 font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {g.client_name}
                  </td>
                  {AGING_BUCKETS.map((b) => (
                    <AgingCell
                      key={b.key}
                      value={g.buckets[b.key]}
                      bucketKey={b.key}
                    />
                  ))}
                  <td
                    className="px-4 py-3 text-right tabular-nums font-semibold"
                    style={{ color: 'var(--accent-danger)' }}
                  >
                    {formatMoney(g.outstanding)}
                  </td>
                </tr>
              ))}
              {/* Firm-wide totals row */}
              <tr
                className="border-t"
                style={{
                  borderColor: 'var(--border-soft)',
                  background: 'var(--surface-sunken)',
                }}
              >
                <td
                  className="px-4 py-3 font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Firm totals
                </td>
                {AGING_BUCKETS.map((b) => (
                  <td
                    key={b.key}
                    className="px-3 py-3 text-right tabular-nums font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {totals.byBucket[b.key] > 0
                      ? formatMoney(totals.byBucket[b.key])
                      : '—'}
                  </td>
                ))}
                <td
                  className="px-4 py-3 text-right tabular-nums font-semibold"
                  style={{ color: 'var(--accent-danger)' }}
                >
                  {formatMoney(totals.total)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

/**
 * One aging-bucket cell — empty values render as a quiet em-dash so
 * the eye glides past them; 90+ days bucket renders red because that
 * range is where firms lose money.
 */
function AgingCell({
  value,
  bucketKey,
}: {
  value: number
  bucketKey: string
}) {
  if (value === 0) {
    return (
      <td
        className="px-3 py-3 text-right tabular-nums"
        style={{ color: 'var(--text-subtle)' }}
      >
        —
      </td>
    )
  }
  const isOverdue = bucketKey === '90_plus'
  return (
    <td
      className="px-3 py-3 text-right tabular-nums"
      style={{
        color: isOverdue
          ? 'var(--accent-danger)'
          : 'var(--text-primary)',
        fontWeight: isOverdue ? 600 : undefined,
      }}
    >
      {formatMoney(value)}
    </td>
  )
}

// ── Client Funds sub-view ──────────────────────────────────────────────

/**
 * Trust vs Operating balance per client. Ghana's GLC rules (and
 * every common-law equivalent) require lawyers to hold client money
 * in a trust account separate from operating cash. This tab makes
 * the split legible and lets partners see who's running low on
 * trust before invoicing eats into it.
 *
 * Movements feed in from the bills-local store's `fund_movements`
 * ledger so the activity column reflects every deposit / transfer
 * that's happened.
 */
function ClientFundsView({
  clients,
}: {
  clients: { id: string; full_name: string }[]
}) {
  // Top-up dialog state — keyed by client id so the same dialog
  // handles every row, opens with the right context, and closes
  // cleanly without parent state churn.
  const [topUpClientId, setTopUpClientId] = useState<string | null>(null)

  const revision = useBillsLocalStore((s) => s.revision)
  const { balances, movements } = useMemo(
    () => {
      const state = useBillsLocalStore.getState()
      return {
        balances: Object.values(state.fund_balances),
        movements: Object.values(state.fund_movements),
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision],
  )

  // Build a per-client lookup: { trust, operating, last_activity_at,
  // last_activity_kind }. Adding the kind makes the table column
  // narrate the most recent action (e.g. "Trust deposit · 12d ago").
  const lookup = useMemo(() => {
    type Row = ClientFundsBalance & {
      last_activity_kind: ClientFundsMovement['kind'] | null
    }
    const map = new Map<string, Row>()
    for (const b of balances) {
      map.set(b.client_id, { ...b, last_activity_kind: null })
    }
    // Walk movements in reverse-chronological order; first hit per
    // client wins.
    for (const m of movements.sort(
      (a, b) => b.occurred_at.localeCompare(a.occurred_at),
    )) {
      const row = map.get(m.client_id)
      if (!row || row.last_activity_kind) continue
      row.last_activity_kind = m.kind
      if (
        !row.last_activity_at ||
        m.occurred_at > row.last_activity_at
      ) {
        row.last_activity_at = m.occurred_at
      }
    }
    return map
  }, [balances, movements])

  // Render every client (not just those with balances) so the empty
  // states are visible — partners spot trust-account oversights
  // faster when the row is present with zero rather than hidden.
  const rows = useMemo(
    () =>
      clients
        .map((c) => {
          const r = lookup.get(c.id)
          return {
            client_id: c.id,
            client_name: c.full_name,
            trust: r?.trust ?? 0,
            operating: r?.operating ?? 0,
            last_activity_at: r?.last_activity_at ?? null,
            last_activity_kind: r?.last_activity_kind ?? null,
          }
        })
        .sort((a, b) => b.trust + b.operating - (a.trust + a.operating)),
    [clients, lookup],
  )

  const totals = useMemo(() => {
    let trust = 0
    let operating = 0
    for (const r of rows) {
      trust += r.trust
      operating += r.operating
    }
    return { trust, operating }
  }, [rows])

  return (
    <>
      <div
        className="mt-4 grid grid-cols-2 gap-4"
      >
        <FundsSummaryCard
          label="Total trust holdings"
          value={totals.trust}
          accent="#2E7D4F"
          hint="Held in client (trust) accounts. Cannot be drawn without an issued bill or written authorisation."
        />
        <FundsSummaryCard
          label="Total operating holdings"
          value={totals.operating}
          accent="#2563EB"
          hint="Sits in operating accounts after fee transfer from trust. Available to draw against day-to-day."
        />
      </div>

      <div
        className="mt-4 rounded-xl border overflow-hidden"
        style={{
          borderColor: 'var(--border-soft)',
          background: 'var(--surface-card)',
        }}
      >
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr
              className="border-b"
              style={{
                background: 'var(--surface-sunken)',
                borderColor: 'var(--border-soft)',
                color: 'var(--text-secondary)',
              }}
            >
              <th className="px-4 py-3 font-medium">Client</th>
              {/*
               * Rate column on Client Funds. Pairs well with the
               * trust + operating balances: the partner can scan
               * "this client holds GHS 50,000 in trust and is on a
               * 1,200/hr rate" and immediately know how many hours
               * of work the retainer covers before another top-up
               * is needed.
               */}
              <th className="px-4 py-3 font-medium">Rate</th>
              <th className="px-4 py-3 font-medium text-right">
                Trust balance
              </th>
              <th className="px-4 py-3 font-medium text-right">
                Operating balance
              </th>
              <th className="px-4 py-3 font-medium">Last activity</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.client_id}
                className="border-t"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <td
                  className="px-4 py-3 font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {r.client_name}
                </td>
                <td className="px-4 py-3">
                  <ClientRateBadge clientId={r.client_id} />
                </td>
                <td
                  className="px-4 py-3 text-right tabular-nums"
                  style={{
                    color:
                      r.trust > 0 ? '#2E7D4F' : 'var(--text-muted)',
                    fontWeight: r.trust > 0 ? 600 : undefined,
                  }}
                >
                  {r.trust > 0 ? formatMoney(r.trust) : '—'}
                </td>
                <td
                  className="px-4 py-3 text-right tabular-nums"
                  style={{
                    color:
                      r.operating > 0
                        ? '#2563EB'
                        : 'var(--text-muted)',
                    fontWeight: r.operating > 0 ? 600 : undefined,
                  }}
                >
                  {r.operating > 0 ? formatMoney(r.operating) : '—'}
                </td>
                <td
                  className="px-4 py-3 text-[12.5px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {r.last_activity_at ? (
                    <>
                      {fundKindLabel(r.last_activity_kind)}
                      <span
                        className="ml-1.5 tabular-nums"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        · {timeAgo(r.last_activity_at)}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>
                      No funds on file
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setTopUpClientId(r.client_id)}
                    className="text-[12px] font-semibold underline underline-offset-2 cursor-pointer"
                    style={{ color: 'var(--accent-today)' }}
                  >
                    Top up
                  </button>
                </td>
              </tr>
            ))}
            <tr
              className="border-t"
              style={{
                borderColor: 'var(--border-soft)',
                background: 'var(--surface-sunken)',
              }}
            >
              <td
                className="px-4 py-3 font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Firm totals
              </td>
              {/* Empty cell aligning with the new Rate column. Rates
                  don't aggregate across clients, so the totals row
                  leaves this blank rather than putting a misleading
                  "average rate" here. */}
              <td className="px-4 py-3" />
              <td
                className="px-4 py-3 text-right tabular-nums font-semibold"
                style={{ color: '#2E7D4F' }}
              >
                {formatMoney(totals.trust)}
              </td>
              <td
                className="px-4 py-3 text-right tabular-nums font-semibold"
                style={{ color: '#2563EB' }}
              >
                {formatMoney(totals.operating)}
              </td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Top-up request dialog — opens with a templated email
          (or phone / in-person branch) keyed off the clicked row. */}
      <TopUpRequestDialog
        open={topUpClientId !== null}
        onOpenChange={(o) => (o ? null : setTopUpClientId(null))}
        clientId={topUpClientId}
      />
    </>
  )
}

function FundsSummaryCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string
  value: number
  accent: string
  hint: string
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <span
        className="text-[11.5px] font-semibold uppercase tracking-wider inline-flex items-center gap-1.5"
        style={{ color: 'var(--text-muted)' }}
      >
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: accent }}
        />
        {label}
      </span>
      <p
        className="font-heading text-[26px] font-semibold tabular-nums leading-tight mt-2"
        style={{ color: accent }}
      >
        {formatMoney(value)}
      </p>
      <p
        className="text-[12px] mt-1 leading-snug"
        style={{ color: 'var(--text-muted)' }}
      >
        {hint}
      </p>
    </div>
  )
}

function fundKindLabel(kind: ClientFundsMovement['kind'] | null): string {
  if (kind === 'deposit') return 'Trust deposit'
  if (kind === 'withdrawal') return 'Withdrawal'
  if (kind === 'transfer_to_operating') return 'Fee transfer (trust → operating)'
  return '—'
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

// ── Unbilled Time sub-view ─────────────────────────────────────────────

/**
 * Unbilled Time view — groups stopped time entries by client and
 * lets the partner roll them into a draft bill in one click. The
 * conversion path:
 *
 *   1. Mint a fresh line_item id for each entry (so we can call
 *      `markAsBilled` with that id afterwards).
 *   2. Build a Draft bill with one line item per entry: hours
 *      computed from `total_seconds`, rate snapshot from
 *      `rate_at_start`, amount from `total_amount`.
 *   3. Push it through `createBill` — returns the new Bill.
 *   4. Loop the entries calling `markAsBilled(entry.id, bill.id,
 *      lineItemId)` so each entry transitions to `billed` and the
 *      Unbilled Time list shrinks accordingly.
 *
 * Tax rate defaults to 12.5% (Ghana VAT) to match the BillComposer.
 * Partner can edit the draft after creation if they want a
 * different tax or grouped descriptions.
 */
function UnbilledTimeView({
  clients,
}: {
  clients: { id: string; full_name: string }[]
}) {
  const revision = useTimeTrackerStore((s) => s.revision)
  const createBill = useBillsLocalStore((s) => s.createBill)
  const markAsBilled = useTimeTrackerStore((s) => s.markAsBilled)

  // Build per-client summary. Read via getState() + revision rather
  // than subscribing to the entries map; both selectors live in the
  // store module and stay correct as long as revision drives the memo.
  const rows = useMemo(() => {
    const byClient = clients
      .map((c) => {
        const summary = unbilledTimeForClient(c.id)
        if (summary.entries.length === 0) return null
        return {
          client_id: c.id,
          client_name: c.full_name,
          ...summary,
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
    return byClient.sort((a, b) => b.total_amount - a.total_amount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, revision])

  const totals = useMemo(() => {
    let seconds = 0
    let amount = 0
    let entryCount = 0
    for (const r of rows) {
      seconds += r.total_seconds
      amount += r.total_amount
      entryCount += r.entries.length
    }
    return { seconds, amount, entryCount }
  }, [rows])

  const handleConvert = (clientId: string) => {
    const row = rows.find((r) => r.client_id === clientId)
    if (!row || row.entries.length === 0) return

    // Mint fresh line_item ids up-front so we can pass them into
    // createBill *and* reference them in markAsBilled afterwards.
    const lineItemIds = row.entries.map(
      () =>
        `li-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    )

    const line_items = row.entries.map((e, i) => {
      const hours = e.total_seconds / 3600
      return {
        id: lineItemIds[i],
        // Add a small "(timer)" suffix so the line item carries its
        // provenance into the bill — useful for clients querying
        // "what was that hour for?" months later.
        description:
          (e.description?.trim() ?? 'Billable time') + ' (timer)',
        quantity: Math.round(hours * 100) / 100,
        rate: e.rate_at_start,
        amount: e.total_amount,
      }
    })

    const tax_rate = 0.125
    const { subtotal, tax_amount, total, balance_due } = recomputeTotals({
      line_items,
      tax_rate,
      paid: 0,
    })

    const today = new Date()
    const due = new Date(today)
    due.setDate(due.getDate() + 14)

    const bill = createBill({
      client_id: clientId,
      case_id: null,
      status: 'Draft',
      issue_date: today.toISOString(),
      due_date: due.toISOString(),
      payment_terms: 'Net 14',
      line_items,
      subtotal,
      tax_rate,
      tax_amount,
      total,
      paid: 0,
      balance_due,
      paid_at: null,
      notes: `Drafted from ${row.entries.length} timer entr${
        row.entries.length === 1 ? 'y' : 'ies'
      } · ${formatDuration(row.total_seconds)} total.`,
    })

    // Transition each entry to 'billed' so the row disappears from
    // the Unbilled list. The conversion ledger is preserved on the
    // entry itself (bill_id + bill_line_item_id) for traceability.
    row.entries.forEach((e, i) => {
      markAsBilled(e.id, bill.id, lineItemIds[i])
    })

    toast.success(
      `Drafted ${bill.bill_number} for ${row.client_name} — ${formatDuration(row.total_seconds)} · ${formatMoney(row.total_amount)}.`,
    )
  }

  if (rows.length === 0) {
    return (
      <div
        className="mt-4 rounded-xl border p-8 text-center"
        style={{
          borderColor: 'var(--border-soft)',
          background: 'var(--surface-card)',
        }}
      >
        <p
          className="text-[13.5px] font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          No unbilled time on file
        </p>
        <p
          className="text-[12.5px] mt-1.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          Start a timer from a client or case page. When you stop it,
          the entry will land here ready to convert into a draft bill.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Summary strip — at-a-glance "you have N hours sitting
          here, that's GHS X if you bill it today". The single
          biggest revenue leak in firms that don't time-track is
          unbilled work; this number is the wake-up call. */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <SummaryStat
          label="Unbilled entries"
          value={String(totals.entryCount)}
          accent="var(--text-primary)"
        />
        <SummaryStat
          label="Unbilled time"
          value={formatDuration(totals.seconds)}
          accent="var(--text-primary)"
        />
        <SummaryStat
          label="Unbilled value"
          value={formatMoney(totals.amount)}
          accent="#2E7D4F"
        />
      </div>

      {/* Per-client table — one row per client with unbilled time,
          a "Convert to bill" action, and an expandable list of the
          individual entries underneath (always-on for now; can
          collapse later if rows grow). */}
      <div
        className="mt-4 rounded-xl border overflow-hidden"
        style={{
          borderColor: 'var(--border-soft)',
          background: 'var(--surface-card)',
        }}
      >
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr
              className="border-b"
              style={{
                background: 'var(--surface-sunken)',
                borderColor: 'var(--border-soft)',
                color: 'var(--text-secondary)',
              }}
            >
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Entries</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="w-32 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <UnbilledRow
                key={r.client_id}
                clientName={r.client_name}
                entries={r.entries}
                totalSeconds={r.total_seconds}
                totalAmount={r.total_amount}
                onConvert={() => handleConvert(r.client_id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
      }}
    >
      <p
        className="text-[10.5px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <p
        className="text-[22px] font-semibold tabular-nums mt-1"
        style={{ color: accent }}
      >
        {value}
      </p>
    </div>
  )
}

/**
 * One client's worth of unbilled time. The expanded entries list
 * gives the partner a chance to spot anything weird (a 12-hour
 * Sunday session, an entry from a forgotten timer) before they
 * commit to a bill.
 */
function UnbilledRow({
  clientName,
  entries,
  totalSeconds,
  totalAmount,
  onConvert,
}: {
  clientName: string
  entries: TimeEntry[]
  totalSeconds: number
  totalAmount: number
  onConvert: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <tr
        className="border-t"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <td
          className="px-4 py-3 font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-1.5 cursor-pointer hover:underline"
          >
            <CaretDown
              size={12}
              strokeWidth={2}
              style={{
                transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 120ms',
                color: 'var(--text-muted)',
              }}
            />
            {clientName}
          </button>
        </td>
        <td
          className="px-4 py-3 tabular-nums"
          style={{ color: 'var(--text-secondary)' }}
        >
          {entries.length}
        </td>
        <td
          className="px-4 py-3 tabular-nums"
          style={{ color: 'var(--text-secondary)' }}
        >
          {formatDuration(totalSeconds)}
        </td>
        <td
          className="px-4 py-3 text-right tabular-nums font-semibold"
          style={{ color: '#2E7D4F' }}
        >
          {formatMoney(totalAmount)}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={onConvert}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-[12px] font-semibold cursor-pointer"
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
            }}
          >
            <Receipt size={11} strokeWidth={2} />
            Convert to bill
          </button>
        </td>
      </tr>
      {expanded &&
        entries.map((e) => (
          <tr
            key={e.id}
            style={{
              background: 'var(--surface-sunken)',
              borderTop: '1px solid var(--border-soft)',
            }}
          >
            <td
              className="px-4 py-2 pl-10 text-[12.5px]"
              style={{ color: 'var(--text-secondary)' }}
              colSpan={2}
            >
              <div>{e.description ?? 'Billable time'}</div>
              <div
                className="text-[11px] mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {formatDate(e.started_at)} · GHS{' '}
                {e.rate_at_start.toLocaleString('en-GH')}/hr
              </div>
            </td>
            <td
              className="px-4 py-2 text-[12.5px] tabular-nums"
              style={{ color: 'var(--text-secondary)' }}
            >
              {formatDuration(e.total_seconds)}
            </td>
            <td
              className="px-4 py-2 text-right text-[12.5px] tabular-nums"
              style={{ color: 'var(--text-secondary)' }}
            >
              {formatMoney(e.total_amount)}
            </td>
            <td />
          </tr>
        ))}
    </>
  )
}

// ── Job Status sub-view ────────────────────────────────────────────────

function JobStatusView({ bills }: { bills: Bill[] }) {
  // For now the "jobs" surface summarises the bill pipeline by
  // status. When the batched-issuance backend lands we replace
  // the buckets with live job records.
  const counts = useMemo(() => {
    const out = { Draft: 0, PendingApproval: 0, Sent: 0, Paid: 0 }
    for (const b of bills) {
      if (b.status === 'Draft') out.Draft += 1
      else if (b.status === 'PendingApproval') out.PendingApproval += 1
      else if (b.status === 'Sent') out.Sent += 1
      else if (b.status === 'Paid') out.Paid += 1
    }
    return out
  }, [bills])

  return (
    <div className="mt-6 grid grid-cols-4 gap-4">
      <JobStatusCard label="Draft" hint="Queued for editing" count={counts.Draft} dotColor="var(--text-secondary)" />
      <JobStatusCard label="Awaiting approval" hint="Waiting on partner sign-off" count={counts.PendingApproval} dotColor="var(--accent-today)" />
      <JobStatusCard label="Issued" hint="Sent to client, awaiting payment" count={counts.Sent} dotColor="#2563EB" />
      <JobStatusCard label="Reconciled" hint="Paid in full" count={counts.Paid} dotColor="#2E7D4F" />
    </div>
  )
}

function JobStatusCard({
  label,
  hint,
  count,
  dotColor,
}: {
  label: string
  hint: string
  count: number
  dotColor: string
}) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: dotColor }}
        />
        <span
          className="text-[11.5px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
      </div>
      <p
        className="font-heading text-[28px] font-semibold leading-none mt-3 tabular-nums"
        style={{ color: 'var(--text-primary)' }}
      >
        {count}
      </p>
      <p
        className="text-[12px] mt-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {hint}
      </p>
    </div>
  )
}

// ── Small components / helpers ─────────────────────────────────────────

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = 'left',
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  align?: 'left' | 'right'
}) {
  return (
    <th
      className="px-4 py-3 font-medium cursor-pointer select-none"
      style={{ textAlign: align }}
      onClick={onClick}
    >
      <span
        className={`inline-flex items-center gap-1.5 ${
          align === 'right' ? 'justify-end' : ''
        }`}
      >
        {label}
        <ArrowsDownUp
          size={12}
          strokeWidth={1.75}
          style={{
            color: active ? 'var(--text-primary)' : 'var(--text-subtle)',
            transform: active && dir === 'desc' ? 'rotate(180deg)' : undefined,
            transition: 'transform 120ms ease',
          }}
        />
      </span>
    </th>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Money formatter — delegates to the shared currency helper so the
 * firm's billing currency (set in Billing Gear) flows through
 * every label on the billing surfaces. Negative balances surface
 * with a leading minus from the formatter itself.
 */
function formatMoney(n: number): string {
  return formatCurrency(n)
}

/**
 * Per-row rate display. Resolves the client's rate through the same
 * chain the BillComposer uses (client-specific -> firm default ->
 * unset) so the two surfaces never disagree about what's in play.
 *
 * Visual states:
 *   - `client` (custom rate set)   : navy chip, label "GHS X / hr"
 *                                    + small "Custom" tag.
 *   - `client` (flat / mixed)      : navy chip with the flat fee
 *                                    label "GHS X flat" so the row
 *                                    doesn't pretend the client is
 *                                    on an hourly rate they aren't.
 *   - `client` (contingency)       : navy chip "X% contingency".
 *   - `client` (none rate kind)    : muted chip "Ad-hoc rate".
 *   - `firm`                       : muted chip "GHS X / hr · Firm
 *                                    default".
 *   - `none`                       : warning chip "Set a rate".
 *
 * Subscribes to the rates store revision so any rate update on the
 * Client form flows through to the table without a manual reload.
 */
function ClientRateBadge({ clientId }: { clientId: string }) {
  const revision = useClientRatesStore((s) => s.revision)
  const resolved: ResolvedRate = useMemo(
    () => getResolvedRate(clientId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clientId, revision],
  )

  // Derive the chip label off the config's kind first — a flat-fee
  // client shouldn't show as "GHS 8,500 / hr" just because that's
  // their stored number.
  const config = resolved.config
  let label = ''
  let tone: 'custom' | 'firm' | 'unset' = 'unset'

  if (resolved.source === 'client' && config) {
    tone = 'custom'
    switch (config.rate_kind) {
      case 'hourly':
        label = `GHS ${config.default_hourly_rate?.toLocaleString('en-GH')} / hr`
        break
      case 'flat':
        label = `GHS ${config.flat_fee?.toLocaleString('en-GH')} flat`
        break
      case 'mixed':
        label = `GHS ${config.default_hourly_rate?.toLocaleString('en-GH')} / hr · mixed`
        break
      case 'contingency':
        label = `${config.contingency_pct}% contingency`
        break
      case 'none':
        // 'none' shouldn't actually reach 'client' source because
        // getResolvedRate falls back when there's no hourly to
        // pre-fill, but if it does we describe it accurately rather
        // than printing a misleading hourly number.
        label = 'Ad-hoc rate'
        tone = 'firm'
        break
    }
  } else if (resolved.source === 'firm' && resolved.rate != null) {
    tone = 'firm'
    label = `GHS ${resolved.rate.toLocaleString('en-GH')} / hr · firm`
  } else {
    tone = 'unset'
    label = 'Set a rate'
  }

  const palette =
    tone === 'custom'
      ? { bg: 'rgba(13,27,42,0.08)', fg: 'var(--navy)' }
      : tone === 'firm'
        ? { bg: 'rgba(0,0,0,0.04)', fg: 'var(--text-secondary)' }
        : { bg: 'rgba(190,53,52,0.10)', fg: 'var(--accent-danger)' }

  return (
    <span
      className="inline-flex items-center gap-1.5 h-6 px-2 rounded text-[11.5px] font-medium tabular-nums whitespace-nowrap"
      style={{ background: palette.bg, color: palette.fg }}
      title={
        config?.notes ??
        (tone === 'firm'
          ? 'No client-specific rate set — using the firm default. Set one on the client to override.'
          : tone === 'unset'
            ? 'No client rate and no firm default set. Set one on the client record.'
            : undefined)
      }
    >
      {label}
    </span>
  )
}

// Mark `outstandingFor` as used so the import isn't flagged when
// the priority suggestion (Task #24) plugs in.
void outstandingFor

// `CalendarDots` is reserved for the in-page filter chip work in
// the next iteration. Keep the import warm so the diff stays tight.
void CalendarDots
