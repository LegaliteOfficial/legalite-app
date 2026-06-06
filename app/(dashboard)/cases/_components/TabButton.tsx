'use client'

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
      onClick={onClick}
      className="relative px-4 py-2.5 text-[14px] font-medium transition-colors"
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
