/**
 * Personal legal library — books, articles, and reference PDFs the user
 * uploads. The /documents page renders these alongside firm-owned legal
 * documents (which live in `./documents`).
 */

import { graphql } from '@/types/generated'

export const LibraryItemsQueryDoc = graphql(/* GraphQL */ `
  query LibraryItems($category: String) {
    libraryItems(category: $category) {
      ...LibraryItemFields
    }
  }
`)

export const LibraryDownloadUrlQueryDoc = graphql(/* GraphQL */ `
  query LibraryDownloadUrl($id: ID!) {
    libraryDownloadUrl(id: $id) {
      url
    }
  }
`)

export const CreateLibraryItemMutationDoc = graphql(/* GraphQL */ `
  mutation CreateLibraryItem($input: CreateLibraryItemInput!) {
    createLibraryItem(input: $input) {
      ...LibraryItemFields
      archive_entry_id
    }
  }
`)

/** One-time signed URL the browser streams a library file to. */
export const CreateLibraryUploadTargetMutationDoc = graphql(/* GraphQL */ `
  mutation CreateLibraryUploadTarget($category: String!, $fileName: String!) {
    createLibraryUploadTarget(category: $category, fileName: $fileName) {
      path
      token
      signed_url
      public_url
    }
  }
`)

export const UpdateLibraryItemMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateLibraryItem($id: ID!, $input: UpdateLibraryItemInput!) {
    updateLibraryItem(id: $id, input: $input) {
      ...LibraryItemFields
    }
  }
`)

export const ToggleLibraryItemFavoriteMutationDoc = graphql(/* GraphQL */ `
  mutation ToggleLibraryItemFavorite($id: ID!) {
    toggleLibraryItemFavorite(id: $id) {
      id
      is_favorite
    }
  }
`)

export const DeleteLibraryItemMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteLibraryItem($id: ID!) {
    deleteLibraryItem(id: $id)
  }
`)
