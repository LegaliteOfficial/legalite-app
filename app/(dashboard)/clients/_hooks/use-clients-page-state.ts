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
  useAssignableMembers,
  useClientAssignees,
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
  // Persisted client teams (clientAssignments query). Saving goes through
  // the Manage assignees dialog, which refetches this on success.
  const assigneesByClient = useClientAssignees()

  // The firm's active roster — drives the Assigned-to filter, so anyone in
  // the firm can be filtered on, not just members already on a client.
  const { members: allFirmMembers } = useAssignableMembers()

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
  // Client the bill composer drawer is open for ("Create bill" row action).
  const [billClientId, setBillClientId] = useState<string | null>(null)

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
    billClientId,
    setBillClientId,
    setTimerClientId,
    // mutations
  }
}

export type ClientsPageState = ReturnType<typeof useClientsPageState>
