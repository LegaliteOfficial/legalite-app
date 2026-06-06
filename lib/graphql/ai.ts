/**
 * NestJS-backed AI conversation history.
 *
 * NOTE: As of the /ai page rewrite (Phase 5), the chat itself talks
 * directly to the FastAPI Q&A service on Railway (see lib/ai/client.ts);
 * conversation history is kept in localStorage (see lib/ai/sessions.ts).
 *
 * The operations below are retained for any older callers + as a forward
 * option if we move history back into the NestJS backend. Delete if
 * unused at the next cleanup pass.
 */

import { graphql } from '@/types/generated'

export const AiConversationsQueryDoc = graphql(/* GraphQL */ `
  query AiConversations {
    aiConversations {
      id
      title
      created_at
      updated_at
    }
  }
`)

export const AiConversationQueryDoc = graphql(/* GraphQL */ `
  query AiConversation($id: ID!) {
    aiConversation(id: $id) {
      id
      title
      created_at
      updated_at
      messages {
        id
        role
        content
        sources
        created_at
      }
    }
  }
`)

export const AiChatMutationDoc = graphql(/* GraphQL */ `
  mutation AiChat($input: AiChatInput!) {
    aiChat(input: $input) {
      response
      conversation_id
      sources {
        id
        title
        content
        similarity
      }
    }
  }
`)

export const DeleteAiConversationMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteAiConversation($id: ID!) {
    deleteAiConversation(id: $id)
  }
`)
