'use client'

/**
 * Performance — composition root.
 *
 * The admin's view of how the firm and its people are doing over a
 * chosen period: a firm-wide KPI strip, then a per-worker leaderboard.
 * Outcomes the system can't infer (cases won/lost, clients gained/lost)
 * are captured via "Record outcome". Revenue and hours are stubbed
 * until billing and time tracking are wired in.
 */

import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { Spinner } from '@/components/shared/Spinner'
import { PageHeader } from '@/components/shared/PageHeader'
import { usePerformance } from './_hooks/use-performance'
import { PeriodSelector } from './_components/PeriodSelector'
import { SummaryStrip } from './_components/SummaryStrip'
import { LeaderboardTable } from './_components/LeaderboardTable'
import { RecordOutcomeDialog } from './_components/RecordOutcomeDialog'

export default function PerformancePage() {
  const perf = usePerformance()
  const [recordOpen, setRecordOpen] = useState(false)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <PageHeader
          title="Performance"
          description="Measure how the firm and each worker are doing over time."
          actions={
            <div className="flex items-center gap-2">
              <PeriodSelector value={perf.periodId} onChange={perf.setPeriodId} />
              <button
                type="button"
                onClick={() => setRecordOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--gold)' }}
              >
                <Plus size={14} strokeWidth={2.5} /> Record outcome
              </button>
            </div>
          }
        />

        {!perf.hydrated ? (
          <div
            className="flex items-center justify-center gap-2 py-24"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Spinner size={16} /> <span className="text-sm">Loading performance…</span>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <SummaryStrip
              totals={perf.totals}
              prevTotals={perf.prevTotals}
              periodId={perf.periodId}
            />
            <LeaderboardTable rows={perf.rows} />
          </div>
        )}
      </div>

      <RecordOutcomeDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        workers={perf.workers}
      />
    </div>
  )
}
