'use client'

import { DOCUMENT_TEMPLATES } from '@/lib/templates'
import { CATEGORIES } from '../_constants'

/**
 * Horizontal scrollable row of category pills. Counts are derived from
 * `DOCUMENT_TEMPLATES`, and a category with nothing in it is left out
 * rather than offered as a filter that returns an empty page.
 */
export function CategoryFilterRow({
  selectedCategory,
  onSelect,
}: {
  selectedCategory: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
      {CATEGORIES.filter((cat) => {
        if (cat.id === 'all') return true
        return DOCUMENT_TEMPLATES.some((t) => t.category === cat.id)
      }).map((cat) => {
        const isActive = selectedCategory === cat.id
        const count =
          cat.id === 'all'
            ? DOCUMENT_TEMPLATES.length
            : DOCUMENT_TEMPLATES.filter((t) => t.category === cat.id).length
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-colors"
            style={{
              background: isActive ? 'var(--surface-sunken)' : 'transparent',
              color: isActive
                ? 'var(--text-primary)'
                : 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = 'var(--surface-overlay)'
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = 'transparent'
            }}
          >
            {cat.label}
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
  )
}
