'use client'

/**
 * Clients list — state orchestration hook.
 *
 * Owns: tab, search, sort, selection, four filter sets (assigned-to,
 * client-status, created-on, column-visibility), the local
 * assignee-override map, and the dialog opener state. Memoised
 * derivations (primary-case lookup → filtered → sorted) live here so
 * the JSX shell reads a single state object.
 */

import { useMemo, useState } from 'react'
import { useCases } from '@/hooks/use-cases'
import {
  useClientAssignees,
  type Assignee,
} from '@/hooks/use-client-assignees'
import { useClients } from '@/hooks/use-clients'
import type { Case, CaseStatus, Client } from '@/types'

import { CREATED_ON_OPTIONS, TOGGLEABLE_COLUMNS } from '../_constants'
import { sortValue } from '../_lib/sort'
import type {
  ClientStatusKey,
  ColumnKey,
  CreatedOnKey,
  SortKey,
  SortState,
  TabKey,
} from '../_types'

export function useClientsPageState() {
  const { data: clients, isLoading, error } = useClients()
  const { data: cases } = useCases()
  const hookAssigneesByClient = useClientAssignees()

  // Local override applied on top of the hook's assignee map so the
  // Manage assignees dialog can produce immediate, visible changes
  // without a backend. When the integrations release ships, the hook
  // itself owns the writes and this state goes away.
  const [assigneeOverrides, setAssigneeOverrides] = useState<
    Map<string, Assignee[]>
  >(new Map())

  const assigneesByClient = useMemo(() => {
    if (assigneeOverrides.size === 0) return hookAssigneesByClient
    const merged = new Map(hookAssigneesByClient)
    for (const [clientId, list] of assigneeOverrides) {
      merged.set(clientId, list)
    }
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

  // Maps client_id → the case that "represents" the client in this
  // list view. Picks the most recently-updated open case if any;
  // falls back to the most recent case of any status.
  const primaryCaseByClient = useMemo(() => {
    const map = new Map<string, Case>()
    for (const c of cases ?? []) {
      if (!c.client_id) continue
      const existing = map.get(c.client_id)
      if (!existing) {
        map.set(c.client_id, c)
        continue
      }
      // Prefer Open over Pending over Closed; within the same status
      // pick the more recently updated one.
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

  // UI state.
  const [tab, setTab] = useState<TabKey>('All')
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sort, setSort] = useState<SortState>({ key: null, dir: 'asc' })
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Filter sets — each narrows the list further; an empty set means
  // "no filter applied".
  const [assignedToFilter, setAssignedToFilter] = useState<Set<string>>(
    new Set(),
  )
  const [statusFilter, setStatusFilter] = useState<Set<ClientStatusKey>>(
    new Set(),
  )
  const [createdOnFilter, setCreatedOnFilter] =
    useState<CreatedOnKey>('all')

  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    () => new Set(TOGGLEABLE_COLUMNS.map((c) => c.key)),
  )

  // Dialog state.
  const [viewClient, setViewClient] = useState<Client | null>(null)
  const [manageClient, setManageClient] = useState<Client | null>(null)
  // Timer dialog keeps the id (not the whole client) so it re-reads
  // from useClients and stays correct if the record is edited mid-flow.
  const [timerClientId, setTimerClientId] = useState<string | null>(null)

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
    // Show clients with at least one of the selected firm members on
    // their roster. Union (not intersect) — users almost always mean
    // "anything assigned to ANY of these people" when ticking names.
    if (assignedToFilter.size > 0) {
      list = list.filter((c) => {
        const roster = assigneesByClient.get(c.id) ?? []
        return roster.some((a) => assignedToFilter.has(a.id))
      })
    }
    // Operates on the CLIENT's own status (Active / Inactive), distinct
    // from the tab nav which filters by primary case status.
    if (statusFilter.size > 0) {
      list = list.filter((c) =>
        statusFilter.has(c.status as ClientStatusKey),
      )
    }
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

  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      // Third click → clear sort
      return { key: null, dir: 'asc' }
    })
  }

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
   * Replace the current assignee list for a client. Updates the local
   * override map so the table re-renders immediately; once real
   * persistence ships this becomes the success path of a mutation.
   */
  const setClientAssignees = (clientId: string, next: Assignee[]) =>
    setAssigneeOverrides((prev) => {
      const map = new Map(prev)
      map.set(clientId, next)
      return map
    })

  return {
    // raw data
    isLoading,
    error,
    // tab + search + sort
    tab,
    setTab,
    search,
    setSearch,
    searchOpen,
    setSearchOpen,
    sort,
    toggleSort,
    // selection
    selected,
    allSelected,
    someSelected,
    toggleAll,
    toggleOne,
    // filters
    assignedToFilter,
    setAssignedToFilter,
    toggleAssignedTo,
    statusFilter,
    setStatusFilter,
    toggleClientStatus,
    createdOnFilter,
    setCreatedOnFilter,
    // columns
    visibleColumns,
    toggleColumn,
    showColumn,
    // derived
    filteredAndSorted,
    primaryCaseByClient,
    assigneesByClient,
    allFirmMembers,
    // dialog state
    viewClient,
    setViewClient,
    manageClient,
    setManageClient,
    timerClientId,
    setTimerClientId,
    // mutations
    setClientAssignees,
  }
}

export type ClientsPageState = ReturnType<typeof useClientsPageState>
