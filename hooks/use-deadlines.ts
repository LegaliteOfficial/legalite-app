import { useMutation, useQuery } from '@apollo/client/react'
import {
  CreateDeadlineMutationDoc,
  DeadlineStatsQueryDoc,
  DeadlinesQueryDoc,
  DeleteDeadlineMutationDoc,
  UpdateDeadlineMutationDoc,
} from '@/lib/graphql/deadlines'
// DEV_SAMPLE_DEADLINES lives in a server-safe module so the
// /api/calendar/feeds/[scope] route can reuse the exact same
// records when generating subscribed iCal feeds in dev mode.
import { DEV_SAMPLE_DEADLINES } from '@/lib/calendar/dev-data'

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

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export function useDeadlines(status?: string) {
  const { data, loading, error, refetch } = useQuery(DeadlinesQueryDoc, {
    variables: { status: status ?? null, upcoming: null },
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  if (DEV_BYPASS) {
    const filtered = status
      ? DEV_SAMPLE_DEADLINES.filter((d) => d.status === status)
      : DEV_SAMPLE_DEADLINES
    return { data: filtered, isLoading: false, error: undefined, refetch }
  }
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
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  if (DEV_BYPASS) {
    return {
      data: { overdue_count: 0, upcoming_this_week: [] as Deadline[] },
      isLoading: false,
      error: undefined,
      refetch,
    }
  }
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
      // DEV_BYPASS — no backend to call. Resolve with a mock
      // record so callers can verify the UI flow end-to-end. The
      // record won't appear in subsequent useDeadlines() reads
      // because those still serve the static DEV_SAMPLE_DEADLINES
      // list; that's acceptable for a dev mock.
      if (DEV_BYPASS) {
        return {
          ...data,
          id: `dev-new-${Date.now()}`,
          user_id: 'dev',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Deadline
      }
      const res = await mutate({
        variables: { input: data as Parameters<typeof mutate>[0]['variables']['input'] },
      })
      return res.data?.createDeadline
    },
    mutate: (data: DeadlineInput) => {
      if (DEV_BYPASS) return
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
      // DEV_BYPASS — resolve with a mock so the UI sees a success
      // path. Same caveat as useCreateDeadline (mutations don't
      // persist; subsequent reads still see the seed data).
      if (DEV_BYPASS) {
        return {
          ...data,
          id,
          user_id: 'dev',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Deadline
      }
      const res = await mutate({
        variables: { id, input: data as Parameters<typeof mutate>[0]['variables']['input'] },
      })
      return res.data?.updateDeadline
    },
    mutate: ({ id, data }: { id: string; data: DeadlineInput }) => {
      if (DEV_BYPASS) return
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
      // DEV_BYPASS — resolve cleanly so the UI's success path runs.
      if (DEV_BYPASS) return
      await mutate({ variables: { id } })
    },
    mutate: (id: string) => {
      if (DEV_BYPASS) return
      void mutate({ variables: { id } })
    },
  }
}
