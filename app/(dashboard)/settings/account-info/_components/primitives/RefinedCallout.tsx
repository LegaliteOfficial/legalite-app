'use client'

import { Warning } from '@phosphor-icons/react'

export function RefinedCallout({
  Icon, title, body, action,
}: {
  Icon: typeof Warning
  title: string
  body: React.ReactNode
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div
      className="rounded-2xl border p-5 flex items-start gap-4"
      style={{ background: 'rgba(245, 158, 11, 0.06)', borderColor: 'rgba(245, 158, 11, 0.30)' }}
    >
      <span
        className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 mt-0.5"
        style={{ background: 'rgba(245, 158, 11, 0.18)' }}
      >
        <Icon size={18} strokeWidth={2} style={{ color: '#B45309' }} />
      </span>
      <div className="flex-1">
        <p className="font-bold text-sm mb-1.5" style={{ color: '#78350F' }}>{title}</p>
        <p className="text-sm leading-relaxed" style={{ color: '#92400E' }}>{body}</p>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-4 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--navy)' }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
