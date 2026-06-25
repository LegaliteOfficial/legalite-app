'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  listAllCustomFields,
  useCustomFieldsStore,
  type CustomField,
} from '@/stores/custom-fields-local.store'
import type { EntityTabId } from '../_types'

/**
 * Custom-fields list state — entity tab + keyword filter, reading from
 * the local persisted store. The store ships with skipHydration, so we
 * rehydrate once on mount; `revision` drives recompute on every write.
 */
export function useCustomFieldsPageState() {
  const [activeTab, setActiveTab] = useState<EntityTabId>('all')
  const [query, setQuery] = useState('')
  const [hydrated, setHydrated] = useState(false)

  const revision = useCustomFieldsStore((s) => s.revision)

  useEffect(() => {
    void useCustomFieldsStore.persist.rehydrate()
    setHydrated(true)
  }, [])

  const allFields = useMemo<CustomField[]>(
    () => listAllCustomFields(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision, hydrated],
  )

  const fields = useMemo(() => {
    const scope =
      activeTab === 'all'
        ? allFields
        : allFields.filter((f) => f.entity === activeTab)
    const q = query.trim().toLowerCase()
    if (!q) return scope
    return scope.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        (f.helpText?.toLowerCase().includes(q) ?? false),
    )
  }, [activeTab, query, allFields])

  return {
    isLoading: !hydrated,
    activeTab,
    changeTab: setActiveTab,
    query,
    changeQuery: setQuery,
    fields,
    total: fields.length,
  }
}
