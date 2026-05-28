import { useMutation, useQuery } from '@apollo/client/react'
import {
  ClientQueryDoc,
  ClientsQueryDoc,
  CreateClientMutationDoc,
  DeleteClientMutationDoc,
  UpdateClientMutationDoc,
} from '@/lib/graphql/operations'
import type { ClientFormData } from '@/schemas'
import type { Client } from '@/types'

/**
 * DEV ONLY — sample clients used when the GraphQL backend is unreachable
 * AND `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`. Mirrors the dev sample case
 * list (hooks/use-cases.ts) so the Client dropdown in /cases/new shows
 * the same names the dev cases reference.
 */
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
const DEV_SAMPLE_CLIENTS: Client[] = [
  {
    id: 'dev-client-1',
    user_id: 'dev',
    full_name: 'Mensah Holdings Ltd',
    email: 'office@mensahholdings.gh',
    phone: '+233 20 555 0101',
    ghana_card: null,
    date_of_birth: null,
    address: 'Accra',
    status: 'Active',
    notes: null,
    created_at: '2026-01-01T09:00:00Z',
    updated_at: '2026-05-01T09:00:00Z',
  },
  {
    id: 'dev-client-2',
    user_id: 'dev',
    full_name: 'Owusu Family Trust',
    email: 'trust@owusu.gh',
    phone: '+233 24 555 0202',
    ghana_card: null,
    date_of_birth: null,
    address: 'Kumasi',
    status: 'Active',
    notes: null,
    created_at: '2026-01-01T09:00:00Z',
    updated_at: '2026-05-01T09:00:00Z',
  },
  {
    id: 'dev-client-3',
    user_id: 'dev',
    full_name: 'AccraTech Ltd',
    email: 'legal@accratech.gh',
    phone: '+233 30 555 0303',
    ghana_card: null,
    date_of_birth: null,
    address: 'Accra',
    status: 'Active',
    notes: null,
    created_at: '2026-01-01T09:00:00Z',
    updated_at: '2026-05-01T09:00:00Z',
  },
  {
    id: 'dev-client-4',
    user_id: 'dev',
    client_code: 'LL-0004',
    full_name: 'Nana Kofi Asante',
    email: 'nana.k.asante@example.gh',
    phone: '+233 26 555 0404',
    ghana_card: null,
    date_of_birth: '1996-06-20',
    address: 'Cape Coast',
    status: 'Active',
    notes: null,
    created_at: '2026-01-01T09:00:00Z',
    updated_at: '2026-05-01T09:00:00Z',
  },
]

export function useClients() {
  // Same short-circuit pattern as useCases — skip the Apollo round-trip
  // in dev bypass mode to avoid the network timeout wait that slowed
  // every page navigation.
  const { data, loading, error, refetch } = useQuery(ClientsQueryDoc, {
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  if (DEV_BYPASS) {
    return {
      data: DEV_SAMPLE_CLIENTS,
      isLoading: false,
      error: undefined,
      refetch,
    }
  }
  return {
    data: data?.clients as Client[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function useClient(id: string | undefined) {
  const { data, loading, error } = useQuery(ClientQueryDoc, {
    variables: { id: id ?? '' },
    skip: !id || DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  if (DEV_BYPASS) {
    const match = id ? DEV_SAMPLE_CLIENTS.find((c) => c.id === id) : undefined
    return { data: match, isLoading: false, error: undefined }
  }
  return {
    data: data?.client as Client | undefined,
    isLoading: loading,
    error,
  }
}

export function useCreateClient() {
  const [mutate, state] = useMutation(CreateClientMutationDoc, {
    refetchQueries: [ClientsQueryDoc, 'DashboardStats'],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (data: ClientFormData) => {
      const res = await mutate({ variables: { input: data } })
      return res.data?.createClient
    },
    mutate: (data: ClientFormData) => {
      void mutate({ variables: { input: data } })
    },
  }
}

export function useUpdateClient() {
  const [mutate, state] = useMutation(UpdateClientMutationDoc, {
    refetchQueries: [ClientsQueryDoc, 'DashboardStats'],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<ClientFormData>
    }) => {
      const res = await mutate({ variables: { id, input: data } })
      return res.data?.updateClient
    },
    mutate: ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      void mutate({ variables: { id, input: data } })
    },
  }
}

export function useDeleteClient() {
  const [mutate, state] = useMutation(DeleteClientMutationDoc, {
    refetchQueries: [ClientsQueryDoc, 'DashboardStats'],
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
