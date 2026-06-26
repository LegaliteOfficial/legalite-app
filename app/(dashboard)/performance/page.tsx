'use client'

/**
 * Performance — composition root.
 *
 * Role-aware: admins get the firm view (KPI strip + leaderboard) with a
 * "Mine" toggle; members see only their own performance. Outcomes the
 * system can't infer (cases won/lost, clients gained/lost) are captured
 * via "Record outcome". Revenue and hours are stubbed until billing and
 * time tracking are wired in. The body is shared with the dashboard's
 * Performance tab.
 */

import { PageHeader } from '@/components/shared/PageHeader'
import { PerformanceContent } from './_components/PerformanceContent'

export default function PerformancePage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <PageHeader
          title="Performance"
          description="Measure how the firm and each worker are doing over time."
        />
        <div className="mt-6">
          <PerformanceContent />
        </div>
      </div>
    </div>
  )
}
