'use client'

/**
 * Icon + label column + flexing value column. Used inside
 * ClientDetailsDialog so every row aligns identically.
 */
export function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="inline-flex items-center gap-1.5 w-28 shrink-0 pt-0.5"
        style={{ color: 'var(--text-muted)' }}
      >
        {icon}
        {label}
      </span>
      <span
        className="flex-1 min-w-0"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </span>
    </div>
  )
}
