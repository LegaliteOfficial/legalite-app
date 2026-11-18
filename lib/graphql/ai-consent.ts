/**
 * Workspace access for the AI assistant: the user's standing preference
 * (ask every time / always allow / never) and the audit trail of every
 * permission decision. The AI service reads the preference with the
 * user's own token before it touches any workspace data.
 */

import { graphql } from '@/types/generated'

export const AiWorkspaceAccessQueryDoc = graphql(/* GraphQL */ `
  query AiWorkspaceAccess {
    aiWorkspaceAccess {
      mode
      is_set
      updated_at
    }
  }
`)

export const AiConsentEventsQueryDoc = graphql(/* GraphQL */ `
  query AiConsentEvents($limit: Int) {
    aiConsentEvents(limit: $limit) {
      id
      decision
      source
      request_id
      scopes
      created_at
    }
  }
`)

export const SetAiWorkspaceAccessMutationDoc = graphql(/* GraphQL */ `
  mutation SetAiWorkspaceAccess($input: SetAiWorkspaceAccessInput!) {
    setAiWorkspaceAccess(input: $input) {
      mode
      is_set
      updated_at
    }
  }
`)

export const RecordAiConsentMutationDoc = graphql(/* GraphQL */ `
  mutation RecordAiConsent($input: RecordAiConsentInput!) {
    recordAiConsent(input: $input)
  }
`)
