'use client'

/**
 * Icon-only pagination button. Hover paints a soft surface, disabled
 * fades to 30% and blocks the cursor.
 */
export function IconNav({
  onClick,
  disabled,
  children,
  ...rest
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => {
        if (!disabled)
          e.currentTarget.style.background = 'var(--surface-sunken)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
