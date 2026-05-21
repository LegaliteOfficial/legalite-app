import { useMutation, useQuery } from '@apollo/client/react'
import {
  CreateTaskMutationDoc,
  DeleteTaskMutationDoc,
  TaskQueryDoc,
  TasksQueryDoc,
  UpdateTaskMutationDoc,
} from '@/lib/graphql/operations'
import type { TaskFormData } from '@/schemas'
import type { Task } from '@/types'

export function useTasks() {
  const { data, loading, error, refetch } = useQuery(TasksQueryDoc)
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
    mutateAsync: async (data: TaskFormData) => {
      const res = await mutate({ variables: { input: data } })
      return res.data?.createTask
    },
    mutate: (data: TaskFormData) => {
      void mutate({ variables: { input: data } })
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
      data: Partial<TaskFormData>
    }) => {
      const res = await mutate({ variables: { id, input: data } })
      return res.data?.updateTask
    },
    mutate: ({ id, data }: { id: string; data: Partial<TaskFormData> }) => {
      void mutate({ variables: { id, input: data } })
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
    mutate: (id: string) => {
      void mutate({ variables: { id } })
    },
  }
}
