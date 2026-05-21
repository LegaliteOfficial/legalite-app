import { useMutation, useQuery } from '@apollo/client/react'
import {
  CaseQueryDoc,
  CasesQueryDoc,
  CreateCaseMutationDoc,
  DeleteCaseMutationDoc,
  UpdateCaseMutationDoc,
} from '@/lib/graphql/operations'
import type { CaseFormData } from '@/schemas'
import type { Case } from '@/types'

export function useCases() {
  const { data, loading, error, refetch } = useQuery(CasesQueryDoc)
  return {
    data: data?.cases as Case[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function useCase(id: string | undefined) {
  const { data, loading, error } = useQuery(CaseQueryDoc, {
    variables: { id: id ?? '' },
    skip: !id,
  })
  return {
    data: data?.case as Case | undefined,
    isLoading: loading,
    error,
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
      const res = await mutate({ variables: { input: data } })
      return res.data?.createCase
    },
    mutate: (data: CaseFormData) => {
      void mutate({ variables: { input: data } })
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
      const res = await mutate({ variables: { id, input: data } })
      return res.data?.updateCase
    },
    mutate: ({ id, data }: { id: string; data: Partial<CaseFormData> }) => {
      void mutate({ variables: { id, input: data } })
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
