'use client'

import { TAB_DESCRIPTORS } from '../_constants'
import type { Tab } from '../_types'

/**
 * Tab bar across the top of the documents page. Library tab shows a
 * count badge with the number of saved drafts (the original kept it
 * keyed off `documents.length` regardless of which tab the count
 * applies to, preserved here).
 */
export function DocumentsTabs({
  active,
  onChange,
  documentCount,
}: {
  active: Tab
  onChange: (tab: Tab) => void
  documentCount: number
}) {
  return (
    <div
      className="mt-6 flex items-center gap-6 border-b"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      {TAB_DESCRIPTORS.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="relative inline-flex items-center gap-1.5 px-0.5 pb-3 text-[13.5px] font-medium transition-colors"
            style={{
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {tab.label}
            {tab.id === 'library' && documentCount > 0 && (
              <span
                className="text-[10.5px] font-medium px-1.5 py-0.5 rounded tabular-nums"
                style={{
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-muted)',
                }}
              >
                {documentCount}
              </span>
            )}
            {isActive && (
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full"
                style={{ background: 'var(--gold)' }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
