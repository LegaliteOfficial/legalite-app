import { useQuery } from '@apollo/client/react'
import { DashboardStatsQueryDoc } from '@/lib/graphql/dashboard'
import type { DashboardStats } from '@/types'

// DEV ONLY — return firm-leader-shaped mock data while Supabase is unreachable.
// Remove this branch when NEXT_PUBLIC_DEV_BYPASS_AUTH is removed.
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

const MOCK_STATS: DashboardStats = {
  total_clients: 184,
  active_cases: 47,
  pending_tasks: 23,
  total_invoices_due: 12,
  personal_total_clients: 28,
  personal_active_cases: 9,
  personal_pending_tasks: 6,
  personal_invoices_due: 3,
  upcoming_dates: [
    { id: '1', title: 'Adjei v. Nartey — Hearing',          court: 'High Court (Commercial Division), Accra', next_court_date: '2026-05-22', client_name: 'Adjei Holdings Ltd' },
    { id: '2', title: 'Tetteh v. Tetteh — Mention',         court: 'Circuit Court, Tema',                     next_court_date: '2026-05-24', client_name: 'Comfort Tetteh' },
    { id: '3', title: 'Boadu v. Republic — Appeal filing',  court: 'Court of Appeal, Accra',                  next_court_date: '2026-05-27', client_name: 'Kwame Boadu' },
    { id: '4', title: 'Ampofo & Sons v. AMA — Case mgmt',   court: 'High Court, Accra',                       next_court_date: '2026-05-30', client_name: 'Ampofo & Sons Ltd' },
  ],
  recent_activity: [
    { type: 'case',     title: 'Kwakye v. Mensah — status moved to Discovery', created_at: '2026-05-20T08:14:00Z' },
    { type: 'invoice',  title: 'Invoice #INV-0241 issued to Adjei Holdings',    created_at: '2026-05-20T07:42:00Z' },
    { type: 'client',   title: 'New client onboarded: Ampofo & Sons Ltd',       created_at: '2026-05-19T16:05:00Z' },
    { type: 'document', title: 'Draft: Notice of Appeal — Boadu v. Republic',   created_at: '2026-05-19T11:30:00Z' },
    { type: 'task',     title: 'Fafali Mensah completed: File Pre-trial brief', created_at: '2026-05-19T10:12:00Z' },
  ],
}

export function useDashboardStats() {
  const { data, loading, error, refetch } = useQuery(DashboardStatsQueryDoc, {
    pollInterval: 60_000,
    skip: DEV_BYPASS,
  })
  if (DEV_BYPASS) {
    return { data: MOCK_STATS, isLoading: false, error: undefined, refetch }
  }
  // GraphQL DashboardStats currently doesn't include personal_* totals — the
  // resolver returns firm-wide numbers only. Backfill the personal slice with
  // firm totals so existing UI keeps rendering until the backend splits them.
  const stats = data?.dashboardStats
  const augmented: DashboardStats | undefined = stats
    ? {
        ...stats,
        personal_total_clients: stats.total_clients,
        personal_active_cases: stats.active_cases,
        personal_pending_tasks: stats.pending_tasks,
        personal_invoices_due: stats.total_invoices_due,
        recent_activity: stats.recent_activity.map((r) => ({
          ...r,
          type: r.type as DashboardStats['recent_activity'][number]['type'],
        })),
      }
    : undefined
  return { data: augmented, isLoading: loading, error, refetch }
}
