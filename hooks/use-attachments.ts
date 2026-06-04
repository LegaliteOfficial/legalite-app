import { useState } from 'react'
import { useMutation, useQuery, useLazyQuery } from '@apollo/client/react'
import { createBrowserClient } from '@supabase/ssr'
import {
  AttachmentsQueryDoc,
  AttachmentDownloadUrlQueryDoc,
  CreateAttachmentMutationDoc,
  DeleteAttachmentMutationDoc,
} from '@/lib/graphql/operations'
import type { AttachmentsQuery } from '@/types/generated/graphql'
import { useAuthStore } from '@/stores/auth.store'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
const BUCKET = 'attachments'

export type EntityType = 'client' | 'case'
export type Attachment = AttachmentsQuery['attachments'][number]

export function useAttachments(entityType: EntityType, entityId?: string) {
  const { data, loading, error, refetch } = useQuery(AttachmentsQueryDoc, {
    variables: { entity_type: entityType, entity_id: entityId ?? '' },
    skip: !entityId || DEV_BYPASS,
    errorPolicy: 'all',
  })
  return {
    data: data?.attachments as Attachment[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

/**
 * Upload a file for a client or case: bytes go straight to the private
 * Supabase Storage bucket (namespaced by firm/entity), then the metadata row
 * is recorded over GraphQL. Mirrors useUploadLibraryFile. Returns the created
 * Attachment so the caller can optimistically prepend it.
 */
export function useUploadAttachment() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const activeMembership = useAuthStore((s) => s.activeMembership)
  const [createAttachment] = useMutation(CreateAttachmentMutationDoc, {
    refetchQueries: [AttachmentsQueryDoc],
  })
  const [isPending, setIsPending] = useState(false)

  return {
    isPending,
    mutateAsync: async ({
      file,
      entityType,
      entityId,
    }: {
      file: File
      entityType: EntityType
      entityId: string
    }) => {
      setIsPending(true)
      try {
        const firmId = activeMembership?.firm_id ?? 'no-firm'
        const safeName = file.name.replace(/[^\w.\-]+/g, '_')
        const path = `${firmId}/${entityType}/${entityId}/${Date.now()}_${safeName}`
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { cacheControl: '3600', upsert: false })
        if (error) throw new Error(`Upload failed: ${error.message}`)

        const res = await createAttachment({
          variables: {
            input: {
              entity_type: entityType,
              entity_id: entityId,
              storage_path: data.path,
              file_name: file.name,
              file_type: file.type || null,
              file_size: file.size,
            },
          },
        })
        return res.data?.createAttachment
      } finally {
        setIsPending(false)
      }
    },
  }
}

export function useDeleteAttachment() {
  const [mutate, state] = useMutation(DeleteAttachmentMutationDoc, {
    refetchQueries: [AttachmentsQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (id: string) => {
      await mutate({ variables: { id } })
    },
  }
}

/** Fetches a fresh signed URL on demand (private bucket) and returns it. */
export function useAttachmentDownload() {
  const [fetchUrl] = useLazyQuery(AttachmentDownloadUrlQueryDoc, {
    fetchPolicy: 'network-only',
  })
  return {
    getUrl: async (id: string): Promise<string | undefined> => {
      const res = await fetchUrl({ variables: { id } })
      return res.data?.attachmentDownloadUrl.url
    },
  }
}
