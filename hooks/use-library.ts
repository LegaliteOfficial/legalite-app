import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { createBrowserClient } from '@supabase/ssr'

export interface LibraryItem {
  id: string
  user_id: string
  category: 'book' | 'article' | 'document'
  title: string
  author: string | null
  description: string | null
  tags: string[] | null
  file_url: string | null
  file_name: string | null
  file_type: string | null
  file_size: number | null
  thumbnail_url: string | null
  is_favorite: boolean
  created_at: string
  updated_at: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

const LIBRARY_KEY = ['library'] as const

export function useLibrary(category?: string) {
  return useQuery<LibraryItem[]>({
    queryKey: [...LIBRARY_KEY, category ?? 'all'],
    queryFn: async () => {
      const params = category ? `?category=${category}` : ''
      const res = await api.get<ApiResponse<LibraryItem[]>>(`/library${params}`)
      return res.data.data
    },
  })
}

export function useCreateLibraryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<LibraryItem>) => {
      const res = await api.post<ApiResponse<LibraryItem>>('/library', data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIBRARY_KEY }),
  })
}

export function useUpdateLibraryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LibraryItem> }) => {
      const res = await api.patch<ApiResponse<LibraryItem>>(`/library/${id}`, data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIBRARY_KEY }),
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<LibraryItem>>(`/library/${id}/favorite`)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIBRARY_KEY }),
  })
}

export function useDeleteLibraryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/library/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIBRARY_KEY }),
  })
}

export function useDownloadLibraryItem() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.get<ApiResponse<{ url: string }>>(`/library/${id}/download`)
      return res.data.data.url
    },
  })
}

// Direct Supabase upload for library files
export function useUploadLibraryFile() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  return useMutation({
    mutationFn: async ({
      file,
      userId,
      category,
    }: {
      file: File
      userId: string
      category: string
    }) => {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${category}/${Date.now()}_${file.name}`

      const { data, error } = await supabase.storage
        .from('library')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw new Error(`Upload failed: ${error.message}`)

      const { data: urlData } = supabase.storage
        .from('library')
        .getPublicUrl(data.path)

      return {
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      }
    },
  })
}
