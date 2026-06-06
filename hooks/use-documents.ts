import { useMutation, useQuery } from '@apollo/client/react'
import {
  CreateDocumentMutationDoc,
  DeleteDocumentMutationDoc,
  DocumentQueryDoc,
  DocumentsQueryDoc,
  UpdateDocumentMutationDoc,
} from '@/lib/graphql/documents'
import type { DocumentFormData } from '@/schemas'
import type { Document } from '@/types'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export function useDocuments() {
  const { data, loading, error, refetch } = useQuery(DocumentsQueryDoc, {
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  if (DEV_BYPASS) {
    return { data: [] as Document[], isLoading: false, error: undefined, refetch }
  }
  return {
    data: data?.documents as Document[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function useDocument(id: string | undefined) {
  const { data, loading, error } = useQuery(DocumentQueryDoc, {
    variables: { id: id ?? '' },
    skip: !id,
  })
  return {
    data: data?.document as Document | undefined,
    isLoading: loading,
    error,
  }
}

export function useCreateDocument() {
  const [mutate, state] = useMutation(CreateDocumentMutationDoc, {
    refetchQueries: [DocumentsQueryDoc, 'DashboardStats'],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (data: DocumentFormData) => {
      const res = await mutate({ variables: { input: data } })
      return res.data?.createDocument
    },
    mutate: (data: DocumentFormData) => {
      void mutate({ variables: { input: data } })
    },
  }
}

export function useUpdateDocument() {
  const [mutate, state] = useMutation(UpdateDocumentMutationDoc, {
    refetchQueries: [DocumentsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<DocumentFormData>
    }) => {
      const res = await mutate({ variables: { id, input: data } })
      return res.data?.updateDocument
    },
    mutate: ({ id, data }: { id: string; data: Partial<DocumentFormData> }) => {
      void mutate({ variables: { id, input: data } })
    },
  }
}

export function useDeleteDocument() {
  const [mutate, state] = useMutation(DeleteDocumentMutationDoc, {
    refetchQueries: [DocumentsQueryDoc, 'DashboardStats'],
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
