'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  listOutcomes,
  listWorkers,
  usePerformanceStore,
  type OutcomeRecord,
  type Worker,
} from '@/stores/performance-local.store'
import {
  inRange,
  periodRange,
  previousRange,
  type PeriodId,
  type Range,
} from '../_lib/period'

export interface WorkerStats {
  worker: Worker
  casesWon: number
  casesLost: number
  /** 0..1, or null when no cases were closed in range. */
  winRate: number | null
  clientsGained: number
  clientsLost: number
  /** Total recorded outcomes — default ranking signal. */
  activity: number
}

export interface Totals {
  casesWon: number
  casesLost: number
  clientsGained: number
  clientsLost: number
  winRate: number | null
}

function emptyTotals(): Totals {
  return { casesWon: 0, casesLost: 0, clientsGained: 0, clientsLost: 0, winRate: null }
}

function totalsFor(outcomes: OutcomeRecord[], range: Range): Totals {
  const t = { casesWon: 0, casesLost: 0, clientsGained: 0, clientsLost: 0 }
  for (const o of outcomes) {
    if (!inRange(o.date, range)) continue
    if (o.type === 'case_won') t.casesWon++
    else if (o.type === 'case_lost') t.casesLost++
    else if (o.type === 'client_acquired') t.clientsGained++
    else if (o.type === 'client_lost') t.clientsLost++
  }
  const closed = t.casesWon + t.casesLost
  return { ...t, winRate: closed === 0 ? null : t.casesWon / closed }
}

/**
 * Performance page state — owns the period selection and derives the
 * per-worker leaderboard plus firm totals (and the prior-period totals
 * for trend deltas) from the local outcomes store.
 */
export function usePerformance() {
  const [hydrated, setHydrated] = useState(false)
  const [periodId, setPeriodId] = useState<PeriodId>('this_year')

  const revision = usePerformanceStore((s) => s.revision)
  const addOutcome = usePerformanceStore((s) => s.addOutcome)
  const deleteOutcome = usePerformanceStore((s) => s.deleteOutcome)

  useEffect(() => {
    void Promise.resolve(usePerformanceStore.persist.rehydrate()).then(() =>
      setHydrated(true),
    )
  }, [])

  const range = useMemo(() => periodRange(periodId), [periodId])
  const prev = useMemo(() => previousRange(range), [range])

  const { rows, totals, prevTotals, workers } = useMemo(() => {
    const workers = listWorkers()
    const outcomes = listOutcomes()

    const rows: WorkerStats[] = workers
      .map((worker) => {
        const mine = outcomes.filter(
          (o) => o.workerId === worker.id && inRange(o.date, range),
        )
        const casesWon = mine.filter((o) => o.type === 'case_won').length
        const casesLost = mine.filter((o) => o.type === 'case_lost').length
        const clientsGained = mine.filter((o) => o.type === 'client_acquired').length
        const clientsLost = mine.filter((o) => o.type === 'client_lost').length
        const closed = casesWon + casesLost
        return {
          worker,
          casesWon,
          casesLost,
          winRate: closed === 0 ? null : casesWon / closed,
          clientsGained,
          clientsLost,
          activity: mine.length,
        }
      })
      .sort(
        (a, b) =>
          b.casesWon - a.casesWon ||
          b.clientsGained - a.clientsGained ||
          b.activity - a.activity,
      )

    return {
      workers,
      rows,
      totals: totalsFor(outcomes, range),
      prevTotals: totalsFor(outcomes, prev),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, range, prev, hydrated])

  return {
    hydrated,
    periodId,
    setPeriodId,
    rows,
    totals: totals ?? emptyTotals(),
    prevTotals,
    workers,
    addOutcome,
    deleteOutcome,
  }
}
