/**
 * Deadlines — court-date-style reminders attached to a case. The stats
 * query feeds the dashboard "overdue / this week" tiles.
 */

import { graphql } from '@/types/generated'

export const DeadlinesQueryDoc = graphql(/* GraphQL */ `
  query Deadlines($status: String, $upcoming: Boolean) {
    deadlines(status: $status, upcoming: $upcoming) {
      ...DeadlineFields
    }
  }
`)

export const DeadlineStatsQueryDoc = graphql(/* GraphQL */ `
  query DeadlineStats {
    deadlineStats {
      overdue_count
      upcoming_this_week {
        ...DeadlineFields
      }
    }
  }
`)

export const CreateDeadlineMutationDoc = graphql(/* GraphQL */ `
  mutation CreateDeadline($input: CreateDeadlineInput!) {
    createDeadline(input: $input) {
      ...DeadlineFields
    }
  }
`)

export const UpdateDeadlineMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateDeadline($id: ID!, $input: UpdateDeadlineInput!) {
    updateDeadline(id: $id, input: $input) {
      ...DeadlineFields
    }
  }
`)

export const DeleteDeadlineMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteDeadline($id: ID!) {
    deleteDeadline(id: $id)
  }
`)
