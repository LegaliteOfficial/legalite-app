'use client'

export function MenuItem({
  children,
  onClick,
  tone = 'default',
}: {
  children: React.ReactNode
  onClick: () => void
  tone?: 'default' | 'danger' | 'disabled'
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        if (tone !== 'disabled') onClick()
      }}
      disabled={tone === 'disabled'}
      className="w-full text-left text-sm px-3 py-2 transition-colors hover:bg-black/[0.04] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ color: tone === 'danger' ? '#B91C1C' : 'var(--navy)' }}
    >
      {children}
    </button>
  )
}
