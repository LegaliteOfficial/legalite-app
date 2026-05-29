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

/**
 * Wire shape returned by the legalite-backend Cases query as of 2026-05-23.
 * The backend hasn't been migrated to the industry-standard field names yet (see
 * migration 20260523_case_workflow_fields.sql and the matching backend codegen).
 * Until it has, we read `matter_type` from the wire and translate to
 * `case_type` for app code. Same with the renamed status enum.
 */
interface WireCase {
  id: string
  user_id: string
  client_id: string
  case_code?: string | null
  title: string
  court?: string | null
  suit_number?: string | null
  opposing_party?: string | null
  next_court_date?: string | null
  status: 'Active' | 'Open' | 'Pending' | 'Closed'
  matter_type?: string | null
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
    // Legacy Active is treated as Open. New rows from migration 0003 already
    // come in as 'Open'.
    status: (row.status === 'Active' ? 'Open' : row.status) as CaseStatus,
    case_type: row.case_type ?? row.matter_type ?? null,
  }
}

/**
 * DEV ONLY — sample cases shown when the GraphQL backend is unreachable
 * AND `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`. Lets us iterate on the cases UI
 * without standing up legalite-backend. Remove the env flag (or the flag's
 * effect on this hook) before shipping. See components/shared/AuthGuard.tsx
 * for the auth-side equivalent.
 */
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
  // In dev-bypass mode we know there's no backend to call. Skip the
  // network round-trip entirely (`skip: true`) instead of letting Apollo
  // hang for the default network timeout before erroring out — that wait
  // was the dominant source of perceived navigation lag between pages
  // that use this hook. With `skip`, useQuery returns immediately and we
  // serve the sample data synchronously on first render.
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
  // Mirror the DEV_BYPASS short-circuit in `useCases` — without it,
  // every detail-page open in dev mode tries to hit Apollo, hangs
  // for the network timeout, then surfaces "Unable to load case".
  // With this branch the dev sample case is returned synchronously.
  const { data, loading, error } = useQuery(CaseQueryDoc, {
    variables: { id: id ?? '' },
    skip: !id || DEV_BYPASS,
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

/**
 * Translate form data (post-rename) into the wire input shape the
 * legalite-backend still expects. Drops fields the backend doesn't know
 * about yet — they'll start being sent once migration 0003 + the backend
 * codegen land.
 */
function toCaseInput(data: Partial<CaseFormData>) {
  const { case_type, case_stage, originating_lawyer, date_opened, ...rest } = data
  return {
    ...rest,
    // case_type is the new app-side name; wire still has matter_type until
    // the backend migration lands.
    matter_type: case_type,
    // Suppress lint warnings for fields the backend hasn't adopted yet.
    // Keep these here as a reminder that the form collects them; they'll
    // be wired once the backend column rename ships.
    _pending_backend: { case_stage, originating_lawyer, date_opened },
  }
}

export function useCreateCase() {
  const [mutate, state] = useMutation(CreateCaseMutationDoc, {
    refetchQueries: [CasesQueryDoc, 'DashboardStats'],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (data: CaseFormData) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input = toCaseInput(data) as any
      delete input._pending_backend
      const res = await mutate({ variables: { input } })
      return res.data?.createCase
    },
    mutate: (data: CaseFormData) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input = toCaseInput(data) as any
      delete input._pending_backend
      void mutate({ variables: { input } })
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input = toCaseInput(data) as any
      delete input._pending_backend
      const res = await mutate({ variables: { id, input } })
      return res.data?.updateCase
    },
    mutate: ({ id, data }: { id: string; data: Partial<CaseFormData> }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input = toCaseInput(data) as any
      delete input._pending_backend
      void mutate({ variables: { id, input } })
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
