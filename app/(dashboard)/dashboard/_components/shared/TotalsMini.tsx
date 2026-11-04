'use client'

/**
 * Small "label + value + coloured tick" used in the Firm overview
 * totals row. Falls back to an em-dash when there is nothing to show,
 * which reads as "no figure" rather than a misleading zero.
 */
export function TotalsMini({
  label,
  color,
  value,
}: {
  label: string
  color: string
  value?: string | null
}) {
  return (
    <div className="relative pl-3">
      <span
        aria-hidden
        className="absolute left-0 top-0.5 bottom-0.5 w-[2px] rounded-full"
        style={{ background: color }}
      />
      <div
        className="text-[10px] font-medium uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </div>
      <div
        className="font-heading text-[22px] font-semibold leading-tight tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {value ?? '—'}
      </div>
    </div>
  )
}
