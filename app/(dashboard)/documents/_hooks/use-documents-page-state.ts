'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDeleteDocument, useDocuments, useUpdateDocument } from '@/hooks/use-documents'
import { useCases } from '@/hooks/use-cases'
import {
  useCreateLibraryItem,
  useDeleteLibraryItem,
  useDownloadLibraryItem,
  useLibrary,
  useToggleFavorite,
  useUploadLibraryFile,
} from '@/hooks/use-library'
import { useAuthStore } from '@/stores/auth.store'
import { DOCUMENT_TEMPLATES } from '@/lib/templates'
import { STATUS_META, type DocumentStatus } from '@/lib/documents/status'
import type { Document } from '@/types'
import type { LibraryCategory, Tab } from '../_types'
import { useStartDocument } from './use-start-document'
import { confirmAction } from '@/stores/confirm.store'

/**
 * State and handlers for the Documents home (list, templates, library).
 * Editing happens on /documents/[id]; this page only starts documents and
 * manages the list.
 */
export function useDocumentsPageState() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('documents')

  // ── Case context (/documents?case=<id>, "New draft" on a case) ────────
  const [caseContextId, setCaseContextId] = useState<string | null>(null)
  const { data: documentCases } = useCases()
  const caseContext = useMemo(
    () => (caseContextId ? documentCases?.find((c) => c.id === caseContextId) : undefined),
    [caseContextId, documentCases],
  )

  // ── Documents ─────────────────────────────────────────────────────────
  const { data: documents, isLoading, error, refetch } = useDocuments()
  const updateMutation = useUpdateDocument()
  const deleteMutation = useDeleteDocument()
  const start = useStartDocument(caseContext)

  // Firm-authored templates share the documents table; the list excludes them.
  const workDocuments = useMemo(() => (documents ?? []).filter((d) => !d.is_template), [documents])
  const myTemplates = useMemo(
    () => (documents ?? []).filter((d) => d.is_template && !d.file_url),
    [documents],
  )

  const setStatus = useCallback(
    async (doc: Document, status: DocumentStatus) => {
      try {
        await updateMutation.mutateAsync({ id: doc.id, data: { status } })
        toast.success(`"${doc.title}" marked as ${STATUS_META[status].label.toLowerCase()}.`)
      } catch {
        toast.error('Unable to update the status. Please try again.')
      }
    },
    [updateMutation],
  )

  const deleteDocument = useCallback(
    async (id: string, title: string | null | undefined) => {
      const ok = await confirmAction({
        title: 'Move this document to the bin?',
        description: `"${title || 'Untitled document'}" will be moved to the bin. You can restore it from there.`,
        tone: 'danger',
        confirmLabel: 'Move to bin',
        successLabel: 'Moved to the bin',
        onConfirm: async () => {
          try {
            await deleteMutation.mutateAsync(id)
          } catch {
            toast.error('Unable to delete the document. Please try again.')
            throw new Error('The document could not be moved to the bin.')
          }
        },
      })
      if (ok) toast.success('Moved to the bin.')
    },
    [deleteMutation],
  )

  // ── Templates ─────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [templateSearch, setTemplateSearch] = useState('')
  const [quickSetupId, setQuickSetupId] = useState<string | null>(null)
  const quickSetupTemplate = useMemo(
    () => DOCUMENT_TEMPLATES.find((t) => t.id === quickSetupId),
    [quickSetupId],
  )

  const filteredTemplates = useMemo(() => {
    let list = DOCUMENT_TEMPLATES
    if (selectedCategory !== 'all') list = list.filter((t) => t.category === selectedCategory)
    if (templateSearch) {
      const q = templateSearch.toLowerCase()
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      )
    }
    return list
  }, [selectedCategory, templateSearch])

  // ── Library ───────────────────────────────────────────────────────────
  const { user } = useAuthStore()
  const [librarySearch, setLibrarySearch] = useState('')
  const [libraryCategory, setLibraryCategory] = useState<LibraryCategory>('book')
  const { data: libraryItems, isLoading: libraryLoading } = useLibrary(libraryCategory)
  const createLibraryItem = useCreateLibraryItem()
  const uploadFile = useUploadLibraryFile()
  const toggleFav = useToggleFavorite()
  const deleteLibItem = useDeleteLibraryItem()
  const downloadItem = useDownloadLibraryItem()

  const handleLibraryUpload = useCallback(
    async (file: File) => {
      if (!user?.id) {
        toast.error('Please sign in to upload files.')
        return
      }
      try {
        const fileData = await uploadFile.mutateAsync({ file, userId: user.id, category: libraryCategory })
        await createLibraryItem.mutateAsync({
          title: file.name.replace(/\.[^.]+$/, ''),
          category: libraryCategory,
          ...fileData,
        })
        toast.success('File uploaded successfully.')
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Upload failed.')
      }
    },
    [user, libraryCategory, uploadFile, createLibraryItem],
  )

  const handleLibraryDownload = useCallback(
    async (id: string) => {
      try {
        const url = await downloadItem.mutateAsync(id)
        window.open(url, '_blank')
      } catch {
        toast.error('Unable to download file. Please try again.')
      }
    },
    [downloadItem],
  )

  const handleLibraryDelete = useCallback(
    async (id: string) => {
      try {
        await deleteLibItem.mutateAsync(id)
        toast.success('Item removed from library.')
      } catch {
        toast.error('Unable to delete item. Please try again.')
      }
    },
    [deleteLibItem],
  )

  const handleLibraryFavorite = useCallback(
    async (id: string) => {
      try {
        await toggleFav.mutateAsync(id)
      } catch {
        toast.error('Unable to update favorite.')
      }
    },
    [toggleFav],
  )

  const filteredLibrary = useMemo(
    () =>
      (libraryItems ?? []).filter(
        (item) =>
          !librarySearch ||
          item.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
          (item.author ?? '').toLowerCase().includes(librarySearch.toLowerCase()),
      ),
    [libraryItems, librarySearch],
  )

  // ── Deep links ────────────────────────────────────────────────────────
  // Read from location rather than useSearchParams so the page needs no
  // Suspense boundary. ?open=<id> is the old editor link: forward it to
  // the studio route. ?case=<id> sets the case context for new documents.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const openId = params.get('open')
    if (openId) {
      router.replace(`/documents/${openId}`)
      return
    }
    const caseId = params.get('case')
    if (!caseId) return
    // One-time sync from the URL (an external source), not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCaseContextId(caseId)
    params.delete('case')
    const rest = params.toString()
    window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''))
  }, [router])

  return {
    activeTab,
    setActiveTab,
    // case context
    caseContext,
    clearCaseContext: () => setCaseContextId(null),
    documentCases: documentCases ?? [],
    // documents
    workDocuments,
    isLoading,
    error,
    refetch,
    setStatus,
    deleteDocument,
    start,
    // templates
    myTemplates,
    selectedCategory,
    setSelectedCategory,
    templateSearch,
    setTemplateSearch,
    filteredTemplates,
    quickSetupTemplate,
    openQuickSetup: setQuickSetupId,
    closeQuickSetup: () => setQuickSetupId(null),
    // library
    librarySearch,
    setLibrarySearch,
    libraryCategory,
    setLibraryCategory,
    libraryLoading,
    filteredLibrary,
    isUploadingLibrary: uploadFile.isPending || createLibraryItem.isPending,
    isDownloadingLibrary: downloadItem.isPending,
    handleLibraryUpload,
    handleLibraryDownload,
    handleLibraryDelete,
    handleLibraryFavorite,
  }
}

export type DocumentsPageState = ReturnType<typeof useDocumentsPageState>
