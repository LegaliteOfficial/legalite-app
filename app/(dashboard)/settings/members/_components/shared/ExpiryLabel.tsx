'use client'

import { useNow } from '@/hooks/use-now'

export function ExpiryLabel({ expiresAt }: { expiresAt: string }) {
  const now = useNow()
  const expired = new Date(expiresAt).getTime() < now
  const formatted = new Date(expiresAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return (
    <span
      className="text-sm"
      style={{ color: expired ? '#B91C1C' : '#6B7280' }}
    >
      {expired ? 'Expired' : formatted}
    </span>
  )
}
