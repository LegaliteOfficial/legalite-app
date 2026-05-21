import { useMutation, useQuery } from '@apollo/client/react'
import {
  CreateDeadlineMutationDoc,
  DeadlineStatsQueryDoc,
  DeadlinesQueryDoc,
  DeleteDeadlineMutationDoc,
  UpdateDeadlineMutationDoc,
} from '@/lib/graphql/operations'

export interface Deadline {
  id: string
  user_id: string
  case_id: string | null
  title: string
  description: string | null
  due_date: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'Pending' | 'Done' | 'Missed'
  reminder_days: number | null
  case_title: string | null
  created_at: string
  updated_at: string
}

type DeadlineInput = Partial<Omit<Deadline, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

export function useDeadlines(status?: string) {
  const { data, loading, error, refetch } = useQuery(DeadlinesQueryDoc, {
    variables: { status: status ?? null, upcoming: null },
  })
  return {
    data: data?.deadlines as Deadline[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function useDeadlineStats() {
  const { data, loading, error, refetch } = useQuery(DeadlineStatsQueryDoc, {
    pollInterval: 60_000,
  })
  return {
    data: data?.deadlineStats as
      | { overdue_count: number; upcoming_this_week: Deadline[] }
      | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function useCreateDeadline() {
  const [mutate, state] = useMutation(CreateDeadlineMutationDoc, {
    refetchQueries: [DeadlinesQueryDoc, DeadlineStatsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (data: DeadlineInput) => {
      const res = await mutate({
        variables: { input: data as Parameters<typeof mutate>[0]['variables']['input'] },
      })
      return res.data?.createDeadline
    },
    mutate: (data: DeadlineInput) => {
      void mutate({
        variables: { input: data as Parameters<typeof mutate>[0]['variables']['input'] },
      })
    },
  }
}

export function useUpdateDeadline() {
  const [mutate, state] = useMutation(UpdateDeadlineMutationDoc, {
    refetchQueries: [DeadlinesQueryDoc, DeadlineStatsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async ({ id, data }: { id: string; data: DeadlineInput }) => {
      const res = await mutate({
        variables: { id, input: data as Parameters<typeof mutate>[0]['variables']['input'] },
      })
      return res.data?.updateDeadline
    },
    mutate: ({ id, data }: { id: string; data: DeadlineInput }) => {
      void mutate({
        variables: { id, input: data as Parameters<typeof mutate>[0]['variables']['input'] },
      })
    },
  }
}

export function useDeleteDeadline() {
  const [mutate, state] = useMutation(DeleteDeadlineMutationDoc, {
    refetchQueries: [DeadlinesQueryDoc, DeadlineStatsQueryDoc],
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
