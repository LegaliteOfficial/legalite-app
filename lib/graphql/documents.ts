/**
 * Documents — saved legal drafts (Notice of Suit, Defence, etc.). The
 * rich-text body lives on `content`. Library items (books / articles
 * the user uploads as reference material) live in `./library`.
 */

import { graphql } from '@/types/generated'

export const DocumentsQueryDoc = graphql(/* GraphQL */ `
  query Documents {
    documents {
      ...DocumentFields
    }
  }
`)

export const DocumentQueryDoc = graphql(/* GraphQL */ `
  query Document($id: ID!) {
    document(id: $id) {
      ...DocumentFields
    }
  }
`)

export const CreateDocumentMutationDoc = graphql(/* GraphQL */ `
  mutation CreateDocument($input: CreateDocumentInput!) {
    createDocument(input: $input) {
      ...DocumentFields
    }
  }
`)

export const UpdateDocumentMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {
    updateDocument(id: $id, input: $input) {
      ...DocumentFields
    }
  }
`)

export const DeleteDocumentMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
`)
