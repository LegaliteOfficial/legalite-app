'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  useCreateDocument,
  useDeleteDocument,
  useDocuments,
  useUpdateDocument,
} from '@/hooks/use-documents'
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
import {
  DOCUMENT_TEMPLATES,
  generateDocumentContent,
  generateDocumentHTML,
} from '@/lib/templates'
import { DEFAULT_DESIGN, normaliseDesign, type DocumentDesign } from '@/lib/documents/design'
import type { Document } from '@/types'
import type { LibraryCategory, Tab } from '../_types'

/**
 * Encapsulates every piece of state + handler the documents page needs.
 * The page component just calls `useDocumentsPageState()` and forwards
 * slices to each sub-tab. Keeping the hook close to the page (under
 * `_hooks/`) signals it isn't meant to be reused by other routes.
 */
export function useDocumentsPageState() {
  // ── Tab + template-selection state ─────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('templates')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [templateSearch, setTemplateSearch] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [showQuickSetup, setShowQuickSetup] = useState(false)

  // ── Editor state ─────────────────────────────────────────────────────
  const [draftTitle, setDraftTitle] = useState('')
  const [court, setCourt] = useState('')
  const [suitNumber, setSuitNumber] = useState('')
  const [templateFields, setTemplateFields] = useState<Record<string, string>>({})
  const [previewContent, setPreviewContent] = useState('')
  const [editorHTML, setEditorHTML] = useState('')
  const [design, setDesign] = useState<DocumentDesign>(DEFAULT_DESIGN)
  /**
   * Bumped whenever a different document is loaded into the studio. The
   * editor is keyed on it, so it remounts with the new content.
   */
  const [contentVersion, setContentVersion] = useState(0)
  /** Set when editing an existing draft — Save updates it instead of duping. */
  const [editingDocId, setEditingDocId] = useState<string | null>(null)

  const loadIntoStudio = useCallback(
    (doc: { html: string; design?: unknown; title: string; court?: string; suitNumber?: string; id?: string | null }) => {
      setEditorHTML(doc.html)
      setPreviewContent(doc.html)
      setDesign(normaliseDesign(doc.design ?? null))
      setDraftTitle(doc.title)
      setCourt(doc.court ?? '')
      setSuitNumber(doc.suitNumber ?? '')
      setEditingDocId(doc.id ?? null)
      setContentVersion((v) => v + 1)
      setActiveTab('editor')
    },
    [],
  )

  // ── Data hooks ────────────────────────────────────────────────────────
  const { data: documents, isLoading, error } = useDocuments()
  const { data: documentCases } = useCases()
  const createMutation = useCreateDocument()
  const updateMutation = useUpdateDocument()
  const deleteDocumentMutation = useDeleteDocument()
  const [draftSearch, setDraftSearch] = useState('')

  // Firm-authored templates share the documents table; drafts exclude them.
  const drafts = useMemo(() => documents?.filter((d) => !d.is_template), [documents])
  const myTemplates = useMemo(
    () => (documents ?? []).filter((d) => d.is_template && !d.file_url),
    [documents],
  )

  // ── Library state ─────────────────────────────────────────────────────
  const { user } = useAuthStore()
  const [librarySearch, setLibrarySearch] = useState('')
  const [libraryCategory, setLibraryCategory] = useState<LibraryCategory>('book')
  const { data: libraryItems, isLoading: libraryLoading } = useLibrary(libraryCategory)
  const createLibraryItem = useCreateLibraryItem()
  const uploadFile = useUploadLibraryFile()
  const toggleFav = useToggleFavorite()
  const deleteLibItem = useDeleteLibraryItem()
  const downloadItem = useDownloadLibraryItem()

  const handleLibraryUpload = useCallback(async (file: File) => {
    if (!user?.id) {
      toast.error('Please sign in to upload files.')
      return
    }
    try {
      const fileData = await uploadFile.mutateAsync({
        file,
        userId: user.id,
        category: libraryCategory,
      })
      await createLibraryItem.mutateAsync({
        title: file.name.replace(/\.[^.]+$/, ''),
        category: libraryCategory,
        ...fileData,
      })
      toast.success('File uploaded successfully.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.')
    }
  }, [user, libraryCategory, uploadFile, createLibraryItem])

  const handleLibraryDownload = useCallback(async (id: string) => {
    try {
      const url = await downloadItem.mutateAsync(id)
      window.open(url, '_blank')
    } catch {
      toast.error('Unable to download file. Please try again.')
    }
  }, [downloadItem])

  const handleLibraryDelete = useCallback(async (id: string) => {
    try {
      await deleteLibItem.mutateAsync(id)
      toast.success('Item removed from library.')
    } catch {
      toast.error('Unable to delete item. Please try again.')
    }
  }, [deleteLibItem])

  const handleLibraryFavorite = useCallback(async (id: string) => {
    try {
      await toggleFav.mutateAsync(id)
    } catch {
      toast.error('Unable to update favorite.')
    }
  }, [toggleFav])

  const filteredLibrary = useMemo(() => {
    return (libraryItems ?? []).filter((item) =>
      !librarySearch ||
      item.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
      (item.author ?? '').toLowerCase().includes(librarySearch.toLowerCase()),
    )
  }, [libraryItems, librarySearch])

  // ── Templates ─────────────────────────────────────────────────────────
  const template = useMemo(
    () => DOCUMENT_TEMPLATES.find((t) => t.id === selectedTemplate),
    [selectedTemplate],
  )

  const filteredTemplates = useMemo(() => {
    let list = DOCUMENT_TEMPLATES
    if (selectedCategory !== 'all') {
      list = list.filter((t) => t.category === selectedCategory)
    }
    if (templateSearch) {
      const q = templateSearch.toLowerCase()
      list = list.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q),
      )
    }
    return list
  }, [selectedCategory, templateSearch])

  const handleSelectTemplate = useCallback((id: string) => {
    const tmpl = DOCUMENT_TEMPLATES.find((t) => t.id === id)
    if (!tmpl) return
    setSelectedTemplate(id)
    setTemplateFields({})
    setDraftTitle(tmpl.name)
    const placeholderFields: Record<string, string> = {}
    for (const f of tmpl.fields) {
      placeholderFields[f.key] = f.placeholder ?? `[${f.label}]`
    }
    setTemplateFields(placeholderFields)
    const html = generateDocumentHTML(id, 'High Court (General Division)', '', tmpl.name, placeholderFields)
    loadIntoStudio({ html, title: tmpl.name })
    setPreviewContent(generateDocumentContent(id, 'High Court (General Division)', '', tmpl.name, placeholderFields))
  }, [loadIntoStudio])

  /** Start a new document from one of the firm's own templates. */
  const openMyTemplate = useCallback((doc: Document) => {
    setSelectedTemplate('')
    loadIntoStudio({ html: doc.content ?? '', design: doc.design, title: doc.title })
  }, [loadIntoStudio])

  /** Blank document with the default design. */
  const startBlankDocument = useCallback(() => {
    setSelectedTemplate('')
    loadIntoStudio({ html: '', title: '' })
  }, [loadIntoStudio])

  const handleOpenQuickSetup = useCallback((id: string) => {
    setSelectedTemplate(id)
    setTemplateFields({})
    setDraftTitle('')
    setCourt('')
    setSuitNumber('')
    setShowQuickSetup(true)
  }, [])

  // ── Editor actions ────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!draftTitle) {
      toast.error('Please enter a draft title.')
      return
    }
    const data = {
      title: draftTitle,
      template_type: template?.name ?? 'Custom',
      court,
      suit_number: suitNumber,
      content: editorHTML || previewContent,
      design: design as unknown as Record<string, unknown>,
    }
    try {
      if (editingDocId) {
        await updateMutation.mutateAsync({ id: editingDocId, data })
        toast.success('Draft updated.')
      } else {
        const created = await createMutation.mutateAsync(data)
        if (created?.id) setEditingDocId(created.id)
        toast.success('Draft saved.')
      }
      setActiveTab('drafts')
    } catch {
      toast.error('Unable to save document. Please try again.')
    }
  }, [draftTitle, template, court, suitNumber, editorHTML, previewContent, design, editingDocId, createMutation, updateMutation])

  /** Saves the current content and design as a reusable firm template. */
  const handleSaveAsTemplate = useCallback(async () => {
    const title = draftTitle.trim()
    if (!title) {
      toast.error('Give the document a title to name the template.')
      return
    }
    try {
      await createMutation.mutateAsync({
        title,
        template_type: 'Firm template',
        content: editorHTML,
        design: design as unknown as Record<string, unknown>,
        is_template: true,
      })
      toast.success(`"${title}" saved to Your templates.`)
    } catch {
      toast.error('Unable to save the template. Please try again.')
    }
  }, [draftTitle, editorHTML, design, createMutation])

  /** Open a saved draft in the editor (Drafts tab → pencil button). */
  const openDraftInEditor = useCallback((doc: { id: string; content?: string | null; title?: string | null; court?: string | null; suit_number?: string | null; design?: unknown }) => {
    loadIntoStudio({
      id: doc.id,
      html: doc.content ?? '',
      design: doc.design,
      title: doc.title ?? '',
      court: doc.court ?? '',
      suitNumber: doc.suit_number ?? '',
    })
  }, [loadIntoStudio])

  // Deep link: /documents?open=<id> (e.g. "Open in editor" on a case)
  // opens that draft in the studio once the documents have loaded. Read
  // from location rather than useSearchParams so the page needs no
  // Suspense boundary; handled once per visit.
  const deepLinkHandled = useRef(false)
  useEffect(() => {
    if (deepLinkHandled.current || !documents) return
    const params = new URLSearchParams(window.location.search)
    const id = params.get('open')
    if (!id) return
    deepLinkHandled.current = true
    const doc = documents.find((d) => d.id === id)
    // One-time sync from the URL (an external source), not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (doc && !doc.file_url) openDraftInEditor(doc)
    else toast.error('That document could not be opened in the editor.')
    params.delete('open')
    const rest = params.toString()
    window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''))
  }, [documents, openDraftInEditor])

  const deleteDraft = useCallback(async (id: string, title: string | null | undefined) => {
    if (!confirm(`Delete "${title || 'this draft'}"? This cannot be undone.`)) return
    try {
      await deleteDocumentMutation.mutateAsync(id)
      toast.success('Draft deleted.')
    } catch {
      toast.error('Unable to delete draft. Please try again.')
    }
  }, [deleteDocumentMutation])

  return {
    // tabs
    activeTab, setActiveTab,
    // templates
    selectedCategory, setSelectedCategory,
    templateSearch, setTemplateSearch,
    filteredTemplates,
    template, selectedTemplate, setSelectedTemplate,
    showQuickSetup, setShowQuickSetup,
    handleSelectTemplate,
    handleOpenQuickSetup,
    myTemplates,
    openMyTemplate,
    startBlankDocument,
    // drafts
    documents, drafts, documentCases,
    isLoading, error,
    draftSearch, setDraftSearch,
    openDraftInEditor,
    deleteDraft,
    // library
    librarySearch, setLibrarySearch,
    libraryCategory, setLibraryCategory,
    libraryLoading,
    filteredLibrary,
    isUploadingLibrary: uploadFile.isPending || createLibraryItem.isPending,
    isDownloadingLibrary: downloadItem.isPending,
    handleLibraryUpload,
    handleLibraryDownload,
    handleLibraryDelete,
    handleLibraryFavorite,
    // editor
    draftTitle, setDraftTitle,
    court, setCourt,
    suitNumber, setSuitNumber,
    editorHTML, setEditorHTML,
    design, setDesign,
    contentVersion,
    templateFields, setTemplateFields,
    editingDocId,
    isEditorSaving: createMutation.isPending || updateMutation.isPending,
    handleSave,
    handleSaveAsTemplate,
  }
}

export type DocumentsPageState = ReturnType<typeof useDocumentsPageState>
