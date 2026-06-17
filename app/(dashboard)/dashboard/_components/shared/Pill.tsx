'use client'

/**
 * Bordered pill button used by the Firm overview filter row.
 * Decorative — clicking is a no-op until the filters wire up to real
 * data.
 */
export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-black/5"
      style={{
        borderColor: 'var(--border-default)',
        background: 'var(--surface-card)',
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </button>
  )
}
