import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Client, ApiResponse } from '@/types'
import type { ClientFormData } from '@/schemas'

const CLIENTS_KEY = ['clients'] as const

export function useClients() {
  return useQuery<Client[]>({
    queryKey: CLIENTS_KEY,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Client[]>>('/clients')
      if (!res.data.success) {
        throw new Error('API returned success=false for GET /clients')
      }
      return res.data.data
    },
  })
}

export function useClient(id: string | undefined) {
  return useQuery<Client>({
    queryKey: [...CLIENTS_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error('Client ID is required')
      const res = await api.get<ApiResponse<Client>>(`/clients/${id}`)
      if (!res.data.success) {
        throw new Error(`API returned success=false for GET /clients/${id}`)
      }
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      const res = await api.post<ApiResponse<Client>>('/clients', data)
      if (!res.data.success) {
        throw new Error('API returned success=false for POST /clients')
      }
      return res.data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLIENTS_KEY })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      if (!id) throw new Error('Client ID is required for update')
      const res = await api.patch<ApiResponse<Client>>(`/clients/${id}`, data)
      if (!res.data.success) {
        throw new Error(`API returned success=false for PATCH /clients/${id}`)
      }
      return res.data.data
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: CLIENTS_KEY })
      qc.invalidateQueries({ queryKey: [...CLIENTS_KEY, variables.id] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!id) throw new Error('Client ID is required for delete')
      await api.delete(`/clients/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLIENTS_KEY })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
