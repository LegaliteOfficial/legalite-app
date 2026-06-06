/**
 * Clients — the firm's client directory.
 *
 * Team assignments per client live in `./assignments`; billing rate
 * config is local-only (see `stores/client-rates-local.store.ts`).
 */

import { graphql } from '@/types/generated'

export const ClientsQueryDoc = graphql(/* GraphQL */ `
  query Clients {
    clients {
      ...ClientFields
    }
  }
`)

export const ClientQueryDoc = graphql(/* GraphQL */ `
  query Client($id: ID!) {
    client(id: $id) {
      ...ClientFields
    }
  }
`)

export const CreateClientMutationDoc = graphql(/* GraphQL */ `
  mutation CreateClient($input: CreateClientInput!) {
    createClient(input: $input) {
      ...ClientFields
    }
  }
`)

export const UpdateClientMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {
    updateClient(id: $id, input: $input) {
      ...ClientFields
    }
  }
`)

export const DeleteClientMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteClient($id: ID!) {
    deleteClient(id: $id)
  }
`)
