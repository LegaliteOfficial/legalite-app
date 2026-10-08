import * as React from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1
          className="font-heading text-[22px] sm:text-[28px] font-semibold leading-tight tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
        )}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
    </div>
  )
}
