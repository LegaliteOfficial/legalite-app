import { useState } from 'react'
import { useMutation, useQuery, useLazyQuery } from '@apollo/client/react'
import {
  AttachmentsQueryDoc,
  AttachmentDownloadUrlQueryDoc,
  CreateAttachmentMutationDoc,
  CreateAttachmentUploadUrlMutationDoc,
  DeleteAttachmentMutationDoc,
} from '@/lib/graphql/attachments'
import { uploadToSignedUrl } from '@/lib/storage-upload'
import type { AttachmentsQuery } from '@/types/generated/graphql'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

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
 * Upload a file for a client or case. The app authenticates with its own JWT
 * (no Supabase session), so the browser can't write to the private bucket
 * directly — Storage RLS would reject it. Instead the backend (service role)
 * issues a one-time signed upload URL; the browser streams the bytes to it,
 * then the metadata row is recorded over GraphQL. Returns the created
 * Attachment so the caller can optimistically prepend it.
 * No Supabase client or anon key is involved in the browser.
 */
export function useUploadAttachment() {
  const [createUploadUrl] = useMutation(CreateAttachmentUploadUrlMutationDoc)
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
      if (DEV_BYPASS) {
        throw new Error(
          'File uploads are disabled in dev bypass mode. Connect a Supabase project to enable them.',
        )
      }
      setIsPending(true)
      try {
        // 1) Ask the backend (service role) for a signed upload target.
        const target = await createUploadUrl({
          variables: {
            input: {
              entity_type: entityType,
              entity_id: entityId,
              file_name: file.name,
            },
          },
        })
        const upload = target.data?.createAttachmentUploadUrl
        if (!upload) throw new Error('Could not start the upload. Please try again.')

        // 2) Stream the bytes to the signed URL — no Storage RLS involved.
        await uploadToSignedUrl(upload.signed_url, file)

        // 3) Record the metadata row.
        const res = await createAttachment({
          variables: {
            input: {
              entity_type: entityType,
              entity_id: entityId,
              storage_path: upload.path,
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
