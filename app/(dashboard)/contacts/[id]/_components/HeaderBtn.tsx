'use client'

/**
 * Outline-style secondary header action — matches the "Save and create
 * new case" treatment on `/contacts/new` so the design language is
 * consistent across the contact create / detail flows.
 */
export function HeaderBtn({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center h-9 px-3.5 rounded-lg border text-[13px] font-medium cursor-pointer transition-colors whitespace-nowrap"
      style={{
        borderColor: 'var(--border-default)',
        background: 'var(--surface-card)',
        color: 'var(--text-primary)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-sunken)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--surface-card)'
      }}
    >
      {children}
    </button>
  )
}
