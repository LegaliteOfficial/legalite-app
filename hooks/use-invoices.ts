import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Invoice, ApiResponse } from '@/types'
import type { InvoiceFormData } from '@/schemas'

const INVOICES_KEY = ['invoices'] as const

export function useInvoices() {
  return useQuery<Invoice[]>({
    queryKey: INVOICES_KEY,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Invoice[]>>('/invoices')
      if (!res.data.success) {
        throw new Error('API returned success=false for GET /invoices')
      }
      return res.data.data
    },
  })
}

export function useInvoice(id: string | undefined) {
  return useQuery<Invoice>({
    queryKey: [...INVOICES_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error('Invoice ID is required')
      const res = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`)
      if (!res.data.success) {
        throw new Error(`API returned success=false for GET /invoices/${id}`)
      }
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const res = await api.post<ApiResponse<Invoice>>('/invoices', data)
      if (!res.data.success) {
        throw new Error('API returned success=false for POST /invoices')
      }
      return res.data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVOICES_KEY })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InvoiceFormData> }) => {
      if (!id) throw new Error('Invoice ID is required for update')
      const res = await api.patch<ApiResponse<Invoice>>(`/invoices/${id}`, data)
      if (!res.data.success) {
        throw new Error(`API returned success=false for PATCH /invoices/${id}`)
      }
      return res.data.data
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: INVOICES_KEY })
      qc.invalidateQueries({ queryKey: [...INVOICES_KEY, variables.id] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!id) throw new Error('Invoice ID is required for delete')
      await api.delete(`/invoices/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVOICES_KEY })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
