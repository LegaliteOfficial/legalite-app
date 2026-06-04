'use client'

/**
 * Cases list view
 * ---------------
 * industry-standard table with status pills, column picker, search, pagination,
 * CSV export, and an expand-rows toggle. The "Stages" tab, "Manage tags",
 * "Case templates", and "Filters" controls are stubbed — they show toasts
 * pointing at the upcoming subsequent screens we'll spec from screenshots.
 *
 * Data shape: see types/index.ts `Case` and hooks/use-cases.ts. The hook
 * translates the legacy `matter_type` column to `case_type` until the
 * backend migration (20260523_case_workflow_fields) and its codegen catch up.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ChevronUp,
  Columns3,
  Download,
  FileText,
  Filter,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { CaseForm } from '@/components/shared/CaseForm'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { PriorityButton } from '@/components/shared/PriorityButton'
import { useCases } from '@/hooks/use-cases'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { PRACTICE_AREAS } from '@/lib/case-options'
import { TagSettingsDialog } from '@/components/shared/TagSettingsDialog'
import type { Case, CaseStatus } from '@/types'

// ── Column registry ─────────────────────────────────────────────────────
// Lives outside the component so its identity is stable across renders.
// `defaultVisible` mirrors what's on the the standard pattern screenshot — the user can
// toggle anything via the Columns ▾ dropdown.
type ColumnId =
  | 'client'
  | 'responsible'
  | 'originating'
  | 'practice_area'
  | 'case_stage'
  | 'open_date'
  | 'close_date'
  | 'pending_date'
  | 'notifications'
  | 'title'
  | 'case_code'
  | 'court'
  | 'suit_number'
  | 'next_date'
  | 'status'

interface ColumnDef {
  id: ColumnId
  label: string
  defaultVisible: boolean
  // Minimum width so the header stays on one line and the whole table can
  // overflow horizontally instead of stacking heading text. Matches the reference
  // behaviour where columns truncate with ellipsis and you scroll left/right.
  minWidth: number
  align?: 'left' | 'right'
  // Whether the column header gets a clickable sort affordance. Columns
  // backed by computed/derived values (Notifications) opt out so we don't
  // pretend they're sortable when they're really just badges.
  sortable?: boolean
  // Comparable value for in-memory sorts. Falls back to the csv getter when
  // omitted. Use this for dates (so they sort by ISO timestamp, not by the
  // user-facing "12 Feb 2026" string).
  sortValue?: (row: Case) => string | number | null
  render: (row: Case, expanded: boolean) => React.ReactNode
  // What value to dump into the CSV export. Defaults to stringifying render
  // when omitted; supply a plain-text getter for columns whose render is JSX.
  csv?: (row: Case) => string
}

type SortDir = 'asc' | 'desc'

const STATUS_FILTERS = ['All', 'Open', 'Pending', 'Closed'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const PAGE_SIZES = [25, 50, 100] as const

/**
 * Filter state for the side drawer. Mirrors the reference panel field-for-field.
 * Empty string / undefined means "no constraint". Fields whose backing data
 * we don't have yet (responsible_staff, tags, admin_view, billable_status,
 * permissions, blocked_users, status_date) render in the UI for fidelity
 * but pass through to filtered() as no-ops until the backend ships those
 * columns. See `applyDrawerFilters` for which fields actually filter today.
 */
interface CaseFilters {
  client?: string
  responsible_lawyer?: string
  originating_lawyer?: string
  responsible_staff?: string
  notifications?: string
  tags?: string
  admin_view?: string
  billable_status?: string
  last_activity_from?: string
  last_activity_to?: string
  permissions?: string
  practice_area?: string
  blocked_users?: string
  status_date_from?: string
  status_date_to?: string
}

const EMPTY_FILTERS: CaseFilters = {}

// ── Filter dropdown option lists ────────────────────────────────────────
// Static lists for fields whose options come from configuration rather
// than from the rows themselves. Each list mirrors the reference defaults with
// "matter" → "case" terminology applied per the LegaLite rename.

const ADMIN_VIEW_OPTIONS = [
  'Cases I have full access to',
  'Cases I am restricted from',
] as const

const BILLABLE_STATUS_OPTIONS = ['Billable case', 'Non-billable case'] as const

// Practice areas list is imported from lib/case-options.ts so it stays
// aligned with the new-case form and the edit dialog.

function countActiveFilters(f: CaseFilters): number {
  return Object.values(f).filter((v) => v != null && v !== '').length
}

/**
 * Narrow the case list using the drawer's filter state. Only fields backed
 * by columns we already have (client, lawyers, practice_area, last activity
 * date) actually constrain results today. Other fields (responsible_staff,
 * tags, admin_view, billable_status, permissions, blocked_users,
 * status_date_*) are silently passed through — they'll start filtering once
 * the matching schema fields land.
 */
function applyDrawerFilters(rows: Case[], f: CaseFilters): Case[] {
  return rows.filter((row) => {
    if (f.client && row.client_name !== f.client) return false
    if (f.responsible_lawyer && row.assigned_lawyer !== f.responsible_lawyer) return false
    if (f.originating_lawyer && row.originating_lawyer !== f.originating_lawyer) return false
    if (f.practice_area && row.case_type !== f.practice_area) return false
    if (f.last_activity_from) {
      const t = new Date(row.updated_at).getTime()
      const from = new Date(f.last_activity_from).getTime()
      if (Number.isFinite(from) && t < from) return false
    }
    if (f.last_activity_to) {
      const t = new Date(row.updated_at).getTime()
      // end-of-day for the "to" bound so a single day picks up rows
      // updated any time that day.
      const to = new Date(f.last_activity_to).getTime() + 24 * 60 * 60 * 1000 - 1
      if (Number.isFinite(to) && t > to) return false
    }
    return true
  })
}

const STORAGE_KEY_COLUMNS = 'll:cases:visible-cols'

const dash = (
  <span style={{ color: 'var(--text-subtle)' }}>—</span>
)

function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'client',
    label: 'Client(s)',
    defaultVisible: true,
    minWidth: 180,
    sortable: true,
    sortValue: (row) => row.client_name ?? '',
    render: (row) => (
      <span
        className="text-[13px] font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {row.client_name || dash}
      </span>
    ),
    csv: (row) => row.client_name ?? '',
  },
  {
    id: 'title',
    label: 'Case title',
    defaultVisible: true,
    minWidth: 240,
    sortable: true,
    sortValue: (row) => row.title,
    render: (row) => (
      <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
        {row.title}
      </span>
    ),
    csv: (row) => row.title,
  },
  {
    id: 'case_code',
    label: 'Case ID',
    defaultVisible: false,
    minWidth: 120,
    sortable: true,
    sortValue: (row) => row.case_code ?? '',
    render: (row) => (
      <span
        className="font-mono text-[12px] tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {row.case_code ?? dash}
      </span>
    ),
    csv: (row) => row.case_code ?? '',
  },
  {
    id: 'responsible',
    label: 'Responsible lawyer',
    defaultVisible: true,
    minWidth: 180,
    sortable: true,
    sortValue: (row) => row.assigned_lawyer ?? '',
    render: (row) => (
      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {row.assigned_lawyer || dash}
      </span>
    ),
    csv: (row) => row.assigned_lawyer ?? '',
  },
  {
    id: 'originating',
    label: 'Originating lawyer',
    defaultVisible: true,
    minWidth: 180,
    sortable: true,
    sortValue: (row) => row.originating_lawyer ?? '',
    render: (row) => (
      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {row.originating_lawyer || dash}
      </span>
    ),
    csv: (row) => row.originating_lawyer ?? '',
  },
  {
    id: 'practice_area',
    label: 'Practice area',
    defaultVisible: true,
    minWidth: 140,
    sortable: true,
    sortValue: (row) => row.case_type ?? '',
    render: (row) =>
      row.case_type ? (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium"
          style={{
            background: 'var(--surface-sunken)',
            color: 'var(--text-secondary)',
          }}
        >
          {row.case_type}
        </span>
      ) : (
        dash
      ),
    csv: (row) => row.case_type ?? '',
  },
  {
    id: 'case_stage',
    label: 'Case stage',
    defaultVisible: true,
    minWidth: 140,
    sortable: true,
    sortValue: (row) => row.case_stage ?? '',
    render: (row) => (
      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {row.case_stage || dash}
      </span>
    ),
    csv: (row) => row.case_stage ?? '',
  },
  {
    id: 'open_date',
    label: 'Open date',
    defaultVisible: true,
    minWidth: 130,
    sortable: true,
    // Sort by ISO timestamp, not by the user-facing "12 Feb 2026" string.
    // Otherwise "01 Jan" < "12 Feb" alphabetically — accurate by accident,
    // but breaks once we cross year boundaries.
    sortValue: (row) => (row.date_opened ? new Date(row.date_opened).getTime() : null),
    render: (row) => (
      <span
        className="text-[12.5px] tabular-nums"
        style={{ color: 'var(--text-secondary)' }}
      >
        {formatDate(row.date_opened) || dash}
      </span>
    ),
    csv: (row) => formatDate(row.date_opened),
  },
  {
    id: 'close_date',
    label: 'Close date',
    defaultVisible: true,
    minWidth: 130,
    sortable: true,
    sortValue: (row) => (row.closed_at ? new Date(row.closed_at).getTime() : null),
    render: (row) => (
      <span
        className="text-[12.5px] tabular-nums"
        style={{ color: 'var(--text-secondary)' }}
      >
        {formatDate(row.closed_at) || dash}
      </span>
    ),
    csv: (row) => formatDate(row.closed_at),
  },
  {
    id: 'pending_date',
    label: 'Pending date',
    defaultVisible: true,
    minWidth: 130,
    sortable: true,
    sortValue: (row) => (row.pending_at ? new Date(row.pending_at).getTime() : null),
    render: (row) => (
      <span
        className="text-[12.5px] tabular-nums"
        style={{ color: 'var(--text-secondary)' }}
      >
        {formatDate(row.pending_at) || dash}
      </span>
    ),
    csv: (row) => formatDate(row.pending_at),
  },
  {
    id: 'notifications',
    label: 'Case notifications',
    defaultVisible: true,
    minWidth: 110,
    align: 'right',
    // Notifications are a derived/computed count — sorting them invites
    // confusion ("did I sort by recency or by count?"). Skip the affordance.
    sortable: false,
    render: (row) => {
      const count = row.notification_count ?? 0
      if (count === 0) {
        return (
          <span className="inline-flex items-center justify-end" style={{ color: 'var(--text-subtle)' }}>
            <Bell size={13} strokeWidth={1.75} />
          </span>
        )
      }
      return (
        <span
          className="inline-flex items-center gap-1.5 justify-end font-medium"
          style={{ color: 'var(--gold-dark)' }}
        >
          <Bell size={13} strokeWidth={1.75} />
          <span className="text-[12px] tabular-nums">{count}</span>
        </span>
      )
    },
    csv: (row) => String(row.notification_count ?? 0),
  },
  {
    id: 'court',
    label: 'Court',
    defaultVisible: false,
    minWidth: 200,
    sortable: true,
    sortValue: (row) => row.court ?? '',
    render: (row) => (
      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {row.court || dash}
      </span>
    ),
    csv: (row) => row.court ?? '',
  },
  {
    id: 'suit_number',
    label: 'Suit no.',
    defaultVisible: false,
    minWidth: 140,
    sortable: true,
    sortValue: (row) => row.suit_number ?? '',
    render: (row) => (
      <span
        className="font-mono text-[12px] tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {row.suit_number || dash}
      </span>
    ),
    csv: (row) => row.suit_number ?? '',
  },
  {
    id: 'next_date',
    label: 'Next court date',
    defaultVisible: false,
    minWidth: 150,
    sortable: true,
    sortValue: (row) => (row.next_court_date ? new Date(row.next_court_date).getTime() : null),
    render: (row) => {
      if (!row.next_court_date) return dash
      const d = new Date(row.next_court_date)
      const isUpcoming =
        d.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 &&
        d.getTime() > Date.now()
      return (
        <span
          className="inline-flex items-center gap-1.5 text-[12.5px] tabular-nums"
          style={{ color: 'var(--text-secondary)' }}
        >
          {isUpcoming && (
            <span
              aria-hidden
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#C0392B' }}
            />
          )}
          {formatDate(row.next_court_date)}
        </span>
      )
    },
    csv: (row) => formatDate(row.next_court_date),
  },
  {
    id: 'status',
    label: 'Status',
    defaultVisible: true,
    minWidth: 110,
    sortable: true,
    sortValue: (row) => row.status ?? 'Open',
    render: (row) => <StatusBadge status={row.status ?? 'Open'} />,
    csv: (row) => row.status ?? 'Open',
  },
]

function loadVisibleColumns(): Set<ColumnId> {
  if (typeof window === 'undefined')
    return new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id))
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_COLUMNS)
    if (!raw) return new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id))
    const parsed = JSON.parse(raw) as ColumnId[]
    // Filter out any persisted IDs that no longer exist in COLUMNS — keeps
    // the picker from holding onto stale entries after schema changes.
    const known = new Set(COLUMNS.map((c) => c.id))
    return new Set(parsed.filter((id): id is ColumnId => known.has(id as ColumnId)))
  } catch {
    return new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id))
  }
}

function exportToCsv(rows: Case[], visibleColumnIds: ColumnId[]) {
  const visibleColumns = COLUMNS.filter((c) => visibleColumnIds.includes(c.id))
  const header = visibleColumns.map((c) => csvEscape(c.label)).join(',')
  const body = rows
    .map((row) =>
      visibleColumns
        .map((c) => csvEscape(c.csv?.(row) ?? ''))
        .join(','),
    )
    .join('\n')
  const csv = `${header}\n${body}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `cases-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export default function CasesPage() {
  const { data: cases, isLoading, error } = useCases()
  const { openModal } = useUIStore()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'cases' | 'stages'>('cases')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Open')
  const [search, setSearch] = useState('')
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(
    () => new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )
  const [hydrated, setHydrated] = useState(false)
  const [expandRows, setExpandRows] = useState(false)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(25)
  const [page, setPage] = useState(0)
  // Sort: null = use insertion order. Cycle on click is none → asc → desc → none.
  const [sortBy, setSortBy] = useState<ColumnId | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  // Filter drawer: separate from the simple status pills + search above.
  // `applied` is what the table filters by; `draft` lives inside the drawer
  // until the user clicks Apply (so partial edits don't immediately
  // re-filter the table on every keystroke).
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<CaseFilters>(EMPTY_FILTERS)
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false)

  // Hydrate column visibility from localStorage on mount. We split this from
  // the initial useState to avoid a server/client divergence: SSR renders
  // with the defaults, then this effect aligns to whatever the user
  // previously toggled.
  useEffect(() => {
    setVisibleColumns(loadVisibleColumns())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(
        STORAGE_KEY_COLUMNS,
        JSON.stringify(Array.from(visibleColumns)),
      )
    } catch {
      /* localStorage full or disabled — non-critical */
    }
  }, [visibleColumns, hydrated])

  // Reset to page 0 whenever the working set changes — otherwise switching
  // filters can leave the user on a non-existent page.
  useEffect(() => {
    setPage(0)
  }, [statusFilter, search, pageSize, filters])

  const allCases = useMemo(() => cases ?? [], [cases])

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      All: allCases.length,
      Open: 0,
      Pending: 0,
      Closed: 0,
    }
    for (const c of allCases) {
      const s = (c.status ?? 'Open') as CaseStatus
      counts[s] = (counts[s] ?? 0) + 1
    }
    return counts
  }, [allCases])

  const filtered = useMemo(() => {
    const byStatus =
      statusFilter === 'All'
        ? allCases
        : allCases.filter((c) => (c.status ?? 'Open') === statusFilter)
    const q = search.trim().toLowerCase()
    const bySearch = !q
      ? byStatus
      : byStatus.filter(
          (c) =>
            c.title?.toLowerCase().includes(q) ||
            c.client_name?.toLowerCase().includes(q) ||
            c.case_code?.toLowerCase().includes(q) ||
            c.suit_number?.toLowerCase().includes(q) ||
            c.court?.toLowerCase().includes(q) ||
            c.assigned_lawyer?.toLowerCase().includes(q) ||
            c.originating_lawyer?.toLowerCase().includes(q) ||
            c.case_type?.toLowerCase().includes(q) ||
            c.case_stage?.toLowerCase().includes(q),
        )
    return applyDrawerFilters(bySearch, filters)
  }, [allCases, statusFilter, search, filters])

  // Apply sort after filtering, before pagination, so the user always sees
  // sorted results across the full filtered set rather than per-page.
  const sorted = useMemo(() => {
    if (!sortBy) return filtered
    const col = COLUMNS.find((c) => c.id === sortBy)
    if (!col?.sortValue) return filtered
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      // Nulls always sort last regardless of direction — keeps empty
      // cells out of the way when the user scans the top of the table.
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [filtered, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * pageSize
  const end = Math.min(start + pageSize, sorted.length)
  const pageRows = sorted.slice(start, end)

  function handleSort(id: ColumnId) {
    // Tri-state click cycle on the same column: asc → desc → none.
    // Switching columns always starts fresh in asc.
    if (sortBy !== id) {
      setSortBy(id)
      setSortDir('asc')
      return
    }
    if (sortDir === 'asc') {
      setSortDir('desc')
      return
    }
    setSortBy(null)
    setSortDir('asc')
  }

  const orderedVisibleColumns = useMemo(
    () => COLUMNS.filter((c) => visibleColumns.has(c.id)),
    [visibleColumns],
  )

  const hasFiltersActive = statusFilter !== 'All' || search.trim().length > 0

  if (isLoading) return <PageSkeleton />
  if (error) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5">
          <ErrorPanel onRetry={() => window.location.reload()} />
        </div>
      </div>
    )
  }

  return (
    // Outer page chrome is a flex column that fills the dashboard <main>.
    // The table card grows to fill remaining height (flex-1 min-h-0) so
    // empty space below the rows is part of the card, not the gradient
    // background. Matches the standard pattern.
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-5 flex flex-col flex-1 min-h-0">
        {/* Top row: tabs (Cases / Stages) + action buttons */}
        <div className="flex items-end justify-between border-b" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="flex gap-1">
            <TabButton
              active={activeTab === 'cases'}
              onClick={() => setActiveTab('cases')}
            >
              Cases
            </TabButton>
            <TabButton
              active={activeTab === 'stages'}
              onClick={() => {
                setActiveTab('stages')
                toast.info('Stages admin is coming next.')
              }}
            >
              Stages
            </TabButton>
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTagsDialogOpen(true)}
            >
              <Tag size={13} strokeWidth={1.75} />
              Manage tags
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info('Case templates is coming next.')
              }
            >
              <FileText size={13} strokeWidth={1.75} />
              Case templates
            </Button>
            <Button
              onClick={() => router.push('/cases/new')}
              size="sm"
              className="rounded-lg"
            >
              <Plus size={13} strokeWidth={2} />
              New case
            </Button>
          </div>
        </div>

        {activeTab === 'stages' ? (
          <StagesPlaceholder />
        ) : (
          <>
            {/* Status pills + search + columns/filters/expand/export */}
            <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                {STATUS_FILTERS.map((s) => {
                  const isActive = statusFilter === s
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors"
                      style={{
                        background: isActive ? 'var(--surface-sunken)' : 'transparent',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background = 'var(--surface-overlay)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      {s}
                      <span
                        className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 rounded-full text-[10.5px] font-medium tabular-nums"
                        style={{
                          background: isActive
                            ? 'var(--surface-card)'
                            : 'var(--surface-sunken)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {statusCounts[s] ?? 0}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search
                    size={13}
                    strokeWidth={1.75}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-subtle)' }}
                  />
                  <Input
                    placeholder="Search cases…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-[13px] rounded-lg"
                    style={{
                      borderColor: 'var(--border-default)',
                      background: 'var(--surface-card)',
                    }}
                  />
                </div>

                <ColumnsPicker
                  visible={visibleColumns}
                  onChange={setVisibleColumns}
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltersOpen(true)}
                >
                  <Filter size={13} strokeWidth={1.75} />
                  Filters
                  {countActiveFilters(filters) > 0 && (
                    <span
                      className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 rounded-full text-[10.5px] font-semibold tabular-nums"
                      style={{
                        background: 'var(--gold)',
                        color: 'var(--navy)',
                      }}
                    >
                      {countActiveFilters(filters)}
                    </span>
                  )}
                  <ChevronDown size={12} strokeWidth={1.75} />
                </Button>
              </div>
            </div>

            {/* Table card grows to fill remaining vertical space. Inner
                scroll container takes flex-1, so the header row is sticky
                at the top and the pagination footer is pinned at the
                bottom — only the rows scroll. min-h-0 is required on
                every flex-column ancestor for the inner overflow to
                actually clip (Flexbox quirk). */}
            <div
              className="mt-4 rounded-2xl border overflow-hidden flex flex-col flex-1 min-h-0"
              style={{
                background: 'var(--surface-card)',
                borderColor: 'var(--border-soft)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              {sorted.length === 0 ? (
                <EmptyState
                  hasFilters={hasFiltersActive}
                  onClearFilters={() => {
                    setSearch('')
                    setStatusFilter('All')
                  }}
                />
              ) : (
                // The scroll container takes the remaining vertical space
                // inside the card; overflow-y-auto scrolls rows under a
                // sticky thead, overflow-x-auto handles the horizontal
                // overflow of wide column sets.
                <div className="overflow-auto flex-1 min-h-0">
                  <table className="w-full" style={{ tableLayout: 'fixed' }}>
                    <thead
                      className="sticky top-0 z-10"
                      style={{ background: 'var(--surface-sunken)' }}
                    >
                      <tr>
                        {orderedVisibleColumns.map((col) => (
                          <th
                            key={col.id}
                            className="px-3 py-2.5 text-[11.5px] font-semibold whitespace-nowrap"
                            style={{
                              color: 'var(--text-muted)',
                              minWidth: col.minWidth,
                              width: col.minWidth,
                              textAlign: col.align ?? 'left',
                            }}
                          >
                            <SortableHeader
                              col={col}
                              active={sortBy === col.id}
                              dir={sortDir}
                              onSort={() => handleSort(col.id)}
                            />
                          </th>
                        ))}
                        <th
                          className="px-3 py-2.5 text-right text-[11.5px] font-semibold"
                          style={{
                            color: 'var(--text-muted)',
                            minWidth: 96,
                            width: 96,
                            // Sticky right action column so row buttons stay
                            // reachable when the table is scrolled
                            // horizontally. Pairs with the sticky thead
                            // above for two-axis stickiness in the corner.
                            position: 'sticky',
                            right: 0,
                            background: 'var(--surface-sunken)',
                          }}
                        >
                          {/* Row actions header — intentionally blank */}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row) => (
                        <tr
                          key={row.id}
                          // Clicking anywhere on the row navigates to
                          // the case detail page. Inline action cells
                          // (Actions menu, status pill, etc.) must
                          // stop propagation so they don't drill in
                          // accidentally.
                          onClick={() => router.push(`/cases/${row.id}`)}
                          className="border-t group cursor-pointer"
                          style={{ borderColor: 'var(--border-soft)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--surface-overlay)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          {orderedVisibleColumns.map((col) => (
                            <td
                              key={col.id}
                              // Cells stay on one line and truncate with
                              // ellipsis when the value overflows the
                              // column min-width — matches the standard pattern. Long
                              // titles surface in full on row hover via
                              // the title attribute below.
                              className={`px-3 ${expandRows ? 'py-3.5' : 'py-2'} overflow-hidden text-ellipsis whitespace-nowrap`}
                              style={{
                                textAlign: col.align ?? 'left',
                                maxWidth: col.minWidth,
                              }}
                              title={col.csv?.(row)}
                            >
                              {col.render(row, expandRows)}
                            </td>
                          ))}
                          <td
                            className={`px-3 ${expandRows ? 'py-3.5' : 'py-2'} text-right`}
                            style={{
                              position: 'sticky',
                              right: 0,
                              // Inherit row background on hover so the
                              // sticky cell doesn't show stale color when
                              // the rest of the row repaints.
                              background: 'inherit',
                            }}
                          >
                            <div
                              className="flex gap-0.5 justify-end items-center"
                              // Stop propagation so clicking any
                              // action doesn't ALSO drill into the
                              // detail page via the row's click
                              // handler.
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Priority star is always visible —
                                  doubles as an at-a-glance indicator
                                  of which cases are flagged. */}
                              <PriorityButton
                                entityType="case"
                                entityId={row.id}
                                label={row.title}
                                metadata={{
                                  next_court_date: row.next_court_date ?? null,
                                  case_code: row.case_code ?? null,
                                }}
                              />
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() =>
                                    openModal({ type: 'editCase', id: row.id })
                                  }
                                  aria-label="Edit case"
                                >
                                  <Pencil size={13} style={{ color: 'var(--text-muted)' }} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() =>
                                    openModal({
                                      type: 'confirmDelete',
                                      entity: 'case',
                                      id: row.id,
                                      name: row.title,
                                    })
                                  }
                                  aria-label="Delete case"
                                >
                                  <Trash2 size={13} style={{ color: 'var(--text-muted)' }} />
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer / pagination */}
              <div
                className="flex items-center justify-between px-3 py-2.5 border-t"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <div className="flex items-center gap-1">
                  <IconNav
                    onClick={() => setPage(0)}
                    disabled={safePage === 0}
                    aria-label="First page"
                  >
                    <ChevronsLeft size={14} strokeWidth={1.75} />
                  </IconNav>
                  <IconNav
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={safePage === 0}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} strokeWidth={1.75} />
                  </IconNav>
                  <IconNav
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={safePage >= totalPages - 1}
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} strokeWidth={1.75} />
                  </IconNav>
                  <IconNav
                    onClick={() => setPage(totalPages - 1)}
                    disabled={safePage >= totalPages - 1}
                    aria-label="Last page"
                  >
                    <ChevronsRight size={14} strokeWidth={1.75} />
                  </IconNav>
                  <span
                    className="ml-2 text-[12px] tabular-nums"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {sorted.length === 0
                      ? '0–0 of 0'
                      : `${start + 1}–${end} of ${sorted.length}`}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    <PageSizeDropdown
                      value={pageSize}
                      onChange={(v) => setPageSize(v)}
                    />
                  </label>

                  <ExpandRowsToggle
                    expanded={expandRows}
                    onChange={setExpandRows}
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sorted.length === 0}
                    onClick={() => {
                      exportToCsv(sorted, Array.from(visibleColumns))
                      toast.success(`Exported ${sorted.length} case${sorted.length === 1 ? '' : 's'} to CSV.`)
                    }}
                  >
                    <Download size={13} strokeWidth={1.75} />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        <CaseForm />
        <DeleteDialog />
        <FilterDrawer
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          value={filters}
          onApply={setFilters}
          cases={allCases}
        />
        <TagSettingsDialog
          open={tagsDialogOpen}
          onOpenChange={setTagsDialogOpen}
        />
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────

/**
 * Renders a column header with a tri-state sort affordance — the
 * up/down chevron pair when inactive, a single up or down chevron when
 * this column drives the sort. Non-sortable columns just render the
 * label and skip the button (so screen readers / keyboard users don't
 * land on a control that does nothing).
 */
function SortableHeader({
  col,
  active,
  dir,
  onSort,
}: {
  col: ColumnDef
  active: boolean
  dir: SortDir
  onSort: () => void
}) {
  const justify =
    col.align === 'right' ? 'justify-end' : 'justify-start'
  if (!col.sortable) {
    return (
      <span
        className={`inline-flex items-center gap-1 ${justify} w-full`}
        style={{ textAlign: col.align ?? 'left' }}
      >
        <span className="truncate">{col.label}</span>
      </span>
    )
  }
  const Icon = active
    ? dir === 'asc'
      ? ChevronUp
      : ChevronDown
    : ChevronsUpDown
  return (
    <button
      type="button"
      onClick={onSort}
      className={`inline-flex items-center gap-1.5 ${justify} w-full transition-colors cursor-pointer`}
      style={{
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = active
          ? 'var(--text-primary)'
          : 'var(--text-muted)'
      }}
      aria-label={`Sort by ${col.label}${active ? ` (${dir})` : ''}`}
    >
      <span className="truncate">{col.label}</span>
      <Icon
        size={12}
        strokeWidth={2}
        style={{
          opacity: active ? 1 : 0.5,
          flexShrink: 0,
        }}
      />
    </button>
  )
}

function TabButton({
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
      onClick={onClick}
      className="relative px-4 py-2.5 text-[14px] font-medium transition-colors"
      style={{
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      }}
    >
      {children}
      {active && (
        <span
          className="absolute left-3 right-3 -bottom-px h-[2px] rounded-t"
          style={{ background: 'var(--gold)' }}
        />
      )}
    </button>
  )
}

function ColumnsPicker({
  visible,
  onChange,
}: {
  visible: Set<ColumnId>
  onChange: (next: Set<ColumnId>) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        // Base UI Menu.Trigger always renders its own <button>. We use the
        // `render` prop (NOT `asChild` — that's a Radix-ism) so it
        // composes with our Button rather than wrapping it.
        render={
          <Button variant="outline" size="sm">
            <Columns3 size={13} strokeWidth={1.75} />
            Columns
            <ChevronDown size={12} strokeWidth={1.75} />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        {/* Plain styled div instead of DropdownMenuLabel: Base UI's
            MenuGroupLabel requires being inside a Menu.Group whose items
            are siblings, which adds noise without semantic benefit here. */}
        <div
          className="px-2 py-1.5 text-[10.5px] uppercase tracking-wider font-semibold"
          style={{ color: 'var(--text-muted)' }}
        >
          Visible columns
        </div>
        <DropdownMenuSeparator />
        {COLUMNS.map((col) => {
          const checked = visible.has(col.id)
          return (
            <DropdownMenuItem
              key={col.id}
              // Base UI's Menu.Item fires `onClick` (NOT `onSelect` — that's
              // a Radix-ism). `closeOnClick={false}` keeps the menu open so
              // the user can toggle several columns in one go without
              // re-opening between each click.
              closeOnClick={false}
              onClick={() => {
                const next = new Set(visible)
                if (checked) next.delete(col.id)
                else next.add(col.id)
                onChange(next)
              }}
              className="cursor-pointer"
            >
              <span
                className="inline-flex h-3.5 w-3.5 mr-2 items-center justify-center rounded-sm border"
                style={{
                  borderColor: checked ? 'var(--gold)' : 'var(--border-default)',
                  background: checked ? 'var(--gold)' : 'transparent',
                }}
              >
                {checked && (
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
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
              {col.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PageSizeDropdown({
  value,
  onChange,
}: {
  value: (typeof PAGE_SIZES)[number]
  onChange: (v: (typeof PAGE_SIZES)[number]) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-medium border"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-secondary)',
            }}
          >
            {value} <ChevronDown size={11} strokeWidth={1.75} />
          </button>
        }
      />
      <DropdownMenuContent align="end">
        {PAGE_SIZES.map((size) => (
          <DropdownMenuItem
            key={size}
            onSelect={() => onChange(size)}
            className="text-[12.5px]"
          >
            {size} per page
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ExpandRowsToggle({
  expanded,
  onChange,
}: {
  expanded: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      className="inline-flex items-center gap-2 text-[12px] cursor-pointer select-none"
      style={{ color: 'var(--text-secondary)' }}
    >
      <span
        role="switch"
        aria-checked={expanded}
        tabIndex={0}
        onClick={() => onChange(!expanded)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            onChange(!expanded)
          }
        }}
        className="relative inline-flex h-[18px] w-[32px] rounded-full transition-colors"
        style={{
          background: expanded ? 'var(--gold)' : 'var(--border-default)',
        }}
      >
        <span
          className="absolute top-0.5 left-0.5 h-[14px] w-[14px] rounded-full bg-white transition-transform"
          style={{
            transform: expanded ? 'translateX(14px)' : 'translateX(0)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
          }}
        />
      </span>
      Expand rows
    </label>
  )
}

function IconNav({
  onClick,
  disabled,
  children,
  ...rest
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = 'var(--surface-sunken)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean
  onClearFilters: () => void
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <Briefcase size={22} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        {hasFilters ? 'No cases found.' : 'No cases yet.'}
      </p>
      <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        {hasFilters
          ? 'Stay organised by keeping every case detail in one place.'
          : 'Click "New case" to file your first one.'}
      </p>
      {hasFilters && (
        <Button
          size="sm"
          className="mt-5"
          onClick={onClearFilters}
        >
          Clear all filters
        </Button>
      )}
    </div>
  )
}

function StagesPlaceholder() {
  return (
    <div
      className="mt-8 rounded-2xl border px-10 py-16 text-center"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <Sparkles size={22} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        Stages admin is coming next
      </p>
      <p className="mt-1.5 text-[12.5px] max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
        Drop the screenshot for the Stages screen when you have it and we&rsquo;ll
        build it as the next sub-screen under Cases.
      </p>
    </div>
  )
}

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
      <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
        Unable to load cases
      </p>
      <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        Please check your connection and try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
        Retry
      </Button>
    </div>
  )
}

// ── Filters drawer ──────────────────────────────────────────────────────

/**
 * Side panel that mirrors the reference Filters drawer. Edits happen against a
 * local `draft` copy — only "Apply filters" commits the values upstream
 * (via `onApply`). "Clear filters" wipes both the draft AND the applied
 * state so the user sees the table refresh immediately without a second
 * click.
 *
 * Fields whose data we don't have yet (Responsible staff, Tags, Admin
 * view, Billable status, Permissions, Blocked users, Status date) render
 * with empty placeholder selects so the UI matches the reference visual spec
 * end-to-end. They're inert today and start filtering when the backend
 * adds the matching columns.
 */
function FilterDrawer({
  open,
  onOpenChange,
  value,
  onApply,
  cases,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: CaseFilters
  onApply: (next: CaseFilters) => void
  cases: Case[]
}) {
  const [draft, setDraft] = useState<CaseFilters>(value)

  // Re-sync draft from the applied state every time the drawer opens.
  // Without this, dismissing the drawer mid-edit and re-opening would
  // show the abandoned partial changes — confusing UX.
  useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])

  // Distinct option lists derived from the cases we already have. Cheap
  // enough at typical firm sizes (low thousands of cases) — if it gets
  // noticeable we'll memoize per-field instead.
  const uniq = (arr: Array<string | null | undefined>) =>
    Array.from(new Set(arr.filter((v): v is string => !!v))).sort()
  const clientOptions = uniq(cases.map((c) => c.client_name))
  const responsibleOptions = uniq(cases.map((c) => c.assigned_lawyer))
  const originatingOptions = uniq(cases.map((c) => c.originating_lawyer))

  // Permissions dropdown is grouped: a top-level "Groups" section with
  // firm-wide buckets, then "Users" with the current viewer. Roster
  // expansion comes when the user-management screen lands; until then
  // "Me" is the only individual entry.
  const { user } = useAuthStore()
  const meLabel = `${user?.name ?? 'Me'} (Me)`
  const permissionsGroups: OptionGroup[] = [
    { label: 'Groups', options: ['Everyone'] },
    { label: 'Users', options: [meLabel] },
  ]

  const setField = <K extends keyof CaseFilters>(key: K, val: CaseFilters[K]) => {
    setDraft((d) => ({ ...d, [key]: val || undefined }))
  }

  const handleApply = () => {
    onApply(draft)
    onOpenChange(false)
  }
  const handleClear = () => {
    setDraft(EMPTY_FILTERS)
    onApply(EMPTY_FILTERS)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop is light — we don't fully cover the table, the user
            should still see what their filters will narrow. */}
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-40 data-[open]:animate-in data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:fade-out-0"
          style={{ background: 'rgba(13,27,42,0.18)' }}
        />
        <DialogPrimitive.Popup
          className="fixed top-4 right-4 bottom-4 z-50 w-[480px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl border outline-none data-[open]:animate-in data-[open]:slide-in-from-right-4 data-[closed]:animate-out data-[closed]:slide-out-to-right-4"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-soft)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <DialogPrimitive.Title
              className="text-[14px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Filters
            </DialogPrimitive.Title>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-md transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
              aria-label="Close filters"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <FilterField label="Client">
              <FilterSelect
                value={draft.client ?? ''}
                onChange={(v) => setField('client', v)}
                placeholder="Find a contact"
                options={clientOptions}
              />
            </FilterField>

            <FilterField label="Responsible lawyer">
              <FilterSelect
                value={draft.responsible_lawyer ?? ''}
                onChange={(v) => setField('responsible_lawyer', v)}
                placeholder="Find a firm user"
                options={responsibleOptions}
              />
            </FilterField>

            <FilterField label="Originating lawyer">
              <FilterSelect
                value={draft.originating_lawyer ?? ''}
                onChange={(v) => setField('originating_lawyer', v)}
                placeholder="Find a firm user"
                options={originatingOptions}
              />
            </FilterField>

            <FilterField label="Responsible staff">
              <FilterSelect
                value={draft.responsible_staff ?? ''}
                onChange={(v) => setField('responsible_staff', v)}
                placeholder="Find a firm user"
                options={[]}
                disabled
                disabledHint="Staff roster not configured yet"
              />
            </FilterField>

            <FilterField label="Case notifications">
              <FilterSelect
                value={draft.notifications ?? ''}
                onChange={(v) => setField('notifications', v)}
                placeholder="Find a firm user"
                options={[]}
                disabled
                disabledHint="Notification subscriptions coming soon"
              />
            </FilterField>

            <FilterField label="Tags">
              <FilterSelect
                value={draft.tags ?? ''}
                onChange={(v) => setField('tags', v)}
                placeholder="Select tags"
                options={[]}
                disabled
                disabledHint="Tag manager coming soon"
              />
            </FilterField>

            <FilterField label="Admin view">
              <FilterSelect
                value={draft.admin_view ?? ''}
                onChange={(v) => setField('admin_view', v)}
                placeholder="Select view"
                options={ADMIN_VIEW_OPTIONS}
              />
            </FilterField>

            <FilterField label="Billable status">
              <FilterSelect
                value={draft.billable_status ?? ''}
                onChange={(v) => setField('billable_status', v)}
                placeholder="Select status"
                options={BILLABLE_STATUS_OPTIONS}
              />
            </FilterField>

            <FilterField label="Last activity date">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input
                  type="date"
                  value={draft.last_activity_from ?? ''}
                  onChange={(e) => setField('last_activity_from', e.target.value)}
                  className="h-10 rounded-lg border px-3 text-[13px]"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                  }}
                />
                <span style={{ color: 'var(--text-muted)' }}>–</span>
                <input
                  type="date"
                  value={draft.last_activity_to ?? ''}
                  onChange={(e) => setField('last_activity_to', e.target.value)}
                  className="h-10 rounded-lg border px-3 text-[13px]"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </FilterField>

            <FilterField label="Permissions">
              <FilterSelect
                value={draft.permissions ?? ''}
                onChange={(v) => setField('permissions', v)}
                placeholder="Find a group"
                groups={permissionsGroups}
                clearable
              />
            </FilterField>

            <FilterField label="Practice area">
              <FilterSelect
                value={draft.practice_area ?? ''}
                onChange={(v) => setField('practice_area', v)}
                placeholder="Find a practice area"
                options={PRACTICE_AREAS}
              />
            </FilterField>

            <FilterField label="Blocked users">
              <FilterSelect
                value={draft.blocked_users ?? ''}
                onChange={(v) => setField('blocked_users', v)}
                placeholder="Find a case by blocked user"
                options={[]}
                disabled
                disabledHint="User-level case blocking coming soon"
              />
            </FilterField>

            <FilterField label="Status date">
              {draft.status_date_from || draft.status_date_to ? (
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input
                    type="date"
                    value={draft.status_date_from ?? ''}
                    onChange={(e) => setField('status_date_from', e.target.value)}
                    className="h-10 rounded-lg border px-3 text-[13px]"
                    style={{
                      borderColor: 'var(--border-default)',
                      background: 'var(--surface-card)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <span style={{ color: 'var(--text-muted)' }}>–</span>
                  <input
                    type="date"
                    value={draft.status_date_to ?? ''}
                    onChange={(e) => setField('status_date_to', e.target.value)}
                    className="h-10 rounded-lg border px-3 text-[13px]"
                    style={{
                      borderColor: 'var(--border-default)',
                      background: 'var(--surface-card)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    // Seed empty strings so the range inputs render above.
                    setDraft((d) => ({ ...d, status_date_from: '', status_date_to: '' }))
                  }}
                  className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-sunken)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface-card)'
                  }}
                >
                  <Plus size={13} strokeWidth={2} />
                  Add status date
                </button>
              )}
            </FilterField>

            <div className="pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="text-[12.5px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Custom fields
              </div>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Customise and speed up your workflow by{' '}
                <button
                  type="button"
                  onClick={() =>
                    toast.info(
                      'Custom fields admin is coming next.',
                    )
                  }
                  className="underline cursor-pointer"
                  style={{ color: 'var(--gold-dark)' }}
                >
                  creating custom fields
                </button>
                .
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-2 px-5 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear filters
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply filters
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function FilterField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className="block text-[12.5px] font-semibold mb-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

/**
 * Lightweight native <select> wrapper styled to match the rest of the
 * filter panel. We use native instead of the shadcn Select primitive
 * because the panel hosts ~10 of these and a native select keeps the
 * keyboard / scroll behaviour predictable inside a Dialog.
 */
interface OptionGroup {
  label: string
  options: readonly string[]
}

/**
 * Lightweight native <select> wrapper styled to match the rest of the
 * filter panel. We use native instead of the shadcn Select primitive
 * because the panel hosts ~10 of these and a native select keeps the
 * keyboard / scroll behaviour predictable inside a Dialog.
 *
 * Provide EITHER `options` (flat list) OR `groups` (sectioned with
 * <optgroup> headers, e.g. Permissions → Groups / Users). If both are
 * given, `groups` wins.
 */
function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  groups,
  disabled = false,
  disabledHint,
  clearable = false,
}: {
  value: string
  onChange: (next: string) => void
  placeholder: string
  options?: readonly string[]
  groups?: readonly OptionGroup[]
  disabled?: boolean
  disabledHint?: string
  clearable?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer disabled:cursor-not-allowed"
        style={{
          borderColor: 'var(--border-default)',
          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          opacity: disabled ? 0.7 : 1,
          // Force the native popup to render with the light theme even
          // when the OS is in dark mode — matches the rest of the app.
          colorScheme: 'light',
        }}
      >
        <option value="">{placeholder}</option>
        {groups
          ? groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </optgroup>
            ))
          : (options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
      </select>
      <div
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {clearable && value && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onChange('')
            }}
            className="pointer-events-auto p-0.5 rounded cursor-pointer"
          >
            <X size={12} strokeWidth={1.75} />
          </button>
        )}
        <ChevronDown size={13} strokeWidth={1.75} />
      </div>
      {disabled && disabledHint && (
        <p
          className="mt-1 text-[11px]"
          style={{ color: 'var(--text-subtle)' }}
        >
          {disabledHint}
        </p>
      )}
    </div>
  )
}
