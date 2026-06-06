/**
 * Generic attachments — files uploaded against any entity (case, client,
 * task, document). Entity type/id are passed as variables; the backend
 * fans out to the right storage bucket.
 */

import { graphql } from '@/types/generated'

export const AttachmentsQueryDoc = graphql(/* GraphQL */ `
  query Attachments($entity_type: String!, $entity_id: ID!) {
    attachments(entity_type: $entity_type, entity_id: $entity_id) {
      ...AttachmentFields
    }
  }
`)

export const AttachmentDownloadUrlQueryDoc = graphql(/* GraphQL */ `
  query AttachmentDownloadUrl($id: ID!) {
    attachmentDownloadUrl(id: $id) {
      url
    }
  }
`)

export const CreateAttachmentMutationDoc = graphql(/* GraphQL */ `
  mutation CreateAttachment($input: CreateAttachmentInput!) {
    createAttachment(input: $input) {
      ...AttachmentFields
    }
  }
`)

export const DeleteAttachmentMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteAttachment($id: ID!) {
    deleteAttachment(id: $id)
  }
`)
