'use client'

import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import type { Worker } from '@/stores/performance-local.store'

export interface Viewer {
  /** Admins (owner/admin) see everyone and can record for anyone. */
  isAdmin: boolean
  /** The worker the current user maps to, for the "Mine" / member view. */
  me: Worker | undefined
}

/**
 * Resolve the current user's performance viewpoint.
 *
 * Role: admin unless the firm membership is explicitly `member`, so an
 * owner/admin (or an unresolved dev session) gets the full firm view
 * while genuine members are scoped to themselves.
 *
 * Identity: match the signed-in user's name to a roster worker, falling
 * back to the first worker so the personal view always has something to
 * show in a seeded/dev setup.
 */
export function useViewerPerformance(workers: Worker[]): Viewer {
  const userName = useAuthStore((s) => s.user?.name ?? null)
  const firmRole = useAuthStore((s) => s.activeMembership?.firm_role ?? null)

  const isAdmin = firmRole !== 'member'

  const me = useMemo(() => {
    if (workers.length === 0) return undefined
    const match = userName
      ? workers.find((w) => w.name.toLowerCase() === userName.toLowerCase())
      : undefined
    return match ?? workers[0]
  }, [workers, userName])

  return { isAdmin, me }
}
