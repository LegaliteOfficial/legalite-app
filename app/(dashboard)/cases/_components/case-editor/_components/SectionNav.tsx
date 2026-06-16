'use client'

import { SECTIONS } from '../_constants'

/**
 * Sticky left-rail nav. Each entry maps 1:1 to a `<Section>` anchor in
 * the main scroller. Clicking jumps to that anchor; the IntersectionObserver
 * in `useCaseEditorState` keeps `active` in sync as the user scrolls.
 */
export function SectionNav({
  active,
  onSelect,
}: {
  active: string
  onSelect: (id: string) => void
}) {
  return (
    <nav
      className="hidden md:flex flex-col shrink-0 w-[240px] border-r overflow-y-auto"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
      }}
    >
      <div
        className="px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        Sections
      </div>
      <ul className="px-2 pb-4 flex flex-col gap-0.5">
        {SECTIONS.map((s) => {
          const isActive = s.id === active
          const Icon = s.Icon
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
                style={{
                  color: isActive
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                  background: isActive
                    ? 'var(--surface-sunken)'
                    : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = 'var(--surface-overlay)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = 'transparent'
                }}
              >
                <Icon size={14} strokeWidth={1.75} />
                <span className="truncate">{s.label}</span>
                {isActive && (
                  <span
                    className="ml-auto w-1 h-4 rounded-full"
                    style={{ background: 'var(--gold)' }}
                  />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
