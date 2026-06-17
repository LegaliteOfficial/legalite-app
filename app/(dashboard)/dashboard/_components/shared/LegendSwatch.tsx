'use client'

/**
 * Chart legend swatch + label. `dashed=true` renders a transparent
 * box with a dashed border (used for the prior-year comparison
 * series so it reads as a reference line, not a primary series).
 */
export function LegendSwatch({
  color,
  label,
  dashed,
}: {
  color: string
  label: string
  dashed?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-2.5 h-2.5 rounded-sm"
        style={{
          background: dashed ? 'transparent' : color,
          border: dashed ? `1.5px dashed ${color}` : 'none',
        }}
      />
      <span className="truncate">{label}</span>
    </span>
  )
}
