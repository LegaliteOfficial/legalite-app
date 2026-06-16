'use client'

/**
 * Tabular density toggle. Switch-style control because users tend to
 * leave their preference on; a plain checkbox would feel less premium.
 */
export function ExpandRowsToggle({
  expanded,
  onChange,
}: {
  expanded: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      className="inline-flex items-center gap-2 text-[12px] cursor-pointer select-none"
      style={{ color: 'var(--text-secondary)' }}
    >
      <span
        role="switch"
        aria-checked={expanded}
        tabIndex={0}
        onClick={() => onChange(!expanded)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            onChange(!expanded)
          }
        }}
        className="relative inline-flex h-[18px] w-[32px] rounded-full transition-colors"
        style={{
          background: expanded ? 'var(--gold)' : 'var(--border-default)',
        }}
      >
        <span
          className="absolute top-0.5 left-0.5 h-[14px] w-[14px] rounded-full bg-white transition-transform"
          style={{
            transform: expanded ? 'translateX(14px)' : 'translateX(0)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
          }}
        />
      </span>
      Expand rows
    </label>
  )
}
