'use client'

/**
 * Two side-by-side native date inputs with a dash separator.
 * Used by the Last activity and Status date filters.
 */
export function DateRangeField({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        className="h-10 rounded-lg border px-3 text-[13px]"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
        }}
      />
      <span style={{ color: 'var(--text-muted)' }}>–</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        className="h-10 rounded-lg border px-3 text-[13px]"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
        }}
      />
    </div>
  )
}
