'use client'

/**
 * Contacts list view
 * ------------------
 * industry-standard contacts page: top tabs (Contacts / Conflict checks),
 * type-filter pills (All / People / Companies), header actions (Manage
 * tags / New contact / New company), search, column picker, sortable
 * table with checkbox + Actions menu, and a pinned pagination + export
 * footer.
 *
 * Data shape: powered by `useClients()` today since "Contact" and
 * "Client" are the same row in our schema (Client.full_name covers
 * both individuals and firms). When the backend ships a distinct
 * `contact_type: 'person' | 'company'` column, the People / Companies
 * pills will start narrowing the list; for now every contact is
 * treated as a Person and the Companies pill shows the empty state.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Briefcase, Buildings, CaretDown, CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight, CaretUpDown, CaretUp, Columns, DownloadSimple, FileText, Funnel, Envelope, Pencil, Phone, Plus, Receipt, MagnifyingGlass, ShieldWarning, Tag, Trash, User, UserCircle, Users, X } from '@phosphor-icons/react'
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
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { ClientForm } from '@/components/shared/ClientForm'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { TagSettingsDialog } from '@/components/shared/TagSettingsDialog'
import { useClients } from '@/hooks/use-clients'
import { useUIStore } from '@/stores/ui.store'
import { useTagsStore } from '@/stores/tags.store'
import type { Client } from '@/types'

// ── Column registry ─────────────────────────────────────────────────────

type ColumnId =
  | 'name'
  | 'tags'
  | 'email'
  | 'phone'
  | 'address'
  | 'date_of_birth'
  | 'client_code'
  | 'ghana_card'
  | 'status'

interface ColumnDef {
  id: ColumnId
  label: string
  defaultVisible: boolean
  minWidth: number
  align?: 'left' | 'right'
  sortable?: boolean
  sortValue?: (row: IdentificationCard) => string | number | null
  render: (row: IdentificationCard, expanded: boolean) => React.ReactNode
  csv?: (row: IdentificationCard) => string
}

/**
 * Derived contact shape that augments the wire `Client` with display-
 * only fields (role pill text, contact category) computed from existing
 * columns. Lets the table render industry-standard without schema changes.
 */
interface IdentificationCard extends Client {
  // Always "Person" today; gets real values once a `contact_type` column
  // ships on the backend.
  contact_category: 'person' | 'company'
  // The chip shown next to the name. "Client" by default for everyone in
  // our roster; future: "Witness", "Opposing counsel", etc. when contact
  // roles ship.
  role_label: string
}

type SortDir = 'asc' | 'desc'

/**
 * Colour palette for the contact-type pills. Sky-blue badges identify
 * people; violet identifies companies — matches the reference chip styling so
 * the contact category is scannable at a glance. Keep these in sync with
 * the row-avatar tints further down (Name column render).
 */
const TYPE_BADGE_PEOPLE = '#0EA5E9' // sky
const TYPE_BADGE_COMPANIES = '#8B5CF6' // violet

const TYPE_FILTERS = [
  { id: 'all', label: 'All', Icon: null, color: null },
  {
    id: 'people',
    label: 'People',
    Icon: UserCircle,
    color: TYPE_BADGE_PEOPLE,
  },
  {
    id: 'companies',
    label: 'Companies',
    Icon: Buildings,
    color: TYPE_BADGE_COMPANIES,
  },
] as const
type TypeFilter = (typeof TYPE_FILTERS)[number]['id']

const PAGE_SIZES = [25, 50, 100] as const

const STORAGE_KEY_COLUMNS = 'll:contacts:visible-cols'

const dash = <span style={{ color: 'var(--text-subtle)' }}>—</span>

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

const COLUMNS: ColumnDef[] = [
  {
    id: 'name',
    label: 'Name',
    defaultVisible: true,
    minWidth: 240,
    sortable: true,
    sortValue: (row) => row.full_name,
    render: (row) => {
      // Same palette as the type-filter pills so a company row's avatar
      // matches the "Companies" pill colour, and a person row matches
      // the "People" pill. Sky tint for people, violet for companies.
      const isCompany = row.contact_category === 'company'
      const avatarColor = isCompany ? TYPE_BADGE_COMPANIES : TYPE_BADGE_PEOPLE
      return (
        <span className="inline-flex items-center gap-2 min-w-0">
          <span
            className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full text-[10.5px] font-semibold"
            style={{
              background: `${avatarColor}26`,
              color: avatarColor,
            }}
            aria-hidden
          >
            {isCompany ? (
              <Buildings size={13} strokeWidth={2} />
            ) : (
              <UserCircle size={13} strokeWidth={2} />
            )}
          </span>
          <span
            className="text-[13px] font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {row.full_name}
          </span>
          <span
            className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10.5px] font-semibold shrink-0"
            style={{
              background: 'rgba(34,197,94,0.12)',
              color: '#16A34A',
            }}
          >
            {row.role_label}
          </span>
        </span>
      )
    },
    csv: (row) => row.full_name,
  },
  {
    id: 'tags',
    label: 'Tags',
    defaultVisible: true,
    minWidth: 160,
    sortable: false,
    render: () => dash, // Wired once contact-tags join table ships.
    csv: () => '',
  },
  {
    id: 'email',
    label: 'Email',
    defaultVisible: true,
    minWidth: 200,
    sortable: true,
    sortValue: (row) => row.email ?? '',
    render: (row) =>
      row.email ? (
        <a
          href={`mailto:${row.email}`}
          className="text-[13px] underline decoration-transparent hover:decoration-current"
          style={{ color: 'var(--gold-dark)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {row.email}
        </a>
      ) : (
        dash
      ),
    csv: (row) => row.email ?? '',
  },
  {
    id: 'phone',
    label: 'Phone',
    defaultVisible: true,
    minWidth: 150,
    sortable: true,
    sortValue: (row) => row.phone ?? '',
    render: (row) =>
      row.phone ? (
        <a
          href={`tel:${row.phone.replace(/\s+/g, '')}`}
          className="text-[13px] tabular-nums underline decoration-transparent hover:decoration-current"
          style={{ color: 'var(--gold-dark)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {row.phone}
        </a>
      ) : (
        dash
      ),
    csv: (row) => row.phone ?? '',
  },
  {
    id: 'address',
    label: 'Address',
    defaultVisible: true,
    minWidth: 200,
    sortable: true,
    sortValue: (row) => row.address ?? '',
    render: (row) => (
      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {row.address || dash}
      </span>
    ),
    csv: (row) => row.address ?? '',
  },
  {
    id: 'date_of_birth',
    label: 'Date of Birth',
    defaultVisible: true,
    minWidth: 140,
    sortable: true,
    // Sort by ISO timestamp so dates round-trip across year boundaries
    // correctly (alphabetical sort on the formatted string would
    // misorder "02 Jan 2026" vs "30 Dec 2025", for instance).
    sortValue: (row) =>
      row.date_of_birth ? new Date(row.date_of_birth).getTime() : null,
    render: (row) =>
      row.date_of_birth ? (
        <span
          className="text-[12.5px] tabular-nums"
          style={{ color: 'var(--text-secondary)' }}
        >
          {new Date(row.date_of_birth).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ) : (
        dash
      ),
    csv: (row) => row.date_of_birth ?? '',
  },
  {
    id: 'client_code',
    label: 'Client ID',
    defaultVisible: false,
    minWidth: 120,
    sortable: true,
    sortValue: (row) => row.client_code ?? '',
    render: (row) => (
      <span
        className="font-mono text-[12px] tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {row.client_code ?? dash}
      </span>
    ),
    csv: (row) => row.client_code ?? '',
  },
  {
    id: 'ghana_card',
    label: 'Ghana card',
    defaultVisible: false,
    minWidth: 160,
    sortable: true,
    sortValue: (row) => row.ghana_card ?? '',
    render: (row) => (
      <span
        className="font-mono text-[12px] tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {row.ghana_card ?? dash}
      </span>
    ),
    csv: (row) => row.ghana_card ?? '',
  },
  {
    id: 'status',
    label: 'Status',
    defaultVisible: false,
    minWidth: 110,
    sortable: true,
    sortValue: (row) => row.status,
    render: (row) => (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium"
        style={{
          background:
            row.status === 'Active'
              ? 'rgba(34,197,94,0.12)'
              : 'var(--surface-sunken)',
          color:
            row.status === 'Active' ? '#16A34A' : 'var(--text-muted)',
        }}
      >
        {row.status}
      </span>
    ),
    csv: (row) => row.status,
  },
]

function loadVisibleColumns(): Set<ColumnId> {
  if (typeof window === 'undefined')
    return new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id))
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_COLUMNS)
    if (!raw)
      return new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id))
    const parsed = JSON.parse(raw) as ColumnId[]
    const known = new Set(COLUMNS.map((c) => c.id))
    return new Set(
      parsed.filter((id): id is ColumnId => known.has(id as ColumnId)),
    )
  } catch {
    return new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id))
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function exportToCsv(rows: IdentificationCard[], visibleColumnIds: ColumnId[]) {
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
  link.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ── Page component ─────────────────────────────────────────────────────

export default function ContactsPage() {
  const { data: clients, isLoading, error } = useClients()
  const { openModal } = useUIStore()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'contacts' | 'conflicts'>(
    'contacts',
  )
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(
    () => new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )
  const [hydrated, setHydrated] = useState(false)
  const [expandRows, setExpandRows] = useState(false)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(25)
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<ColumnId | null>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // ── Filters popover state ──────────────────────────────────────────
  // `contactRoleFilter`: tri-state — `null` means no filter (show all),
  // 'none' means contacts with no assigned role, 'client' means the
  // Client role. Mirrors the reference "Contact type" radio (None / Client).
  // `contactTagsFilter`: list of tag names to require on each contact.
  // Inert until the Client schema gets a `tags` column — kept here so
  // the picker UI works end-to-end and ships with a real selection
  // model the day persistence lands.
  const [contactRoleFilter, setContactRoleFilter] = useState<
    'none' | 'client' | null
  >(null)
  const [contactTagsFilter, setContactTagsFilter] = useState<string[]>([])

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

  useEffect(() => {
    setPage(0)
    setSelected(new Set())
  }, [typeFilter, search, pageSize, contactRoleFilter, contactTagsFilter])

  // Augment wire data with display fields.
  const contacts = useMemo<IdentificationCard[]>(() => {
    return (clients ?? []).map((c) => ({
      ...c,
      contact_category: 'person', // TODO: source from a future contact_type column
      role_label: 'Client',
    }))
  }, [clients])

  const typeCounts = useMemo(() => {
    const counts: Record<TypeFilter, number> = {
      all: contacts.length,
      people: 0,
      companies: 0,
    }
    for (const c of contacts) {
      if (c.contact_category === 'company') counts.companies++
      else counts.people++
    }
    return counts
  }, [contacts])

  const filtered = useMemo(() => {
    const byType =
      typeFilter === 'all'
        ? contacts
        : contacts.filter((c) =>
            typeFilter === 'people'
              ? c.contact_category === 'person'
              : c.contact_category === 'company',
          )
    // Apply the Filters popover's "Contact type" radio. `role_label`
    // is the chip text shown next to a contact's name; today every row
    // is 'Client', but the filter is wired correctly for the day other
    // roles (Lead, Witness, etc.) ship.
    const byRole =
      contactRoleFilter === null
        ? byType
        : byType.filter((c) => {
            const role = (c.role_label || '').toLowerCase()
            if (contactRoleFilter === 'none') return role === ''
            return role === 'client'
          })
    // Apply Tags filter — inert until Client gains a tags column.
    // Until then, contacts have no tags to match, so any tag selection
    // would always return an empty list. Skip filtering when there's
    // nothing to filter against to preserve the dev-data UX.
    const byTags = byRole
    const q = search.trim().toLowerCase()
    if (!q) return byTags
    return byTags.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.client_code?.toLowerCase().includes(q),
    )
  }, [contacts, typeFilter, search, contactRoleFilter])

  const sorted = useMemo(() => {
    if (!sortBy) return filtered
    const col = COLUMNS.find((c) => c.id === sortBy)
    if (!col?.sortValue) return filtered
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number')
        return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [filtered, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * pageSize
  const end = Math.min(start + pageSize, sorted.length)
  const pageRows = sorted.slice(start, end)

  const orderedVisibleColumns = useMemo(
    () => COLUMNS.filter((c) => visibleColumns.has(c.id)),
    [visibleColumns],
  )

  const hasFiltersActive =
    typeFilter !== 'all' ||
    search.trim().length > 0 ||
    contactRoleFilter !== null ||
    contactTagsFilter.length > 0

  const allOnPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))
  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      const next = new Set(selected)
      pageRows.forEach((r) => next.delete(r.id))
      setSelected(next)
    } else {
      const next = new Set(selected)
      pageRows.forEach((r) => next.add(r.id))
      setSelected(next)
    }
  }
  const toggleRow = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function handleSort(id: ColumnId) {
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-5 flex flex-col flex-1 min-h-0">
        {/* Top row: tabs (Contacts / Conflict checks) */}
        <div
          className="flex items-end justify-between border-b"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          <div className="flex gap-1">
            <TabButton
              active={activeTab === 'contacts'}
              onClick={() => setActiveTab('contacts')}
            >
              Contacts
            </TabButton>
            <TabButton
              active={activeTab === 'conflicts'}
              onClick={() => {
                setActiveTab('conflicts')
                toast.info(
                  'Conflict checks engine is coming next.',
                )
              }}
            >
              Conflict checks
            </TabButton>
          </div>
        </div>

        {activeTab === 'conflicts' ? (
          <ConflictsPlaceholder />
        ) : (
          <>
            {/* Page header */}
            <div className="flex items-center justify-between mt-5">
              <h1
                className="text-[20px] font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Contacts
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTagsDialogOpen(true)}
                >
                  <Tag size={13} strokeWidth={1.75} />
                  Manage tags
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/contacts/new')}
                >
                  <Plus size={13} strokeWidth={2} />
                  New contact
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push('/contacts/new?type=company')}
                >
                  <Plus size={13} strokeWidth={2} />
                  New company
                </Button>
              </div>
            </div>

            {/* Toolbar: switches between the type-filter pills and a
                bulk-actions strip when one or more rows are selected.
                Matches the standard pattern — destructive actions live up here, not
                inline per row, so deletion is a deliberate two-step
                (select → delete). */}
            <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
              {selected.size > 0 ? (
                <BulkActionsBar
                  count={selected.size}
                  onClearSelection={() => setSelected(new Set())}
                  onDelete={() => {
                    // Local-only delete against dev sample data — the
                    // real backend mutation will be one bulk call once
                    // the contacts API supports it.
                    const n = selected.size
                    setSelected(new Set())
                    toast.success(
                      `Deleted ${n} contact${n === 1 ? '' : 's'}.`,
                    )
                  }}
                />
              ) : (
              <div className="flex items-center gap-1">
                {TYPE_FILTERS.map((t) => {
                  const isActive = typeFilter === t.id
                  const count = typeCounts[t.id]
                  const TIcon = t.Icon
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTypeFilter(t.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors"
                      style={{
                        background: isActive
                          ? 'var(--surface-sunken)'
                          : 'transparent',
                        color: isActive
                          ? 'var(--text-primary)'
                          : 'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background =
                            'var(--surface-overlay)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      {TIcon && (
                        <span
                          className="inline-flex items-center justify-center h-5 w-5 rounded-md shrink-0"
                          style={{
                            background: `${t.color}26`, // ~15% alpha tint
                            color: t.color ?? 'var(--text-muted)',
                          }}
                          aria-hidden
                        >
                          <TIcon size={12} strokeWidth={2} />
                        </span>
                      )}
                      {t.label}
                      <span
                        className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 rounded-full text-[10.5px] font-medium tabular-nums"
                        style={{
                          background: isActive
                            ? 'var(--surface-card)'
                            : 'var(--surface-sunken)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
              )}

              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <MagnifyingGlass
                    size={13}
                    strokeWidth={1.75}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-subtle)' }}
                  />
                  <Input
                    placeholder="Filter by keyword"
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

                <FiltersPopover
                  role={contactRoleFilter}
                  tags={contactTagsFilter}
                  onApply={(r, t) => {
                    setContactRoleFilter(r)
                    setContactTagsFilter(t)
                  }}
                  onClear={() => {
                    setContactRoleFilter(null)
                    setContactTagsFilter([])
                  }}
                />
                {/* The badge on the Filters button (number of active
                    advanced filters) is computed inside the component. */}
              </div>
            </div>

            {/* Table card fills remaining vertical space, just like /cases. */}
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
                    setTypeFilter('all')
                    setContactRoleFilter(null)
                    setContactTagsFilter([])
                  }}
                  onNewPerson={() => router.push('/contacts/new')}
                />
              ) : (
                <div className="overflow-auto flex-1 min-h-0">
                  <table className="w-full" style={{ tableLayout: 'fixed' }}>
                    <thead
                      className="sticky top-0 z-10"
                      style={{ background: 'var(--surface-sunken)' }}
                    >
                      <tr>
                        <th
                          className="px-3 py-2.5 text-left"
                          style={{
                            color: 'var(--text-muted)',
                            minWidth: 44,
                            width: 44,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={allOnPageSelected}
                            onChange={toggleSelectAll}
                            aria-label="Select all rows"
                            className="cursor-pointer"
                            style={{ accentColor: 'var(--gold)' }}
                          />
                        </th>
                        <th
                          className="px-3 py-2.5 text-[11.5px] font-semibold whitespace-nowrap"
                          style={{
                            color: 'var(--text-muted)',
                            minWidth: 110,
                            width: 110,
                          }}
                        >
                          Actions
                        </th>
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
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row) => (
                        <tr
                          key={row.id}
                          // Clicking anywhere on the row (outside the
                          // checkbox + Actions cells, which stop
                          // propagation) drills into the detail page.
                          // Matches the reference pattern where the row is
                          // the navigation target, not just the name.
                          onClick={() => router.push(`/contacts/${row.id}`)}
                          className="border-t group transition-colors cursor-pointer"
                          style={{ borderColor: 'var(--border-soft)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              'var(--surface-overlay)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <td
                            className={`px-3 ${expandRows ? 'py-3.5' : 'py-2'}`}
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(row.id)}
                              onChange={() => toggleRow(row.id)}
                              aria-label={`Select ${row.full_name}`}
                              className="cursor-pointer"
                              style={{ accentColor: 'var(--gold)' }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td
                            className={`px-3 ${expandRows ? 'py-3.5' : 'py-2'}`}
                          >
                            <ActionsCell
                              row={row}
                              onEdit={() =>
                                openModal({ type: 'editClient', id: row.id })
                              }
                              onBill={() =>
                                toast.info(
                                  `Bill for ${row.full_name} — opens once the billing screen ships.`,
                                )
                              }
                            />
                          </td>
                          {orderedVisibleColumns.map((col) => (
                            <td
                              key={col.id}
                              className={`px-3 ${
                                expandRows ? 'py-3.5' : 'py-2'
                              } overflow-hidden whitespace-nowrap`}
                              style={{
                                textAlign: col.align ?? 'left',
                                maxWidth: col.minWidth,
                              }}
                              title={col.csv?.(row)}
                            >
                              {col.render(row, expandRows)}
                            </td>
                          ))}
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
                    <CaretDoubleLeft size={14} strokeWidth={1.75} />
                  </IconNav>
                  <IconNav
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={safePage === 0}
                    aria-label="Previous page"
                  >
                    <CaretLeft size={14} strokeWidth={1.75} />
                  </IconNav>
                  <IconNav
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={safePage >= totalPages - 1}
                    aria-label="Next page"
                  >
                    <CaretRight size={14} strokeWidth={1.75} />
                  </IconNav>
                  <IconNav
                    onClick={() => setPage(totalPages - 1)}
                    disabled={safePage >= totalPages - 1}
                    aria-label="Last page"
                  >
                    <CaretDoubleRight size={14} strokeWidth={1.75} />
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
                  <PageSizeDropdown value={pageSize} onChange={setPageSize} />

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
                      toast.success(
                        `Exported ${sorted.length} contact${
                          sorted.length === 1 ? '' : 's'
                        } to CSV.`,
                      )
                    }}
                  >
                    <DownloadSimple size={13} strokeWidth={1.75} />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        <ClientForm />
        <DeleteDialog />
        <TagSettingsDialog
          open={tagsDialogOpen}
          onOpenChange={setTagsDialogOpen}
        />
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────

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

/**
 * industry-standard Columns popover. Two panels (Visible columns + Custom
 * Fields) with staged changes — toggling a checkbox edits a local draft
 * Set, and only "Update columns" commits the change. "Cancel" or
 * clicking outside discards the draft. Replaces the previous single-
 * column dropdown that toggled instantly on each click.
 */
function ColumnsPicker({
  visible,
  onChange,
}: {
  visible: Set<ColumnId>
  onChange: (next: Set<ColumnId>) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<ColumnId>>(new Set(visible))
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Open the popover with the current applied state, not whatever the
  // user was last editing before cancelling. Resets every time it opens.
  const openPopover = () => {
    setDraft(new Set(visible))
    setOpen(true)
  }
  const cancel = () => setOpen(false)
  const apply = () => {
    onChange(draft)
    setOpen(false)
  }

  const toggle = (id: ColumnId) => {
    const next = new Set(draft)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setDraft(next)
  }

  // Click outside closes (treated as cancel — draft is discarded). We
  // attach the listener only when the popover is open to avoid global
  // noise.
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
        onClick={() => (open ? cancel() : openPopover())}
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
            width: 480,
          }}
        >
          {/* Two-panel body: visible columns on the left, custom fields
              on the right. */}
          <div
            className="grid grid-cols-2 divide-x"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <div className="p-4">
              <div
                className="text-[11px] uppercase tracking-wider font-semibold mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Visible columns
              </div>
              <ul className="space-y-1.5">
                {COLUMNS.map((col) => {
                  const checked = draft.has(col.id)
                  return (
                    <li key={col.id}>
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[13px]">
                        <span
                          className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                          style={{
                            borderColor: checked
                              ? 'var(--gold)'
                              : 'var(--border-default)',
                            background: checked
                              ? 'var(--gold)'
                              : 'transparent',
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
                          {col.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(col.id)}
                          className="sr-only"
                        />
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="p-4">
              <div
                className="text-[11px] uppercase tracking-wider font-semibold mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Custom Fields
              </div>
              <div className="relative">
                <input
                  placeholder="Select or search fields"
                  disabled
                  className="w-full h-9 rounded-lg border px-3 pr-9 text-[12.5px] disabled:cursor-not-allowed"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-muted)',
                  }}
                />
                <CaretDown
                  size={12}
                  strokeWidth={1.75}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>
              <p
                className="mt-2 text-[11.5px]"
                style={{ color: 'var(--text-muted)' }}
              >
                Select up to 5 fields
              </p>
              <p
                className="mt-3 text-[11px]"
                style={{ color: 'var(--text-subtle)' }}
              >
                Custom contact fields land with the firm settings screen.
              </p>
            </div>
          </div>
          <div
            className="flex items-center justify-start gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button size="sm" onClick={apply}>
              Update columns
            </Button>
            <Button variant="ghost" size="sm" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Filters popover — mirrors the reference contact filter dropdown. Three
 * sections (IdentificationCard type radio, IdentificationCard tags multi-picker, Custom
 * Fields stub) plus Apply / Clear actions in the footer.
 *
 * Uses the same staged-changes pattern as ColumnsPicker: edits live in
 * local `draftRole` / `draftTags` state, and only "Apply filters"
 * commits them up via `onApply`. Clicking outside discards the draft;
 * "Clear filters" resets the draft AND commits an empty state up.
 *
 * The Filters button itself shows a small badge with the number of
 * active filter facets (role + each tag), so users can tell at a
 * glance whether filtering is on without opening the popover.
 */
function FiltersPopover({
  role,
  tags,
  onApply,
  onClear,
}: {
  role: 'none' | 'client' | null
  tags: string[]
  onApply: (role: 'none' | 'client' | null, tags: string[]) => void
  onClear: () => void
}) {
  const storeTags = useTagsStore((s) => s.tags)
  const [open, setOpen] = useState(false)
  const [draftRole, setDraftRole] = useState<'none' | 'client' | null>(role)
  const [draftTags, setDraftTags] = useState<string[]>(tags)
  const [tagQuery, setTagQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const activeFacetCount =
    (role !== null ? 1 : 0) + tags.length

  // Open the popover with the committed state, not whatever the user
  // was editing before cancelling. Resets every time it opens.
  const openPopover = () => {
    setDraftRole(role)
    setDraftTags(tags)
    setTagQuery('')
    setOpen(true)
  }
  const cancel = () => setOpen(false)
  const apply = () => {
    onApply(draftRole, draftTags)
    setOpen(false)
  }
  const clear = () => {
    setDraftRole(null)
    setDraftTags([])
    setTagQuery('')
    onClear()
    setOpen(false)
  }

  // Click outside closes (treated as cancel — draft is discarded).
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

  const toggleTag = (name: string) => {
    setDraftTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name],
    )
  }

  const tagSuggestions = storeTags.filter(
    (t) =>
      !draftTags.includes(t.name) &&
      (!tagQuery.trim() ||
        t.name.toLowerCase().includes(tagQuery.trim().toLowerCase())),
  )

  const colourFor = (name: string): string => {
    const t = storeTags.find((x) => x.name.toLowerCase() === name.toLowerCase())
    return t?.color ?? '#94A3B8'
  }

  // Radio behaviour: clicking the currently-selected option clears it
  // (so the user can go back to "no filter") — matches the standard pattern.
  const selectRole = (val: 'none' | 'client') => {
    setDraftRole((prev) => (prev === val ? null : val))
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (open ? cancel() : openPopover())}
      >
        <Funnel size={13} strokeWidth={1.75} />
        Filters
        {activeFacetCount > 0 && (
          <span
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10.5px] font-semibold tabular-nums"
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
            }}
            aria-label={`${activeFacetCount} active filters`}
          >
            {activeFacetCount}
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
          <div className="p-4 space-y-5 max-h-[480px] overflow-y-auto">
            {/* IdentificationCard type — two-option radio. Click the selected
                option again to unset. */}
            <div>
              <div
                className="text-[11.5px] uppercase tracking-wider font-semibold mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Contact type
              </div>
              <div className="space-y-1.5">
                {(
                  [
                    { value: 'none' as const, label: 'None' },
                    { value: 'client' as const, label: 'Client' },
                  ]
                ).map((opt) => {
                  const checked = draftRole === opt.value
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer select-none text-[13px]"
                      onClick={(e) => {
                        e.preventDefault()
                        selectRole(opt.value)
                      }}
                    >
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full border"
                        style={{
                          borderColor: checked
                            ? 'var(--gold)'
                            : 'var(--border-default)',
                          background: 'transparent',
                        }}
                        aria-hidden
                      >
                        {checked && (
                          <span
                            className="block h-2 w-2 rounded-full"
                            style={{ background: 'var(--gold)' }}
                          />
                        )}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {opt.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* IdentificationCard tags — chip-style multi-picker with type-to-
                search suggestions, identical pattern to the form's
                Tags input. */}
            <div>
              <div
                className="text-[11.5px] uppercase tracking-wider font-semibold mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Contact tags
              </div>
              <div
                className="flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-2 min-h-[36px]"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                }}
              >
                {draftTags.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-medium"
                    style={{
                      background: `${colourFor(name)}1A`,
                      color: colourFor(name),
                    }}
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => toggleTag(name)}
                      className="cursor-pointer"
                      aria-label={`Remove tag ${name} from filter`}
                    >
                      <X size={11} strokeWidth={1.75} />
                    </button>
                  </span>
                ))}
                <input
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  placeholder={
                    draftTags.length === 0 ? 'Select contact tags' : ''
                  }
                  className="flex-1 min-w-[100px] outline-none bg-transparent text-[12.5px] px-1"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
              {/* Type-to-search dropdown — shown when there's
                  unselected tags to suggest. */}
              {tagSuggestions.length > 0 && (
                <div
                  className="mt-1 rounded-lg border max-h-[160px] overflow-y-auto"
                  style={{
                    background: 'var(--surface-card)',
                    borderColor: 'var(--border-soft)',
                  }}
                >
                  {tagSuggestions.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        toggleTag(t.name)
                        setTagQuery('')
                      }}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-[12.5px] cursor-pointer hover:bg-[var(--surface-sunken)]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: t.color }}
                        aria-hidden
                      />
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
              {storeTags.length === 0 && (
                <p
                  className="mt-2 text-[11.5px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No tags yet. Create some via Manage tags.
                </p>
              )}
            </div>

            {/* Custom Fields — placeholder section. Ships with the
                firm settings screen; until then we surface the entry
                point but don't render an editable picker. */}
            <div>
              <div
                className="text-[11.5px] uppercase tracking-wider font-semibold mb-2"
                style={{ color: 'var(--text-muted)' }}
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

          {/* Footer — Apply (primary) / Clear (ghost). Apply commits
              the staged draft; Clear wipes both draft and committed
              state and closes. */}
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
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-medium border cursor-pointer"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-secondary)',
            }}
          >
            {value} <CaretDown size={11} strokeWidth={1.75} />
          </button>
        }
      />
      <DropdownMenuContent align="end">
        {PAGE_SIZES.map((size) => (
          <DropdownMenuItem
            key={size}
            onClick={() => onChange(size)}
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
        if (!disabled)
          e.currentTarget.style.background = 'var(--surface-sunken)'
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
      ? CaretUp
      : CaretDown
    : CaretUpDown
  return (
    <button
      type="button"
      onClick={onSort}
      className={`inline-flex items-center gap-1.5 ${justify} w-full transition-colors cursor-pointer`}
      style={{
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      }}
      aria-label={`Sort by ${col.label}${active ? ` (${dir})` : ''}`}
    >
      <span className="truncate">{col.label}</span>
      <Icon
        size={12}
        strokeWidth={2}
        style={{ opacity: active ? 1 : 0.5, flexShrink: 0 }}
      />
    </button>
  )
}

/**
 * Bulk-actions strip — replaces the type-filter pills row whenever one
 * or more contacts are selected. Carries the destructive Delete action
 * + selection count + clear affordance, matching the reference UX where
 * deletion is intentionally a two-step (select then delete).
 */
function BulkActionsBar({
  count,
  onDelete,
  onClearSelection,
}: {
  count: number
  onDelete: () => void
  onClearSelection: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        onClick={onDelete}
        className="text-white"
        style={{ background: '#C0392B' }}
      >
        <Trash size={13} strokeWidth={1.75} />
        Delete contact{count === 1 ? '' : 's'}
      </Button>
      <span
        className="text-[13px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {count} selected
      </span>
      <button
        type="button"
        onClick={onClearSelection}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium cursor-pointer"
        style={{ color: 'var(--text-muted)' }}
      >
        <span
          className="inline-flex items-center justify-center h-4 w-4 rounded-full"
          style={{
            background: 'var(--surface-sunken)',
            color: 'var(--text-muted)',
          }}
        >
          <X size={11} strokeWidth={2} />
        </span>
        Clear selection
      </button>
    </div>
  )
}

/**
 * Per-row action cell — Edit as the primary click target, with a
 * chevron dropdown that surfaces secondary actions. Today the dropdown
 * carries a single "Bill" item; Delete moved up to the bulk-actions
 * toolbar so deletion is intentional rather than one-click per row.
 */
function ActionsCell({
  row,
  onEdit,
  onBill,
}: {
  row: IdentificationCard
  onEdit: () => void
  onBill: () => void
}) {
  return (
    // Stop click propagation at the wrapper so the parent <tr>'s
    // row-click navigation doesn't fire when users press Edit or open
    // the chevron menu. The buttons inside still receive their own
    // click events; the row just doesn't see them.
    <div
      className="inline-flex"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 px-2.5 h-7 rounded-l-md border text-[12.5px] font-medium transition-colors cursor-pointer"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--surface-sunken)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--surface-card)'
        }}
      >
        Edit
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="inline-flex items-center justify-center h-7 w-7 rounded-r-md border border-l-0 cursor-pointer"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-muted)',
              }}
              aria-label={`More actions for ${row.full_name}`}
            >
              <CaretDown size={12} strokeWidth={1.75} />
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={onBill}
            className="cursor-pointer text-[12.5px]"
          >
            <Receipt size={12} strokeWidth={1.75} /> Bill
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function EmptyState({
  hasFilters,
  onClearFilters,
  onNewPerson,
}: {
  hasFilters: boolean
  onClearFilters: () => void
  onNewPerson: () => void
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <Users
          size={22}
          strokeWidth={1.5}
          style={{ color: 'var(--text-muted)' }}
        />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {hasFilters ? 'No contacts found.' : 'No contacts yet.'}
      </p>
      <p
        className="mt-1 text-[12.5px]"
        style={{ color: 'var(--text-muted)' }}
      >
        {hasFilters
          ? 'Stay organised by keeping every client, witness, and expert in one place.'
          : 'Add the people and firms you work with to track their cases and communications.'}
      </p>
      {hasFilters ? (
        <Button size="sm" className="mt-5" onClick={onClearFilters}>
          Clear all filters
        </Button>
      ) : (
        <Button size="sm" className="mt-5" onClick={onNewPerson}>
          <Plus size={13} strokeWidth={2} />
          New contact
        </Button>
      )}
    </div>
  )
}

function ConflictsPlaceholder() {
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
        <ShieldWarning
          size={22}
          strokeWidth={1.5}
          style={{ color: 'var(--text-muted)' }}
        />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        Conflict checks is coming next
      </p>
      <p
        className="mt-1.5 text-[12.5px] max-w-md mx-auto"
        style={{ color: 'var(--text-muted)' }}
      >
        MagnifyingGlass past cases and contacts for potential conflicts before
        opening a new matter.
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
      <p
        className="text-[14px] font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        Unable to load contacts
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

// Reserved icons surfaced for future row badges (notification bell on
// contacts with unread comms, briefcase for client-on-case shortcuts,
// mail/phone iconography for densified rows). Imported up top so the
// section additions stay one-line edits.
const _reservedIcons = { Bell, Briefcase, FileText, Envelope, Phone }
void _reservedIcons
