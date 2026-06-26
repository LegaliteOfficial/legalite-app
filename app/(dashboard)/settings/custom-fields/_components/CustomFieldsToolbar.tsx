'use client'

import { MagnifyingGlass } from '@phosphor-icons/react'
import { TABS } from '../_constants'
import type { EntityTabId } from '../_types'

/**
 * Entity tabs (All / Clients / Cases / Contacts) + keyword search.
 */
export function CustomFieldsToolbar({
  activeTab,
  onTabChange,
  query,
  onQueryChange,
}: {
  activeTab: EntityTabId
  onTabChange: (id: EntityTabId) => void
  query: string
  onQueryChange: (q: string) => void
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 flex-wrap px-5 pt-4 pb-3 border-b"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-1 flex-wrap">
        {TABS.map((t) => {
          const active = t.id === activeTab
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className="rounded-md px-3 py-1.5 text-sm font-semibold transition-colors"
              style={{
                background: active ? 'var(--navy)' : 'transparent',
                color: active ? 'white' : 'var(--text-secondary)',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="relative">
        <MagnifyingGlass
          size={14}
          strokeWidth={2}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by name"
          className="h-9 w-64 rounded-md border bg-white pl-9 pr-3 text-sm transition-colors focus:outline-none focus:border-yellow-600"
          style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
        />
      </div>
    </div>
  )
}
