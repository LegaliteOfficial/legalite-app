/**
 * Client communications — outbound/inbound messages across email, SMS,
 * WhatsApp, and the in-app inbox.
 */

import { graphql } from '@/types/generated'

export const MessagesQueryDoc = graphql(/* GraphQL */ `
  query Messages($clientId: ID, $channel: String) {
    messages(clientId: $clientId, channel: $channel) {
      ...MessageFields
    }
  }
`)

export const CreateMessageMutationDoc = graphql(/* GraphQL */ `
  mutation CreateMessage($input: CreateMessageInput!) {
    createMessage(input: $input) {
      ...MessageFields
    }
  }
`)

export const DeleteMessageMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteMessage($id: ID!) {
    deleteMessage(id: $id)
  }
`)

/**
 * Email or WhatsApp a client from their profile. Email is sent by the
 * backend; WhatsApp returns a click-to-chat link for the app to open.
 */
export const SendClientMessageMutationDoc = graphql(/* GraphQL */ `
  mutation SendClientMessage($input: SendClientMessageInput!) {
    sendClientMessage(input: $input) {
      whatsapp_url
      message {
        ...MessageFields
      }
    }
  }
`)
