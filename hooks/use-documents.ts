import { useMutation, useQuery } from '@apollo/client/react'
import {
  AddDocumentCommentMutationDoc,
  CreateDocumentFolderMutationDoc,
  CreateDocumentMutationDoc,
  DeleteDocumentCommentMutationDoc,
  DeleteDocumentFolderMutationDoc,
  DeleteDocumentMutationDoc,
  DeleteDocumentPermanentMutationDoc,
  DocumentCommentsQueryDoc,
  DocumentFoldersQueryDoc,
  DocumentQueryDoc,
  DocumentsQueryDoc,
  LinkDocumentsToCaseMutationDoc,
  RestoreDocumentMutationDoc,
  SignDocumentUploadMutationDoc,
  UpdateDocumentFolderMutationDoc,
  UpdateDocumentMutationDoc,
} from '@/lib/graphql/documents'
import { uploadToCloudinary } from '@/lib/cloudinary'
import type {
  DocumentCommentFormData,
  DocumentFolderFormData,
  DocumentFormData,
} from '@/schemas'
import type { Document, DocumentComment, DocumentFolder } from '@/types'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

// Every document write refreshes the list + the dashboard counters. Folder
// counts also depend on the live document set, so refresh folders too.
const DOC_REFETCH = [
  DocumentsQueryDoc,
  DocumentFoldersQueryDoc,
  'DashboardStats',
]

export interface DocumentsFilter {
  /** Show the recycle bin (only binned documents) instead of live ones. */
  includeDeleted?: boolean
  /** Only documents linked to this case. */
  caseId?: string
  /** Only documents filed under this client. */
  clientId?: string
  /** Defer the request (e.g. until a picker opens). */
  skip?: boolean
}

/**
 * Firm documents. Pass `caseId` or `clientId` so a case or contact page
 * loads only its own files rather than the whole library.
 */
export function useDocuments(filter: DocumentsFilter = {}) {
  const { data, loading, error, refetch } = useQuery(DocumentsQueryDoc, {
    variables: {
      includeDeleted: filter.includeDeleted ?? false,
      caseId: filter.caseId ?? null,
      clientId: filter.clientId ?? null,
    },
    skip: filter.skip,
  })
  if (DEV_BYPASS) {
    return { data: [] as Document[], isLoading: false, error: undefined, refetch }
  }
  return {
    data: data?.documents as Document[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function useDocument(id: string | undefined) {
  const { data, loading, error } = useQuery(DocumentQueryDoc, {
    variables: { id: id ?? '' },
    skip: !id,
  })
  return {
    data: data?.document as Document | undefined,
    isLoading: loading,
    error,
  }
}

export function useCreateDocument() {
  const [mutate, state] = useMutation(CreateDocumentMutationDoc, {
    refetchQueries: DOC_REFETCH,
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (data: DocumentFormData) => {
      const res = await mutate({ variables: { input: data } })
      return res.data?.createDocument
    },
    mutate: (data: DocumentFormData) => {
      void mutate({ variables: { input: data } })
    },
  }
}

export function useUpdateDocument() {
  const [mutate, state] = useMutation(UpdateDocumentMutationDoc, {
    refetchQueries: DOC_REFETCH,
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<DocumentFormData>
    }) => {
      const res = await mutate({ variables: { id, input: data } })
      return res.data?.updateDocument
    },
    mutate: ({ id, data }: { id: string; data: Partial<DocumentFormData> }) => {
      void mutate({ variables: { id, input: data } })
    },
  }
}

/**
 * Link existing documents to a case in one request. The backend files each
 * one under the case's client and moves any out of another case's folder.
 */
export function useLinkDocumentsToCase() {
  const [mutate, state] = useMutation(LinkDocumentsToCaseMutationDoc, {
    refetchQueries: DOC_REFETCH,
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async ({ caseId, documentIds }: { caseId: string; documentIds: string[] }) => {
      const res = await mutate({ variables: { caseId, documentIds } })
      return res.data?.linkDocumentsToCase
    },
  }
}

/** Soft delete — moves the document to the recycle bin. */
export function useDeleteDocument() {
  const [mutate, state] = useMutation(DeleteDocumentMutationDoc, {
    refetchQueries: DOC_REFETCH,
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

/** Restore a binned document back to the live list. */
export function useRestoreDocument() {
  const [mutate, state] = useMutation(RestoreDocumentMutationDoc, {
    refetchQueries: DOC_REFETCH,
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (id: string) => {
      const res = await mutate({ variables: { id } })
      return res.data?.restoreDocument
    },
  }
}

/** Permanent, irreversible delete from the recycle bin. */
export function useDeleteDocumentPermanent() {
  const [mutate, state] = useMutation(DeleteDocumentPermanentMutationDoc, {
    refetchQueries: DOC_REFETCH,
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (id: string) => {
      await mutate({ variables: { id } })
    },
  }
}

// ── File uploads (Cloudinary) ───────────────────────────────────────────────

/**
 * Returns an `uploadFile(file)` that performs a signed, direct browser→
 * Cloudinary upload and resolves to the stored asset's metadata. The backend
 * only ever sees the resulting URLs (via createDocument) — the bytes never
 * transit our server.
 */
export function useUploadDocumentFile() {
  const [sign, state] = useMutation(SignDocumentUploadMutationDoc)
  const uploadFile = async (file: File) => {
    const res = await sign()
    const sig = res.data?.signDocumentUpload
    if (!sig) throw new Error('Could not authorise the upload.')
    return uploadToCloudinary(file, sig)
  }
  return { uploadFile, isPending: state.loading }
}

// ── Folders ────────────────────────────────────────────────────────────────

/** Folders for one contact (`clientId`) or one case (`caseId`). */
export function useDocumentFolders(filter: { clientId?: string; caseId?: string } = {}) {
  const { data, loading, error, refetch } = useQuery(DocumentFoldersQueryDoc, {
    variables: { clientId: filter.clientId ?? null, caseId: filter.caseId ?? null },
  })
  if (DEV_BYPASS) {
    return {
      data: [] as DocumentFolder[],
      isLoading: false,
      error: undefined,
      refetch,
    }
  }
  return {
    data: data?.documentFolders as DocumentFolder[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function useCreateDocumentFolder() {
  const [mutate, state] = useMutation(CreateDocumentFolderMutationDoc, {
    refetchQueries: [DocumentFoldersQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (data: DocumentFolderFormData) => {
      const res = await mutate({ variables: { input: data } })
      return res.data?.createDocumentFolder
    },
  }
}

export function useUpdateDocumentFolder() {
  const [mutate, state] = useMutation(UpdateDocumentFolderMutationDoc, {
    refetchQueries: [DocumentFoldersQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async ({ id, name }: { id: string; name: string }) => {
      const res = await mutate({ variables: { id, input: { name } } })
      return res.data?.updateDocumentFolder
    },
  }
}

export function useDeleteDocumentFolder() {
  const [mutate, state] = useMutation(DeleteDocumentFolderMutationDoc, {
    // Deleting a folder re-parents its files to root, so refresh documents too.
    refetchQueries: [DocumentFoldersQueryDoc, DocumentsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (id: string) => {
      await mutate({ variables: { id } })
    },
  }
}

// ── Comments ─────────────────────────────────────────────────────────────────

export function useDocumentComments(documentId: string | undefined) {
  const { data, loading, error, refetch } = useQuery(DocumentCommentsQueryDoc, {
    variables: { documentId: documentId ?? '' },
    skip: !documentId,
  })
  return {
    data: data?.documentComments as DocumentComment[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function useAddDocumentComment() {
  const [mutate, state] = useMutation(AddDocumentCommentMutationDoc, {
    // Refresh the thread + the list (comment_count column).
    refetchQueries: [DocumentCommentsQueryDoc, DocumentsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (data: DocumentCommentFormData) => {
      const res = await mutate({ variables: { input: data } })
      return res.data?.addDocumentComment
    },
  }
}

export function useDeleteDocumentComment() {
  const [mutate, state] = useMutation(DeleteDocumentCommentMutationDoc, {
    refetchQueries: [DocumentCommentsQueryDoc, DocumentsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (id: string) => {
      await mutate({ variables: { id } })
    },
  }
}
