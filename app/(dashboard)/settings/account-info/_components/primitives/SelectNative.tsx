'use client'

import { CaretDown } from '@phosphor-icons/react'

export function SelectNative({
  value, onChange, options, fullWidth,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  fullWidth?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none rounded-md border bg-white h-10 px-3 pr-9 text-sm transition-colors hover:bg-black/[0.02] focus:outline-none focus:border-yellow-600 ${fullWidth ? 'w-full' : 'w-full'}`}
      style={{
        borderColor: 'var(--border)',
        color: 'var(--navy)',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236B7280\' stroke-width=\'2.25\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '12px',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
