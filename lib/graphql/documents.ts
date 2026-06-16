/**
 * Documents — saved legal drafts (Notice of Suit, Defence, etc.). The
 * rich-text body lives on `content`. Library items (books / articles
 * the user uploads as reference material) live in `./library`.
 *
 * The contact Documents tab also organises files into folders, soft-
 * deletes them to a recycle bin, and threads comments — those
 * operations live alongside the core document CRUD below.
 */

import { graphql } from '@/types/generated'

export const DocumentsQueryDoc = graphql(/* GraphQL */ `
  query Documents($includeDeleted: Boolean) {
    documents(includeDeleted: $includeDeleted) {
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

export const RestoreDocumentMutationDoc = graphql(/* GraphQL */ `
  mutation RestoreDocument($id: ID!) {
    restoreDocument(id: $id) {
      ...DocumentFields
    }
  }
`)

export const DeleteDocumentPermanentMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteDocumentPermanent($id: ID!) {
    deleteDocumentPermanent(id: $id)
  }
`)

// ── File uploads (Cloudinary, signed direct upload) ─────────────────────────

export const SignDocumentUploadMutationDoc = graphql(/* GraphQL */ `
  mutation SignDocumentUpload {
    signDocumentUpload {
      cloud_name
      api_key
      timestamp
      signature
      folder
      resource_type
    }
  }
`)

// ── Folders ────────────────────────────────────────────────────────────────

export const DocumentFoldersQueryDoc = graphql(/* GraphQL */ `
  query DocumentFolders($clientId: ID) {
    documentFolders(clientId: $clientId) {
      ...DocumentFolderFields
    }
  }
`)

export const CreateDocumentFolderMutationDoc = graphql(/* GraphQL */ `
  mutation CreateDocumentFolder($input: CreateDocumentFolderInput!) {
    createDocumentFolder(input: $input) {
      ...DocumentFolderFields
    }
  }
`)

export const UpdateDocumentFolderMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateDocumentFolder($id: ID!, $input: UpdateDocumentFolderInput!) {
    updateDocumentFolder(id: $id, input: $input) {
      ...DocumentFolderFields
    }
  }
`)

export const DeleteDocumentFolderMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteDocumentFolder($id: ID!) {
    deleteDocumentFolder(id: $id)
  }
`)

// ── Comments ─────────────────────────────────────────────────────────────────

export const DocumentCommentsQueryDoc = graphql(/* GraphQL */ `
  query DocumentComments($documentId: ID!) {
    documentComments(documentId: $documentId) {
      ...DocumentCommentFields
    }
  }
`)

export const AddDocumentCommentMutationDoc = graphql(/* GraphQL */ `
  mutation AddDocumentComment($input: CreateDocumentCommentInput!) {
    addDocumentComment(input: $input) {
      ...DocumentCommentFields
    }
  }
`)

export const DeleteDocumentCommentMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteDocumentComment($id: ID!) {
    deleteDocumentComment(id: $id)
  }
`)
