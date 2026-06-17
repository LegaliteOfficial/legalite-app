'use client'

import { SIDEBAR_ITEMS } from '../_constants'
import type { GrantedCount } from '../_types'

/**
 * Sticky left-rail nav. Highlights the active section (driven by the
 * scroll-spy IntersectionObserver in the state hook) and surfaces the
 * per-section granted/total counts so the user can see progress
 * without scrolling each section into view.
 */
export function Sidebar({
  activeId,
  grantedCounts,
}: {
  activeId: string
  grantedCounts: Record<string, GrantedCount>
}) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div
        className="text-[10px] font-bold tracking-[3px] uppercase mb-3"
        style={{ color: '#9CA3AF' }}
      >
        Sections
      </div>
      <ul className="space-y-0.5">
        {SIDEBAR_ITEMS.map((item) => {
          const active = item.id === activeId
          const counts = grantedCounts[item.id]
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm transition-colors"
                style={{
                  background: active
                    ? 'rgba(201,151,43,0.10)'
                    : 'transparent',
                  color: active ? 'var(--gold)' : 'var(--navy)',
                  fontWeight: active ? 700 : 500,
                }}
              >
                <span>{item.label}</span>
                {counts && (
                  <span
                    className="text-[10px] font-bold tabular-nums"
                    style={{ color: active ? 'var(--gold)' : '#9CA3AF' }}
                  >
                    {counts.granted}/{counts.total}
                  </span>
                )}
              </a>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
