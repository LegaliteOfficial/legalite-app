/**
 * Dashboard stats — single aggregate query the home page reads. The
 * backend computes per-firm + per-user counts in one round trip.
 */

import { graphql } from '@/types/generated'

export const DashboardStatsQueryDoc = graphql(/* GraphQL */ `
  query DashboardStats {
    dashboardStats {
      total_clients
      active_cases
      pending_tasks
      total_invoices_due
      upcoming_dates {
        id
        title
        court
        next_court_date
        client_name
      }
      recent_activity {
        type
        title
        created_at
      }
    }
  }
`)
