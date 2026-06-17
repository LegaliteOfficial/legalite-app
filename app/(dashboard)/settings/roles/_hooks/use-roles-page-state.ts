'use client'

import { useMemo, useState } from 'react'
import { useFirmRoles } from '@/hooks/use-firm-roles'
import { PAGE_SIZE } from '../_constants'
import { toRole } from '../_lib/to-role'
import type { Role, TabId } from '../_types'

/**
 * Roles list state — tab + keyword filter + paging. Both filters reset
 * the page to 0 so a narrowed result set doesn't strand the user on a
 * page that's now beyond the end.
 */
export function useRolesPageState() {
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const { data: roleData, isLoading } = useFirmRoles()
  const roles = useMemo<Role[]>(
    () => (roleData ?? []).map(toRole),
    [roleData],
  )

  const filteredRoles = useMemo(() => {
    let scope: Role[]
    switch (activeTab) {
      case 'all':
        scope = roles
        break
      case 'custom':
        scope = roles.filter((r) => r.kind === 'custom')
        break
      case 'standard':
        scope = roles.filter((r) => r.kind === 'standard')
        break
    }
    const q = query.trim().toLowerCase()
    if (!q) return scope
    return scope.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    )
  }, [activeTab, query, roles])

  const total = filteredRoles.length
  const start = total === 0 ? 0 : page * PAGE_SIZE + 1
  const end = Math.min(total, (page + 1) * PAGE_SIZE)
  const pageRoles = filteredRoles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const canPrev = page > 0
  const canNext = end < total

  const changeTab = (id: TabId) => {
    setActiveTab(id)
    setPage(0)
  }
  const changeQuery = (q: string) => {
    setQuery(q)
    setPage(0)
  }

  return {
    isLoading,
    activeTab,
    changeTab,
    query,
    changeQuery,
    page,
    setPage,
    total,
    start,
    end,
    pageRoles,
    canPrev,
    canNext,
  }
}
