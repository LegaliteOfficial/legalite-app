import { useMutation, useQuery } from '@apollo/client/react'
import {
  CaseQueryDoc,
  CasesQueryDoc,
  CreateCaseMutationDoc,
  DeleteCaseMutationDoc,
  UpdateCaseMutationDoc,
} from '@/lib/graphql/operations'
import type { CaseFormData } from '@/schemas'
import type { Case, CaseStatus } from '@/types'
import type {
  CreateCaseInput,
  UpdateCaseInput,
} from '@/types/generated/graphql'

/**
 * Wire shape returned by the legalite-backend Cases query. The backend now
 * exposes the industry-standard names directly (case_type, case_stage,
 * date_opened, …) and the Open/Pending/Closed enum, so app code maps almost
 * 1:1. The only residual translation is treating any legacy 'Active' status
 * (rows not yet normalised) as 'Open'.
 */
interface WireCase {
  id: string
  firm_id?: string | null
  user_id: string
  client_id: string
  case_code?: string | null
  title: string
  court?: string | null
  suit_number?: string | null
  opposing_party?: string | null
  next_court_date?: string | null
  status: 'Active' | 'Open' | 'Pending' | 'Closed'
  case_type?: string | null
  case_stage?: string | null
  assigned_lawyer?: string | null
  originating_lawyer?: string | null
  date_opened?: string | null
  closed_at?: string | null
  pending_at?: string | null
  notification_count?: number
  notes?: string | null
  description?: string | null
  details?: string | null
  created_at: string
  updated_at: string
  client_name?: string
}

function toCase(row: WireCase): Case {
  return {
    ...row,
    status: (row.status === 'Active' ? 'Open' : row.status) as CaseStatus,
    case_type: row.case_type ?? null,
  }
}


export function useCases() {
  const { data, loading, error, refetch } = useQuery(CasesQueryDoc, {
    errorPolicy: 'all',
  })
  const rows = data?.cases as WireCase[] | undefined
  return {
    data: rows?.map(toCase),
    isLoading: loading,
    error,
    refetch,
  }
}

export function useCase(id: string | undefined) {
  const { data, loading, error } = useQuery(CaseQueryDoc, {
    variables: { id: id ?? '' },
    errorPolicy: 'all',
  })
  const row = data?.case as WireCase | undefined
  return {
    data: row ? toCase(row) : undefined,
    isLoading: loading,
    error,
  }
}

function toCaseInput(data: Partial<CaseFormData>): CreateCaseInput & UpdateCaseInput {
  const input: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === '' || value === undefined) continue
    input[key] = value
  }
  // The form schema guarantees title + client_id on create; update is partial.
  return input as CreateCaseInput & UpdateCaseInput
}

export function useCreateCase() {
  const [mutate, state] = useMutation(CreateCaseMutationDoc, {
    refetchQueries: [CasesQueryDoc, 'DashboardStats'],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (data: CaseFormData) => {
      const res = await mutate({ variables: { input: toCaseInput(data) } })
      return res.data?.createCase
    },
    mutate: (data: CaseFormData) => {
      void mutate({ variables: { input: toCaseInput(data) } })
    },
  }
}

export function useUpdateCase() {
  const [mutate, state] = useMutation(UpdateCaseMutationDoc, {
    refetchQueries: [CasesQueryDoc, 'DashboardStats'],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<CaseFormData>
    }) => {
      const res = await mutate({ variables: { id, input: toCaseInput(data) } })
      return res.data?.updateCase
    },
    mutate: ({ id, data }: { id: string; data: Partial<CaseFormData> }) => {
      void mutate({ variables: { id, input: toCaseInput(data) } })
    },
  }
}

export function useDeleteCase() {
  const [mutate, state] = useMutation(DeleteCaseMutationDoc, {
    refetchQueries: [CasesQueryDoc, 'DashboardStats'],
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
