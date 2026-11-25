/**
 * Firm archive: every document the firm uploads to the Legal Library, read
 * and described by Legalite AI (summary, parties, dates, verification notes,
 * full text) so the firm can find and read its content at any time.
 */

import { graphql } from '@/types/generated'

export const ArchiveEntriesQueryDoc = graphql(/* GraphQL */ `
  query ArchiveEntries($search: String, $documentType: String, $limit: Int) {
    archiveEntries(search: $search, documentType: $documentType, limit: $limit) {
      id
      title
      status
      error
      document_type
      summary
      court
      suit_number
      document_date
      tags
      legibility
      completeness
      verification_notes
      file_name
      file_type
      file_size
      page_count
      word_count
      case_id
      case_title
      uploaded_by
      uploaded_by_name
      source_category
      created_at
      processed_at
    }
  }
`)

export const ArchiveEntryQueryDoc = graphql(/* GraphQL */ `
  query ArchiveEntry($id: ID!) {
    archiveEntry(id: $id) {
      id
      title
      status
      error
      document_type
      summary
      key_points
      court
      suit_number
      document_date
      legal_references
      tags
      is_legal_document
      legibility
      completeness
      verification_notes
      confidence
      content
      page_count
      word_count
      extraction_method
      warnings
      file_name
      file_type
      file_size
      case_id
      case_title
      uploaded_by
      uploaded_by_name
      created_at
      processed_at
      parties {
        name
        role
      }
      key_dates {
        date
        description
      }
      amounts {
        amount
        description
      }
    }
  }
`)

export const ArchiveDownloadUrlQueryDoc = graphql(/* GraphQL */ `
  query ArchiveDownloadUrl($id: ID!) {
    archiveDownloadUrl(id: $id) {
      url
    }
  }
`)

export const ReprocessArchiveEntryMutationDoc = graphql(/* GraphQL */ `
  mutation ReprocessArchiveEntry($id: ID!) {
    reprocessArchiveEntry(id: $id) {
      id
      status
      error
    }
  }
`)

export const UpdateArchiveEntryMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateArchiveEntry($id: ID!, $input: UpdateArchiveEntryInput!) {
    updateArchiveEntry(id: $id, input: $input) {
      id
      title
      document_type
      summary
      tags
      case_id
      case_title
    }
  }
`)

export const DeleteArchiveEntryMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteArchiveEntry($id: ID!) {
    deleteArchiveEntry(id: $id)
  }
`)
