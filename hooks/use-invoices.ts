import { useMutation, useQuery } from '@apollo/client/react'
import {
  CreateInvoiceMutationDoc,
  DeleteInvoiceMutationDoc,
  InvoiceQueryDoc,
  InvoicesQueryDoc,
  UpdateInvoiceMutationDoc,
} from '@/lib/graphql/operations'
import type { InvoiceFormData } from '@/schemas'
import type { Invoice } from '@/types'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export function useInvoices() {
  const { data, loading, error, refetch } = useQuery(InvoicesQueryDoc, {
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  if (DEV_BYPASS) {
    return { data: [] as Invoice[], isLoading: false, error: undefined, refetch }
  }
  return {
    data: data?.invoices as Invoice[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function useInvoice(id: string | undefined) {
  const { data, loading, error } = useQuery(InvoiceQueryDoc, {
    variables: { id: id ?? '' },
    skip: !id,
  })
  return {
    data: data?.invoice as Invoice | undefined,
    isLoading: loading,
    error,
  }
}

export function useCreateInvoice() {
  const [mutate, state] = useMutation(CreateInvoiceMutationDoc, {
    refetchQueries: [InvoicesQueryDoc, 'DashboardStats'],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (data: InvoiceFormData) => {
      const res = await mutate({ variables: { input: data } })
      return res.data?.createInvoice
    },
    mutate: (data: InvoiceFormData) => {
      void mutate({ variables: { input: data } })
    },
  }
}

export function useUpdateInvoice() {
  const [mutate, state] = useMutation(UpdateInvoiceMutationDoc, {
    refetchQueries: [InvoicesQueryDoc, 'DashboardStats'],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<InvoiceFormData>
    }) => {
      const res = await mutate({ variables: { id, input: data } })
      return res.data?.updateInvoice
    },
    mutate: ({ id, data }: { id: string; data: Partial<InvoiceFormData> }) => {
      void mutate({ variables: { id, input: data } })
    },
  }
}

export function useDeleteInvoice() {
  const [mutate, state] = useMutation(DeleteInvoiceMutationDoc, {
    refetchQueries: [InvoicesQueryDoc, 'DashboardStats'],
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
