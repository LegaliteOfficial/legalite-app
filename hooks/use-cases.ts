import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Case, ApiResponse } from '@/types'
import type { CaseFormData } from '@/schemas'

const CASES_KEY = ['cases'] as const

export function useCases() {
  return useQuery<Case[]>({
    queryKey: CASES_KEY,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Case[]>>('/cases')
      if (!res.data.success) {
        throw new Error('API returned success=false for GET /cases')
      }
      return res.data.data
    },
  })
}

export function useCase(id: string | undefined) {
  return useQuery<Case>({
    queryKey: [...CASES_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error('Case ID is required')
      const res = await api.get<ApiResponse<Case>>(`/cases/${id}`)
      if (!res.data.success) {
        throw new Error(`API returned success=false for GET /cases/${id}`)
      }
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useCreateCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CaseFormData) => {
      const res = await api.post<ApiResponse<Case>>('/cases', data)
      if (!res.data.success) {
        throw new Error('API returned success=false for POST /cases')
      }
      return res.data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CASES_KEY })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CaseFormData> }) => {
      if (!id) throw new Error('Case ID is required for update')
      const res = await api.patch<ApiResponse<Case>>(`/cases/${id}`, data)
      if (!res.data.success) {
        throw new Error(`API returned success=false for PATCH /cases/${id}`)
      }
      return res.data.data
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: CASES_KEY })
      qc.invalidateQueries({ queryKey: [...CASES_KEY, variables.id] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!id) throw new Error('Case ID is required for delete')
      await api.delete(`/cases/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CASES_KEY })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
