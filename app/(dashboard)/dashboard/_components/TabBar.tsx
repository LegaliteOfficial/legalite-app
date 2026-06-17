'use client'

import { TABS } from '../_constants'
import type { TabId } from '../_types'

export function TabBar({
  active,
  onChange,
}: {
  active: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <div
      className="flex items-center gap-7 border-b"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      {TABS.map((t) => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className="relative px-0.5 pb-3 text-[13.5px] font-medium transition-colors"
            style={{
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {t.label}
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
