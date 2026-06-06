/**
 * Lawyer verification documents — the GBA card / SCE certificate /
 * practising licence uploads that gate `verification_status` on the
 * auth user.
 */

import { graphql } from '@/types/generated'

export const MyVerificationDocumentsQueryDoc = graphql(/* GraphQL */ `
  query MyVerificationDocuments {
    myVerificationDocuments {
      id
      document_type
      file_url
      file_name
      file_type
      file_size
      status
      rejection_reason
      created_at
    }
  }
`)

export const UploadVerificationDocumentMutationDoc = graphql(/* GraphQL */ `
  mutation UploadVerificationDocument(
    $input: UploadVerificationDocumentInput!
  ) {
    uploadVerificationDocument(input: $input) {
      id
      document_type
      file_url
      file_name
      status
      created_at
    }
  }
`)
