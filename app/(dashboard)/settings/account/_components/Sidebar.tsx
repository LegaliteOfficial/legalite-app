'use client'

import { SECTIONS_NAV } from '../_constants'
import type { SectionId } from '../_types'

export function Sidebar({
  active,
  onChange,
}: {
  active: SectionId
  onChange: (id: SectionId) => void
}) {
  return (
    <nav
      className="rounded-xl border p-2 space-y-1"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border)' }}
    >
      {SECTIONS_NAV.map((s) => {
        const Icon = s.icon
        const isActive = active === s.id
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: isActive ? 'var(--gold-muted)' : 'transparent',
              color: isActive ? 'var(--gold-dark)' : 'var(--text-secondary)',
            }}
          >
            <Icon size={16} />
            {s.label}
          </button>
        )
      })}
    </nav>
  )
}
