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
  /** Set when editing an existing draft — Save updates it instead of duping. */
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Keep the contentEditable in sync when editorHTML changes externally
  // (e.g. opening a draft from the Drafts tab).
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== editorHTML) {
      editorRef.current.innerHTML = editorHTML
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, editorHTML])

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }, [])

  // ── Data hooks ────────────────────────────────────────────────────────
  const { data: documents, isLoading, error } = useDocuments()
  const { data: documentCases } = useCases()
  const createMutation = useCreateDocument()
  const updateMutation = useUpdateDocument()
  const deleteDocumentMutation = useDeleteDocument()
  const [draftSearch, setDraftSearch] = useState('')

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
    const preview = generateDocumentContent(id, 'High Court (General Division)', '', tmpl.name, placeholderFields)
    const html = generateDocumentHTML(id, 'High Court (General Division)', '', tmpl.name, placeholderFields)
    setPreviewContent(preview)
    setEditorHTML(html)
    setEditingDocId(null)
    setActiveTab('editor')
  }, [])

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
    // Prefer the live DOM HTML — captures any execCommand edits since
    // the last onInput event fired.
    const content = editorRef.current?.innerHTML || editorHTML || previewContent
    const data = {
      title: draftTitle,
      template_type: template?.name ?? 'Custom',
      court,
      suit_number: suitNumber,
      content,
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
  }, [draftTitle, template, court, suitNumber, editorHTML, previewContent, editingDocId, createMutation, updateMutation])

  const handleExport = useCallback(() => {
    const content = editorRef.current?.innerText ?? previewContent
    if (!content) {
      toast.error('Nothing to export. Generate a document first.')
      return
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${draftTitle || 'document'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Document exported.')
  }, [draftTitle, previewContent])

  const handlePrint = useCallback(() => {
    const html =
      editorRef.current?.innerHTML ||
      editorHTML ||
      `<pre style="white-space: pre-wrap;">${previewContent}</pre>`
    if (!html.trim()) {
      toast.error('Nothing to print. Generate a document first.')
      return
    }
    const pw = window.open('', '_blank')
    if (pw) {
      pw.document.write(
        `<html><head><title>${draftTitle || 'Legal Document'}</title><style>body{font-family:'Times New Roman',serif;font-size:14pt;line-height:1.8;padding:60px;max-width:800px;margin:0 auto;}</style></head><body>${html}</body></html>`,
      )
      pw.document.close()
      pw.print()
    }
  }, [draftTitle, editorHTML, previewContent])

  /** Open a saved draft in the editor (Drafts tab → pencil button). */
  const openDraftInEditor = useCallback((doc: { id: string; content?: string | null; title?: string | null; court?: string | null; suit_number?: string | null }) => {
    setEditorHTML(doc.content ?? '')
    setPreviewContent(doc.content ?? '')
    setDraftTitle(doc.title ?? '')
    setCourt(doc.court ?? '')
    setSuitNumber(doc.suit_number ?? '')
    setEditingDocId(doc.id)
    setActiveTab('editor')
  }, [])

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
    // drafts
    documents, documentCases,
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
    templateFields, setTemplateFields,
    editorRef,
    editingDocId,
    isEditorSaving: createMutation.isPending || updateMutation.isPending,
    execCommand,
    handleSave,
    handleExport,
    handlePrint,
  }
}

export type DocumentsPageState = ReturnType<typeof useDocumentsPageState>
