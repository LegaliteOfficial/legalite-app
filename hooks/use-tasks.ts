import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Task, ApiResponse } from '@/types'
import type { TaskFormData } from '@/schemas'

const TASKS_KEY = ['tasks'] as const

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: TASKS_KEY,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Task[]>>('/tasks')
      if (!res.data.success) {
        throw new Error('API returned success=false for GET /tasks')
      }
      return res.data.data
    },
  })
}

export function useTask(id: string | undefined) {
  return useQuery<Task>({
    queryKey: [...TASKS_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error('Task ID is required')
      const res = await api.get<ApiResponse<Task>>(`/tasks/${id}`)
      if (!res.data.success) {
        throw new Error(`API returned success=false for GET /tasks/${id}`)
      }
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: TaskFormData) => {
      const res = await api.post<ApiResponse<Task>>('/tasks', data)
      if (!res.data.success) {
        throw new Error('API returned success=false for POST /tasks')
      }
      return res.data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASKS_KEY })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskFormData> }) => {
      if (!id) throw new Error('Task ID is required for update')
      const res = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, data)
      if (!res.data.success) {
        throw new Error(`API returned success=false for PATCH /tasks/${id}`)
      }
      return res.data.data
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: TASKS_KEY })
      qc.invalidateQueries({ queryKey: [...TASKS_KEY, variables.id] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!id) throw new Error('Task ID is required for delete')
      await api.delete(`/tasks/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASKS_KEY })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
