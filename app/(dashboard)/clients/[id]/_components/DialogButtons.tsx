'use client'

export function PrimaryDialogBtn({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: 'var(--gold)',
        color: 'var(--navy)',
        boxShadow:
          '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.background = 'var(--gold-dark, #B0831F)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--gold)'
      }}
    >
      {label}
    </button>
  )
}

/**
 * Ghost cancel button used in dialog footers — quiet text-only style
 * matching the contacts page header's Cancel button. Centralised so
 * the four dialogs share the same hover treatment.
 */
export function GhostDialogBtn({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center h-9 px-3 rounded-lg text-[13px] font-medium cursor-pointer transition-colors disabled:opacity-50"
      style={{ color: 'var(--text-muted)', background: 'transparent' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-sunken)'
        e.currentTarget.style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-muted)'
      }}
    >
      {label}
    </button>
  )
}

