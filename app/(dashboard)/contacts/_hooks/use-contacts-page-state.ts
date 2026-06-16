'use client'

/**
 * Contacts list — state orchestration hook.
 *
 * Owns the filter/sort/page state, the column-visibility hydration
 * round-trip, and the row-selection set. Memoised derivations (filtered
 * → sorted → page slice) live here so the JSX shell only consumes a
 * single state object.
 */

import { useEffect, useMemo, useState } from 'react'
import { useClients } from '@/hooks/use-clients'
import { COLUMNS } from '../_lib/columns'
import { loadVisibleColumns, saveVisibleColumns } from '../_lib/storage'
import type {
  ColumnId,
  ContactRoleFilter,
  ContactRow,
  SortDir,
  TypeFilter,
} from '../_types'

export type ContactsTab = 'contacts' | 'conflicts'

export function useContactsPageState() {
  const { data: clients, isLoading, error } = useClients()

  const [activeTab, setActiveTab] = useState<ContactsTab>('contacts')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(
    () => new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )
  const [hydrated, setHydrated] = useState(false)
  const [expandRows, setExpandRows] = useState(false)
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25)
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<ColumnId | null>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Filters popover state.
  // `contactRoleFilter`: tri-state — null = show all, 'none' = no role,
  //   'client' = explicit Client role.
  // `contactTagsFilter`: a contact must carry every selected tag.
  const [contactRoleFilter, setContactRoleFilter] =
    useState<ContactRoleFilter>(null)
  const [contactTagsFilter, setContactTagsFilter] = useState<string[]>([])

  // Hydrate the column-visibility set on mount (localStorage is
  // unavailable during SSR so the default fires on first render).
  useEffect(() => {
    setVisibleColumns(loadVisibleColumns())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveVisibleColumns(visibleColumns)
  }, [visibleColumns, hydrated])

  // Reset pagination + selection when any filter input changes.
  useEffect(() => {
    setPage(0)
    setSelected(new Set())
  }, [typeFilter, search, pageSize, contactRoleFilter, contactTagsFilter])

  const contacts = useMemo<ContactRow[]>(() => {
    return (clients ?? []).map((c) => ({
      ...c,
      contact_category: c.contact_type === 'company' ? 'company' : 'person',
      role_label: c.roles?.[0] ?? '',
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
    // `role_label` is the chip text shown next to a contact's name;
    // today every row is 'Client', but the filter is wired correctly
    // for the day other roles (Lead, Witness, etc.) ship.
    const byRole =
      contactRoleFilter === null
        ? byType
        : byType.filter((c) => {
            const role = (c.role_label || '').toLowerCase()
            if (contactRoleFilter === 'none') return role === ''
            return role === 'client'
          })
    const byTags =
      contactTagsFilter.length === 0
        ? byRole
        : byRole.filter((c) => {
            const names = new Set(c.tags.map((t) => t.name.toLowerCase()))
            return contactTagsFilter.every((t) => names.has(t.toLowerCase()))
          })
    const q = search.trim().toLowerCase()
    if (!q) return byTags
    return byTags.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.organization?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.client_code?.toLowerCase().includes(q),
    )
  }, [contacts, typeFilter, search, contactRoleFilter, contactTagsFilter])

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
    const next = new Set(selected)
    if (allOnPageSelected) {
      pageRows.forEach((r) => next.delete(r.id))
    } else {
      pageRows.forEach((r) => next.add(r.id))
    }
    setSelected(next)
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

  function clearAllFilters() {
    setSearch('')
    setTypeFilter('all')
    setContactRoleFilter(null)
    setContactTagsFilter([])
  }

  return {
    // raw data
    isLoading,
    error,
    // tabs / filters
    activeTab,
    setActiveTab,
    typeFilter,
    setTypeFilter,
    typeCounts,
    search,
    setSearch,
    visibleColumns,
    setVisibleColumns,
    orderedVisibleColumns,
    contactRoleFilter,
    setContactRoleFilter,
    contactTagsFilter,
    setContactTagsFilter,
    hasFiltersActive,
    clearAllFilters,
    // table state
    expandRows,
    setExpandRows,
    pageSize,
    setPageSize,
    page: safePage,
    setPage,
    totalPages,
    start,
    end,
    sortBy,
    sortDir,
    handleSort,
    // rows
    pageRows,
    sortedAll: sorted,
    contactCount: sorted.length,
    // selection
    selected,
    allOnPageSelected,
    toggleSelectAll,
    toggleRow,
    clearSelection: () => setSelected(new Set()),
    // tag dialog
    tagsDialogOpen,
    setTagsDialogOpen,
  }
}

export type ContactsPageState = ReturnType<typeof useContactsPageState>
