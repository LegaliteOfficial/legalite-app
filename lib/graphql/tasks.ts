/**
 * Tasks — work items assigned to a member, optionally scoped to a
 * client or case. Backend exposes the same row shape across CRUD.
 */

import { graphql } from '@/types/generated'

export const TasksQueryDoc = graphql(/* GraphQL */ `
  query Tasks {
    tasks {
      ...TaskFields
    }
  }
`)

export const TaskQueryDoc = graphql(/* GraphQL */ `
  query Task($id: ID!) {
    task(id: $id) {
      ...TaskFields
    }
  }
`)

export const CreateTaskMutationDoc = graphql(/* GraphQL */ `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      ...TaskFields
    }
  }
`)

export const UpdateTaskMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      ...TaskFields
    }
  }
`)

export const DeleteTaskMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`)
