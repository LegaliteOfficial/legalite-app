/**
 * Conflict checks — search contacts + matters for name collisions, and
 * (optionally) record the run for the firm's audit history.
 */

import { graphql } from '@/types/generated'

export const ConflictCheckQueryDoc = graphql(/* GraphQL */ `
  query ConflictCheck($query: String!) {
    conflictCheck(query: $query) {
      kind
      ref_id
      label
      sublabel
      match_field
    }
  }
`)

export const ConflictChecksQueryDoc = graphql(/* GraphQL */ `
  query ConflictChecks {
    conflictChecks {
      id
      query
      match_count
      notes
      run_by_name
      created_at
      matches {
        kind
        ref_id
        label
        sublabel
        match_field
      }
    }
  }
`)

export const RecordConflictCheckMutationDoc = graphql(/* GraphQL */ `
  mutation RecordConflictCheck($input: RecordConflictCheckInput!) {
    recordConflictCheck(input: $input) {
      id
      query
      match_count
      notes
      run_by_name
      created_at
      matches {
        kind
        ref_id
        label
        sublabel
        match_field
      }
    }
  }
`)
