'use client'

import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Active:        { bg: 'rgba(46,125,79,0.1)',  color: '#2E7D4F' },
  Done:          { bg: 'rgba(46,125,79,0.1)',  color: '#2E7D4F' },
  Paid:          { bg: 'rgba(46,125,79,0.1)',  color: '#2E7D4F' },
  Pending:       { bg: 'rgba(201,151,43,0.12)', color: '#B8860B' },
  Draft:         { bg: 'rgba(201,151,43,0.12)', color: '#B8860B' },
  Sent:          { bg: 'rgba(59,130,246,0.1)',  color: '#2563EB' },
  'In Progress': { bg: 'rgba(59,130,246,0.1)',  color: '#2563EB' },
  Inactive:      { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' },
  Closed:        { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' },
  Overdue:       { bg: 'rgba(192,57,43,0.1)',   color: '#C0392B' },
  High:          { bg: 'rgba(192,57,43,0.1)',   color: '#C0392B' },
  Medium:        { bg: 'rgba(201,151,43,0.12)', color: '#B8860B' },
  Low:           { bg: 'rgba(46,125,79,0.1)',   color: '#2E7D4F' },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' }

  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', className)}
      style={{ background: style.bg, color: style.color }}
    >
      {status}
    </span>
  )
}
