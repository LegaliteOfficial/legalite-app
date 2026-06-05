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

// ── DEV_BYPASS dev sample ──────────────────────────────────────────────
// When `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` and there's no live backend, we
// short-circuit the Apollo round-trip and serve this hand-rolled list so
// the cases UI (list, detail, dropdowns referenced by /clients, /tasks,
// /calendar) renders end-to-end without a running GraphQL server. Mirrors
// `DEV_SAMPLE_CLIENTS` ids in hooks/use-clients.ts so the client-case
// link in the new-case form lights up correctly.
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
const DEV_SAMPLE_CASES: Case[] = [
  {
    id: 'dev-1',
    user_id: 'dev',
    client_id: 'dev-client-1',
    case_code: 'LL-0001',
    title: 'Mensah v. Ghana Revenue Authority',
    court: 'High Court (Commercial Division)',
    suit_number: 'HC/COM/2026/0114',
    opposing_party: 'Ghana Revenue Authority',
    next_court_date: '2026-06-04',
    status: 'Open',
    case_type: 'Tax',
    case_stage: 'Discovery',
    assigned_lawyer: 'Akosua Boateng',
    originating_lawyer: 'Kwame Asante',
    date_opened: '2026-02-12',
    closed_at: null,
    pending_at: null,
    notification_count: 3,
    notes: null,
    description: null,
    created_at: '2026-02-12T09:00:00Z',
    updated_at: '2026-05-20T14:32:00Z',
    client_name: 'Mensah Holdings Ltd',
  },
  {
    id: 'dev-2',
    user_id: 'dev',
    client_id: 'dev-client-2',
    case_code: 'LL-0002',
    title: 'Estate of Owusu — Probate',
    court: 'High Court (General Division)',
    suit_number: 'HC/PROB/2026/0089',
    opposing_party: null,
    next_court_date: '2026-05-29',
    status: 'Open',
    case_type: 'Probate',
    case_stage: 'Pleadings',
    assigned_lawyer: 'Yaw Mensah',
    originating_lawyer: 'Akosua Boateng',
    date_opened: '2026-01-08',
    closed_at: null,
    pending_at: null,
    notification_count: 1,
    notes: null,
    description: null,
    created_at: '2026-01-08T09:00:00Z',
    updated_at: '2026-05-22T11:10:00Z',
    client_name: 'Owusu Family Trust',
  },
  {
    id: 'dev-3',
    user_id: 'dev',
    client_id: 'dev-client-3',
    case_code: 'LL-0003',
    title: 'AccraTech Ltd v. Volta Cables',
    court: 'High Court (Commercial Division)',
    suit_number: 'HC/COM/2026/0212',
    opposing_party: 'Volta Cables Ltd',
    next_court_date: '2026-07-15',
    status: 'Pending',
    case_type: 'Contract',
    case_stage: 'Negotiation',
    assigned_lawyer: 'Kwame Asante',
    originating_lawyer: 'Kwame Asante',
    date_opened: '2026-03-22',
    closed_at: null,
    pending_at: '2026-05-18T09:00:00Z',
    notification_count: 0,
    notes: null,
    description: null,
    created_at: '2026-03-22T09:00:00Z',
    updated_at: '2026-05-18T09:00:00Z',
    client_name: 'AccraTech Ltd',
  },
  {
    id: 'dev-4',
    user_id: 'dev',
    client_id: 'dev-client-4',
    case_code: 'LL-0004',
    title: 'Asante Land Title Registration',
    court: 'High Court (Land Division)',
    suit_number: 'HC/LAND/2025/0578',
    opposing_party: null,
    next_court_date: null,
    status: 'Closed',
    case_type: 'Land',
    case_stage: 'Completed',
    assigned_lawyer: 'Yaw Mensah',
    originating_lawyer: 'Yaw Mensah',
    date_opened: '2025-09-04',
    closed_at: '2026-04-12T10:00:00Z',
    pending_at: null,
    notification_count: 0,
    notes: null,
    description: null,
    created_at: '2025-09-04T09:00:00Z',
    updated_at: '2026-04-12T10:00:00Z',
    client_name: 'Nana Kofi Asante',
  },
]

export function useCases() {
  // Skip the Apollo round-trip in dev bypass mode to avoid the network
  // timeout wait that "Unable to load cases"-d every page navigation when
  // no GraphQL backend is reachable.
  const { data, loading, error, refetch } = useQuery(CasesQueryDoc, {
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  if (DEV_BYPASS) {
    return {
      data: DEV_SAMPLE_CASES,
      isLoading: false,
      error: undefined,
      refetch,
    }
  }
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
    skip: DEV_BYPASS || !id,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  if (DEV_BYPASS) {
    const match = id ? DEV_SAMPLE_CASES.find((c) => c.id === id) : undefined
    return { data: match, isLoading: false, error: undefined }
  }
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
