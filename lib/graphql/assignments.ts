/**
 * Team assignments — who in the firm is working on which client / case.
 *
 * Backend has two separate types (`ClientAssignment`, `CaseAssignment`)
 * because the entity FK differs (`client_id` vs `case_id`). We keep the
 * projections inline rather than fragmented because the shared subset
 * (~6 fields) is small and two parallel fragments would cost more LOC
 * than they save.
 */

import { graphql } from '@/types/generated'

export const ClientAssignmentsQueryDoc = graphql(/* GraphQL */ `
  query ClientAssignments {
    clientAssignments {
      id
      client_id
      member_id
      assignment_role
      name
      professional_title
      avatar_url
    }
  }
`)

export const SetClientAssignmentsMutationDoc = graphql(/* GraphQL */ `
  mutation SetClientAssignments($input: SetClientAssignmentsInput!) {
    setClientAssignments(input: $input) {
      id
      client_id
      member_id
      assignment_role
      name
      professional_title
      avatar_url
    }
  }
`)

export const CaseAssignmentsQueryDoc = graphql(/* GraphQL */ `
  query CaseAssignments($case_id: ID!) {
    caseAssignments(case_id: $case_id) {
      id
      case_id
      member_id
      assignment_role
      name
      professional_title
      avatar_url
    }
  }
`)

export const SetCaseAssignmentsMutationDoc = graphql(/* GraphQL */ `
  mutation SetCaseAssignments($input: SetCaseAssignmentsInput!) {
    setCaseAssignments(input: $input) {
      id
      case_id
      member_id
      assignment_role
      name
      professional_title
      avatar_url
    }
  }
`)
