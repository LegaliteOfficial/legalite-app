'use client'

/**
 * Small "label + em-dash value + coloured tick" used in the Firm
 * overview totals row. Renders an em-dash today because the
 * utilisation data isn't wired through yet; the structure is here so
 * the moment the ledger lands the values just drop in.
 */
export function TotalsMini({ label, color }: { label: string; color: string }) {
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
        —
      </div>
    </div>
  )
}
