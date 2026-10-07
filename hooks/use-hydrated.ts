'use client'

import { useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/**
 * False on the server and during the hydration pass, true afterwards.
 *
 * Suspense queries gate on this: the Apollo client reads the auth token
 * from localStorage, so running a query during SSR would go out
 * unauthenticated. Rendering the section skeleton until hydrated keeps
 * the server markup and the first client render identical.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false)
}
