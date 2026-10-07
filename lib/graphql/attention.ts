/**
 * Attention feed — the Deadline engine's server-aggregated view of
 * everything that needs the user's attention (deadlines, tasks, events,
 * hearings, court dates, invoices) plus the actions it supports.
 */

import { graphql } from '@/types/generated'

export const AttentionFeedQueryDoc = graphql(/* GraphQL */ `
  query AttentionFeed($input: AttentionFeedInput) {
    attentionFeed(input: $input) {
      horizon_days
      generated_at
      items {
        key
        id
        kind
        title
        context
        detail
        due_at
        all_day
        priority
        bucket
        status
        case_id
        client_id
        event_type
        amount_ghs
        completable
        snoozed_until
      }
      awaiting_outcome {
        ...CalendarEventFields
      }
      summary {
        total
        overdue
        today
        tomorrow
        week
        later
        snoozed
        by_kind {
          kind
          total
          overdue
        }
      }
    }
  }
`)

export const CompleteAttentionItemMutationDoc = graphql(/* GraphQL */ `
  mutation CompleteAttentionItem($input: AttentionItemRefInput!) {
    completeAttentionItem(input: $input)
  }
`)

export const SnoozeAttentionItemMutationDoc = graphql(/* GraphQL */ `
  mutation SnoozeAttentionItem($input: SnoozeAttentionItemInput!) {
    snoozeAttentionItem(input: $input) {
      kind
      id
      snoozed_until
    }
  }
`)

export const UnsnoozeAttentionItemMutationDoc = graphql(/* GraphQL */ `
  mutation UnsnoozeAttentionItem($input: AttentionItemRefInput!) {
    unsnoozeAttentionItem(input: $input)
  }
`)
