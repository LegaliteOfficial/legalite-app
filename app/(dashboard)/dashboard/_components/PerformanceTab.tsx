'use client'

import { PerformanceContent } from '../../performance/_components/PerformanceContent'

/**
 * Dashboard "Performance" tab — renders the same role-aware performance
 * surface as the dedicated /performance page, so members see (and
 * record) their own outcomes and admins see the whole firm.
 */
export function PerformanceTab() {
  return <PerformanceContent />
}
