'use client'

import { UserPlus } from '@phosphor-icons/react'

export function EmptyState({
  icon,
  title,
  body,
  action,
  actionLabel,
}: {
  icon: React.ReactNode
  title: string
  body: string
  action: () => void
  actionLabel: string
}) {
  return (
    <div className="py-16 px-5 text-center">
      <div
        className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(13,27,42,0.06)' }}
      >
        {icon}
      </div>
      <h3
        className="font-heading text-lg font-bold mb-1"
        style={{ color: 'var(--navy)' }}
      >
        {title}
      </h3>
      <p
        className="text-sm mb-5 max-w-sm mx-auto leading-relaxed"
        style={{ color: '#6B7280' }}
      >
        {body}
      </p>
      <button
        type="button"
        onClick={action}
        className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: 'var(--navy)' }}
      >
        <UserPlus size={14} strokeWidth={2.5} /> {actionLabel}
      </button>
    </div>
  )
}
