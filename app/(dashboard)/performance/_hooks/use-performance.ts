'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
  /** Important tasks an admin credited to this worker. */
  keyTasks: number
  /** Total recorded outcomes — default ranking signal. */
  activity: number
}

export interface Totals {
  casesWon: number
  casesLost: number
  clientsGained: number
  clientsLost: number
  keyTasks: number
  winRate: number | null
}

function emptyTotals(): Totals {
  return { casesWon: 0, casesLost: 0, clientsGained: 0, clientsLost: 0, keyTasks: 0, winRate: null }
}

function totalsFromList(list: OutcomeRecord[]): Totals {
  const t = { casesWon: 0, casesLost: 0, clientsGained: 0, clientsLost: 0, keyTasks: 0 }
  for (const o of list) {
    if (o.type === 'case_won') t.casesWon++
    else if (o.type === 'case_lost') t.casesLost++
    else if (o.type === 'client_acquired') t.clientsGained++
    else if (o.type === 'client_lost') t.clientsLost++
    else if (o.type === 'key_task') t.keyTasks++
  }
  const closed = t.casesWon + t.casesLost
  return { ...t, winRate: closed === 0 ? null : t.casesWon / closed }
}

function totalsFor(outcomes: OutcomeRecord[], range: Range): Totals {
  return totalsFromList(outcomes.filter((o) => inRange(o.date, range)))
}

/** A single worker's totals (current + prior period) and their in-range outcomes. */
export interface PersonalPerformance {
  totals: Totals
  prevTotals: Totals
  outcomes: OutcomeRecord[]
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

  // One worker's view — drives the member / "Mine" experience.
  const personalFor = useCallback(
    (workerId: string): PersonalPerformance => {
      const mine = listOutcomes().filter((o) => o.workerId === workerId)
      const inCur = mine.filter((o) => inRange(o.date, range))
      return {
        totals: totalsFromList(inCur),
        prevTotals: totalsFor(mine, prev),
        outcomes: inCur.sort((a, b) => b.date.localeCompare(a.date)),
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision, range, prev, hydrated],
  )

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
        const keyTasks = mine.filter((o) => o.type === 'key_task').length
        const closed = casesWon + casesLost
        return {
          worker,
          casesWon,
          casesLost,
          winRate: closed === 0 ? null : casesWon / closed,
          clientsGained,
          clientsLost,
          keyTasks,
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
    personalFor,
    addOutcome,
    deleteOutcome,
  }
}
