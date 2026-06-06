'use client'

import type { ButtonHTMLAttributes } from 'react'

export function IconNav({
  onClick,
  disabled,
  children,
  ...rest
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = 'var(--surface-sunken)'
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
