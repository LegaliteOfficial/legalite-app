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

export function useClients() {
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
    skip: !id,
  })
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
