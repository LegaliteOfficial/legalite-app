'use client'

import type { ReactNode } from 'react'
import { QueryErrorBoundary } from '@/components/shared/QueryErrorBoundary'
import { useClientProfileStore } from '@/stores/client-profile.store'

/**
 * Error boundary for one profile section. "Try again" bumps the store's
 * retry key, which changes the suspense query key and starts a fresh
 * request instead of re-reading the cached error.
 */
export function ProfileErrorBoundary({ label, children }: { label: string; children: ReactNode }) {
  const retry = useClientProfileStore((s) => s.retry)
  return (
    <QueryErrorBoundary label={label} onRetry={retry}>
      {children}
    </QueryErrorBoundary>
  )
}
