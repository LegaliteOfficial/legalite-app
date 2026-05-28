import { useMutation, useQuery, useLazyQuery } from '@apollo/client/react'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  CreateLibraryItemMutationDoc,
  DeleteLibraryItemMutationDoc,
  LibraryDownloadUrlQueryDoc,
  LibraryItemsQueryDoc,
  ToggleLibraryItemFavoriteMutationDoc,
  UpdateLibraryItemMutationDoc,
} from '@/lib/graphql/operations'

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

type LibraryItemInput = Partial<Omit<LibraryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export function useLibrary(category?: string) {
  const { data, loading, error, refetch } = useQuery(LibraryItemsQueryDoc, {
    variables: { category: category ?? null },
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  if (DEV_BYPASS) {
    return { data: [] as LibraryItem[], isLoading: false, error: undefined, refetch }
  }
  return {
    data: data?.libraryItems as LibraryItem[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function useCreateLibraryItem() {
  const [mutate, state] = useMutation(CreateLibraryItemMutationDoc, {
    refetchQueries: [LibraryItemsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (data: LibraryItemInput) => {
      const res = await mutate({
        variables: { input: data as Parameters<typeof mutate>[0]['variables']['input'] },
      })
      return res.data?.createLibraryItem
    },
    mutate: (data: LibraryItemInput) => {
      void mutate({
        variables: { input: data as Parameters<typeof mutate>[0]['variables']['input'] },
      })
    },
  }
}

export function useUpdateLibraryItem() {
  const [mutate, state] = useMutation(UpdateLibraryItemMutationDoc, {
    refetchQueries: [LibraryItemsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async ({ id, data }: { id: string; data: LibraryItemInput }) => {
      const res = await mutate({
        variables: { id, input: data as Parameters<typeof mutate>[0]['variables']['input'] },
      })
      return res.data?.updateLibraryItem
    },
    mutate: ({ id, data }: { id: string; data: LibraryItemInput }) => {
      void mutate({
        variables: { id, input: data as Parameters<typeof mutate>[0]['variables']['input'] },
      })
    },
  }
}

export function useToggleFavorite() {
  const [mutate, state] = useMutation(ToggleLibraryItemFavoriteMutationDoc, {
    refetchQueries: [LibraryItemsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (id: string) => {
      const res = await mutate({ variables: { id } })
      return res.data?.toggleLibraryItemFavorite
    },
    mutate: (id: string) => {
      void mutate({ variables: { id } })
    },
  }
}

export function useDeleteLibraryItem() {
  const [mutate, state] = useMutation(DeleteLibraryItemMutationDoc, {
    refetchQueries: [LibraryItemsQueryDoc],
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

export function useDownloadLibraryItem() {
  const [exec, state] = useLazyQuery(LibraryDownloadUrlQueryDoc)
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (id: string) => {
      const res = await exec({ variables: { id } })
      const url = res.data?.libraryDownloadUrl.url
      if (!url) throw new Error('No download URL returned')
      return url
    },
  }
}

// Direct Supabase upload for library files — outside the GraphQL graph because
// binary file upload via GraphQL multipart adds complexity for no benefit here.
export function useUploadLibraryFile() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const [isPending, setIsPending] = useState(false)

  return {
    isPending,
    mutateAsync: async ({
      file,
      userId,
      category,
    }: {
      file: File
      userId: string
      category: string
    }) => {
      setIsPending(true)
      try {
      const path = `${userId}/${category}/${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage
        .from('library')
        .upload(path, file, { cacheControl: '3600', upsert: false })

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
      } finally {
        setIsPending(false)
      }
    },
  }
}
