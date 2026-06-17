'use client'

import { MagnifyingGlass, SlidersHorizontal } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { TABS } from '../_constants'
import type { TabId } from '../_types'

/**
 * Tabs + keyword search + filter affordance. The filter button toasts
 * a "coming soon" message until the advanced-filters panel ships.
 */
export function RolesToolbar({
  activeTab,
  onTabChange,
  query,
  onQueryChange,
}: {
  activeTab: TabId
  onTabChange: (id: TabId) => void
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
                color: active ? 'white' : '#6B7280',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <MagnifyingGlass
            size={14}
            strokeWidth={2}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: '#9CA3AF' }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by keyword"
            className="h-9 w-64 rounded-md border bg-white pl-9 pr-3 text-sm transition-colors focus:outline-none focus:border-yellow-600"
            style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
          />
        </div>
        <button
          type="button"
          onClick={() => toast.message('Filter panel coming soon.')}
          aria-label="Open filters"
          className="h-9 w-9 rounded-md border flex items-center justify-center transition-colors hover:bg-black/[0.02]"
          style={{ borderColor: 'var(--border)', background: 'white' }}
        >
          <SlidersHorizontal
            size={14}
            strokeWidth={2}
            style={{ color: 'var(--navy)' }}
          />
        </button>
      </div>
    </div>
  )
}
