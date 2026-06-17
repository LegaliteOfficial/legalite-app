'use client'

import { Check, Warning } from '@phosphor-icons/react'
import { BRAND_COLOR_PRESETS } from '../_constants'

export function BrandColorPicker({
  value,
  onChange,
  firmName,
}: {
  value: string | null
  onChange: (color: string | null) => void
  firmName: string
}) {
  const initials = firmName
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'
  // If the current value isn't one of the presets, surface it on
  // the custom-colour input so the user sees they're using a
  // bespoke shade.
  const isCustom = value !== null && !BRAND_COLOR_PRESETS.some((p) => p.value === value)
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Live preview chip — square, mirrors the sidebar render. */}
      <span
        aria-hidden
        title="Sidebar preview"
        className="inline-flex items-center justify-center h-10 w-10 rounded-md text-[12px] font-semibold border shrink-0"
        style={{
          background: value ?? 'transparent',
          color: value ? readableTextOnBg(value) : '#9CA3AF',
          borderColor: value ? value : 'var(--border)',
        }}
      >
        {value ? initials : '—'}
      </span>

      {/* Preset swatch row. Selected preset gets a ring so the
          active choice stays obvious. */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {BRAND_COLOR_PRESETS.map((p) => {
          const active = value === p.value
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              title={p.label}
              aria-label={`${p.label} brand colour`}
              aria-pressed={active}
              className="h-7 w-7 rounded-md transition-transform cursor-pointer hover:scale-110"
              style={{
                background: p.value,
                boxShadow: active
                  ? '0 0 0 2px white, 0 0 0 4px var(--gold)'
                  : '0 0 0 1px var(--border)',
              }}
            />
          )
        })}
        {/* Custom colour input — native HTML colour picker. The
            label wraps it so the entire chip is clickable. */}
        <label
          title="Custom colour"
          className="relative h-7 w-7 rounded-md cursor-pointer overflow-hidden flex items-center justify-center"
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            boxShadow: isCustom ? '0 0 0 2px white, 0 0 0 4px var(--gold)' : undefined,
          }}
        >
          <input
            type="color"
            value={value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#888888'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {/* Diagonal rainbow strip hinting at "any colour". */}
          <span
            aria-hidden
            className="absolute inset-1 rounded-sm"
            style={{
              background:
                'conic-gradient(from 180deg, #ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #6366f1, #ec4899, #ef4444)',
              opacity: 0.85,
            }}
          />
        </label>
      </div>

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-1 text-xs font-semibold underline underline-offset-2"
          style={{ color: '#6B7280' }}
        >
          Clear colour
        </button>
      )}
    </div>
  )
}

/**
 * Mirrors the Sidebar's contrast helper so the preview chip in
 * this picker uses the exact same text-colour logic as the live
 * sidebar render — what the user sees here is what they get.
 */
function readableTextOnBg(bg: string): string {
  let hex = bg.trim()
  if (hex.startsWith('#')) hex = hex.slice(1)
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('')
  }
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#FFFFFF'
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255
  const srgb = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const lum = 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
  return lum > 0.42 ? '#0D1B2A' : '#FFFFFF'
}
