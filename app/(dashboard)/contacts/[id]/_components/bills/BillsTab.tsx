'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretDown,
  CaretLeft,
  CaretRight,
  Columns,
  DownloadSimple,
  Funnel,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCases } from "@/hooks/use-cases"
import { useInvoices } from "@/hooks/use-invoices"
import type { Case, Invoice } from "@/types"
import { PagerBtn } from '../PagerBtn'

// ── Bills tab ──────────────────────────────────────────────────────────

/**
 * Status sub-tabs surfaced above the bills table. Order follows the standard pattern.
 * Each one maps to a predicate over `Invoice.status`; the rest of the
 * pipeline filters by the chosen status, then layers search /
 * advanced filters on top.
 *
 * Notes on the the standard pattern→LegaLite status mapping:
 *   - **Draft** matches `'Draft'` directly.
 *   - **Pending approval** has no analogue in our schema yet — the
 *     workflow ships with the firm-approval module, so this sub-tab
 *     renders the empty state for now.
 *   - **Unpaid** rolls up both `'Sent'` (awaiting payment) and
 *     `'Overdue'` (past due date) — these are the actionable bills.
 *   - **Paid** matches `'Paid'`.
 *   - **All** ignores status entirely.
 *   - **Archive** is a future flag on Invoice; today it renders empty.
 */
const BILL_TABS = [
  'Draft',
  'Pending approval',
  'Unpaid',
  'Paid',
  'All',
  'Archive',
] as const
type BillTab = (typeof BILL_TABS)[number]

type BillColumnId =
  | 'last_sent'
  | 'id'
  | 'status'
  | 'due'
  | 'clients'
  | 'matters'
  | 'issue_date'
  | 'pending_payment'
  | 'balance'
  | 'paid_on'
  | 'paid'
  | 'type'
  | 'total'
  | 'net_total'
  | 'total_tax'

interface BillColumn {
  id: BillColumnId
  label: string
  defaultVisible: boolean
}

/**
 * Bill column registry — matches the reference checklist exactly, default
 * visibility per the screenshot. Columns whose data isn't on Invoice
 * yet (last_sent, pending_payment, paid_on, type, total/net_total/tax
 * — those come with the line-item ledger) render em-dashes today.
 */
const BILL_COLUMNS: BillColumn[] = [
  { id: 'last_sent', label: 'Last sent', defaultVisible: true },
  { id: 'id', label: 'Id', defaultVisible: true },
  { id: 'status', label: 'Status', defaultVisible: true },
  { id: 'due', label: 'Due', defaultVisible: true },
  { id: 'clients', label: 'Clients', defaultVisible: true },
  { id: 'matters', label: 'Matters', defaultVisible: true },
  { id: 'issue_date', label: 'Issue date', defaultVisible: true },
  { id: 'pending_payment', label: 'Pending payment', defaultVisible: false },
  { id: 'balance', label: 'Balance', defaultVisible: true },
  { id: 'paid_on', label: 'Paid on', defaultVisible: false },
  { id: 'paid', label: 'Paid', defaultVisible: false },
  { id: 'type', label: 'Type', defaultVisible: false },
  { id: 'total', label: 'Total', defaultVisible: false },
  { id: 'net_total', label: 'Net Total', defaultVisible: false },
  { id: 'total_tax', label: 'Total Tax', defaultVisible: false },
]

const BILL_PAGE_SIZES = [25, 50, 100] as const

/** Categories surfaced by the Type filter — matches the reference three. */
const BILL_TYPES = ['None', 'Revenue', 'Client Account'] as const

interface BillFilters {
  matter: string
  responsibleSolicitor: string
  originatingSolicitor: string
  dueFrom: string
  dueTo: string
  issueFrom: string
  issueTo: string
  overdueOnly: boolean
  type: string
  currency: string
}

const EMPTY_BILL_FILTERS: BillFilters = {
  matter: '',
  responsibleSolicitor: '',
  originatingSolicitor: '',
  dueFrom: '',
  dueTo: '',
  issueFrom: '',
  issueTo: '',
  overdueOnly: false,
  type: '',
  currency: '',
}

/**
 * Bills tab body. Mirrors the reference contact-scoped bills view: status
 * sub-tabs · MagnifyingGlass by ID · Columns popover · Filters popover · table
 * (or empty state) · paging + Export footer.
 *
 * Data flows through `useInvoices()` filtered to `client_id ===
 * contactId`; the dev DEV_BYPASS path returns an empty list so users
 * see the "No bills match your filters." state out of the box.
 */
export function BillsTab({ contactId }: { contactId: string }) {
  const { data: allInvoices } = useInvoices()
  const { data: allCases } = useCases()
  const invoices = useMemo(
    () => (allInvoices ?? []).filter((i) => i.client_id === contactId),
    [allInvoices, contactId],
  )
  const contactCases = useMemo(
    () => (allCases ?? []).filter((c) => c.client_id === contactId),
    [allCases, contactId],
  )

  const [billTab, setBillTab] = useState<BillTab>('Unpaid')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<BillFilters>(EMPTY_BILL_FILTERS)
  const [visibleCols, setVisibleCols] = useState<Set<BillColumnId>>(
    () =>
      new Set(BILL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )
  const [pageSize, setPageSize] = useState<(typeof BILL_PAGE_SIZES)[number]>(
    25,
  )
  const [page, setPage] = useState(0)

  // Status filter pipeline.
  const byStatus = useMemo(() => {
    switch (billTab) {
      case 'Draft':
        return invoices.filter((i) => i.status === 'Draft')
      case 'Unpaid':
        return invoices.filter(
          (i) => i.status === 'Sent' || i.status === 'Overdue',
        )
      case 'Paid':
        return invoices.filter((i) => i.status === 'Paid')
      case 'All':
        return invoices
      case 'Pending approval':
      case 'Archive':
        // No analogue on Invoice yet — render the empty state.
        return []
      default:
        return invoices
    }
  }, [invoices, billTab])

  const filtered = useMemo(() => {
    return byStatus.filter((inv) => {
      // MagnifyingGlass by ID — substring match because IDs may be long UUIDs.
      const q = search.trim().toLowerCase()
      if (q && !inv.id.toLowerCase().includes(q)) return false

      if (filters.matter && inv.client_id !== filters.matter) {
        // We attach the matter filter to client_id today because
        // Invoice doesn't carry a case_id; will switch to case_id
        // once the column ships.
        return false
      }
      if (filters.overdueOnly && inv.status !== 'Overdue') return false

      if (filters.dueFrom && inv.due_date && inv.due_date < filters.dueFrom)
        return false
      if (filters.dueTo && inv.due_date && inv.due_date > filters.dueTo)
        return false
      // issue date filter: Invoice doesn't carry an `issued_at`
      // column yet, so we fall back to `created_at`.
      if (
        filters.issueFrom &&
        inv.created_at &&
        inv.created_at.slice(0, 10) < filters.issueFrom
      )
        return false
      if (
        filters.issueTo &&
        inv.created_at &&
        inv.created_at.slice(0, 10) > filters.issueTo
      )
        return false
      return true
    })
  }, [byStatus, search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * pageSize
  const end = Math.min(start + pageSize, filtered.length)
  const pageRows = filtered.slice(start, end)

  const orderedCols = useMemo(
    () => BILL_COLUMNS.filter((c) => visibleCols.has(c.id)),
    [visibleCols],
  )

  // Reset paging when filters / status change.
  useEffect(() => {
    setPage(0)
  }, [billTab, search, filters, pageSize])

  // Active facet count surfaced as a badge on the Filters button.
  const activeFilterCount =
    (filters.matter ? 1 : 0) +
    (filters.responsibleSolicitor ? 1 : 0) +
    (filters.originatingSolicitor ? 1 : 0) +
    (filters.dueFrom || filters.dueTo ? 1 : 0) +
    (filters.issueFrom || filters.issueTo ? 1 : 0) +
    (filters.overdueOnly ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.currency ? 1 : 0)

  return (
    <section
      className="rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Status sub-tabs + right-side toolbar share a row. */}
      <div
        className="flex items-center justify-between gap-4 px-6 py-3 border-b flex-wrap"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-1">
          {BILL_TABS.map((t) => (
            <BillStatusTab
              key={t}
              active={billTab === t}
              onClick={() => setBillTab(t)}
            >
              {t}
            </BillStatusTab>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <MagnifyingGlass
              size={13}
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-subtle)' }}
            />
            <Input
              placeholder="Search by ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-[13px] rounded-lg"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
              }}
            />
          </div>
          <BillsColumnsPopover
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <BillsFiltersPopover
            filters={filters}
            cases={contactCases}
            activeCount={activeFilterCount}
            onApply={setFilters}
            onClear={() => setFilters(EMPTY_BILL_FILTERS)}
          />
        </div>
      </div>

      {/* Body — table or empty state. */}
      {filtered.length === 0 ? (
        <NoBillsEmptyState />
      ) : (
        <div className="overflow-auto">
          <table className="w-full" style={{ tableLayout: 'auto' }}>
            <thead style={{ background: 'var(--surface-sunken)' }}>
              <tr>
                <th
                  className="px-3 py-2.5 text-left text-[11.5px] font-semibold"
                  style={{ color: 'var(--text-muted)', width: 80 }}
                >
                  Actions
                </th>
                {orderedCols.map((c) => (
                  <th
                    key={c.id}
                    className="px-3 py-2.5 text-left text-[11.5px] font-semibold whitespace-nowrap"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((inv) => (
                <BillRow key={inv.id} invoice={inv} columns={orderedCols} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer — pagination + Export. Same vocabulary as the
          Documents footer for consistency. */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-t"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-1">
          <PagerBtn
            onClick={() => setPage(0)}
            disabled={safePage === 0}
            aria-label="First page"
          >
            <CaretDoubleLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            aria-label="Previous page"
          >
            <CaretLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn
            onClick={() =>
              setPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={safePage >= totalPages - 1}
            aria-label="Next page"
          >
            <CaretRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn
            onClick={() => setPage(totalPages - 1)}
            disabled={safePage >= totalPages - 1}
            aria-label="Last page"
          >
            <CaretDoubleRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <span
            className="ml-2 text-[12px] tabular-nums"
            style={{ color: 'var(--text-muted)' }}
          >
            {filtered.length === 0
              ? 'No results found'
              : `${start + 1}–${end} of ${filtered.length}`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-medium border cursor-pointer"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {pageSize}{' '}
                  <CaretDown size={11} strokeWidth={1.75} />
                </button>
              }
            />
            <DropdownMenuContent align="end">
              {BILL_PAGE_SIZES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => setPageSize(s)}
                  className="text-[12.5px]"
                >
                  {s} per page
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            disabled={filtered.length === 0}
            onClick={() =>
              toast.info(
                'Bill export ships once the billing screen lands.',
              )
            }
          >
            <DownloadSimple size={13} strokeWidth={1.75} />
            Export
          </Button>
        </div>
      </div>
    </section>
  )
}

// ── Bills — sub-components ─────────────────────────────────────────────

/**
 * Status sub-tab. Pill-style button; the active state gets a filled
 * navy background so it reads as a "you are here" indicator (the standard pattern
 * uses an outlined border treatment, but our pill matches the rest
 * of the LegaLite tabs).
 */
function BillStatusTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 h-9 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
      style={{
        background: active ? 'var(--surface-sunken)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        border: active
          ? '1px solid var(--border-default)'
          : '1px solid transparent',
      }}
    >
      {children}
    </button>
  )
}

/**
 * Columns popover — staged-changes pattern (mirrors Documents).
 * Actions column is fixed (always visible); the rest are toggleable.
 */
function BillsColumnsPopover({
  visible,
  onChange,
}: {
  visible: Set<BillColumnId>
  onChange: (next: Set<BillColumnId>) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<BillColumnId>>(new Set(visible))
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const openPopover = () => {
    setDraft(new Set(visible))
    setOpen(true)
  }
  const apply = () => {
    onChange(draft)
    setOpen(false)
  }
  const toggle = (id: BillColumnId) => {
    const next = new Set(draft)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setDraft(next)
  }

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (open ? setOpen(false) : openPopover())}
      >
        <Columns size={13} strokeWidth={1.75} />
        Columns
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 280,
          }}
        >
          <div className="p-4 max-h-[420px] overflow-y-auto">
            <div
              className="text-[11.5px] uppercase tracking-wider font-semibold mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Visible columns
            </div>
            <ul className="space-y-1.5">
              <li>
                <span
                  className="inline-flex items-center gap-2 text-[13px] opacity-60"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-sm border"
                    style={{
                      borderColor: 'var(--gold)',
                      background: 'var(--gold)',
                    }}
                    aria-hidden
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6.5L5 9.5L10 3.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  Actions
                </span>
              </li>
              {BILL_COLUMNS.map((c) => {
                const checked = draft.has(c.id)
                return (
                  <li key={c.id}>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[13px]">
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                        style={{
                          borderColor: checked
                            ? 'var(--gold)'
                            : 'var(--border-default)',
                          background: checked ? 'var(--gold)' : 'transparent',
                        }}
                        aria-hidden
                      >
                        {checked && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6.5L5 9.5L10 3.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {c.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        className="sr-only"
                      />
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
          <div
            className="flex items-center justify-start gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button size="sm" onClick={apply}>
              Update columns
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Filters popover — Matter / Responsible Solicitor / Originating
 * Solicitor / Due-date range / Issue-date range / Show overdue only
 * / Type / Currency / Custom Fields stub. Staged-changes pattern
 * with Apply + Clear in the footer.
 *
 * Today the Solicitor and Currency pickers are stubs (we don't have
 * a firm-users picker or a multi-currency catalog yet); they show
 * the the standard pattern copy so users can preview the surface area.
 */
function BillsFiltersPopover({
  filters,
  cases,
  activeCount,
  onApply,
  onClear,
}: {
  filters: BillFilters
  cases: Case[]
  activeCount: number
  onApply: (f: BillFilters) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<BillFilters>(filters)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const openPopover = () => {
    setDraft(filters)
    setOpen(true)
  }
  const apply = () => {
    onApply(draft)
    setOpen(false)
  }
  const clear = () => {
    setDraft(EMPTY_BILL_FILTERS)
    onClear()
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (open ? setOpen(false) : openPopover())}
      >
        <Funnel size={13} strokeWidth={1.75} />
        Filters
        {activeCount > 0 && (
          <span
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10.5px] font-semibold tabular-nums"
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          >
            {activeCount}
          </span>
        )}
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 360,
          }}
        >
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Matter — filtered to the contact's own cases. */}
            <BillFilterSelect
              label="Matter"
              value={draft.matter}
              placeholder="Find a matter by matter name or client"
              onChange={(v) => setDraft({ ...draft, matter: v })}
              options={cases.map((c) => ({ value: c.id, label: c.title }))}
            />

            {/* Solicitor pickers — stubbed text inputs until the
                firm-users picker ships. */}
            <BillFilterInput
              label="Responsible Solicitor"
              value={draft.responsibleSolicitor}
              placeholder="Find a firm user"
              onChange={(v) =>
                setDraft({ ...draft, responsibleSolicitor: v })
              }
            />
            <BillFilterInput
              label="Originating Solicitor"
              value={draft.originatingSolicitor}
              placeholder="Find a firm user"
              onChange={(v) =>
                setDraft({ ...draft, originatingSolicitor: v })
              }
            />

            {/* Due date range. */}
            <BillFilterDateRange
              label="Due date"
              from={draft.dueFrom}
              to={draft.dueTo}
              onChange={(from, to) =>
                setDraft({ ...draft, dueFrom: from, dueTo: to })
              }
            />
            {/* Issue date range. */}
            <BillFilterDateRange
              label="Issue date"
              from={draft.issueFrom}
              to={draft.issueTo}
              onChange={(from, to) =>
                setDraft({ ...draft, issueFrom: from, issueTo: to })
              }
            />

            <label className="flex items-center gap-2 cursor-pointer select-none text-[13px]">
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                style={{
                  borderColor: draft.overdueOnly
                    ? 'var(--gold)'
                    : 'var(--border-default)',
                  background: draft.overdueOnly ? 'var(--gold)' : 'transparent',
                }}
                aria-hidden
              >
                {draft.overdueOnly && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6.5L5 9.5L10 3.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span style={{ color: 'var(--text-primary)' }}>
                Show overdue bills only
              </span>
              <input
                type="checkbox"
                checked={draft.overdueOnly}
                onChange={() =>
                  setDraft({ ...draft, overdueOnly: !draft.overdueOnly })
                }
                className="sr-only"
              />
            </label>

            <BillFilterSelect
              label="Type"
              value={draft.type}
              placeholder="All"
              onChange={(v) => setDraft({ ...draft, type: v })}
              options={BILL_TYPES.map((t) => ({ value: t, label: t }))}
            />

            <BillFilterInput
              label="Currency"
              value={draft.currency}
              placeholder="Find a currency"
              onChange={(v) => setDraft({ ...draft, currency: v })}
            />

            {/* Custom Fields stub — follows the standard pattern. */}
            <div>
              <div
                className="text-[12.5px] font-semibold mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Custom Fields
              </div>
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                Customise and speed up your workflow by creating Custom
                Fields. Available once the firm settings screen ships.
              </p>
            </div>
          </div>
          <div
            className="flex items-center justify-start gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button size="sm" onClick={apply}>
              Apply filters
            </Button>
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function BillFilterSelect({
  label,
  value,
  placeholder,
  onChange,
  options,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div>
      <div
        className="text-[12.5px] font-semibold mb-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: value ? 'var(--text-primary)' : 'var(--text-muted)',
            colorScheme: 'light',
          }}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <CaretDown
          size={13}
          strokeWidth={1.75}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
      </div>
    </div>
  )
}

function BillFilterInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div
        className="text-[12.5px] font-semibold mb-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 rounded-lg border px-3 text-[13px]"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
        }}
      />
    </div>
  )
}

function BillFilterDateRange({
  label,
  from,
  to,
  onChange,
}: {
  label: string
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  return (
    <div>
      <div
        className="text-[12.5px] font-semibold mb-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => onChange(e.target.value, to)}
          className="flex-1 h-10 rounded-lg border px-3 text-[13px]"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            colorScheme: 'light',
          }}
        />
        <span style={{ color: 'var(--text-muted)' }} aria-hidden>
          –
        </span>
        <input
          type="date"
          value={to}
          onChange={(e) => onChange(from, e.target.value)}
          className="flex-1 h-10 rounded-lg border px-3 text-[13px]"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            colorScheme: 'light',
          }}
        />
      </div>
    </div>
  )
}

/**
 * Single bill row. Renders an Actions dropdown plus every visible
 * column from the registry. Fields not on Invoice yet (last_sent,
 * pending_payment, paid_on, type, total/net_total/tax) render an
 * em-dash so the table stays scannable; they light up automatically
 * the day those columns ship.
 */
function BillRow({
  invoice,
  columns,
}: {
  invoice: Invoice
  columns: BillColumn[]
}) {
  const dash = (
    <span style={{ color: 'var(--text-subtle)' }}>—</span>
  )
  const fmtDate = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      : null
  const fmtMoney = (n?: number | null) =>
    n != null
      ? new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GHS',
      }).format(n)
      : null

  const value = (id: BillColumnId): React.ReactNode => {
    switch (id) {
      case 'last_sent':
        return dash
      case 'id':
        return (
          <span
            className="font-mono text-[12px] tracking-wide"
            style={{ color: 'var(--text-muted)' }}
          >
            {invoice.id.slice(0, 8)}
          </span>
        )
      case 'status':
        return (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium"
            style={{
              background:
                invoice.status === 'Paid'
                  ? 'rgba(34,197,94,0.12)'
                  : invoice.status === 'Overdue'
                    ? 'rgba(220,38,38,0.12)'
                    : 'rgba(201,151,43,0.16)',
              color:
                invoice.status === 'Paid'
                  ? '#16A34A'
                  : invoice.status === 'Overdue'
                    ? '#DC2626'
                    : 'var(--gold-dark)',
            }}
          >
            {invoice.status}
          </span>
        )
      case 'due':
        return fmtDate(invoice.due_date) ?? dash
      case 'clients':
        return invoice.client_name || dash
      case 'matters':
        return dash
      case 'issue_date':
        return fmtDate(invoice.created_at) ?? dash
      case 'pending_payment':
        return dash
      case 'balance':
        return fmtMoney(invoice.amount_ghs) ?? dash
      case 'paid_on':
        return dash
      case 'paid':
        return dash
      case 'type':
        return dash
      case 'total':
        return fmtMoney(invoice.amount_ghs) ?? dash
      case 'net_total':
        return dash
      case 'total_tax':
        return dash
      default:
        return dash
    }
  }

  return (
    <tr
      className="border-t transition-colors"
      style={{ borderColor: 'var(--border-soft)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-overlay)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <td className="px-3 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center justify-center h-7 w-7 rounded-md border cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-muted)',
                }}
                aria-label={`Actions for invoice ${invoice.id}`}
              >
                <CaretDown size={12} strokeWidth={1.75} />
              </button>
            }
          />
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem
              onClick={() => toast.info('Bill preview is coming next.')}
              className="text-[12.5px] cursor-pointer"
            >
              Open
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toast.info('Sending bills ships with the billing screen.')
              }
              className="text-[12.5px] cursor-pointer"
            >
              PaperPlaneTilt
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toast.info('Recording payment ships next.')
              }
              className="text-[12.5px] cursor-pointer"
            >
              Record payment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
      {columns.map((c) => (
        <td
          key={c.id}
          className="px-3 py-2 text-[13px] whitespace-nowrap"
          style={{ color: 'var(--text-primary)' }}
        >
          {value(c.id)}
        </td>
      ))}
    </tr>
  )
}

/**
 * Illustrated empty state for the Bills tab. Replaces the previous
 * plain-text "No bills match your filters." line with the same kind
 * of inline-SVG family used by Documents / Transactions / Comms so
 * the four contact-detail tabs read as one coherent surface.
 */
function NoBillsEmptyState() {
  return (
    <div className="py-16 px-6 text-center">
      <div className="mx-auto mb-6 w-[180px]" aria-hidden>
        <NoBillsIllustration />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        No bills match your filters.
      </p>
      <p
        className="mt-1 text-[12.5px] max-w-md mx-auto"
        style={{ color: 'var(--text-muted)' }}
      >
        Issue your first bill from a closed matter, or relax the filters
        above to see drafts and unpaid invoices.
      </p>
    </div>
  )
}

/**
 * Inline SVG of a paper invoice / receipt with line items, a total
 * row, a cedi (₵) currency stamp in the corner, and a blue "+" badge
 * at the bottom-right. Mirrors the design vocabulary of the other
 * empty-state illustrations in this file.
 *
 * Composition (in z-order):
 *   1. Ground shadow ellipse
 *   2. White receipt panel with a zig-zag bottom edge (the classic
 *      "torn paper" tell that signals a printed bill)
 *   3. Title bar at the top — a darker stripe with a circular
 *      cedi badge on the left
 *   4. Four horizontal line-item strokes
 *   5. A bolder total row at the bottom
 *   6. Blue "+" badge bottom-right of the panel
 *
 * 220×180 viewBox so the illustration sits at the same visual weight
 * as Documents / Bank accounts / Communications.
 */
function NoBillsIllustration() {
  const PAPER_FILL = '#FFFFFF'
  const STROKE = '#1F2A44'
  const TEXT_LINE = '#C7D2DD'
  const TOTAL_LINE = '#1F2A44'
  const HEADER_FILL = '#F1F5FA'
  const ACCENT_TINT = 'rgba(201,151,43,0.18)' // soft gold for the ₵ badge
  const ACCENT = '#B0831F'
  const SHADOW = 'rgba(13, 27, 42, 0.08)'
  const BADGE_FILL = '#1E88E5'
  const BADGE_PLUS = '#FFFFFF'

  return (
    <svg
      viewBox="0 0 220 180"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      role="img"
      aria-label="No bills illustration"
    >
      {/* Ground shadow — same anchor used by the other empty states. */}
      <ellipse cx="110" cy="160" rx="68" ry="5" fill={SHADOW} />

      {/* Receipt panel. Drawn as a single path so we can carve the
          zig-zag "torn paper" bottom edge in one shape. The zig-zags
          start at the lower-left corner and march to the right with
          alternating peaks/troughs. */}
      <path
        d="
          M52 22
          h116
          a8 8 0 0 1 8 8
          v110
          l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8
          l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8
          V30
          a8 8 0 0 1 8 -8
          Z
        "
        fill={PAPER_FILL}
        stroke={STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Title bar — a soft tinted stripe at the top so the receipt
          reads as having a header / company name row. */}
      <path
        d="
          M52 22
          h116
          a8 8 0 0 1 8 8
          v12
          H44
          v-12
          a8 8 0 0 1 8 -8
          Z
        "
        fill={HEADER_FILL}
      />
      <line
        x1="44"
        y1="42"
        x2="176"
        y2="42"
        stroke={STROKE}
        strokeWidth="2"
      />

      {/* Cedi (₵) stamp on the left side of the header. Circle
          background tinted in our gold accent so the receipt feels
          on-brand without leaning fully into navy. */}
      <circle cx="64" cy="32" r="9" fill={ACCENT_TINT} stroke={ACCENT} strokeWidth="2" />
      <text
        x="64"
        y="35.5"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill={ACCENT}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        ₵
      </text>

      {/* Four line items. Each pair = description line on the left,
          amount line on the right, so the receipt reads as a
          structured ledger. */}
      <line x1="58" y1="60" x2="118" y2="60" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="138" y1="60" x2="168" y2="60" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />

      <line x1="58" y1="74" x2="110" y2="74" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="138" y1="74" x2="168" y2="74" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />

      <line x1="58" y1="88" x2="124" y2="88" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="138" y1="88" x2="168" y2="88" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />

      <line x1="58" y1="102" x2="104" y2="102" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="138" y1="102" x2="168" y2="102" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />

      {/* Divider line above the total row. */}
      <line x1="58" y1="116" x2="168" y2="116" stroke={STROKE} strokeWidth="1.5" strokeDasharray="2 3" />

      {/* TOTAL row — bolder strokes so it reads as the bottom-line
          number on the bill. */}
      <line x1="58" y1="128" x2="100" y2="128" stroke={TOTAL_LINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="132" y1="128" x2="170" y2="128" stroke={TOTAL_LINE} strokeWidth="4" strokeLinecap="round" />

      {/* "+" badge bottom-right of the receipt — same affordance the
          other empty states use to hint at "create one". */}
      <circle cx="178" cy="142" r="16" fill={BADGE_FILL} />
      <line
        x1="178"
        y1="134"
        x2="178"
        y2="150"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="170"
        y1="142"
        x2="186"
        y2="142"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
