import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Deadline {
  id: string
  user_id: string
  case_id: string | null
  title: string
  description: string | null
  due_date: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'Pending' | 'Done' | 'Missed'
  reminder_days: number | null
  case_title: string | null
  created_at: string
  updated_at: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

const DEADLINES_KEY = ['deadlines'] as const

export function useDeadlines(status?: string) {
  return useQuery<Deadline[]>({
    queryKey: [...DEADLINES_KEY, status ?? 'all'],
    queryFn: async () => {
      const params = status ? `?status=${status}` : ''
      const res = await api.get<ApiResponse<Deadline[]>>(`/deadlines${params}`)
      return res.data.data
    },
  })
}

export function useDeadlineStats() {
  return useQuery<{ overdue_count: number; upcoming_this_week: Deadline[] }>({
    queryKey: [...DEADLINES_KEY, 'stats'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ overdue_count: number; upcoming_this_week: Deadline[] }>>('/deadlines/stats')
      return res.data.data
    },
    refetchInterval: 60_000,
  })
}

export function useCreateDeadline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Deadline>) => {
      const res = await api.post<ApiResponse<Deadline>>('/deadlines', data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DEADLINES_KEY }),
  })
}

export function useUpdateDeadline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Deadline> }) => {
      const res = await api.patch<ApiResponse<Deadline>>(`/deadlines/${id}`, data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DEADLINES_KEY }),
  })
}

export function useDeleteDeadline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/deadlines/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DEADLINES_KEY }),
  })
}
