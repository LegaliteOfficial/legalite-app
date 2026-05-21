'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  LayoutGrid, BookOpen, PenTool, Download, Printer,
  Pencil, Trash2, Search, Scale, Briefcase, Home, Users, Gavel,
  FileText, ArrowLeft, Sparkles,
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3, Pilcrow,
  List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Spinner } from '@/components/shared/Spinner'
import { useDocuments, useCreateDocument, useDeleteDocument } from '@/hooks/use-documents'
import { useCases } from '@/hooks/use-cases'
import { useLibrary, useCreateLibraryItem, useUploadLibraryFile, useToggleFavorite, useDeleteLibraryItem, useDownloadLibraryItem } from '@/hooks/use-library'
import { FileUploadZone } from '@/components/shared/FileUploadZone'
import { LibraryCard } from '@/components/shared/LibraryCard'
import { TemplateAssembly } from '@/components/shared/TemplateAssembly'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { DOCUMENT_TEMPLATES, GHANA_COURTS, generateDocumentContent, generateDocumentHTML } from '@/lib/templates'
import type { Document } from '@/types'
import { toast } from 'sonner'

type Tab = 'templates' | 'drafts' | 'library' | 'editor'

const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: LayoutGrid },
  { id: 'litigation', label: 'Litigation', icon: Scale },
  { id: 'criminal', label: 'Criminal', icon: Gavel },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'corporate', label: 'Corporate', icon: Briefcase },
  { id: 'conveyancing', label: 'Conveyancing', icon: Home },
] as const

const CATEGORY_COLORS: Record<string, { bg: string; accent: string }> = {
  litigation: { bg: 'rgba(37,99,235,0.06)', accent: '#2563EB' },
  criminal: { bg: 'rgba(192,57,43,0.06)', accent: '#C0392B' },
  family: { bg: 'rgba(139,92,246,0.06)', accent: '#8B5CF6' },
  corporate: { bg: 'rgba(46,125,79,0.06)', accent: '#2E7D4F' },
  conveyancing: { bg: 'rgba(201,151,43,0.06)', accent: '#C9972B' },
}

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('templates')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [templateSearch, setTemplateSearch] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [showQuickSetup, setShowQuickSetup] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [court, setCourt] = useState('')
  const [suitNumber, setSuitNumber] = useState('')
  const [templateFields, setTemplateFields] = useState<Record<string, string>>({})
  const [previewContent, setPreviewContent] = useState('')
  const [editorHTML, setEditorHTML] = useState('')
  const [librarySearch, setLibrarySearch] = useState('')
  const [libraryCategory, setLibraryCategory] = useState<'book' | 'article' | 'document'>('book')
  const editorRef = useRef<HTMLDivElement>(null)

  /** Keep the contentEditable div in sync when editorHTML changes externally
      (e.g. when user opens a draft from the Drafts tab). */
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

  const { data: documents, isLoading, error } = useDocuments()
  const { data: documentCases } = useCases()
  const createMutation = useCreateDocument()
  const deleteDocumentMutation = useDeleteDocument()
  const [draftSearch, setDraftSearch] = useState('')
  const { openModal } = useUIStore()
  const { user } = useAuthStore()
  const { data: libraryItems, isLoading: libraryLoading } = useLibrary(libraryCategory)
  const createLibraryItem = useCreateLibraryItem()
  const uploadFile = useUploadLibraryFile()
  const toggleFav = useToggleFavorite()
  const deleteLibItem = useDeleteLibraryItem()
  const downloadItem = useDownloadLibraryItem()

  const handleLibraryUpload = useCallback(async (file: File) => {
    if (!user?.id) { toast.error('Please sign in to upload files.'); return }
    try {
      const fileData = await uploadFile.mutateAsync({ file, userId: user.id, category: libraryCategory })
      await createLibraryItem.mutateAsync({
        title: file.name.replace(/\.[^.]+$/, ''),
        category: libraryCategory,
        ...fileData,
      })
      toast.success('File uploaded successfully.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.'
      toast.error(msg)
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

  const filteredLibrary = (libraryItems ?? []).filter((item) =>
    !librarySearch || item.title.toLowerCase().includes(librarySearch.toLowerCase()) || (item.author ?? '').toLowerCase().includes(librarySearch.toLowerCase())
  )

  const template = DOCUMENT_TEMPLATES.find((t) => t.id === selectedTemplate)

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
        t.category.toLowerCase().includes(q)
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
    // Generate a preview with placeholder fields
    const placeholderFields: Record<string, string> = {}
    for (const f of tmpl.fields) {
      placeholderFields[f.key] = f.placeholder ?? `[${f.label}]`
    }
    setTemplateFields(placeholderFields)
    const preview = generateDocumentContent(id, 'High Court (General Division)', '', tmpl.name, placeholderFields)
    const html = generateDocumentHTML(id, 'High Court (General Division)', '', tmpl.name, placeholderFields)
    setPreviewContent(preview)
    setEditorHTML(html)
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

  const handleFieldChange = useCallback((key: string, value: string) => {
    setTemplateFields((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleGenerate = useCallback(() => {
    if (!selectedTemplate) { toast.error('Please select a template first.'); return }
    if (!court) { toast.error('Please select a court.'); return }
    const content = generateDocumentContent(selectedTemplate, court, suitNumber, draftTitle, templateFields)
    setPreviewContent(content)
    const html = generateDocumentHTML(selectedTemplate, court, suitNumber, draftTitle, templateFields)
    setEditorHTML(html)
    setActiveTab('editor')
    toast.success('Document generated successfully.')
  }, [selectedTemplate, court, suitNumber, draftTitle, templateFields])

  const handleSave = useCallback(async () => {
    if (!draftTitle) { toast.error('Please enter a draft title.'); return }
    // Prefer the live DOM HTML (captures any execCommand edits the user
    // made in the editor since the last onInput event).
    const content = editorRef.current?.innerHTML || editorHTML || previewContent
    try {
      await createMutation.mutateAsync({
        title: draftTitle,
        template_type: template?.name ?? 'Custom',
        court,
        suit_number: suitNumber,
        content,
      })
      toast.success('Draft saved.')
      setActiveTab('drafts')
    } catch {
      toast.error('Unable to save document. Please try again.')
    }
  }, [draftTitle, template, court, suitNumber, editorHTML, previewContent, createMutation])

  const handleExport = useCallback(() => {
    const content = editorRef.current?.innerText ?? previewContent
    if (!content) { toast.error('Nothing to export. Generate a document first.'); return }
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
    const html = editorRef.current?.innerHTML || editorHTML || `<pre style="white-space: pre-wrap;">${previewContent}</pre>`
    if (!html.trim()) { toast.error('Nothing to print. Generate a document first.'); return }
    const pw = window.open('', '_blank')
    if (pw) {
      pw.document.write(`<html><head><title>${draftTitle || 'Legal Document'}</title><style>body{font-family:'Times New Roman',serif;font-size:14pt;line-height:1.8;padding:60px;max-width:800px;margin:0 auto;}</style></head><body>${html}</body></html>`)
      pw.document.close()
      pw.print()
    }
  }, [draftTitle, editorHTML, previewContent])

  const tabs: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'templates', label: 'Templates', icon: LayoutGrid },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'editor', label: 'Editor', icon: PenTool },
  ]

  const libraryColumns: Column<Document>[] = [
    {
      key: 'id', header: 'DOC ID',
      render: (row) => (
        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(13,27,42,0.06)', color: 'var(--navy)' }}>
          {row.id?.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    { key: 'title', header: 'TITLE' },
    { key: 'template_type', header: 'TYPE' },
    { key: 'court', header: 'COURT' },
    { key: 'suit_number', header: 'SUIT NO.' },
    {
      key: 'created_at', header: 'CREATED',
      render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : '-',
    },
    {
      key: 'actions', header: '',
      render: (row) => (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
            setPreviewContent(row.content ?? '')
            setDraftTitle(row.title ?? '')
            setCourt(row.court ?? '')
            setSuitNumber(row.suit_number ?? '')
            setActiveTab('editor')
            setEditorHTML(row.content ?? '')
          }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openModal({ type: 'confirmDelete', entity: 'document', id: row.id, name: row.title })}>
            <Trash2 size={13} className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const filteredDocs = (documents ?? []).filter((d) =>
    !librarySearch ||
    d.title?.toLowerCase().includes(librarySearch.toLowerCase()) ||
    d.template_type?.toLowerCase().includes(librarySearch.toLowerCase())
  )

  if (isLoading) return <PageSkeleton />
  if (error) return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <div
          className="rounded-2xl border px-10 py-12 text-center"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-soft)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
            Failed to load documents
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-4">Retry</Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <PageHeader
          title="Documents"
          description="Templates, drafts, and your legal library."
        />

        <div
          className="mt-6 flex items-center gap-6 border-b"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative inline-flex items-center gap-1.5 px-0.5 pb-3 text-[13.5px] font-medium transition-colors"
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {tab.label}
                {tab.id === 'library' && documents?.length ? (
                  <span
                    className="text-[10.5px] font-medium px-1.5 py-0.5 rounded tabular-nums"
                    style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}
                  >
                    {documents.length}
                  </span>
                ) : null}
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full"
                    style={{ background: 'var(--gold)' }}
                  />
                )}
              </button>
            )
          })}
        </div>

      {/* Templates Tab - Gallery View */}
      {activeTab === 'templates' && !showQuickSetup && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--navy)' }}>Create with Templates</h2>
              <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{DOCUMENT_TEMPLATES.length} legal document templates</p>
            </div>
            <div className="relative w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <Input value={templateSearch} onChange={(e) => setTemplateSearch(e.target.value)} placeholder="Search templates..." className="pl-9 h-10" />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id
              const count = cat.id === 'all' ? DOCUMENT_TEMPLATES.length : DOCUMENT_TEMPLATES.filter((t) => t.category === cat.id).length
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-colors"
                  style={{
                    background: isActive ? 'var(--surface-sunken)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--surface-overlay)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {cat.label}
                  <span
                    className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 rounded-full text-[10.5px] font-medium tabular-nums"
                    style={{
                      background: isActive ? 'var(--surface-card)' : 'var(--surface-sunken)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Template Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="rounded-xl border p-12 text-center" style={{ background: 'white', borderColor: 'var(--border)' }}>
              <FileText size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium" style={{ color: '#6B7280' }}>No templates match your search.</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {filteredTemplates.map((t) => {
                const colors = CATEGORY_COLORS[t.category] ?? { bg: 'rgba(107,114,128,0.06)', accent: '#6B7280' }
                return (
                  <div key={t.id} className="flex-shrink-0 snap-start" style={{ width: '180px' }}>
                  <button
                    onClick={() => handleSelectTemplate(t.id)}
                    className="group text-left w-full transition-all hover:shadow-xl hover:-translate-y-1"
                  >
                    {/* Document preview - realistic legal doc */}
                    <div
                      className="rounded-lg border-2 overflow-hidden transition-all group-hover:border-[var(--gold)] shadow-sm"
                      style={{
                        borderColor: 'var(--border)',
                        background: 'white',
                        aspectRatio: '8.5/11',
                      }}
                    >
                      <div className="p-3 h-full flex flex-col" style={{ fontSize: '4px', fontFamily: "'Times New Roman', serif", color: '#374151', lineHeight: '1.6' }}>
                        {/* Coat of arms / Letterhead */}
                        <div className="text-center mb-1.5 pb-1.5 border-b-2" style={{ borderColor: colors.accent + '40' }}>
                          <div className="w-5 h-5 rounded-full mx-auto mb-1 flex items-center justify-center" style={{ background: colors.accent + '15', border: `0.5px solid ${colors.accent}40` }}>
                            <Scale size={8} style={{ color: colors.accent }} />
                          </div>
                          <div className="font-bold tracking-wide" style={{ fontSize: '5px', color: colors.accent }}>IN THE {t.category === 'criminal' ? 'CRIMINAL' : t.category === 'family' ? 'FAMILY' : 'HIGH'} COURT</div>
                          <div style={{ fontSize: '3.5px', color: '#9CA3AF' }}>REPUBLIC OF GHANA</div>
                        </div>

                        {/* Suit number */}
                        <div className="text-right mb-1" style={{ fontSize: '3.5px', color: '#6B7280' }}>SUIT NO: HC/0042/2025</div>

                        {/* Parties */}
                        <div className="mb-1.5 text-center" style={{ fontSize: '4px' }}>
                          <div className="font-bold" style={{ color: 'var(--navy)' }}>JOHN MENSAH</div>
                          <div style={{ fontSize: '3px', color: '#9CA3AF', letterSpacing: '0.5px' }}>... {t.fields[0]?.label?.toUpperCase() ?? 'PLAINTIFF'}</div>
                          <div className="font-bold my-0.5" style={{ color: '#6B7280', fontSize: '3.5px' }}>VS.</div>
                          <div className="font-bold" style={{ color: 'var(--navy)' }}>KWAME ASANTE</div>
                          <div style={{ fontSize: '3px', color: '#9CA3AF', letterSpacing: '0.5px' }}>... {t.fields[1]?.label?.toUpperCase() ?? 'DEFENDANT'}</div>
                        </div>

                        {/* Document title */}
                        <div className="text-center py-1 mb-1.5 border-y-2" style={{ borderColor: colors.accent + '30' }}>
                          <div className="font-bold tracking-wider" style={{ fontSize: '5px', color: colors.accent }}>{t.name.toUpperCase()}</div>
                        </div>

                        {/* Body text */}
                        <div className="flex-1 px-1" style={{ fontSize: '3.5px', color: '#6B7280', lineHeight: '1.8' }}>
                          <div className="mb-1">The {t.fields[0]?.label ?? 'Plaintiff'} herein states as follows:</div>
                          <div className="mb-0.5">1. That the {t.fields[0]?.label ?? 'Plaintiff'} is a person of full legal capacity and is currently residing within the jurisdiction of this Honourable Court at Accra, Greater Accra Region.</div>
                          <div className="mb-0.5">2. That on or about the date herein stated, the above-named parties did enter into an agreement pertaining to the subject matter of this action.</div>
                          <div className="mb-0.5">3. That the {t.fields[1]?.label ?? 'Defendant'} has failed, refused and/or neglected to comply with the terms and conditions as agreed upon by both parties.</div>
                          <div className="mb-0.5">4. That by reason of the foregoing, the {t.fields[0]?.label ?? 'Plaintiff'} has suffered loss and damage and seeks the reliefs endorsed hereon.</div>
                          <div>5. WHEREFORE the {t.fields[0]?.label ?? 'Plaintiff'} claims against the {t.fields[1]?.label ?? 'Defendant'} as per the endorsement on this document.</div>
                        </div>

                        {/* Signature block */}
                        <div className="mt-auto pt-1 border-t" style={{ borderColor: '#f3f4f6', fontSize: '3px', color: '#9CA3AF' }}>
                          <div>Dated this 23rd day of March, 2026</div>
                          <div className="mt-1 w-12 border-b" style={{ borderColor: '#d1d5db' }} />
                          <div className="font-bold mt-0.5" style={{ fontSize: '3.5px', color: '#6B7280' }}>Counsel for {t.fields[0]?.label ?? 'Plaintiff'}</div>
                        </div>
                      </div>
                    </div>
                    {/* Title below card */}
                    <h3 className="font-heading text-[12px] font-bold mt-2 mb-0 leading-tight group-hover:text-[var(--gold)] transition-colors truncate" style={{ color: 'var(--navy)' }}>
                      {t.name}
                    </h3>
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: '#9CA3AF' }}>
                      {t.category.charAt(0).toUpperCase() + t.category.slice(1)} &middot; {t.fields.length} fields
                    </p>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenQuickSetup(t.id) }}
                    className="w-full mt-1.5 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all hover:shadow-sm"
                    style={{ background: 'rgba(201,151,43,0.08)', color: 'var(--gold)', border: '1px solid rgba(201,151,43,0.2)' }}
                  >
                    <PenTool size={10} />
                    Quick Setup
                  </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Setup (after selecting a template) — case-driven assembly view */}
      {activeTab === 'templates' && showQuickSetup && template && (
        <TemplateAssembly
          template={template}
          onBack={() => { setShowQuickSetup(false); setSelectedTemplate('') }}
          onSaved={() => setActiveTab('drafts')}
        />
      )}

      {/* Drafts Tab — saved generated documents */}
      {activeTab === 'drafts' && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--navy)' }}>My Drafts</h2>
              <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
                {documents?.length ?? 0} saved document{(documents?.length ?? 0) === 1 ? '' : 's'}
              </p>
            </div>
            <div className="relative w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <Input
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                placeholder="Search drafts..."
                className="pl-9 h-10"
              />
            </div>
          </div>

          {(() => {
            const filteredDrafts = (documents ?? []).filter((d) => {
              if (!draftSearch.trim()) return true
              const q = draftSearch.toLowerCase()
              return (
                (d.title ?? '').toLowerCase().includes(q) ||
                (d.template_type ?? '').toLowerCase().includes(q) ||
                (d.court ?? '').toLowerCase().includes(q) ||
                (d.suit_number ?? '').toLowerCase().includes(q)
              )
            })

            if (filteredDrafts.length === 0) {
              return (
                <div className="rounded-xl border p-12 text-center" style={{ background: 'white', borderColor: 'var(--border)' }}>
                  <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium mb-1" style={{ color: '#374151' }}>
                    {draftSearch ? `No drafts match "${draftSearch}".` : 'No drafts yet.'}
                  </p>
                  <p className="text-[12px]" style={{ color: '#9CA3AF' }}>
                    {draftSearch ? 'Try a different search term.' : 'Pick a template, fill it in, and click "Save to Library" to keep a draft here.'}
                  </p>
                  {!draftSearch && (
                    <Button
                      onClick={() => setActiveTab('templates')}
                      className="mt-4 text-white"
                      style={{ background: 'var(--gold)' }}
                    >
                      Browse Templates
                    </Button>
                  )}
                </div>
              )
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredDrafts.map((doc) => {
                  const linkedCase = documentCases?.find((c) => c.id === doc.case_id)
                  const created = doc.created_at ? new Date(doc.created_at) : null
                  return (
                    <div
                      key={doc.id}
                      className="group rounded-xl border p-5 transition-all hover:shadow-md"
                      style={{ background: 'white', borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,151,43,0.08)' }}>
                          <FileText size={16} style={{ color: 'var(--gold)' }} />
                        </div>
                        {doc.template_type && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(13,27,42,0.06)', color: 'var(--navy)' }}>
                            {doc.template_type}
                          </span>
                        )}
                      </div>

                      <h3 className="font-heading text-sm font-bold mb-2 line-clamp-2" style={{ color: 'var(--navy)' }}>
                        {doc.title || 'Untitled draft'}
                      </h3>

                      <div className="space-y-1 mb-3">
                        {linkedCase && (
                          <p className="text-[11px] truncate" style={{ color: '#6B7280' }}>
                            <span className="font-medium">Case:</span> {linkedCase.title}
                          </p>
                        )}
                        {doc.suit_number && (
                          <p className="text-[11px] font-mono truncate" style={{ color: '#6B7280' }}>
                            {doc.suit_number}
                          </p>
                        )}
                        {doc.court && (
                          <p className="text-[11px] truncate" style={{ color: '#9CA3AF' }}>
                            {doc.court}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                        <span className="text-[10px]" style={{ color: '#9CA3AF' }}>
                          {created ? created.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="Open in editor"
                            onClick={() => {
                              setEditorHTML(doc.content ?? '')
                              setDraftTitle(doc.title ?? '')
                              setCourt(doc.court ?? '')
                              setSuitNumber(doc.suit_number ?? '')
                              setActiveTab('editor')
                            }}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="Delete draft"
                            onClick={() => {
                              if (confirm(`Delete "${doc.title || 'this draft'}"? This cannot be undone.`)) {
                                deleteDocumentMutation.mutate(doc.id, {
                                  onSuccess: () => toast.success('Draft deleted.'),
                                  onError: () => toast.error('Unable to delete draft. Please try again.'),
                                })
                              }
                            }}
                          >
                            <Trash2 size={13} className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}

      {/* Library Tab */}
      {activeTab === 'library' && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--navy)' }}>Legal Library</h2>
              <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
                Your personal collection of legal resources
              </p>
            </div>
            <div className="relative w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <Input value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} placeholder="Search library..." className="pl-9 h-10" />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1 mb-6">
            {([
              { id: 'book' as const, label: 'Books' },
              { id: 'article' as const, label: 'Articles' },
              { id: 'document' as const, label: 'Documents' },
            ]).map((cat) => {
              const isActive = libraryCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setLibraryCategory(cat.id)}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors"
                  style={{
                    background: isActive ? 'var(--surface-sunken)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--surface-overlay)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Upload Zone */}
          <div className="mb-6">
            <FileUploadZone
              category={libraryCategory}
              accept={libraryCategory === 'book' ? '.pdf,.epub,.docx' : libraryCategory === 'article' ? '.pdf,.docx,.txt' : '.pdf,.jpg,.jpeg,.png,.docx'}
              maxSizeMB={libraryCategory === 'article' ? 20 : 50}
              onUpload={handleLibraryUpload}
              isUploading={uploadFile.isPending || createLibraryItem.isPending}
            />
          </div>

          {/* Items Grid */}
          {libraryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-4 animate-pulse" style={{ background: 'white', borderColor: 'var(--border)' }}>
                  <div className="h-11 w-11 rounded-lg bg-gray-100 mb-3" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-gray-50 rounded mb-3" />
                  <div className="h-px bg-gray-100 mb-2" />
                  <div className="h-3 w-1/3 bg-gray-50 rounded" />
                </div>
              ))}
            </div>
          ) : filteredLibrary.length === 0 ? (
            <div className="rounded-xl border p-12 text-center" style={{ background: 'white', borderColor: 'var(--border)' }}>
              <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium mb-1" style={{ color: '#6B7280' }}>
                No {libraryCategory === 'book' ? 'books' : libraryCategory === 'article' ? 'articles' : 'documents'} yet
              </p>
              <p className="text-[12px]" style={{ color: '#9CA3AF' }}>
                Upload your first {libraryCategory} using the drop zone above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredLibrary.map((item) => (
                <LibraryCard
                  key={item.id}
                  item={item}
                  onDownload={handleLibraryDownload}
                  onDelete={handleLibraryDelete}
                  onFavorite={handleLibraryFavorite}
                  isDownloading={downloadItem.isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor Tab */}
      {activeTab === 'editor' && (
        <div className="rounded-xl border" style={{ background: 'white', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--navy)' }}>{draftTitle || 'Untitled Document'}</h2>
              {court && <StatusBadge status={court.split('(')[0].trim()} />}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}><Download size={14} className="mr-1.5" /> Export</Button>
              <Button variant="outline" size="sm" onClick={handlePrint}><Printer size={14} className="mr-1.5" /> Print</Button>
              <Button size="sm" onClick={handleSave} disabled={createMutation.isPending} style={{ background: 'var(--gold)' }} className="text-white">
                {createMutation.isPending ? <><Spinner size={14} /> Saving...</> : 'Save'}
              </Button>
            </div>
          </div>
          {/* Rich text toolbar — execCommand is deprecated but preserves
              custom HTML formatting from generateDocumentHTML. */}
          <div className="flex items-center gap-0.5 px-3 py-2 border-b flex-wrap" style={{ borderColor: 'var(--border)', background: 'rgba(13,27,42,0.02)' }}>
            <ToolbarBtn onClick={() => execCommand('bold')} title="Bold (Cmd/Ctrl+B)"><Bold size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('italic')} title="Italic (Cmd/Ctrl+I)"><Italic size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('underline')} title="Underline (Cmd/Ctrl+U)"><Underline size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('strikeThrough')} title="Strikethrough"><Strikethrough size={14} /></ToolbarBtn>
            <ToolbarDiv />
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'p')} title="Paragraph"><Pilcrow size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'h1')} title="Heading 1"><Heading1 size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'h2')} title="Heading 2"><Heading2 size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'h3')} title="Heading 3"><Heading3 size={14} /></ToolbarBtn>
            <ToolbarDiv />
            <ToolbarBtn onClick={() => execCommand('insertUnorderedList')} title="Bullet list"><List size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('insertOrderedList')} title="Numbered list"><ListOrdered size={14} /></ToolbarBtn>
            <ToolbarDiv />
            <ToolbarBtn onClick={() => execCommand('justifyLeft')} title="Align left"><AlignLeft size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('justifyCenter')} title="Align center"><AlignCenter size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('justifyRight')} title="Align right"><AlignRight size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('justifyFull')} title="Justify"><AlignJustify size={14} /></ToolbarBtn>
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setEditorHTML((e.target as HTMLDivElement).innerHTML)}
            className="p-8 min-h-[600px] focus:outline-none leading-relaxed"
            style={{ fontFamily: "'Times New Roman', serif", color: '#1a1a1a', fontSize: '13pt', lineHeight: '1.8' }}
            dangerouslySetInnerHTML={{ __html: editorHTML || '<div style="color:#9CA3AF;font-family:DM Sans,sans-serif;font-size:13px;">Start typing your legal document here, or switch to the Templates tab to use a template...</div>' }}
          />
        </div>
      )}

        <DeleteDialog />
      </div>
    </div>
  )
}

// ── Toolbar helpers (shared between Editor tab and TemplateAssembly) ──

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className="h-8 w-8 rounded flex items-center justify-center transition-colors"
      style={{ color: '#374151' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(13,27,42,0.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  )
}

function ToolbarDiv() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />
}
