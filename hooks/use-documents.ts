import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Document, ApiResponse } from '@/types'
import type { DocumentFormData } from '@/schemas'

const DOCUMENTS_KEY = ['documents'] as const

export function useDocuments() {
  return useQuery<Document[]>({
    queryKey: DOCUMENTS_KEY,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Document[]>>('/documents')
      if (!res.data.success) {
        throw new Error('API returned success=false for GET /documents')
      }
      return res.data.data
    },
  })
}

export function useDocument(id: string | undefined) {
  return useQuery<Document>({
    queryKey: [...DOCUMENTS_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error('Document ID is required')
      const res = await api.get<ApiResponse<Document>>(`/documents/${id}`)
      if (!res.data.success) {
        throw new Error(`API returned success=false for GET /documents/${id}`)
      }
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useCreateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: DocumentFormData) => {
      const res = await api.post<ApiResponse<Document>>('/documents', data)
      if (!res.data.success) {
        throw new Error('API returned success=false for POST /documents')
      }
      return res.data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOCUMENTS_KEY })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DocumentFormData> }) => {
      if (!id) throw new Error('Document ID is required for update')
      const res = await api.patch<ApiResponse<Document>>(`/documents/${id}`, data)
      if (!res.data.success) {
        throw new Error(`API returned success=false for PATCH /documents/${id}`)
      }
      return res.data.data
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: DOCUMENTS_KEY })
      qc.invalidateQueries({ queryKey: [...DOCUMENTS_KEY, variables.id] })
    },
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!id) throw new Error('Document ID is required for delete')
      await api.delete(`/documents/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOCUMENTS_KEY })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
