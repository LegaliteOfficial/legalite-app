'use client'

import { TABS } from '../_constants'
import type { TabKey } from '../_types'

/**
 * Tab strip across the top of the table. Gold underline marks the
 * active tab. All / Open / Pending / Closed filter by the client's
 * primary-case status (Open/Pending/Closed) with All as the no-filter
 * passthrough.
 */
export function ClientsTabNav({
  active,
  onChange,
}: {
  active: TabKey
  onChange: (tab: TabKey) => void
}) {
  return (
    <div
      className="mt-5 flex items-center gap-1 border-b"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      {TABS.map((t) => {
        const isActive = active === t
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className="inline-flex items-center px-4 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px cursor-pointer transition-colors"
            style={{
              color: isActive
                ? 'var(--text-primary)'
                : 'var(--text-secondary)',
              borderColor: isActive ? 'var(--gold)' : 'transparent',
              fontWeight: isActive ? 600 : 500,
            }}
          >
            {t}
          </button>
        )
      })}
    </div>
  )
}
