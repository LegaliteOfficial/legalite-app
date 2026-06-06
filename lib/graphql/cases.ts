/**
 * Cases — matters opened in the firm.
 *
 * Team assignments per case live in `./assignments`. Attachments and
 * tasks tied to a case live in `./attachments` and `./tasks`.
 */

import { graphql } from '@/types/generated'

export const CasesQueryDoc = graphql(/* GraphQL */ `
  query Cases {
    cases {
      ...CaseFields
    }
  }
`)

export const CaseQueryDoc = graphql(/* GraphQL */ `
  query Case($id: ID!) {
    case(id: $id) {
      ...CaseFields
    }
  }
`)

export const CreateCaseMutationDoc = graphql(/* GraphQL */ `
  mutation CreateCase($input: CreateCaseInput!) {
    createCase(input: $input) {
      ...CaseFields
    }
  }
`)

export const UpdateCaseMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateCase($id: ID!, $input: UpdateCaseInput!) {
    updateCase(id: $id, input: $input) {
      ...CaseFields
    }
  }
`)

export const DeleteCaseMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteCase($id: ID!) {
    deleteCase(id: $id)
  }
`)
