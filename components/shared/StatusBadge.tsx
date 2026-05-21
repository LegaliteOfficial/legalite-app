'use client'

import { cn } from '@/lib/utils'

const DOT_COLORS: Record<string, string> = {
  Active:        '#2E7D4F',
  Done:          '#2E7D4F',
  Paid:          '#2E7D4F',
  Low:           '#2E7D4F',
  Pending:       '#C9972B',
  Draft:         '#8A8F99',
  Medium:        '#C9972B',
  Sent:          '#2563EB',
  'In Progress': '#2563EB',
  Inactive:      '#8A8F99',
  Closed:        '#8A8F99',
  Overdue:       '#C0392B',
  High:          '#C0392B',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const dot = DOT_COLORS[status] ?? '#8A8F99'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-medium',
        className,
      )}
      style={{
        background: 'var(--surface-sunken)',
        color: 'var(--text-secondary)',
      }}
    >
      <span
        aria-hidden
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: dot }}
      />
      {status}
    </span>
  )
}
