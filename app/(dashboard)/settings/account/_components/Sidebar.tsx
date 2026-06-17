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
    <div className="lg:col-span-1">
      <div
        className="rounded-xl border p-2 space-y-1 lg:sticky lg:top-6"
        style={{ background: 'white', borderColor: 'var(--border)' }}
      >
        {SECTIONS_NAV.map((s) => {
          const Icon = s.icon
          const isActive = active === s.id
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isActive
                  ? 'rgba(201,151,43,0.08)'
                  : 'transparent',
                color: isActive ? '#C9972B' : '#6B7280',
              }}
            >
              <Icon size={16} />
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
