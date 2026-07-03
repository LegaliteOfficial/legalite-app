'use client'

import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { Spinner } from '@/components/shared/Spinner'
import { usePerformance } from '../_hooks/use-performance'
import { useViewerPerformance } from '../_hooks/use-viewer'
import { PeriodSelector } from './PeriodSelector'
import { SummaryStrip } from './SummaryStrip'
import { LeaderboardTable } from './LeaderboardTable'
import { PersonalPerformance } from './PersonalPerformance'
import { RecordOutcomeDialog } from './RecordOutcomeDialog'

/**
 * Role-aware performance surface, shared by the dashboard tab and the
 * dedicated page.
 *
 * - Admins (owner/admin): a "Firm / Mine" scope toggle. Firm shows the
 *   KPI strip + full leaderboard and lets them record for anyone; Mine
 *   shows their own view.
 * - Members: only their own performance, and Record is locked to them.
 */
export function PerformanceContent() {
  const perf = usePerformance()
  const { isAdmin, me } = useViewerPerformance(perf.workers)
  const [scope, setScope] = useState<'firm' | 'mine'>(isAdmin ? 'firm' : 'mine')
  const [recordOpen, setRecordOpen] = useState(false)

  if (!perf.hydrated) {
    return (
      <div
        className="flex items-center justify-center gap-2 py-24"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Spinner size={16} /> <span className="text-sm">Loading performance…</span>
      </div>
    )
  }

  // Members are always scoped to themselves regardless of toggle state.
  const effectiveScope = isAdmin ? scope : 'mine'
  const lockedWorker = effectiveScope === 'mine' ? me : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {isAdmin ? (
          <div
            className="inline-flex items-center gap-1 rounded-lg border p-1"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-card)' }}
          >
            {(['firm', 'mine'] as const).map((s) => {
              const active = scope === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className="rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors"
                  style={{
                    background: active ? 'var(--navy)' : 'transparent',
                    color: active ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {s === 'firm' ? 'Firm' : 'Mine'}
                </button>
              )
            })}
          </div>
        ) : (
          <div />
        )}

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
      </div>

      {effectiveScope === 'firm' ? (
        <>
          <SummaryStrip
            totals={perf.totals}
            prevTotals={perf.prevTotals}
            periodId={perf.periodId}
          />
          <LeaderboardTable rows={perf.rows} />
        </>
      ) : me ? (
        <PersonalPerformance
          worker={me}
          data={perf.personalFor(me.id)}
          periodId={perf.periodId}
          heading={isAdmin ? 'Your performance' : undefined}
        />
      ) : (
        <p className="py-12 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          No performance profile found for your account yet.
        </p>
      )}

      <RecordOutcomeDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        workers={perf.workers}
        lockedWorker={lockedWorker}
        canAddKeyTask={isAdmin}
      />
    </div>
  )
}
