'use client'

import { ToggleSwitch } from './ToggleSwitch'

export function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onToggle,
}: {
  icon: React.ElementType
  label: string
  description: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: 'rgba(201,151,43,0.08)' }}
        >
          <Icon size={16} style={{ color: '#C9972B' }} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: '#0D1B2A' }}>
            {label}
          </p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            {description}
          </p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onToggle={onToggle} />
    </div>
  )
}
