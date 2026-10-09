'use client'

/**
 * Tab strip button. Underline accent in gold marks the active tab.
 */
export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative px-4 py-2.5 text-[13.5px] font-medium transition-colors cursor-pointer"
      style={{
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      }}
    >
      {children}
      {active && (
        <span
          className="absolute left-3 right-3 -bottom-px h-[2px] rounded-t"
          style={{ background: 'var(--gold)' }}
        />
      )}
    </button>
  )
}
