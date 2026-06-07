import { useMutation, useQuery } from '@apollo/client/react'
import {
  CreateTaskMutationDoc,
  DeleteTaskMutationDoc,
  TaskQueryDoc,
  TasksQueryDoc,
  UpdateTaskMutationDoc,
} from '@/lib/graphql/tasks'
import type {
  TasksQuery,
  CreateTaskInput,
  UpdateTaskInput,
} from '@/types/generated/graphql'

// Skip Apollo round-trip in dev bypass — otherwise every navigation to
// /tasks hangs for the network timeout before the empty state renders.
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export type Task = TasksQuery['tasks'][number]
export type TaskAssignee = Task['assignees'][number]
export type TaskReminder = Task['reminders'][number]

/**
 * Reminder lead times offered in the task composer. Reminders fire
 * relative to the task's due date, so a due date is required for any
 * of these to actually send.
 */
export const TASK_REMINDER_PRESETS: { minutes: number; label: string }[] = [
  { minutes: 15, label: '15 minutes before' },
  { minutes: 30, label: '30 minutes before' },
  { minutes: 60, label: '1 hour before' },
  { minutes: 120, label: '2 hours before' },
  { minutes: 1440, label: '1 day before' },
  { minutes: 2880, label: '2 days before' },
  { minutes: 4320, label: '3 days before' },
  { minutes: 10080, label: '1 week before' },
]

export function useTasks() {
  const { data, loading, error, refetch } = useQuery(TasksQueryDoc, {
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  if (DEV_BYPASS) {
    return { data: [] as Task[], isLoading: false, error: undefined, refetch }
  }
  return {
    data: data?.tasks as Task[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function useTask(id: string | undefined) {
  const { data, loading, error } = useQuery(TaskQueryDoc, {
    variables: { id: id ?? '' },
    skip: !id,
  })
  return {
    data: data?.task as Task | undefined,
    isLoading: loading,
    error,
  }
}

export function useCreateTask() {
  const [mutate, state] = useMutation(CreateTaskMutationDoc, {
    refetchQueries: [TasksQueryDoc, 'DashboardStats'],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (input: CreateTaskInput) => {
      const res = await mutate({ variables: { input } })
      return res.data?.createTask
    },
  }
}

export function useUpdateTask() {
  const [mutate, state] = useMutation(UpdateTaskMutationDoc, {
    refetchQueries: [TasksQueryDoc, 'DashboardStats'],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async ({
      id,
      data,
    }: {
      id: string
      data: UpdateTaskInput
    }) => {
      const res = await mutate({ variables: { id, input: data } })
      return res.data?.updateTask
    },
  }
}

export function useDeleteTask() {
  const [mutate, state] = useMutation(DeleteTaskMutationDoc, {
    refetchQueries: [TasksQueryDoc, 'DashboardStats'],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (id: string) => {
      await mutate({ variables: { id } })
    },
  }
}
