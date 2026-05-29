'use client'

/**
 * PageSkeleton — universal page-level loading state.
 *
 * Historically this rendered a row-of-bars Skeleton placeholder.
 * It now wraps `PageLoader` so the law-themed scales-of-justice
 * animation appears uniformly wherever any page or list-level
 * loading is in flight (matches the route-level `loading.tsx`
 * files, the auth bounce, dashboard tab switches, etc).
 *
 * Keeping the `PageSkeleton` export means we don't have to touch
 * every call site that already imports this — the visual swap
 * propagates with a single change here.
 */

import { PageLoader } from '@/components/shared/PageLoader'

export function PageSkeleton() {
  return <PageLoader />
}
