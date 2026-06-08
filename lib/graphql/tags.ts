/**
 * Tags — firm-scoped palette + contact assignment.
 *
 * Tags belong to a firm and attach M:N onto contacts (clients). The
 * `setContactTags` mutation replaces a contact's full tag set; `tagContacts`
 * bulk-adds one tag to many contacts (list "tag selected" action).
 */

import { graphql } from '@/types/generated'

export const TagsQueryDoc = graphql(/* GraphQL */ `
  query Tags {
    tags {
      ...TagFields
    }
  }
`)

export const CreateTagMutationDoc = graphql(/* GraphQL */ `
  mutation CreateTag($input: CreateTagInput!) {
    createTag(input: $input) {
      ...TagFields
    }
  }
`)

export const UpdateTagMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateTag($id: ID!, $input: UpdateTagInput!) {
    updateTag(id: $id, input: $input) {
      ...TagFields
    }
  }
`)

export const DeleteTagMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteTag($id: ID!) {
    deleteTag(id: $id)
  }
`)

export const SetContactTagsMutationDoc = graphql(/* GraphQL */ `
  mutation SetContactTags($input: SetContactTagsInput!) {
    setContactTags(input: $input) {
      ...TagFields
    }
  }
`)

export const TagContactsMutationDoc = graphql(/* GraphQL */ `
  mutation TagContacts($input: TagContactsInput!) {
    tagContacts(input: $input)
  }
`)
