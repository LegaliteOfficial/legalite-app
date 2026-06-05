'use client'

/**
 * Clients page
 * ------------
 * List view of every client the firm has on file. Layout breakdown:
 *
 *   - Page header   — "Clients" title + primary "Add a client" button
 *   - Tab nav       — All / Open / Pending / Closed. The non-"All"
 *                     tabs filter by the client's most-recent case's
 *                     status (clients with no cases are excluded
 *                     from the status-specific tabs but show under
 *                     "All").
 *   - Filter row    — Three placeholder chips (Assigned to / Status /
 *                     Created on), a search icon that expands into
 *                     an inline input, and an Edit-columns button.
 *                     The chip / edit-columns affordances toast a
 *                     "coming soon" hint for now; they're scaffolded
 *                     so the next iteration can wire them without
 *                     re-doing the layout.
 *   - Table         — Sortable headers (Phone / Email / Status /
 *                     Assigned to), per-row checkbox, gold-tinted
 *                     avatar with initials, status badge, an
 *                     assigned-to avatar stack, and a per-row
 *                     three-dot menu (View / Edit / Assign case /
 *                     Delete).
 *
 * Data sources:
 *   - useClients() — list of clients
 *   - useCases()   — joined to derive each client's primary case
 *                    status. The "primary" case is the most recently
 *                    updated open case (falls back to most recent
 *                    case of any status if no open case exists).
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowUpDown,
  Briefcase,
  CalendarClock,
  Check,
  ChevronDown,
  Clock,
  Edit3,
  Eye,
  Filter,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Settings2,
  Trash2,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { ClientForm } from '@/components/shared/ClientForm'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { StartTimerDialog } from '@/components/shared/StartTimerDialog'
import { PriorityButton } from '@/components/shared/PriorityButton'
import { useClients } from '@/hooks/use-clients'
import { useCases } from '@/hooks/use-cases'
import {
  ROLE_LABEL,
  useClientAssignees,
  type Assignee,
} from '@/hooks/use-client-assignees'
import { useUIStore } from '@/stores/ui.store'
import type { Client, Case, CaseStatus } from '@/types'

// ── Tabs ───────────────────────────────────────────────────────────────

/**
 * Tabs across the top of the table. "All" shows everyone; the
 * status tabs filter by the client's primary-case status.
 */
const TABS = ['All', 'Open', 'Pending', 'Closed'] as const
type TabKey = (typeof TABS)[number]

// ── Sorting ────────────────────────────────────────────────────────────

/**
 * Sortable columns. Sort state is `{ key, dir }`; clicking a column
 * header cycles asc → desc → off → asc on that column.
 */
type SortKey = 'phone' | 'email' | 'status' | 'assigned'
type SortDir = 'asc' | 'desc'
interface SortState {
  key: SortKey | null
  dir: SortDir
}

// ── Filters ────────────────────────────────────────────────────────────

/** Client status options surfaced in the Status filter chip. */
const CLIENT_STATUSES = ['Active', 'Inactive'] as const
type ClientStatusKey = (typeof CLIENT_STATUSES)[number]

/**
 * Created-on filter presets. Each option's `days` value is the
 * number of days back from today; `null` means no date constraint
 * (the "All time" default). Picked these windows because they
 * cover the common law-firm reporting cadences (weekly review,
 * monthly review, quarterly review, annual review).
 */
const CREATED_ON_OPTIONS = [
  { key: 'all', label: 'All time', days: null as number | null },
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: '1y', label: 'Last year', days: 365 },
] as const
type CreatedOnKey = (typeof CREATED_ON_OPTIONS)[number]['key']

// ── Columns ────────────────────────────────────────────────────────────

/**
 * Columns the user can show / hide via the Edit columns dropdown.
 * The Client column and the row-menu column are always visible —
 * the first identifies the row, the second is the actions handle —
 * so they're not listed here.
 */
const TOGGLEABLE_COLUMNS = [
  { key: 'phone', label: 'Phone number' },
  { key: 'email', label: 'Email address' },
  { key: 'status', label: 'Status' },
  { key: 'assigned', label: 'Assigned to' },
] as const
type ColumnKey = (typeof TOGGLEABLE_COLUMNS)[number]['key']

// ── Page ───────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const router = useRouter()
  const { data: clients, isLoading, error } = useClients()
  const { data: cases } = useCases()
  const hookAssigneesByClient = useClientAssignees()
  const { openModal } = useUIStore()

  // Local override applied on top of the hook's assignee map so
  // the Manage assignees dialog can produce immediate, visible
  // changes without a backend. When the integrations release ships,
  // this state goes away and the hook itself owns the writes.
  const [assigneeOverrides, setAssigneeOverrides] = useState<
    Map<string, Assignee[]>
  >(new Map())

  const assigneesByClient = useMemo(() => {
    if (assigneeOverrides.size === 0) return hookAssigneesByClient
    const merged = new Map(hookAssigneesByClient)
    for (const [clientId, list] of assigneeOverrides) merged.set(clientId, list)
    return merged
  }, [hookAssigneesByClient, assigneeOverrides])

  // Flat, de-duped list of every firm member who appears on any
  // client's roster. Drives the Assigned-to filter dropdown. Sorted
  // alphabetically so the list is scannable.
  const allFirmMembers = useMemo(() => {
    const map = new Map<string, Assignee>()
    for (const list of assigneesByClient.values()) {
      for (const a of list) {
        if (!map.has(a.id)) map.set(a.id, a)
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }, [assigneesByClient])

  // ── Per-client primary case lookup ──────────────────────────────
  // Maps client_id → the case that "represents" the client in this
  // list view. Picks the most recently-updated open case if any;
  // falls back to the most recent case of any status; undefined
  // when the client has no cases on file.
  const primaryCaseByClient = useMemo(() => {
    const map = new Map<string, Case>()
    for (const c of cases ?? []) {
      if (!c.client_id) continue
      const existing = map.get(c.client_id)
      if (!existing) {
        map.set(c.client_id, c)
        continue
      }
      // Prefer Open over Pending over Closed; within the same
      // status pick the more recently updated one.
      const score = (status: CaseStatus) =>
        status === 'Open' ? 2 : status === 'Pending' ? 1 : 0
      const a = score(c.status as CaseStatus)
      const b = score(existing.status as CaseStatus)
      if (a > b || (a === b && c.updated_at > existing.updated_at)) {
        map.set(c.client_id, c)
      }
    }
    return map
  }, [cases])

  // ── UI state ────────────────────────────────────────────────────
  const [tab, setTab] = useState<TabKey>('All')
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sort, setSort] = useState<SortState>({ key: null, dir: 'asc' })
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Filter chip state. Each chip's selection narrows the table to
  // rows that match — they intersect with each other AND with the
  // tab nav, so the more constraints the user adds the tighter the
  // result. Empty sets mean "no filter applied" (don't narrow).
  const [assignedToFilter, setAssignedToFilter] = useState<Set<string>>(
    new Set(),
  )
  const [statusFilter, setStatusFilter] = useState<Set<ClientStatusKey>>(
    new Set(),
  )
  const [createdOnFilter, setCreatedOnFilter] = useState<CreatedOnKey>('all')

  // Edit-columns state. Starts with everything visible so first-run
  // matches the default reference layout.
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    () => new Set(TOGGLEABLE_COLUMNS.map((c) => c.key)),
  )

  // View / Manage assignees dialog state — both hold the client
  // they're operating on (or null when closed). Using full Client
  // refs (not just ids) so the dialog can read fields synchronously
  // without re-deriving from the list on every render.
  const [viewClient, setViewClient] = useState<Client | null>(null)
  const [manageClient, setManageClient] = useState<Client | null>(null)
  // The "Start timer" row action sets this to a client id, which
  // opens the StartTimerDialog. Keeping it as just the id (not the
  // whole client object) means the dialog re-reads from useClients
  // and stays correct if the underlying record is edited mid-flow.
  const [timerClientId, setTimerClientId] = useState<string | null>(null)

  // ── Derived list ────────────────────────────────────────────────
  const filteredAndSorted = useMemo(() => {
    let list = clients ?? []
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => {
        return (
          c.full_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.client_code?.toLowerCase().includes(q)
        )
      })
    }
    if (tab !== 'All') {
      list = list.filter((c) => {
        const pc = primaryCaseByClient.get(c.id)
        return pc?.status === tab
      })
    }
    // Assigned-to filter — show clients with at least one of the
    // selected firm members on their roster. Intersect (not union)
    // would feel surprising — users almost always mean "show
    // anything assigned to ANY of these people" when ticking names.
    if (assignedToFilter.size > 0) {
      list = list.filter((c) => {
        const roster = assigneesByClient.get(c.id) ?? []
        return roster.some((a) => assignedToFilter.has(a.id))
      })
    }
    // Status filter — operates on the CLIENT's own status (Active /
    // Inactive), distinct from the tab nav which filters by primary
    // case status. Lets the user say "show me Active clients with
    // an Open case" by combining both.
    if (statusFilter.size > 0) {
      list = list.filter((c) => statusFilter.has(c.status as ClientStatusKey))
    }
    // Created-on filter — keeps rows whose created_at falls within
    // the chosen lookback window. `all` skips the check entirely.
    if (createdOnFilter !== 'all') {
      const opt = CREATED_ON_OPTIONS.find((o) => o.key === createdOnFilter)
      if (opt?.days != null) {
        const cutoff = Date.now() - opt.days * 24 * 60 * 60 * 1000
        list = list.filter((c) => {
          const t = new Date(c.created_at).getTime()
          return Number.isFinite(t) && t >= cutoff
        })
      }
    }
    if (sort.key) {
      const dir = sort.dir === 'asc' ? 1 : -1
      list = [...list].sort((a, b) => {
        const va = sortValue(a, sort.key!, primaryCaseByClient)
        const vb = sortValue(b, sort.key!, primaryCaseByClient)
        if (va === vb) return 0
        return va < vb ? -dir : dir
      })
    }
    return list
  }, [
    clients,
    search,
    tab,
    sort,
    primaryCaseByClient,
    assignedToFilter,
    statusFilter,
    createdOnFilter,
    assigneesByClient,
  ])

  // ── Sort header helpers ─────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      // Third click → clear sort
      return { key: null, dir: 'asc' }
    })
  }

  // ── Selection helpers ───────────────────────────────────────────
  const allSelected =
    filteredAndSorted.length > 0 &&
    filteredAndSorted.every((c) => selected.has(c.id))
  const someSelected = filteredAndSorted.some((c) => selected.has(c.id))
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) filteredAndSorted.forEach((c) => next.delete(c.id))
      else filteredAndSorted.forEach((c) => next.add(c.id))
      return next
    })
  }
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // ── Filter toggles ──────────────────────────────────────────────
  // Each chip's onSelect callback toggles membership of the option
  // it received. Wrapped so each filter's signature is tight.
  const toggleAssignedTo = (id: string) =>
    setAssignedToFilter((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleClientStatus = (status: ClientStatusKey) =>
    setStatusFilter((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  const toggleColumn = (key: ColumnKey) =>
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  const showColumn = (key: ColumnKey) => visibleColumns.has(key)

  /**
   * Replace the current assignee list for a client. Updates the
   * local override map so the table re-renders immediately; once a
   * real persistence layer ships, this becomes the success path of
   * a mutation.
   */
  const setClientAssignees = (clientId: string, next: Assignee[]) =>
    setAssigneeOverrides((prev) => {
      const map = new Map(prev)
      map.set(clientId, next)
      return map
    })

  // ── Render ──────────────────────────────────────────────────────
  if (isLoading) return <PageSkeleton />
  if (error) {
    return (
      <div
        className="flex-1 overflow-y-auto"
        style={{ background: 'var(--surface-card)' }}
      >
        <div className="px-6 py-5">
          <ErrorPanel onRetry={() => window.location.reload()} />
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: 'var(--surface-card)' }}
    >
      <div className="px-6 py-6">
        {/* ─── Title + primary action ──────────────────────────── */}
        <div className="flex items-center justify-between">
          <h1
            className="text-[26px] font-semibold leading-tight tracking-tight"
            style={{
              color: 'var(--text-primary)',
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            Clients
          </h1>
          <Button
            onClick={() => openModal({ type: 'addClient' })}
            size="lg"
            className="rounded-lg"
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
            }}
          >
            <Plus size={14} strokeWidth={2.25} />
            Add a client
          </Button>
        </div>

        {/* ─── Tab nav ─────────────────────────────────────────── */}
        <div
          className="mt-5 flex items-center gap-1 border-b"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          {TABS.map((t) => {
            const active = tab === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="inline-flex items-center px-4 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px cursor-pointer transition-colors"
                style={{
                  color: active
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                  borderColor: active ? 'var(--gold)' : 'transparent',
                  fontWeight: active ? 600 : 500,
                }}
              >
                {t}
              </button>
            )
          })}
        </div>

        {/* ─── Filter chips row ────────────────────────────────── */}
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Assigned to — multi-select firm members. */}
            <MultiSelectChip
              icon={<Users size={12} strokeWidth={1.75} />}
              label="Assigned to"
              activeCount={assignedToFilter.size}
              options={allFirmMembers.map((m) => ({
                key: m.id,
                label: m.name,
                meta: ROLE_LABEL[m.role],
                selected: assignedToFilter.has(m.id),
              }))}
              onToggle={(key) => toggleAssignedTo(key)}
              onClear={() => setAssignedToFilter(new Set())}
              emptyLabel="No firm members on file yet."
            />

            {/* Status — multi-select client status (Active/Inactive).
                Distinct from the tab nav which uses case status, so
                users can intersect "Active client" with "Open case". */}
            <MultiSelectChip
              icon={<Filter size={12} strokeWidth={1.75} />}
              label="Status"
              activeCount={statusFilter.size}
              options={CLIENT_STATUSES.map((s) => ({
                key: s,
                label: s,
                selected: statusFilter.has(s),
              }))}
              onToggle={(key) => toggleClientStatus(key as ClientStatusKey)}
              onClear={() => setStatusFilter(new Set())}
            />

            {/* Created on — single-select preset windows. */}
            <SingleSelectChip
              icon={<CalendarClock size={12} strokeWidth={1.75} />}
              label="Created on"
              valueLabel={
                CREATED_ON_OPTIONS.find((o) => o.key === createdOnFilter)
                  ?.label ?? 'All time'
              }
              isCustomised={createdOnFilter !== 'all'}
              options={CREATED_ON_OPTIONS.map((o) => ({
                key: o.key,
                label: o.label,
                selected: createdOnFilter === o.key,
              }))}
              onSelect={(key) => setCreatedOnFilter(key as CreatedOnKey)}
            />
          </div>
          <div className="flex items-center gap-2">
            {searchOpen ? (
              <div className="relative w-56">
                <Search
                  size={13}
                  strokeWidth={1.75}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-subtle)' }}
                />
                <Input
                  autoFocus
                  placeholder="Search clients…"
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
                <Search size={13} strokeWidth={1.75} />
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
                    <Settings2 size={13} strokeWidth={1.75} />
                    Edit columns
                    {visibleColumns.size < TOGGLEABLE_COLUMNS.length && (
                      <span
                        className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10.5px] font-semibold"
                        style={{
                          background: 'var(--accent-today-tint-strong)',
                          color: 'var(--accent-today)',
                        }}
                        aria-label={`${TOGGLEABLE_COLUMNS.length - visibleColumns.size} hidden`}
                      >
                        {TOGGLEABLE_COLUMNS.length - visibleColumns.size}
                      </span>
                    )}
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-52">
                {TOGGLEABLE_COLUMNS.map((col) => {
                  const visible = showColumn(col.key)
                  return (
                    <DropdownMenuItem
                      key={col.key}
                      // preventDefault keeps the menu open so the user
                      // can toggle several columns without re-opening.
                      onClick={(e) => {
                        e.preventDefault?.()
                        toggleColumn(col.key)
                      }}
                      className="text-[13px] cursor-pointer"
                    >
                      {col.label}
                      {visible && (
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
          </div>
        </div>

        {/* ─── Table ───────────────────────────────────────────── */}
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
                <th className="w-10 px-4 py-3">
                  <SelectAllCheckbox
                    checked={allSelected}
                    indeterminate={!allSelected && someSelected}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3 font-medium">Client</th>
                {showColumn('phone') && (
                  <SortHeader
                    label="Phone number"
                    active={sort.key === 'phone'}
                    dir={sort.dir}
                    onClick={() => toggleSort('phone')}
                  />
                )}
                {showColumn('email') && (
                  <SortHeader
                    label="Email address"
                    active={sort.key === 'email'}
                    dir={sort.dir}
                    onClick={() => toggleSort('email')}
                  />
                )}
                {showColumn('status') && (
                  <SortHeader
                    label="Status"
                    active={sort.key === 'status'}
                    dir={sort.dir}
                    onClick={() => toggleSort('status')}
                  />
                )}
                {showColumn('assigned') && (
                  <SortHeader
                    label="Assigned to"
                    active={sort.key === 'assigned'}
                    dir={sort.dir}
                    onClick={() => toggleSort('assigned')}
                  />
                )}
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.length === 0 && (
                <tr>
                  <td
                    // Always-visible columns are checkbox + Client + row
                    // menu (3); plus however many toggleable columns are
                    // currently visible.
                    colSpan={3 + visibleColumns.size}
                    className="px-6 py-16 text-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {search.trim()
                      ? `No clients matching "${search}".`
                      : tab === 'All' && assignedToFilter.size === 0 && statusFilter.size === 0 && createdOnFilter === 'all'
                        ? 'No clients yet. Click "Add a client" to register your first one.'
                        : 'No clients match the current filters.'}
                  </td>
                </tr>
              )}
              {filteredAndSorted.map((c) => {
                const pc = primaryCaseByClient.get(c.id)
                const statusLabel = pc?.status ?? 'Active'
                return (
                  <tr
                    key={c.id}
                    className="border-t transition-colors"
                    style={{ borderColor: 'var(--border-soft)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'var(--surface-sunken)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td className="px-4 py-3">
                      <RowCheckbox
                        checked={selected.has(c.id)}
                        onChange={() => toggleOne(c.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={c.full_name} />
                        <span
                          className="font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {c.full_name}
                        </span>
                      </div>
                    </td>
                    {showColumn('phone') && (
                      <td
                        className="px-4 py-3 tabular-nums"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {c.phone || '—'}
                      </td>
                    )}
                    {showColumn('email') && (
                      <td
                        className="px-4 py-3 truncate"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {c.email || '—'}
                      </td>
                    )}
                    {showColumn('status') && (
                      <td className="px-4 py-3">
                        <StatusBadge status={statusLabel} />
                      </td>
                    )}
                    {showColumn('assigned') && (
                      <td className="px-4 py-3">
                        <AssignedAvatars
                          assignees={assigneesByClient.get(c.id) ?? []}
                          onManage={() => setManageClient(c)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {/* Always-visible priority star — first-class
                            affordance so users don't have to dig
                            into the row menu to flag a client. */}
                        <PriorityButton
                          entityType="client"
                          entityId={c.id}
                          label={c.full_name}
                        />
                        <RowMenu
                          clientName={c.full_name}
                          onView={() => setViewClient(c)}
                        onEdit={() =>
                          openModal({ type: 'editClient', id: c.id })
                        }
                        onAssignCase={() =>
                          // Pre-fill the new-case form with this client
                          // selected. The /cases/new page reads the
                          // ?client= query param and seeds client_ids.
                          router.push(`/cases/new?client=${c.id}`)
                        }
                        onStartTimer={() => setTimerClientId(c.id)}
                          onDelete={() =>
                            openModal({
                              type: 'confirmDelete',
                              entity: 'client',
                              id: c.id,
                              name: c.full_name,
                            })
                          }
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <ClientForm />
        <DeleteDialog />
        {/* Billable-hour timer entry point — opened by the
            "Time working hours" item in the row action menu. The
            dialog walks through the rate gate when needed, then
            kicks off the timer; the 30-min check-ins + floating
            active-timer widget live in TimeTrackerBoot at the
            dashboard layout level so they survive navigation. */}
        <StartTimerDialog
          open={timerClientId !== null}
          onOpenChange={(o) => !o && setTimerClientId(null)}
          clientId={timerClientId}
        />

        {/* View dialog — read-only client snapshot opened from the
            row menu. Shows contact info, primary case status, and
            the assignee roster so the user can review without going
            to a separate detail page. */}
        <ClientDetailsDialog
          client={viewClient}
          primaryCase={viewClient ? primaryCaseByClient.get(viewClient.id) : undefined}
          assignees={
            viewClient ? assigneesByClient.get(viewClient.id) ?? [] : []
          }
          onOpenChange={(o) => !o && setViewClient(null)}
          onEdit={() => {
            if (viewClient) {
              const id = viewClient.id
              setViewClient(null)
              openModal({ type: 'editClient', id })
            }
          }}
        />

        {/* Manage assignees dialog — multi-select firm members for a
            single client. Persists into the local override map so
            the table reflects changes immediately. Backend mutation
            wires in here when the integrations release ships. */}
        <ManageAssigneesDialog
          client={manageClient}
          allMembers={allFirmMembers}
          current={
            manageClient
              ? assigneesByClient.get(manageClient.id) ?? []
              : []
          }
          onOpenChange={(o) => !o && setManageClient(null)}
          onSave={(next) => {
            if (manageClient) {
              setClientAssignees(manageClient.id, next)
              toast.success(
                `Assignees updated for ${manageClient.full_name}.`,
              )
              setManageClient(null)
            }
          }}
        />
      </div>
    </div>
  )
}

// ── Sort value helper ──────────────────────────────────────────────────

/**
 * Pull the comparable value for a row given a sort key. Falls back
 * to empty string so undefined fields sort consistently rather than
 * crashing the comparator.
 */
function sortValue(
  c: Client,
  key: SortKey,
  primaryByClient: Map<string, Case>,
): string {
  if (key === 'phone') return (c.phone ?? '').toLowerCase()
  if (key === 'email') return (c.email ?? '').toLowerCase()
  if (key === 'status') {
    const pc = primaryByClient.get(c.id)
    return (pc?.status ?? 'zzz').toLowerCase()
  }
  // 'assigned' — today we only show the owner so sorts by user_id;
  // when real assignment data lands this picks up the assignee name.
  return (c.user_id ?? '').toLowerCase()
}

// ── Sub-components ─────────────────────────────────────────────────────

/**
 * Filter-chip trigger. Pill-shaped, icon + label + caret, with a
 * gold count badge when one or more options are selected so the
 * user can tell at a glance whether a filter is active.
 */
// ChipTrigger renders the visual presentation of a chip trigger.
// It returns a <span>, NOT a <button>, because it's always wrapped
// inside the DropdownMenuTrigger's actual <button>. Nested buttons
// would be invalid HTML and would silently drop the inner click,
// which surfaced as "chip looks open but dropdown is empty".
function ChipTrigger({
  icon,
  label,
  activeCount,
  activeText,
}: {
  icon: React.ReactNode
  label: string
  activeCount?: number
  activeText?: string
}) {
  const active = (activeCount && activeCount > 0) || !!activeText
  return (
    <span
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12.5px] font-medium cursor-pointer"
      style={{
        borderColor: active ? 'var(--gold)' : 'var(--border-default)',
        background: active
          ? 'var(--accent-today-tint)'
          : 'var(--surface-card)',
        color: 'var(--text-secondary)',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
      {label}
      {activeCount != null && activeCount > 0 && (
        <span
          className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10.5px] font-semibold"
          style={{
            background: 'var(--accent-today-tint-strong)',
            color: 'var(--accent-today)',
          }}
        >
          {activeCount}
        </span>
      )}
      {activeText && (
        <span
          className="text-[11.5px] font-semibold"
          style={{ color: 'var(--accent-today)' }}
        >
          · {activeText}
        </span>
      )}
      <ChevronDown
        size={11}
        strokeWidth={1.75}
        style={{ color: 'var(--text-muted)' }}
      />
    </span>
  )
}

/**
 * Multi-select filter chip — the dropdown holds N options; clicking
 * one toggles it (and keeps the menu open so the user can pick
 * several without re-opening). A "Clear" footer resets the filter
 * in one click. Used for Assigned to and Status.
 */
function MultiSelectChip({
  icon,
  label,
  activeCount,
  options,
  onToggle,
  onClear,
  emptyLabel,
}: {
  icon: React.ReactNode
  label: string
  activeCount: number
  options: { key: string; label: string; meta?: string; selected: boolean }[]
  onToggle: (key: string) => void
  onClear: () => void
  emptyLabel?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button type="button">
            <ChipTrigger
              icon={icon}
              label={label}
              activeCount={activeCount}
            />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-64 p-1">
        {options.length === 0 ? (
          <div
            className="px-3 py-4 text-[12.5px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {emptyLabel ?? 'No options available.'}
          </div>
        ) : (
          <>
            {options.map((opt) => (
              <DropdownMenuItem
                key={opt.key}
                onClick={(e) => {
                  e.preventDefault?.()
                  onToggle(opt.key)
                }}
                className="text-[13px] cursor-pointer"
              >
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{opt.label}</span>
                  {opt.meta && (
                    <span
                      className="block text-[11.5px] truncate"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {opt.meta}
                    </span>
                  )}
                </span>
                {opt.selected && (
                  <Check
                    size={12}
                    strokeWidth={2}
                    style={{ color: 'var(--text-muted)' }}
                  />
                )}
              </DropdownMenuItem>
            ))}
            {activeCount > 0 && (
              <div
                className="border-t mt-1 pt-1"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <DropdownMenuItem
                  onClick={() => onClear()}
                  className="text-[12.5px] cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Clear selection
                </DropdownMenuItem>
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Single-select filter chip — picks one of a fixed set of preset
 * options (e.g. Created-on lookback ranges). Closes the menu on
 * select so the user gets immediate feedback.
 */
function SingleSelectChip({
  icon,
  label,
  valueLabel,
  isCustomised,
  options,
  onSelect,
}: {
  icon: React.ReactNode
  label: string
  valueLabel: string
  isCustomised: boolean
  options: { key: string; label: string; selected: boolean }[]
  onSelect: (key: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button type="button">
            <ChipTrigger
              icon={icon}
              label={label}
              activeText={isCustomised ? valueLabel : undefined}
            />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-44">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            className="text-[13px] cursor-pointer"
          >
            {opt.label}
            {opt.selected && (
              <Check
                size={12}
                strokeWidth={2}
                className="ml-auto"
                style={{ color: 'var(--text-muted)' }}
              />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Sortable column header. Renders the label + an up/down arrow
 * affordance; the icon's opacity bumps when the column is the
 * active sort and rotates 180° between asc/desc.
 */
function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
}) {
  return (
    <th
      className="px-4 py-3 font-medium cursor-pointer select-none"
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <ArrowUpDown
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

/**
 * Header checkbox supporting an "indeterminate" middle state for
 * "some but not all rows selected". HTML doesn't expose
 * indeterminate via the `checked` attribute — has to be set on the
 * DOM property after mount, so we use a ref callback.
 */
function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean
  indeterminate: boolean
  onChange: () => void
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label="Select all rows"
      ref={(el) => {
        if (el) el.indeterminate = indeterminate
      }}
      className="h-4 w-4 rounded cursor-pointer"
      style={{ accentColor: 'var(--gold)' }}
    />
  )
}

/**
 * Per-row checkbox. Identical to the header version but without
 * the indeterminate prop.
 */
function RowCheckbox({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label="Select row"
      className="h-4 w-4 rounded cursor-pointer"
      style={{ accentColor: 'var(--gold)' }}
    />
  )
}

/**
 * Initials avatar — round, gold-tinted, with the first letters of
 * the name. Used in the Client column so each row reads quickly
 * even with long names that get truncated.
 */
function Avatar({ name }: { name: string }) {
  const initials = useMemo(() => initialsOf(name), [name])
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center h-7 w-7 rounded-full text-[10.5px] font-semibold shrink-0"
      style={{
        background: 'var(--accent-today-tint-strong)',
        color: 'var(--accent-today)',
      }}
    >
      {initials}
    </span>
  )
}

/**
 * Assigned-to column — stacked, overlapping avatar pile showing
 * every firm member assigned to the client (lawyers, partners,
 * associates, paralegals). Renders the first N avatars inline and
 * collapses the remainder into a "+M" counter chip; hovering any
 * avatar surfaces the member's name + role via the `title`
 * attribute, and clicking the stack opens the "manage assignees"
 * affordance (stubbed today, real picker ships next iteration).
 *
 * Visual choices:
 *   - Avatars overlap by half their width so the eye reads them
 *     as a group rather than three separate chips.
 *   - Each avatar has a 2-px ring in the row background colour so
 *     the overlap is legible against any row state (hover, etc.).
 *   - Each role gets a different tint so a senior partner reads
 *     as more prominent than a paralegal at a glance.
 *   - "Unassigned" copy is rendered when the list is empty rather
 *     than an empty cell — keeps the column legible.
 */
const MAX_VISIBLE_AVATARS = 4

function AssignedAvatars({
  assignees,
  onManage,
}: {
  assignees: Assignee[]
  onManage: () => void
}) {
  if (assignees.length === 0) {
    return (
      <button
        type="button"
        onClick={onManage}
        className="text-[12.5px] italic cursor-pointer"
        style={{ color: 'var(--text-muted)' }}
      >
        Unassigned
      </button>
    )
  }
  const visible = assignees.slice(0, MAX_VISIBLE_AVATARS)
  const overflow = assignees.length - visible.length
  return (
    <button
      type="button"
      onClick={onManage}
      aria-label={`Manage assignees (${assignees.length} on file)`}
      className="inline-flex items-center cursor-pointer"
    >
      {visible.map((a, i) => (
        <span
          key={a.id}
          aria-hidden
          title={`${a.name} — ${ROLE_LABEL[a.role]}`}
          className="inline-flex items-center justify-center h-7 w-7 rounded-full text-[10.5px] font-semibold"
          style={{
            // Overlap each subsequent avatar by ~half its width.
            // The first avatar sits flush; the rest get a negative
            // left margin so the eye reads the pile as a group.
            marginLeft: i === 0 ? 0 : -10,
            // A 2-px ring in the row background colour separates
            // overlapping avatars cleanly even on hover (where the
            // row tint shifts to --surface-sunken).
            boxShadow: '0 0 0 2px var(--surface-card)',
            background: roleBg(a.role),
            color: roleFg(a.role),
            // Higher avatars stack above lower ones so the
            // leftmost (usually most senior) reads on top.
            zIndex: MAX_VISIBLE_AVATARS - i,
            position: 'relative',
          }}
        >
          {initialsOf(a.name)}
        </span>
      ))}
      {overflow > 0 && (
        <span
          aria-hidden
          title={overflowTitle(assignees, MAX_VISIBLE_AVATARS)}
          className="inline-flex items-center justify-center h-7 px-2 rounded-full text-[11px] font-semibold tabular-nums"
          style={{
            marginLeft: -10,
            boxShadow: '0 0 0 2px var(--surface-card)',
            background: 'var(--surface-sunken)',
            color: 'var(--text-secondary)',
            position: 'relative',
            zIndex: 0,
          }}
        >
          +{overflow}
        </span>
      )}
    </button>
  )
}

/**
 * Background fill for an assignee chip, keyed by role. Senior
 * partners get the gold tint to read as the "most prominent"
 * assignee; lawyers get a navy tint; associates / paralegals get
 * progressively cooler / quieter fills so the seniority hierarchy
 * is legible at a glance.
 */
function roleBg(role: Assignee['role']): string {
  if (role === 'senior_partner') return 'var(--accent-today-tint-strong)'
  if (role === 'lawyer') return 'var(--navy-tint, #E7ECF3)'
  if (role === 'associate') return 'var(--surface-sunken)'
  if (role === 'paralegal') return 'var(--border-soft)'
  return 'var(--surface-sunken)'
}

function roleFg(role: Assignee['role']): string {
  if (role === 'senior_partner') return 'var(--accent-today)'
  if (role === 'lawyer') return 'var(--navy, #0D1B2A)'
  return 'var(--text-secondary)'
}

/**
 * Tooltip text for the "+N" overflow chip — lists everyone hidden
 * behind the overflow so the user can read who else is on file
 * without clicking through to the manage-assignees screen.
 */
function overflowTitle(assignees: Assignee[], visibleCount: number): string {
  return assignees
    .slice(visibleCount)
    .map((a) => `${a.name} (${ROLE_LABEL[a.role]})`)
    .join('\n')
}

/**
 * Row action menu — three-dot trigger that opens a popover with
 * the per-row actions. Stops click bubbling so opening the menu
 * doesn't ripple a row-level click handler (we don't have one
 * yet but defensiveness here is cheap).
 */
function RowMenu({
  clientName,
  onView,
  onEdit,
  onAssignCase,
  onStartTimer,
  onDelete,
}: {
  clientName: string
  onView: () => void
  onEdit: () => void
  onAssignCase: () => void
  onStartTimer: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Actions for ${clientName}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >
            <MoreHorizontal size={15} strokeWidth={2} />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={onView}
          className="text-[13px] cursor-pointer"
        >
          <Eye size={13} strokeWidth={1.75} />
          View
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onEdit}
          className="text-[13px] cursor-pointer"
        >
          <Edit3 size={13} strokeWidth={1.75} />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onAssignCase}
          className="text-[13px] cursor-pointer"
        >
          <UserIcon size={13} strokeWidth={1.75} />
          Assign case
        </DropdownMenuItem>
        {/*
         * Start a billable-hour timer for this client. Opens the
         * StartTimerDialog (mounted at the page level), which
         * walks through the rate gate if needed before starting.
         */}
        <DropdownMenuItem
          onClick={onStartTimer}
          className="text-[13px] cursor-pointer"
        >
          <Clock size={13} strokeWidth={1.75} />
          Time working hours
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="text-[13px] cursor-pointer"
          style={{ color: 'var(--accent-danger)' }}
        >
          <Trash2 size={13} strokeWidth={1.75} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Reusable initials helper. Splits on whitespace, takes the first
 * letter of up to two words, uppercases. Returns "?" for empty
 * input so the avatar never renders blank.
 */
function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  )
}

/**
 * Error fallback rendered when the GraphQL fetch errors out and
 * the dev-bypass short-circuit isn't taking over.
 */
function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="rounded-2xl border px-10 py-12 text-center"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <p
        className="text-[14px] font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        Unable to load clients
      </p>
      <p
        className="mt-1 text-[12.5px]"
        style={{ color: 'var(--text-muted)' }}
      >
        Please check your connection and try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
        Retry
      </Button>
    </div>
  )
}

// ── View dialog ────────────────────────────────────────────────────────

/**
 * Read-only snapshot of a client's record. Opens from the row menu's
 * "View" action. Shows contact info + primary-case status + the full
 * assignee roster so the user can review the client without leaving
 * the list view. An "Edit" button at the bottom drops into the
 * existing ClientForm modal for changes.
 */
function ClientDetailsDialog({
  client,
  primaryCase,
  assignees,
  onOpenChange,
  onEdit,
}: {
  client: Client | null
  primaryCase: Case | undefined
  assignees: Assignee[]
  onOpenChange: (open: boolean) => void
  onEdit: () => void
}) {
  return (
    <Dialog open={!!client} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            {client?.full_name ?? 'Client'}
          </DialogTitle>
        </DialogHeader>

        {client && (
          <div className="grid gap-4 py-2 text-[13px]">
            <DetailRow
              icon={<Phone size={13} strokeWidth={1.75} />}
              label="Phone"
              value={client.phone || '—'}
            />
            <DetailRow
              icon={<Mail size={13} strokeWidth={1.75} />}
              label="Email"
              value={client.email || '—'}
            />
            <DetailRow
              icon={<UserIcon size={13} strokeWidth={1.75} />}
              label="Client ID"
              value={
                <span
                  className="font-mono text-[12px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {client.client_code ?? '—'}
                </span>
              }
            />
            <DetailRow
              icon={<Filter size={13} strokeWidth={1.75} />}
              label="Client status"
              value={<StatusBadge status={client.status} />}
            />
            <DetailRow
              icon={<Briefcase size={13} strokeWidth={1.75} />}
              label="Primary case"
              value={
                primaryCase ? (
                  <span className="flex flex-col gap-1">
                    <span style={{ color: 'var(--text-primary)' }}>
                      {primaryCase.title}
                    </span>
                    <StatusBadge status={primaryCase.status} />
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    No cases on file
                  </span>
                )
              }
            />
            <DetailRow
              icon={<Users size={13} strokeWidth={1.75} />}
              label={`Assignees (${assignees.length})`}
              value={
                assignees.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Unassigned
                  </span>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {assignees.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between"
                      >
                        <span style={{ color: 'var(--text-primary)' }}>
                          {a.name}
                        </span>
                        <span
                          className="text-[11.5px]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {ROLE_LABEL[a.role]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )
              }
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={onEdit}
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
            }}
          >
            <Edit3 size={13} strokeWidth={1.75} />
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Tiny label/value row helper used inside the View dialog. Keeps
 * the layout consistent (icon + label column with fixed width + value
 * column that flexes).
 */
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="inline-flex items-center gap-1.5 w-28 shrink-0 pt-0.5"
        style={{ color: 'var(--text-muted)' }}
      >
        {icon}
        {label}
      </span>
      <span className="flex-1 min-w-0" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  )
}

// ── Manage assignees dialog ────────────────────────────────────────────

/**
 * Multi-select dialog for adding / removing firm members from a
 * client's roster. Persists into the page-local override map so the
 * table reflects the new pile immediately — backend mutation slots
 * in here when integrations release.
 *
 * Selection state is held in a local `useState` initialised from the
 * `current` prop each time the dialog opens; that way cancelling
 * discards changes naturally without resetting on every render.
 */
function ManageAssigneesDialog({
  client,
  allMembers,
  current,
  onOpenChange,
  onSave,
}: {
  client: Client | null
  allMembers: Assignee[]
  current: Assignee[]
  onOpenChange: (open: boolean) => void
  onSave: (next: Assignee[]) => void
}) {
  const open = !!client
  // Track the per-dialog draft selection. Key the state with the
  // client id so the draft resets every time we open a different
  // client's dialog without React seeing the same state instance.
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set())
  const dialogKey = client?.id ?? '__none__'

  // Initialise / reset the draft whenever the dialog opens for a
  // (possibly different) client.
  useMemo(() => {
    if (open) setDraftIds(new Set(current.map((a) => a.id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogKey, open])

  const toggle = (id: string) =>
    setDraftIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleSave = () => {
    // Preserve allMembers order so the saved list is stable across
    // re-renders (the table renders avatars in this order).
    const next = allMembers.filter((m) => draftIds.has(m.id))
    onSave(next)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            Manage assignees
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-2 py-1">
          <p
            className="text-[12.5px]"
            style={{ color: 'var(--text-muted)' }}
          >
            Pick the firm members who should be assigned to{' '}
            <span style={{ color: 'var(--text-primary)' }}>
              {client?.full_name}
            </span>
            . Selected members appear in the row's avatar stack.
          </p>

          <div
            className="max-h-72 overflow-y-auto rounded-md border"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            {allMembers.length === 0 ? (
              <div
                className="px-3 py-4 text-[12.5px]"
                style={{ color: 'var(--text-muted)' }}
              >
                No firm members on file yet.
              </div>
            ) : (
              allMembers.map((m) => {
                const checked = draftIds.has(m.id)
                return (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                    style={{
                      background: checked
                        ? 'var(--accent-today-tint)'
                        : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(m.id)}
                      className="h-4 w-4 rounded cursor-pointer"
                      style={{ accentColor: 'var(--gold)' }}
                    />
                    <span className="flex-1 min-w-0">
                      <span
                        className="block text-[13px] truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {m.name}
                      </span>
                      <span
                        className="block text-[11.5px] truncate"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {ROLE_LABEL[m.role]}
                      </span>
                    </span>
                  </label>
                )
              })
            )}
          </div>

          <p
            className="text-[11.5px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {draftIds.size} member{draftIds.size === 1 ? '' : 's'} selected.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
            }}
          >
            Save assignees
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Suppress unused-import warnings for icons reserved for the next
// iteration (Phone / Mail / Check go on the Edit-columns dialog,
// etc.). Cheaper than churning the import block.
void Phone
void Mail
void Check
