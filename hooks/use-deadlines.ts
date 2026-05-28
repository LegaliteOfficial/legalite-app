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

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

/**
 * DEV ONLY — sample deadlines used so the case-detail Calendar
 * section has something to render in dev mode. Mirrors the dev
 * sample case ids in `use-cases.ts` so each card lights up on the
 * right case-detail page.
 */
const DEV_SAMPLE_DEADLINES: Deadline[] = [
  {
    id: 'dev-deadline-1',
    user_id: 'dev',
    case_id: 'dev-1',
    title: 'Mensah holdings — case management conference',
    description: null,
    due_date: '2026-06-04T09:00:00Z',
    priority: 'High',
    status: 'Pending',
    reminder_days: 2,
    case_title: 'Mensah v. Ghana Revenue Authority',
    created_at: '2026-05-20T09:00:00Z',
    updated_at: '2026-05-20T09:00:00Z',
  },
  {
    id: 'dev-deadline-2',
    user_id: 'dev',
    case_id: 'dev-1',
    title: 'File discovery responses to GRA',
    description: null,
    due_date: '2026-06-12T16:00:00Z',
    priority: 'Medium',
    status: 'Pending',
    reminder_days: 5,
    case_title: 'Mensah v. Ghana Revenue Authority',
    created_at: '2026-05-20T09:00:00Z',
    updated_at: '2026-05-20T09:00:00Z',
  },
  {
    id: 'dev-deadline-3',
    user_id: 'dev',
    case_id: 'dev-2',
    title: 'Estate of Owusu — probate hearing',
    description: null,
    due_date: '2026-05-29T10:30:00Z',
    priority: 'High',
    status: 'Pending',
    reminder_days: 1,
    case_title: 'Estate of Owusu — Probate',
    created_at: '2026-05-15T09:00:00Z',
    updated_at: '2026-05-15T09:00:00Z',
  },
  {
    id: 'dev-deadline-4',
    user_id: 'dev',
    case_id: 'dev-3',
    title: 'AccraTech v. Volta — settlement negotiation',
    description: null,
    due_date: '2026-07-15T14:00:00Z',
    priority: 'Medium',
    status: 'Pending',
    reminder_days: 3,
    case_title: 'AccraTech Ltd v. Volta Cables',
    created_at: '2026-05-18T09:00:00Z',
    updated_at: '2026-05-18T09:00:00Z',
  },
]

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
