'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  listRecoverableItems,
  useRecoveryBinStore,
  type DeletedItem,
} from '@/stores/recovery-bin-local.store'
import type { KindTabId } from '../_types'

/**
 * Recovery-bin list state — kind tab + keyword filter, reading from the
 * local persisted store. Rehydrates once on mount and sweeps expired
 * tombstones so the bin reflects the retention window; `revision`
 * drives recompute on every write.
 */
export function useRecoveryBinState() {
  const [activeTab, setActiveTab] = useState<KindTabId>('all')
  const [query, setQuery] = useState('')
  const [hydrated, setHydrated] = useState(false)

  const revision = useRecoveryBinStore((s) => s.revision)
  const purgeExpired = useRecoveryBinStore((s) => s.purgeExpired)

  useEffect(() => {
    void Promise.resolve(useRecoveryBinStore.persist.rehydrate()).then(() => {
      purgeExpired()
      setHydrated(true)
    })
  }, [purgeExpired])

  const allItems = useMemo<DeletedItem[]>(
    () => listRecoverableItems(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision, hydrated],
  )

  const items = useMemo(() => {
    const scope =
      activeTab === 'all'
        ? allItems
        : allItems.filter((it) => it.kind === activeTab)
    const q = query.trim().toLowerCase()
    if (!q) return scope
    return scope.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        (it.subtitle?.toLowerCase().includes(q) ?? false),
    )
  }, [activeTab, query, allItems])

  return {
    isLoading: !hydrated,
    activeTab,
    changeTab: setActiveTab,
    query,
    changeQuery: setQuery,
    items,
    total: items.length,
    /** Total in the bin regardless of tab/search — drives "Empty bin". */
    binCount: allItems.length,
  }
}
