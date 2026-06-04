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
import type {
  CreateClientInput,
  UpdateClientInput,
} from '@/types/generated/graphql'


export function useClients() {
  // Same short-circuit pattern as useCases — skip the Apollo round-trip
  // in dev bypass mode to avoid the network timeout wait that slowed
  // every page navigation.
  const { data, loading, error, refetch } = useQuery(ClientsQueryDoc)
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
  })
  return {
    data: data?.client as Client | undefined,
    isLoading: loading,
    error,
  }
}

// Strip empty-string optionals: the backend treats a missing field as null and
// would reject '' for typed columns (email validation, date_of_birth DATE).
function toClientInput(
  data: Partial<ClientFormData>,
): CreateClientInput & UpdateClientInput {
  const input: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === '' || value === undefined) continue
    input[key] = value
  }
  // The form schema guarantees full_name on create; update is partial.
  return input as CreateClientInput & UpdateClientInput
}

export function useCreateClient() {
  const [mutate, state] = useMutation(CreateClientMutationDoc, {
    refetchQueries: [ClientsQueryDoc, 'DashboardStats'],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (data: ClientFormData) => {
      const res = await mutate({ variables: { input: toClientInput(data) } })
      return res.data?.createClient
    },
    mutate: (data: ClientFormData) => {
      void mutate({ variables: { input: toClientInput(data) } })
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
      const res = await mutate({ variables: { id, input: toClientInput(data) } })
      return res.data?.updateClient
    },
    mutate: ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      void mutate({ variables: { id, input: toClientInput(data) } })
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
