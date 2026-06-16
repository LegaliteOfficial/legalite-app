'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUUpLeft,
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChatCircle,
  Columns,
  Copy,
  DotsThree,
  DownloadSimple,
  FileText,
  Folder,
  FolderOpen,
  Funnel,
  MagnifyingGlass,
  PaperPlaneTilt,
  Plus,
  Trash,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCases } from '@/hooks/use-cases'
import {
  useAddDocumentComment,
  useCreateDocument,
  useCreateDocumentFolder,
  useDeleteDocument,
  useDeleteDocumentComment,
  useDeleteDocumentFolder,
  useDeleteDocumentPermanent,
  useDocumentComments,
  useDocumentFolders,
  useDocuments,
  useRestoreDocument,
  useUpdateDocument,
  useUpdateDocumentFolder,
  useUploadDocumentFile,
} from '@/hooks/use-documents'
import type { Case, Document, DocumentFolder } from '@/types'
import { GhostDialogBtn, PrimaryDialogBtn } from '../DialogButtons'
import { PagerBtn } from '../PagerBtn'

// ── Documents tab ──────────────────────────────────────────────────────

/**
 * Document column registry — the set of columns the picker can toggle.
 * Some fields (Size / Author / Uploaded by / Comments) aren't in our
 * Document schema yet, so they render em-dashes today. Keeping them in
 * the registry means the picker UI matches the standard pattern one-to-one and lights
 * up automatically the day the columns ship.
 */
type DocColumnId =
  | 'recorded_time'
  | 'name'
  | 'case'
  | 'category'
  | 'size'
  | 'last_edit'
  | 'received_at'
  | 'comments'
  | 'contact'
  | 'author'
  | 'uploaded_by'
  | 'uploaded_date'
  | 'id'

interface DocColumn {
  id: DocColumnId
  label: string
  defaultVisible: boolean
}

const DOC_COLUMNS: DocColumn[] = [
  { id: 'recorded_time', label: 'Recorded time', defaultVisible: false },
  { id: 'name', label: 'Name', defaultVisible: true },
  { id: 'case', label: 'Case', defaultVisible: false },
  { id: 'category', label: 'Category', defaultVisible: true },
  { id: 'size', label: 'Size', defaultVisible: false },
  { id: 'last_edit', label: 'Last edit at', defaultVisible: true },
  { id: 'received_at', label: 'Received at', defaultVisible: false },
  { id: 'comments', label: 'Comments', defaultVisible: false },
  { id: 'contact', label: 'Contact', defaultVisible: false },
  { id: 'author', label: 'Author', defaultVisible: false },
  { id: 'uploaded_by', label: 'Uploaded by', defaultVisible: false },
  // Uploaded date — surfaces the `created_at` timestamp (when the
  // record first entered the system). Distinct from Last edit at
  // (which tracks `updated_at`) and Received at (the day the firm
  // physically received the file, which lands with the file-storage
  // backend).
  { id: 'uploaded_date', label: 'Uploaded date', defaultVisible: false },
  // ID — the document's primary key. Off by default; firms with a
  // file-numbering convention switch it on for audit / cross-reference.
  { id: 'id', label: 'ID', defaultVisible: false },
]

const DOC_PAGE_SIZES = [25, 50, 100] as const

/**
 * Documents tab body. Mirrors the reference contact-scoped documents view:
 * toolbar (Funnel by keyword · Priority · Columns · Filters · New) plus
 * either an empty-state illustration or a table of files.
 *
 * Today every dev contact has zero documents (the Document schema
 * doesn't carry any sample rows), so the user sees the empty state
 * with the "Drag and drop files here or use the New button" prompt.
 * The toolbar still renders so users can explore the controls.
 */
export function DocumentsTab({ contactId }: { contactId: string }) {
  // The recycle-bin toggle swaps the underlying query between live and
  // binned documents (the backend filters on `deleted_at`).
  const [showBin, setShowBin] = useState(false)
  const { data: allDocs } = useDocuments(showBin)
  const { data: allCases } = useCases()
  const { data: allFolders } = useDocumentFolders(contactId)
  const docs = useMemo(
    () => (allDocs ?? []).filter((d) => d.client_id === contactId),
    [allDocs, contactId],
  )
  // Cases owned by this contact — used by the UploadSimple dialog's
  // Matter picker so users can attach the new file to one of the
  // contact's open cases without leaving the page.
  const contactCases = useMemo(
    () => (allCases ?? []).filter((c) => c.client_id === contactId),
    [allCases, contactId],
  )
  const folders = useMemo(() => allFolders ?? [], [allFolders])

  // One state flag per dialog. Keeping them separate (vs a single
  // discriminated union) lets each dialog manage its own lifecycle
  // and reset state on open without the others noticing.
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFolderOpen, setUploadFolderOpen] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [createFromTemplateOpen, setCreateFromTemplateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showFoldersFirst, setShowFoldersFirst] = useState(true)
  const [visibleCols, setVisibleCols] = useState<Set<DocColumnId>>(
    () =>
      new Set(DOC_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )
  const [caseFilter, setCaseFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [pageSize, setPageSize] = useState<(typeof DOC_PAGE_SIZES)[number]>(
    25,
  )
  const [page, setPage] = useState(0)
  const [expandRows, setExpandRows] = useState(false)
  // Folder the user has drilled into (null = library root). The bin view
  // is flat — folders are hidden there — so this only applies to live docs.
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const folderById = useMemo(
    () => new Map(folders.map((f) => [f.id, f])),
    [folders],
  )
  const currentFolder = currentFolderId
    ? folderById.get(currentFolderId) ?? null
    : null
  // Ancestor chain (root → … → current) for the breadcrumb.
  const folderPath = useMemo(() => {
    const path: DocumentFolder[] = []
    let id: string | null = currentFolderId
    const guard = new Set<string>()
    while (id && !guard.has(id)) {
      guard.add(id)
      const f = folderById.get(id)
      if (!f) break
      path.unshift(f)
      id = f.parent_id ?? null
    }
    return path
  }, [folderById, currentFolderId])

  // ── Funnel pipeline ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return docs.filter((d) => {
      if (q && !d.title.toLowerCase().includes(q)) return false
      if (caseFilter && d.case_id !== caseFilter) return false
      if (categoryFilter && d.template_type !== categoryFilter) return false
      // Folder scoping (skipped in the bin, which is intentionally flat):
      //   root  → only loose files (no folder)
      //   inside → only files filed under the open folder
      if (!showBin) {
        const folderId = d.folder_id ?? null
        if (folderId !== currentFolderId) return false
      }
      return true
    })
  }, [docs, search, caseFilter, categoryFilter, currentFolderId, showBin])

  // Sub-folders of the current level, matched against the search.
  const visibleFolders = useMemo(() => {
    if (showBin || !showFoldersFirst) return []
    const q = search.trim().toLowerCase()
    return folders.filter(
      (f) =>
        (f.parent_id ?? null) === currentFolderId &&
        (!q || f.name.toLowerCase().includes(q)),
    )
  }, [folders, showBin, showFoldersFirst, search, currentFolderId])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * pageSize
  const end = Math.min(start + pageSize, filtered.length)
  const pageRows = filtered.slice(start, end)

  const orderedCols = useMemo(
    () => DOC_COLUMNS.filter((c) => visibleCols.has(c.id)),
    [visibleCols],
  )
  const colSpan = orderedCols.length + 1

  // Reset paging when filters / scope change.
  useEffect(() => {
    setPage(0)
  }, [search, caseFilter, categoryFilter, pageSize, currentFolderId, showBin])

  const hasRows = filtered.length > 0 || visibleFolders.length > 0

  return (
    <section
      className="rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Card-internal tab label — matches the reference "Documents" sub-
          heading inside the panel. Doubles as a breadcrumb when the user
          drills into a folder or opens the recycle bin. */}
      <div
        className="px-6 pt-5 pb-4 border-b flex items-center justify-between gap-3"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <h2
          className="text-[15px] font-semibold inline-flex items-center gap-1.5 min-w-0"
          style={{ color: 'var(--text-primary)' }}
        >
          {showBin ? (
            <span className="inline-flex items-center gap-1.5">
              <Trash size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
              Recycle bin
            </span>
          ) : folderPath.length > 0 ? (
            <span className="inline-flex items-center gap-1 min-w-0 flex-wrap">
              <button
                type="button"
                onClick={() => setCurrentFolderId(null)}
                className="cursor-pointer hover:underline shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                Documents
              </button>
              {folderPath.map((f, i) => {
                const last = i === folderPath.length - 1
                return (
                  <span key={f.id} className="inline-flex items-center gap-1 min-w-0">
                    <CaretRight size={13} strokeWidth={2} style={{ color: 'var(--text-subtle)' }} />
                    {last ? (
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <Folder size={15} weight="fill" style={{ color: 'var(--gold)' }} />
                        {f.name}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCurrentFolderId(f.id)}
                        className="cursor-pointer hover:underline truncate"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {f.name}
                      </button>
                    )}
                  </span>
                )
              })}
            </span>
          ) : (
            <>
              Documents
              <span
                className="ml-2 inline-block h-[2px] w-16 rounded-full"
                style={{ background: 'var(--gold)' }}
                aria-hidden
              />
            </>
          )}
        </h2>

        {(currentFolder || showBin) && (
          <div className="flex items-center gap-2 shrink-0">
            {currentFolder && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setCurrentFolderId(currentFolder.parent_id ?? null)
                }
              >
                <ArrowUUpLeft size={14} strokeWidth={1.75} />
                Up one level
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentFolderId(null)
                if (showBin) setShowBin(false)
              }}
            >
              {showBin ? 'Back to documents' : 'Root'}
            </Button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div
        className="px-6 py-4 flex items-center justify-end gap-2 flex-wrap"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="relative w-64">
          <MagnifyingGlass
            size={13}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-subtle)' }}
          />
          <Input
            placeholder="Filter by keyword"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-[13px] rounded-lg"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
            }}
          />
        </div>

        <SortPopover
          showFoldersFirst={showFoldersFirst}
          onToggle={setShowFoldersFirst}
        />

        <ColumnsPopover
          visible={visibleCols}
          onChange={setVisibleCols}
        />

        <FiltersPopover
          cases={contactCases}
          caseFilter={caseFilter}
          categoryFilter={categoryFilter}
          showBin={showBin}
          onApply={(c, k, b) => {
            setCaseFilter(c)
            setCategoryFilter(k)
            setShowBin(b)
            // The bin is a flat view — leave any open folder behind.
            if (b) setCurrentFolderId(null)
          }}
          onClear={() => {
            setCaseFilter('')
            setCategoryFilter('')
            setShowBin(false)
          }}
        />

        <NewDropdown
          onUploadFiles={() => setUploadOpen(true)}
          onUploadFolder={() => setUploadFolderOpen(true)}
          onCreateFolder={() => setCreateFolderOpen(true)}
          onCreateFromTemplate={() => setCreateFromTemplateOpen(true)}
        />
      </div>

      {/* Body — empty state or table */}
      {!hasRows ? (
        showBin ? (
          <BinEmptyState />
        ) : (
          <DocumentsEmptyState />
        )
      ) : (
        <div className="overflow-auto">
          <table className="w-full" style={{ tableLayout: 'auto' }}>
            <thead
              style={{ background: 'var(--surface-sunken)' }}
            >
              <tr>
                <th
                  className="px-3 py-2.5 text-left text-[11.5px] font-semibold"
                  style={{ color: 'var(--text-muted)', width: 80 }}
                >
                  Action
                </th>
                {orderedCols.map((c) => (
                  <th
                    key={c.id}
                    className="px-3 py-2.5 text-left text-[11.5px] font-semibold whitespace-nowrap"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleFolders.map((folder) => (
                <FolderRow
                  key={folder.id}
                  folder={folder}
                  colSpan={colSpan}
                  expanded={expandRows}
                  onOpen={() => setCurrentFolderId(folder.id)}
                />
              ))}
              {pageRows.map((row) => (
                <DocumentRow
                  key={row.id}
                  doc={row}
                  columns={orderedCols}
                  expanded={expandRows}
                  cases={contactCases}
                  folders={folders}
                  inBin={showBin}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer / pagination */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-t"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-1">
          <PagerBtn
            onClick={() => setPage(0)}
            disabled={safePage === 0}
            aria-label="First page"
          >
            <CaretDoubleLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            aria-label="Previous page"
          >
            <CaretLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn
            onClick={() =>
              setPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={safePage >= totalPages - 1}
            aria-label="Next page"
          >
            <CaretRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn
            onClick={() => setPage(totalPages - 1)}
            disabled={safePage >= totalPages - 1}
            aria-label="Last page"
          >
            <CaretDoubleRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <span
            className="ml-2 text-[12px] tabular-nums"
            style={{ color: 'var(--text-muted)' }}
          >
            {filtered.length === 0
              ? 'No results found'
              : `${start + 1}–${end} of ${filtered.length}`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-medium border cursor-pointer"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {pageSize} <CaretDown size={11} strokeWidth={1.75} />
                </button>
              }
            />
            <DropdownMenuContent align="end">
              {DOC_PAGE_SIZES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => setPageSize(s)}
                  className="text-[12.5px]"
                >
                  {s} per page
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <label
            className="inline-flex items-center gap-2 text-[12px] cursor-pointer select-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span
              role="switch"
              aria-checked={expandRows}
              tabIndex={0}
              onClick={() => setExpandRows((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  setExpandRows((v) => !v)
                }
              }}
              className="relative inline-flex h-[18px] w-[32px] rounded-full transition-colors"
              style={{
                background: expandRows
                  ? 'var(--gold)'
                  : 'var(--border-default)',
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 h-[14px] w-[14px] rounded-full bg-white transition-transform"
                style={{
                  transform: expandRows
                    ? 'translateX(14px)'
                    : 'translateX(0)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
                }}
              />
            </span>
            Expand rows
          </label>
        </div>
      </div>

      {/* Four New-menu dialogs. Each keeps its own state + reset
          behaviour; opening one doesn't touch the others. New files land
          in the folder the user is currently viewing. */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        contactId={contactId}
        contactCases={contactCases}
        folders={folders}
        currentFolderId={currentFolderId}
      />
      <UploadFolderDialog
        open={uploadFolderOpen}
        onOpenChange={setUploadFolderOpen}
        contactId={contactId}
        contactCases={contactCases}
        parentId={currentFolderId}
      />
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        contactId={contactId}
        parentId={currentFolderId}
      />
      <CreateFromTemplateDialog
        open={createFromTemplateOpen}
        onOpenChange={setCreateFromTemplateOpen}
        contactId={contactId}
        contactCases={contactCases}
      />
    </section>
  )
}

/**
 * Folder row — rendered above the document rows at the library root. The
 * whole row drills into the folder; a tucked-away action menu renames or
 * deletes it. Deleting a folder re-parents its files to the root (the
 * backend FK is ON DELETE SET NULL), so nothing is lost.
 */
function FolderRow({
  folder,
  colSpan,
  expanded,
  onOpen,
}: {
  folder: DocumentFolder
  colSpan: number
  expanded: boolean
  onOpen: () => void
}) {
  const updateMutation = useUpdateDocumentFolder()
  const deleteMutation = useDeleteDocumentFolder()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [name, setName] = useState(folder.name)
  const cellPad = expanded ? 'py-3.5' : 'py-2.5'

  const [prevRename, setPrevRename] = useState(renameOpen)
  if (renameOpen !== prevRename) {
    setPrevRename(renameOpen)
    if (renameOpen) setName(folder.name)
  }

  const handleRename = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === folder.name) {
      setRenameOpen(false)
      return
    }
    try {
      await updateMutation.mutateAsync({ id: folder.id, name: trimmed })
      toast.success('Folder renamed.')
      setRenameOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rename failed.')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(folder.id)
      toast.success('Folder deleted. Its files moved to the root.')
      setDeleteOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  return (
    <tr
      className="border-t transition-colors cursor-pointer"
      style={{ borderColor: 'var(--border-soft)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-overlay)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
      onClick={onOpen}
    >
      <td className={`px-3 ${cellPad}`} onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center justify-center h-7 w-7 rounded-md border cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-muted)',
                }}
                aria-label={`Actions for folder ${folder.name}`}
              >
                <DotsThree size={16} weight="bold" />
              </button>
            }
          />
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem
              onClick={onOpen}
              className="text-[12.5px] cursor-pointer"
            >
              Open
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setRenameOpen(true)}
              className="text-[12.5px] cursor-pointer"
            >
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="text-[12.5px] cursor-pointer"
              style={{ color: 'var(--danger, #C0392B)' }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
      <td className={`px-3 ${cellPad}`} colSpan={colSpan - 1}>
        <span className="inline-flex items-center gap-2 min-w-0">
          <Folder size={17} weight="fill" style={{ color: 'var(--gold)' }} />
          <span
            className="text-[13px] font-semibold truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {folder.name}
          </span>
          <span
            className="text-[11.5px] tabular-nums px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}
          >
            {folder.document_count} file{folder.document_count === 1 ? '' : 's'}
          </span>
          <CaretRight
            size={13}
            strokeWidth={2}
            className="ml-auto shrink-0"
            style={{ color: 'var(--text-subtle)' }}
          />
        </span>
      </td>

      {/* Rename + delete dialogs (portal out, so valid inside a row). */}
      <td className="hidden" onClick={(e) => e.stopPropagation()}>
        <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
          <DialogContent
            className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--border)' }}
          >
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle
                className="text-[18px] font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Rename folder
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void handleRename()
                  }
                }}
                autoFocus
                className="h-10 text-[13px] rounded-lg"
                style={{ borderColor: 'var(--border-default)' }}
              />
            </div>
            <DialogFooter
              className="px-6 py-4 mt-4 border-t flex sm:flex-row sm:justify-start gap-2"
              style={{ borderColor: 'var(--border-soft)', background: 'rgba(13,27,42,0.015)' }}
            >
              <Button size="sm" onClick={handleRename} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent
            className="sm:max-w-[440px] p-0 overflow-hidden rounded-2xl"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--border)' }}
          >
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle
                className="text-[18px] font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Delete folder
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-2">
              <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                Delete{' '}
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {folder.name}
                </span>
                ? Any sub-folders are removed too, and every file inside the
                tree moves back to the root — no files are deleted.
              </p>
            </div>
            <DialogFooter
              className="px-6 py-4 mt-4 border-t flex sm:flex-row sm:justify-start gap-2"
              style={{ borderColor: 'var(--border-soft)', background: 'rgba(13,27,42,0.015)' }}
            >
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all disabled:opacity-50"
                style={{ background: 'var(--danger, #C0392B)', color: '#fff' }}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete folder'}
              </button>
              <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </td>
    </tr>
  )
}

/**
 * Recycle-bin empty state — distinct copy from the "no files" library
 * state so the two views never read as the same screen.
 */
function BinEmptyState() {
  return (
    <div className="py-20 px-6 text-center">
      <div
        className="mx-auto mb-5 inline-flex items-center justify-center h-16 w-16 rounded-2xl"
        style={{ background: 'var(--surface-sunken)' }}
        aria-hidden
      >
        <Trash size={28} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        The recycle bin is empty
      </p>
      <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        Deleted documents land here, where you can restore them or remove them
        for good.
      </p>
    </div>
  )
}

// ── Documents — sub-components ─────────────────────────────────────────

/**
 * Priority popover (formerly "Sort") — currently single setting
 * ("Show folders first"). Built as a popover instead of a dropdown so
 * the description text fits comfortably. Toggle commits immediately;
 * no Apply step. The trigger label was renamed from "Sort" to
 * "Priority" because the underlying control governs *which row sits
 * at the top*, not the column-sort direction — Priority reads more
 * accurately than Sort for that intent.
 */
function SortPopover({
  showFoldersFirst,
  onToggle,
}: {
  showFoldersFirst: boolean
  onToggle: (v: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
      >
        Priority
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border p-4"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 280,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div
                className="text-[13px] font-semibold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Show folders first
              </div>
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                With this setting turned on, folders will appear at the
                top of the list when sorting by the Name, Last edit at,
                and Uploaded date columns.
              </p>
            </div>
            <span
              role="switch"
              aria-checked={showFoldersFirst}
              tabIndex={0}
              onClick={() => onToggle(!showFoldersFirst)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  onToggle(!showFoldersFirst)
                }
              }}
              className="relative inline-flex h-[22px] w-[40px] rounded-full transition-colors shrink-0 mt-0.5 cursor-pointer"
              style={{
                background: showFoldersFirst
                  ? 'var(--gold)'
                  : 'var(--border-default)',
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 h-[18px] w-[18px] rounded-full bg-white transition-transform"
                style={{
                  transform: showFoldersFirst
                    ? 'translateX(18px)'
                    : 'translateX(0)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
                }}
              />
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Columns popover — staged-changes pattern (mirrors the contacts list
 * ColumnsPicker). Edit a local draft set, Update columns commits, Cancel
 * or click-outside discards.
 */
function ColumnsPopover({
  visible,
  onChange,
}: {
  visible: Set<DocColumnId>
  onChange: (next: Set<DocColumnId>) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<DocColumnId>>(new Set(visible))
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const openPopover = () => {
    setDraft(new Set(visible))
    setOpen(true)
  }
  const apply = () => {
    onChange(draft)
    setOpen(false)
  }
  const toggle = (id: DocColumnId) => {
    const next = new Set(draft)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setDraft(next)
  }

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (open ? setOpen(false) : openPopover())}
      >
        <Columns size={13} strokeWidth={1.75} />
        Columns
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 280,
          }}
        >
          <div className="p-4 max-h-[360px] overflow-y-auto">
            <div
              className="text-[11.5px] uppercase tracking-wider font-semibold mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Visible columns
            </div>
            <ul className="space-y-1.5">
              {/* `Action` is fixed — always visible, not toggleable. */}
              <li>
                <span
                  className="inline-flex items-center gap-2 text-[13px] opacity-60"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-sm border"
                    style={{
                      borderColor: 'var(--gold)',
                      background: 'var(--gold)',
                    }}
                    aria-hidden
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6.5L5 9.5L10 3.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  Action
                </span>
              </li>
              {DOC_COLUMNS.map((c) => {
                const checked = draft.has(c.id)
                return (
                  <li key={c.id}>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[13px]">
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                        style={{
                          borderColor: checked
                            ? 'var(--gold)'
                            : 'var(--border-default)',
                          background: checked ? 'var(--gold)' : 'transparent',
                        }}
                        aria-hidden
                      >
                        {checked && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6.5L5 9.5L10 3.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {c.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        className="sr-only"
                      />
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
          <div
            className="flex items-center justify-start gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button size="sm" onClick={apply}>
              Update columns
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Filters popover — Matter picker, Category picker, "Show Items in
 * Bin" toggle, Apply / Clear. The Case picker lists the contact's own
 * cases; the Category picker is sourced from {@link DOCUMENT_CATEGORIES}
 * so it stays in lock-step with the upload/template dialogs.
 */
function FiltersPopover({
  cases,
  caseFilter,
  categoryFilter,
  showBin,
  onApply,
  onClear,
}: {
  cases: Case[]
  caseFilter: string
  categoryFilter: string
  showBin: boolean
  onApply: (caseId: string, category: string, showBin: boolean) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const [draftCase, setDraftCase] = useState(caseFilter)
  const [draftCategory, setDraftCategory] = useState(categoryFilter)
  const [draftBin, setDraftBin] = useState(showBin)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const activeCount =
    (caseFilter ? 1 : 0) + (categoryFilter ? 1 : 0) + (showBin ? 1 : 0)

  const openPopover = () => {
    setDraftCase(caseFilter)
    setDraftCategory(categoryFilter)
    setDraftBin(showBin)
    setOpen(true)
  }
  const apply = () => {
    onApply(draftCase, draftCategory, draftBin)
    setOpen(false)
  }
  const clear = () => {
    setDraftCase('')
    setDraftCategory('')
    setDraftBin(false)
    onClear()
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (open ? setOpen(false) : openPopover())}
      >
        <Funnel size={13} strokeWidth={1.75} />
        Filters
        {activeCount > 0 && (
          <span
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10.5px] font-semibold tabular-nums"
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          >
            {activeCount}
          </span>
        )}
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 320,
          }}
        >
          <div className="p-4 space-y-4">
            <div>
              <div
                className="text-[12.5px] font-semibold mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Case
              </div>
              <select
                value={draftCase}
                onChange={(e) => setDraftCase(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-[13px] appearance-none cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: draftCase
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  colorScheme: 'light',
                }}
              >
                <option value="">Find a case</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_code ? `${c.case_code} — ${c.title}` : c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div
                className="text-[12.5px] font-semibold mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Category
              </div>
              <select
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-[13px] appearance-none cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: draftCategory
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  colorScheme: 'light',
                }}
              >
                <option value="">Find a document category</option>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none text-[13px]">
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                style={{
                  borderColor: draftBin
                    ? 'var(--gold)'
                    : 'var(--border-default)',
                  background: draftBin ? 'var(--gold)' : 'transparent',
                }}
                aria-hidden
              >
                {draftBin && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2 6.5L5 9.5L10 3.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span style={{ color: 'var(--text-primary)' }}>
                Show items in Bin
              </span>
              <input
                type="checkbox"
                checked={draftBin}
                onChange={() => setDraftBin((v) => !v)}
                className="sr-only"
              />
            </label>
          </div>
          <div
            className="flex items-center justify-start gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button size="sm" onClick={apply}>
              Apply filters
            </Button>
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * "New" dropdown — surfaces the reference four creation entry points. Each
 * menu item opens its own dialog; the parent owns the open state so
 * the dialogs survive dropdown close.
 */
function NewDropdown({
  onUploadFiles,
  onUploadFolder,
  onCreateFolder,
  onCreateFromTemplate,
}: {
  onUploadFiles: () => void
  onUploadFolder: () => void
  onCreateFolder: () => void
  onCreateFromTemplate: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap"
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
              boxShadow:
                '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                'var(--gold-dark, #B0831F)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--gold)'
            }}
          >
            New
            <CaretDown size={12} strokeWidth={2} />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={onUploadFiles}
          className="text-[12.5px] cursor-pointer"
        >
          UploadSimple files
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onUploadFolder}
          className="text-[12.5px] cursor-pointer"
        >
          UploadSimple folder
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onCreateFolder}
          className="text-[12.5px] cursor-pointer"
        >
          Create folder
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onCreateFromTemplate}
          className="text-[12.5px] cursor-pointer"
        >
          Create document from template
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Empty state shown when the contact has no documents. Follows the standard pattern:
 * an open-book illustration with a bright-blue magnifying glass
 * overlapping the bottom-right corner, plus the "No files found"
 * headline and the drag-and-drop subhead.
 */
function DocumentsEmptyState() {
  return (
    <div className="py-20 px-6 text-center">
      <div className="mx-auto mb-6 w-[180px]" aria-hidden>
        <NoFilesIllustration />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        No files found
      </p>
      <p
        className="mt-1 text-[12.5px]"
        style={{ color: 'var(--text-muted)' }}
      >
        Drag and drop files here or use the &ldquo;New&rdquo; button.
      </p>
    </div>
  )
}

/**
 * Inline SVG of an open book with a magnifying glass overlapping the
 * bottom-right corner. Mirrors the reference contact-scoped Documents empty
 * state. Drawn at a 220×180 viewBox; scales to whatever wrapper width
 * the caller sets.
 *
 * Composition (in z-order):
 *   1. Book shadow ellipse at the base (subtle ground anchor)
 *   2. Left page (white panel with text lines)
 *   3. Right page (white panel with text lines)
 *   4. Centre spine (the V where the pages meet)
 *   5. Magnifying glass: outer ring, lens fill, inner highlight, handle
 *
 * Colours pull from the design tokens so the illustration adapts to
 * theme changes without us editing fills directly.
 */
function NoFilesIllustration() {
  // Palette — pulled out so each shape references the same hue.
  const PAGE_FILL = '#FFFFFF'
  const PAGE_STROKE = '#1F2A44' // navy-ish outline matching the brand navy
  const TEXT_LINE = '#C7D2DD' // light grey for the "text" strokes
  const SHADOW = 'rgba(13, 27, 42, 0.08)'
  const LENS_FILL = '#7DD3FC' // light sky-blue glass
  const LENS_HIGHLIGHT = '#FFFFFF'
  const LENS_RIM = '#1E88E5' // saturated blue matching the reference accent
  const HANDLE = '#1E88E5'

  return (
    <svg
      viewBox="0 0 220 180"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      role="img"
      aria-label="No documents illustration"
    >
      {/* Ground shadow — grounds the book without committing to a
          full floor. Stays subtle. */}
      <ellipse cx="110" cy="160" rx="78" ry="6" fill={SHADOW} />

      {/* Left page */}
      <path
        d="M18 36 L102 30 L106 132 L22 138 Z"
        fill={PAGE_FILL}
        stroke={PAGE_STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Right page */}
      <path
        d="M118 30 L202 36 L198 138 L114 132 Z"
        fill={PAGE_FILL}
        stroke={PAGE_STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Centre spine — the V where the two pages meet. Drawn after
          the pages so the joint reads cleanly. */}
      <path
        d="M102 30 L110 40 L118 30"
        fill="none"
        stroke={PAGE_STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M106 132 L110 142 L114 132"
        fill="none"
        stroke={PAGE_STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <line
        x1="110"
        y1="40"
        x2="110"
        y2="142"
        stroke={PAGE_STROKE}
        strokeWidth="2"
      />

      {/* Text lines — left page. Slight downward slope mirrors the
          page's perspective tilt. */}
      <line
        x1="34"
        y1="60"
        x2="92"
        y2="56"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="34"
        y1="74"
        x2="92"
        y2="70"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="34"
        y1="88"
        x2="80"
        y2="85"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="34"
        y1="102"
        x2="92"
        y2="98"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="34"
        y1="116"
        x2="70"
        y2="113"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Text lines — right page. */}
      <line
        x1="128"
        y1="56"
        x2="186"
        y2="60"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="128"
        y1="70"
        x2="186"
        y2="74"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="128"
        y1="85"
        x2="170"
        y2="88"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Magnifying glass — drawn last so it sits on top of the book.
          Composition: handle first, then the rim/lens disc so the
          handle disappears under the disc's edge. */}
      {/* Handle */}
      <line
        x1="172"
        y1="140"
        x2="200"
        y2="168"
        stroke={HANDLE}
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* Lens disc — outer rim */}
      <circle
        cx="156"
        cy="124"
        r="32"
        fill={LENS_RIM}
      />
      {/* Lens disc — inner glass */}
      <circle
        cx="156"
        cy="124"
        r="24"
        fill={LENS_FILL}
      />
      {/* Lens highlight — small white crescent in the upper-left
          quadrant gives the glass its glassy read. */}
      <path
        d="M141 112 Q146 104 156 104"
        stroke={LENS_HIGHLIGHT}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  )
}

/**
 * Single document row. Renders a tight Action menu in the first cell
 * plus every visible column from the registry. Missing fields (Size /
 * Author / Comments — not on Document yet) render an em-dash so the
 * table stays scannable.
 */
/** Human-readable file size, e.g. 2048 → "2 KB". */
function formatBytes(bytes?: number | null): string | null {
  if (bytes == null || bytes < 0) return null
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  )
  const val = bytes / 1024 ** i
  return `${val >= 10 || i === 0 ? Math.round(val) : val.toFixed(1)} ${units[i]}`
}

/**
 * Flatten a folder set into depth-first order with each folder's nesting
 * depth — used to render indented `<option>`s in the folder pickers so the
 * hierarchy is visible in a flat select.
 */
function orderFolderTree(
  folders: DocumentFolder[],
): { folder: DocumentFolder; depth: number }[] {
  const byParent = new Map<string | null, DocumentFolder[]>()
  for (const f of folders) {
    const p = f.parent_id ?? null
    const arr = byParent.get(p) ?? []
    arr.push(f)
    byParent.set(p, arr)
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.name.localeCompare(b.name))
  }
  const out: { folder: DocumentFolder; depth: number }[] = []
  const walk = (parent: string | null, depth: number) => {
    for (const f of byParent.get(parent) ?? []) {
      out.push({ folder: f, depth })
      walk(f.id, depth + 1)
    }
  }
  walk(null, 0)
  return out
}

/** Indented label for a folder option, e.g. "    └ Sub". */
function folderOptionLabel(name: string, depth: number): string {
  return depth === 0 ? name : `${'  '.repeat(depth)}└ ${name}`
}

function DocumentRow({
  doc,
  columns,
  expanded,
  cases,
  folders,
  inBin,
}: {
  doc: Document
  columns: DocColumn[]
  expanded: boolean
  cases: Case[]
  folders: DocumentFolder[]
  inBin: boolean
}) {
  // Each row owns the lifecycle of its own action dialogs — keeping
  // them local (vs lifting to the table) means a row re-render never
  // disturbs a dialog open on a sibling row.
  const [previewOpen, setPreviewOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [focusComments, setFocusComments] = useState(false)

  const restoreMutation = useRestoreDocument()
  const purgeMutation = useDeleteDocumentPermanent()

  const dash = (
    <span style={{ color: 'var(--text-subtle)' }}>—</span>
  )
  const cellPad = expanded ? 'py-3.5' : 'py-2'
  const fmtDate = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      : null

  const openComments = () => {
    setFocusComments(true)
    setPreviewOpen(true)
  }

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync(doc.id)
      toast.success('Document restored.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Restore failed.')
    }
  }

  const value = (id: DocColumnId): React.ReactNode => {
    switch (id) {
      case 'recorded_time':
        return fmtDate(doc.created_at) ?? dash
      case 'name':
        return (
          <button
            type="button"
            onClick={() => {
              setFocusComments(false)
              setPreviewOpen(true)
            }}
            className="inline-flex items-center gap-2 min-w-0 cursor-pointer text-left"
          >
            {doc.file_thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doc.file_thumbnail_url}
                alt=""
                className="h-7 w-7 rounded object-cover shrink-0 border"
                style={{ borderColor: 'var(--border-soft)' }}
              />
            ) : (
              <FileText
                size={15}
                strokeWidth={1.75}
                style={{ color: 'var(--text-muted)' }}
              />
            )}
            <span
              className="text-[13px] font-medium truncate hover:underline"
              style={{ color: 'var(--text-primary)' }}
            >
              {doc.title}
            </span>
          </button>
        )
      case 'case':
        return doc.case_title || doc.case_id || dash
      case 'category':
        return doc.template_type || dash
      case 'size':
        return formatBytes(doc.file_size) ?? dash
      case 'last_edit':
        return fmtDate(doc.updated_at) ?? dash
      case 'received_at':
        return fmtDate(doc.received_date) ?? dash
      case 'comments':
        return (
          <button
            type="button"
            onClick={openComments}
            className="inline-flex items-center gap-1.5 cursor-pointer"
            style={{ color: doc.comment_count ? 'var(--text-primary)' : 'var(--text-subtle)' }}
          >
            <ChatCircle size={14} strokeWidth={1.75} />
            <span className="tabular-nums text-[12.5px]">{doc.comment_count}</span>
          </button>
        )
      case 'contact':
        return doc.client_name || dash
      case 'author':
        return doc.author || dash
      case 'uploaded_by':
        return doc.uploaded_by_name || dash
      case 'uploaded_date':
        return fmtDate(doc.created_at) ?? dash
      case 'id':
        return (
          <span
            className="font-mono text-[12px] tracking-wide"
            style={{ color: 'var(--text-muted)' }}
          >
            {doc.id}
          </span>
        )
      default:
        return dash
    }
  }

  return (
    <tr
      className="border-t transition-colors"
      style={{ borderColor: 'var(--border-soft)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-overlay)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <td className={`px-3 ${cellPad}`}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center justify-center h-7 w-7 rounded-md border cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-muted)',
                }}
                aria-label={`Actions for ${doc.title}`}
              >
                <CaretDown size={12} strokeWidth={1.75} />
              </button>
            }
          />
          <DropdownMenuContent align="start" className="w-44">
            {inBin ? (
              <>
                <DropdownMenuItem
                  onClick={handleRestore}
                  className="text-[12.5px] cursor-pointer"
                >
                  Restore
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setFocusComments(false)
                    setPreviewOpen(true)
                  }}
                  className="text-[12.5px] cursor-pointer"
                >
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => downloadDocument(doc)}
                  className="text-[12.5px] cursor-pointer"
                >
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-[12.5px] cursor-pointer"
                  style={{ color: 'var(--danger, #C0392B)' }}
                >
                  Delete forever
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    setFocusComments(false)
                    setPreviewOpen(true)
                  }}
                  className="text-[12.5px] cursor-pointer"
                >
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => downloadDocument(doc)}
                  className="text-[12.5px] cursor-pointer"
                >
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openComments}
                  className="text-[12.5px] cursor-pointer"
                >
                  Comments
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setRenameOpen(true)}
                  className="text-[12.5px] cursor-pointer"
                >
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setMoveOpen(true)}
                  className="text-[12.5px] cursor-pointer"
                >
                  Move…
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-[12.5px] cursor-pointer"
                  style={{ color: 'var(--danger, #C0392B)' }}
                >
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
      {columns.map((c) => (
        <td
          key={c.id}
          className={`px-3 ${cellPad} text-[13px] whitespace-nowrap`}
          style={{ color: 'var(--text-primary)' }}
        >
          {value(c.id)}
        </td>
      ))}

      {/* Action dialogs — preview / rename / move / delete. Each is
          gated on its own open flag and writes through the document
          mutations wired in the dialog bodies. */}
      <DocumentPreviewDialog
        doc={doc}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        focusComments={focusComments}
      />
      <RenameDocumentDialog
        doc={doc}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <MoveDocumentDialog
        doc={doc}
        cases={cases}
        folders={folders}
        open={moveOpen}
        onOpenChange={setMoveOpen}
      />
      <DeleteDocumentDialog
        doc={doc}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        permanent={inBin}
        onPurge={async () => {
          await purgeMutation.mutateAsync(doc.id)
        }}
      />
    </tr>
  )
}

/**
 * Download a document. Uploaded files (Cloudinary-backed) open their real
 * asset; editor-authored drafts have no binary, so we materialise the
 * `content` HTML into a self-contained .html file via an object URL with a
 * self-describing metadata header.
 */
function downloadDocument(doc: Document) {
  // Real uploaded file → hand the browser the stored asset directly.
  if (doc.file_url) {
    const a = document.createElement('a')
    a.href = doc.file_url
    a.target = '_blank'
    a.rel = 'noopener'
    a.download = doc.title
    document.body.appendChild(a)
    a.click()
    a.remove()
    return
  }

  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  const metaRows = [
    doc.case_title && `Case: ${esc(doc.case_title)}`,
    doc.court && `Court: ${esc(doc.court)}`,
    doc.suit_number && `Suit No: ${esc(doc.suit_number)}`,
    doc.parties && `Parties: ${esc(doc.parties)}`,
    doc.judge && `Judge: ${esc(doc.judge)}`,
  ].filter(Boolean) as string[]

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(doc.title)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 720px; margin: 48px auto; padding: 0 24px; color: #1a1a1a; line-height: 1.6; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .meta { color: #555; font-size: 13px; margin-bottom: 24px; border-bottom: 1px solid #ddd; padding-bottom: 16px; }
  .meta div { margin: 2px 0; }
</style>
</head>
<body>
  <h1>${esc(doc.title)}</h1>
  ${
    metaRows.length
      ? `<div class="meta">${metaRows.map((r) => `<div>${r}</div>`).join('')}</div>`
      : ''
  }
  <div class="content">${doc.content || '<p><em>This document has no content yet.</em></p>'}</div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  // Strip any existing extension from the title, then append .html.
  const base = doc.title.replace(/\.[a-z0-9]+$/i, '') || 'document'
  a.href = url
  a.download = `${base}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  toast.success('Document downloaded.')
}

/**
 * Read-only preview of a saved draft. Renders the stored `content`
 * HTML inside the dialog (the same markup the editor produces) plus
 * the court / suit / parties metadata. No mutation — purely a viewer;
 * editing happens from the document editor screen.
 */
function DocumentPreviewDialog({
  doc,
  open,
  onOpenChange,
  focusComments = false,
}: {
  doc: Document
  open: boolean
  onOpenChange: (v: boolean) => void
  focusComments?: boolean
}) {
  // Two tabs inside the viewer: the document body and its comment thread.
  // Opening via the Comments action/column jumps straight to the thread.
  const [tab, setTab] = useState<'document' | 'comments'>('document')
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setTab(focusComments ? 'comments' : 'document')
  }

  const meta = [
    doc.case_title && { label: 'Case', value: doc.case_title },
    doc.template_type && { label: 'Category', value: doc.template_type },
    doc.court && { label: 'Court', value: doc.court },
    doc.suit_number && { label: 'Suit No', value: doc.suit_number },
    doc.parties && { label: 'Parties', value: doc.parties },
    doc.judge && { label: 'Judge', value: doc.judge },
    doc.author && { label: 'Author', value: doc.author },
    doc.uploaded_by_name && { label: 'Uploaded by', value: doc.uploaded_by_name },
    formatBytes(doc.file_size) && {
      label: 'Size',
      value: formatBytes(doc.file_size) as string,
    },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[640px] p-0 overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle
            className="text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {doc.title}
          </DialogTitle>
        </DialogHeader>

        {/* Tab strip */}
        <div
          className="px-6 mt-3 flex items-center gap-1 border-b"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          {(['document', 'comments'] as const).map((t) => {
            const active = tab === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="relative px-3 py-2 text-[13px] font-medium cursor-pointer capitalize"
                style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {t === 'comments'
                  ? `Comments${doc.comment_count ? ` (${doc.comment_count})` : ''}`
                  : 'Document'}
                {active && (
                  <span
                    className="absolute left-2 right-2 -bottom-px h-[2px] rounded-full"
                    style={{ background: 'var(--gold)' }}
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {tab === 'document' ? (
            <>
              {meta.length > 0 && (
                <dl
                  className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mb-4 pb-4 border-b text-[12.5px]"
                  style={{ borderColor: 'var(--border-soft)' }}
                >
                  {meta.map((m) => (
                    <div key={m.label} className="contents">
                      <dt
                        className="font-semibold"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {m.label}
                      </dt>
                      <dd style={{ color: 'var(--text-primary)' }}>{m.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {doc.file_url ? (
                <DocumentFilePreview doc={doc} />
              ) : doc.content ? (
                <div
                  className="prose prose-sm max-w-none text-[13.5px] leading-relaxed"
                  style={{ color: 'var(--text-primary)' }}
                  // Content is the HTML our own Tiptap editor produced, stored
                  // server-side. Rendered read-only here.
                  dangerouslySetInnerHTML={{ __html: doc.content }}
                />
              ) : (
                <p
                  className="text-[13px] italic py-6 text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  This document has no content yet.
                </p>
              )}
            </>
          ) : (
            <DocumentCommentsPanel documentId={doc.id} open={open && tab === 'comments'} />
          )}
        </div>

        <DialogFooter
          className="px-6 py-4 border-t flex sm:flex-row sm:justify-start gap-2"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <Button size="sm" variant="outline" onClick={() => downloadDocument(doc)}>
            <DownloadSimple size={14} strokeWidth={1.75} />
            Download
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Renders the stored Cloudinary asset inside the preview dialog: images
 * inline, PDFs in an embedded frame, and anything else (raw .docx/.zip/…)
 * as a download card since the browser can't render it directly.
 */
function DocumentFilePreview({ doc }: { doc: Document }) {
  const mime = doc.file_mime_type ?? ''
  const isImage = mime.startsWith('image/')
  const isPdf = mime === 'application/pdf'

  if (isImage) {
    return (
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={doc.file_url ?? ''}
          alt={doc.title}
          className="max-h-[52vh] w-auto rounded-lg border"
          style={{ borderColor: 'var(--border-soft)' }}
        />
      </div>
    )
  }

  if (isPdf) {
    return (
      <iframe
        src={doc.file_url ?? ''}
        title={doc.title}
        className="w-full rounded-lg border"
        style={{ height: '52vh', borderColor: 'var(--border-soft)' }}
      />
    )
  }

  // Unpreviewable type — offer the asset for download.
  return (
    <div
      className="flex flex-col items-center gap-3 py-10 rounded-lg border"
      style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-sunken)' }}
    >
      <FileText size={36} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
      <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        This file type can&rsquo;t be previewed in the browser.
      </p>
      <Button size="sm" variant="outline" onClick={() => downloadDocument(doc)}>
        <DownloadSimple size={14} strokeWidth={1.75} />
        Download to view
      </Button>
    </div>
  )
}

/**
 * Comment thread for a document. Lists existing comments and lets the
 * user add or delete them through the comment mutations. Only queries
 * once its tab is actually open (the `skip` on `open`) so collapsed
 * threads don't fan out a request per row.
 */
function DocumentCommentsPanel({
  documentId,
  open,
}: {
  documentId: string
  open: boolean
}) {
  const { data: comments, isLoading } = useDocumentComments(
    open ? documentId : undefined,
  )
  const addMutation = useAddDocumentComment()
  const deleteMutation = useDeleteDocumentComment()
  const [body, setBody] = useState('')

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const submit = async () => {
    const trimmed = body.trim()
    if (!trimmed || addMutation.isPending) return
    try {
      await addMutation.mutateAsync({ document_id: documentId, body: trimmed })
      setBody('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not post comment.')
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete comment.')
    }
  }

  const list = comments ?? []

  return (
    <div>
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
            Loading comments…
          </p>
        ) : list.length === 0 ? (
          <p
            className="text-[12.5px] italic py-4 text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            No comments yet. Start the thread below.
          </p>
        ) : (
          list.map((c) => (
            <div
              key={c.id}
              className="group rounded-lg border p-3"
              style={{
                borderColor: 'var(--border-soft)',
                background: 'var(--surface-sunken)',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span
                  className="text-[12.5px] font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {c.author_name || 'Firm member'}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ color: 'var(--text-subtle)' }}
                  >
                    {fmt(c.created_at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ color: 'var(--text-subtle)' }}
                    aria-label="Delete comment"
                  >
                    <Trash size={13} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
              <p
                className="text-[13px] whitespace-pre-wrap"
                style={{ color: 'var(--text-secondary)' }}
              >
                {c.body}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Composer */}
      <div className="mt-4 flex items-end gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              void submit()
            }
          }}
          rows={2}
          placeholder="Add a comment… (⌘/Ctrl + Enter to post)"
          className="flex-1 rounded-lg border px-3 py-2 text-[13px] resize-none outline-none"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!body.trim() || addMutation.isPending}
          className="inline-flex items-center justify-center h-10 w-10 rounded-lg cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          aria-label="Post comment"
        >
          <PaperPlaneTilt size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}

/**
 * Rename dialog — edits the document `title` through
 * {@link useUpdateDocument}. Save is disabled while the field is empty
 * or unchanged so we never fire a no-op mutation.
 */
function RenameDocumentDialog({
  doc,
  open,
  onOpenChange,
}: {
  doc: Document
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const updateMutation = useUpdateDocument()
  const [title, setTitle] = useState(doc.title)

  // Re-seed the field every time the dialog opens so a cancelled edit
  // doesn't leak into the next open. Done in render (React's endorsed
  // "adjust state on prop change" pattern) rather than an effect so we
  // avoid a cascading re-render.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setTitle(doc.title)
  }

  const trimmed = title.trim()
  const canSave =
    trimmed.length > 0 && trimmed !== doc.title && !updateMutation.isPending

  const handleSave = async () => {
    if (!canSave) return
    try {
      await updateMutation.mutateAsync({ id: doc.id, data: { title: trimmed } })
      toast.success('Document renamed.')
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error ? `Rename failed: ${err.message}` : 'Rename failed.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[440px] p-0 overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle
            className="text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Rename document
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2">
          <Label
            htmlFor={`rename-${doc.id}`}
            className="text-[12px] font-semibold mb-1.5 block"
            style={{ color: 'var(--text-primary)' }}
          >
            Document name *
          </Label>
          <Input
            id={`rename-${doc.id}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleSave()
              }
            }}
            autoFocus
            className="h-10 text-[13px] rounded-lg"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>

        <DialogFooter
          className="px-6 py-4 mt-4 border-t flex sm:flex-row sm:justify-start gap-2"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <Button size="sm" onClick={handleSave} disabled={!canSave}>
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Move dialog — reassigns the document to one of the contact's matters
 * (or detaches it) by writing `case_id` through {@link useUpdateDocument}.
 * Passing an empty string clears the matter; the backend treats the
 * optional `case_id` accordingly.
 */
function MoveDocumentDialog({
  doc,
  cases,
  folders,
  open,
  onOpenChange,
}: {
  doc: Document
  cases: Case[]
  folders: DocumentFolder[]
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const updateMutation = useUpdateDocument()
  const [caseId, setCaseId] = useState(doc.case_id ?? '')
  const [folderId, setFolderId] = useState(doc.folder_id ?? '')

  // Re-seed on open (render-phase reset — see RenameDocumentDialog).
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setCaseId(doc.case_id ?? '')
      setFolderId(doc.folder_id ?? '')
    }
  }

  const dirty =
    caseId !== (doc.case_id ?? '') || folderId !== (doc.folder_id ?? '')
  const canSave = dirty && !updateMutation.isPending

  const handleSave = async () => {
    if (!canSave) return
    try {
      await updateMutation.mutateAsync({
        id: doc.id,
        // Empty strings detach from the matter / folder respectively.
        data: { case_id: caseId, folder_id: folderId },
      })
      toast.success('Document moved.')
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error ? `Move failed: ${err.message}` : 'Move failed.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[440px] p-0 overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle
            className="text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Move document
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-4">
          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Folder
            </Label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full h-10 rounded-lg border px-3 text-[13px] appearance-none cursor-pointer"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: folderId ? 'var(--text-primary)' : 'var(--text-muted)',
                colorScheme: 'light',
              }}
            >
              <option value="">Library root (no folder)</option>
              {orderFolderTree(folders).map(({ folder, depth }) => (
                <option key={folder.id} value={folder.id}>
                  {folderOptionLabel(folder.name, depth)}
                </option>
              ))}
            </select>
            {folders.length === 0 && (
              <p className="mt-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                No folders yet — create one from the New menu.
              </p>
            )}
          </div>

          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Matter
            </Label>
            <select
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="w-full h-10 rounded-lg border px-3 text-[13px] appearance-none cursor-pointer"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: caseId ? 'var(--text-primary)' : 'var(--text-muted)',
                colorScheme: 'light',
              }}
            >
              <option value="">No matter (unassigned)</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_code ? `${c.case_code} — ${c.title}` : c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter
          className="px-6 py-4 mt-4 border-t flex sm:flex-row sm:justify-start gap-2"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <Button size="sm" onClick={handleSave} disabled={!canSave}>
            {updateMutation.isPending ? 'Moving…' : 'Move'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Delete confirmation. In the library it soft-deletes to the recycle bin
 * (reversible); in the bin it permanently purges the record via the
 * `onPurge` callback. Copy + button label adapt to the mode.
 */
function DeleteDocumentDialog({
  doc,
  open,
  onOpenChange,
  permanent = false,
  onPurge,
}: {
  doc: Document
  open: boolean
  onOpenChange: (v: boolean) => void
  permanent?: boolean
  onPurge?: () => Promise<void>
}) {
  const deleteMutation = useDeleteDocument()
  const [purging, setPurging] = useState(false)
  const busy = deleteMutation.isPending || purging

  const handleDelete = async () => {
    if (busy) return
    try {
      if (permanent) {
        setPurging(true)
        await onPurge?.()
        toast.success('Document permanently deleted.')
      } else {
        await deleteMutation.mutateAsync(doc.id)
        toast.success('Document moved to the recycle bin.')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error ? `Delete failed: ${err.message}` : 'Delete failed.',
      )
    } finally {
      setPurging(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[440px] p-0 overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle
            className="text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {permanent ? 'Delete forever' : 'Delete document'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2">
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {permanent ? (
              <>
                Permanently delete{' '}
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {doc.title}
                </span>
                ? This cannot be undone.
              </>
            ) : (
              <>
                Move{' '}
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {doc.title}
                </span>{' '}
                to the recycle bin? You can restore it later.
              </>
            )}
          </p>
        </div>

        <DialogFooter
          className="px-6 py-4 mt-4 border-t flex sm:flex-row sm:justify-start gap-2"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--danger, #C0392B)', color: '#fff' }}
          >
            {busy
              ? permanent
                ? 'Deleting…'
                : 'Moving…'
              : permanent
                ? 'Delete forever'
                : 'Move to bin'}
          </button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Default category list for the upload dialog. Pulled from the
 * standard the standard pattern set so users see familiar legal-document buckets.
 * Persisted as the document's `template_type` string column for now;
 * the firm-settings screen will let firms manage this list later.
 */
const DOCUMENT_CATEGORIES = [
  'Agreements',
  'Answers',
  'Briefs',
  'Closings',
  'Communications',
  'Correspondence',
  'Court orders',
  'Discovery',
  'Evidence',
  'Filings',
  'Memos',
  'Notices',
  'Pleadings',
  'Receipts',
  'Reports',
  'Research',
  'Settlements',
  'Transcripts',
  'Wills',
  'Other',
] as const

/**
 * One staged file inside the UploadSimple dialog. The user can stack
 * multiple of these via "+ Add another file"; each row carries its
 * own metadata (file name, matter, received date, category, author).
 */
interface StagedFile {
  id: string
  file: File | null
  fileName: string
  extension: string
  matter: string
  receivedDate: string
  category: string
  author: string
}

function emptyStagedFile(): StagedFile {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `staged-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file: null,
    fileName: '',
    extension: '',
    matter: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    category: '',
    author: '',
  }
}

/**
 * UploadSimple dialog — opens from New ▸ UploadSimple files. Mirrors the reference
 * modal: file row + metadata fields (File name · Matter · Received
 * date · Category · Author), with "+ Add another file" to attach
 * more in a single submission, then UploadSimple / Cancel.
 *
 * On UploadSimple we call `useCreateDocument().mutateAsync` once per staged
 * file. Most metadata maps cleanly onto the existing Document schema
 * (`title`, `template_type`, `case_id`, `client_id`); `received_date`
 * and `author` are kept in form state and surfaced once those columns
 * ship with the contact-detail migration.
 */
function UploadDialog({
  open,
  onOpenChange,
  contactId,
  contactCases,
  folders,
  currentFolderId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  contactId: string
  contactCases: Case[]
  folders: DocumentFolder[]
  currentFolderId: string | null
}) {
  const createMutation = useCreateDocument()
  const { uploadFile } = useUploadDocumentFile()
  const [staged, setStaged] = useState<StagedFile[]>(() => [emptyStagedFile()])
  const [targetFolder, setTargetFolder] = useState<string>(currentFolderId ?? '')
  const [submitting, setSubmitting] = useState(false)

  // Reset the staged list every time the dialog re-opens — the
  // previous submission's leftovers shouldn't carry over. New files
  // default into whichever folder the user is currently viewing.
  useEffect(() => {
    if (open) {
      setStaged([emptyStagedFile()])
      setTargetFolder(currentFolderId ?? '')
    }
  }, [open, currentFolderId])

  const updateRow = (id: string, patch: Partial<StagedFile>) => {
    setStaged((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  }
  const removeRow = (id: string) => {
    setStaged((prev) =>
      prev.length === 1 ? prev : prev.filter((r) => r.id !== id),
    )
  }
  const addRow = () => {
    setStaged((prev) => [...prev, emptyStagedFile()])
  }

  // Submission is valid when every row has both a file and a non-
  // empty file name. Matter / category / author stay optional —
  // matches the standard pattern (only the file + filename are required).
  const canSubmit =
    staged.length > 0 &&
    staged.every((r) => r.file !== null && r.fileName.trim().length > 0) &&
    !submitting

  const handleUpload = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      // Run uploads sequentially so a single failure surfaces clearly
      // — Promise.allSettled would swallow per-row errors behind a
      // bulk success. Each file is pushed to Cloudinary first, then the
      // resulting asset URLs are persisted on the document record.
      for (const row of staged) {
        const asset = row.file ? await uploadFile(row.file) : null
        await createMutation.mutateAsync({
          title: row.fileName + row.extension,
          template_type: row.category,
          case_id: row.matter,
          client_id: contactId,
          folder_id: targetFolder,
          author: row.author,
          received_date: row.receivedDate,
          file_url: asset?.file_url,
          file_public_id: asset?.file_public_id,
          file_thumbnail_url: asset?.file_thumbnail_url,
          file_mime_type: asset?.file_mime_type,
          // Real byte size from Cloudinary (falls back to the File size).
          file_size: asset?.file_size ?? row.file?.size,
          court: '',
          suit_number: '',
          parties: '',
          judge: '',
          content: '',
        })
      }
      toast.success(
        staged.length === 1
          ? 'File uploaded.'
          : `${staged.length} files uploaded.`,
      )
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `UploadSimple failed: ${err.message}`
          : 'Upload failed. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle
            className="text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Upload files
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 max-h-[60vh] overflow-y-auto space-y-5">
          {/* Destination folder — applies to every file in this batch. */}
          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Folder
            </Label>
            <div className="relative">
              <select
                value={targetFolder}
                onChange={(e) => setTargetFolder(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: targetFolder ? 'var(--text-primary)' : 'var(--text-muted)',
                  colorScheme: 'light',
                }}
              >
                <option value="">Library root (no folder)</option>
                {orderFolderTree(folders).map(({ folder, depth }) => (
                  <option key={folder.id} value={folder.id}>
                    {folderOptionLabel(folder.name, depth)}
                  </option>
                ))}
              </select>
              <CaretDown
                size={13}
                strokeWidth={1.75}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          {staged.map((row, idx) => (
            <UploadRow
              key={row.id}
              index={idx}
              row={row}
              cases={contactCases}
              onChange={(patch) => updateRow(row.id, patch)}
              onRemove={
                staged.length > 1 ? () => removeRow(row.id) : undefined
              }
            />
          ))}

          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 text-[13px] font-medium cursor-pointer"
            style={{ color: 'var(--gold-dark)' }}
          >
            <span
              className="inline-flex items-center justify-center h-5 w-5 rounded-full"
              style={{
                background: 'var(--gold)',
                color: 'var(--navy)',
              }}
              aria-hidden
            >
              <Plus size={12} strokeWidth={2.25} />
            </span>
            Add another file
          </button>
        </div>

        <DialogFooter
          className="px-6 py-4 border-t flex sm:flex-row sm:justify-start gap-2"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <button
            type="button"
            onClick={handleUpload}
            disabled={!canSubmit}
            className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
              boxShadow:
                '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
            }}
            onMouseEnter={(e) => {
              if (!canSubmit) return
              e.currentTarget.style.background =
                'var(--gold-dark, #B0831F)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--gold)'
            }}
          >
            {submitting
              ? 'Uploading…'
              : staged.length > 1
                ? `UploadSimple ${staged.length} files`
                : 'Upload'}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="inline-flex items-center h-9 px-3 rounded-lg text-[13px] font-medium cursor-pointer transition-colors disabled:opacity-50"
            style={{
              color: 'var(--text-muted)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-sunken)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * One file-row inside the UploadSimple dialog. Renders the file picker
 * (chip with filename + Replace) above the metadata form (File name,
 * Matter, Received date, Category, Author). Splits the filename into
 * `fileName` + `extension` on selection so the user can edit the
 * stem without losing the `.csv`/`.pdf`/etc. suffix.
 */
function UploadRow({
  index,
  row,
  cases,
  onChange,
  onRemove,
}: {
  index: number
  row: StagedFile
  cases: Case[]
  onChange: (patch: Partial<StagedFile>) => void
  onRemove?: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  // Picker rendered as a hidden native input that we trigger via a
  // button click. Lets us style the affordance without dropping the
  // native file dialog.
  const onPickFile = () => fileInputRef.current?.click()
  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    // Split "foo.bar.csv" → name "foo.bar", ext ".csv". The leading
    // dot is preserved so we can re-join cleanly on submit.
    const dot = f.name.lastIndexOf('.')
    const stem = dot === -1 ? f.name : f.name.slice(0, dot)
    const ext = dot === -1 ? '' : f.name.slice(dot)
    onChange({ file: f, fileName: stem, extension: ext })
  }

  return (
    <section
      className="space-y-4 pt-1"
      style={{
        borderTop:
          index > 0 ? '1px solid var(--border-soft)' : undefined,
        paddingTop: index > 0 ? 16 : 0,
      }}
    >
      {/* File picker. Two states: empty (Choose file button) /
          chosen (filename chip + Replace file). */}
      <div className="flex items-start gap-3">
        <span
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
          style={{
            background: 'var(--surface-sunken)',
            color: 'var(--gold-dark)',
          }}
          aria-hidden
        >
          <FolderOpen size={16} strokeWidth={1.75} />
        </span>
        <div className="flex-1 min-w-0">
          <Label
            className="text-[12px] font-semibold mb-1.5 block"
            style={{ color: 'var(--text-primary)' }}
          >
            File
          </Label>
          <div
            className="flex items-center justify-between gap-2 rounded-lg border px-3 h-10 text-[13px]"
            style={{
              borderColor: 'var(--border-default)',
              background: row.file
                ? 'var(--surface-card)'
                : 'var(--surface-sunken)',
              color: row.file ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <span className="truncate">
              {row.file
                ? `${row.fileName}${row.extension}`
                : 'No file chosen'}
            </span>
            <button
              type="button"
              onClick={onPickFile}
              className="text-[12.5px] font-medium cursor-pointer shrink-0"
              style={{ color: 'var(--gold-dark)' }}
            >
              {row.file ? 'Replace file' : 'Choose file'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={onFileChosen}
              aria-label="Choose file to upload"
            />
          </div>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[12.5px] font-medium cursor-pointer self-end pb-2.5 whitespace-nowrap"
            style={{ color: 'var(--gold-dark)' }}
          >
            Remove
          </button>
        )}
      </div>

      {/* File name — required, with the extension pinned as a
          suffix chip so the user knows it can't be lost. */}
      <div>
        <Label
          htmlFor={`file-name-${row.id}`}
          className="text-[12px] font-semibold mb-1.5 block"
          style={{ color: 'var(--text-primary)' }}
        >
          File name *
        </Label>
        <div
          className="flex items-center rounded-lg border h-10 overflow-hidden"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
          }}
        >
          <input
            id={`file-name-${row.id}`}
            value={row.fileName}
            onChange={(e) => onChange({ fileName: e.target.value })}
            placeholder="e.g. contract-draft"
            className="flex-1 h-full px-3 text-[13px] bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          {row.extension && (
            <span
              className="px-3 text-[12.5px] tabular-nums border-l"
              style={{
                borderColor: 'var(--border-soft)',
                color: 'var(--text-muted)',
                background: 'var(--surface-sunken)',
              }}
            >
              {row.extension}
            </span>
          )}
        </div>
      </div>

      {/* Matter picker. Today it's filtered to the contact's own
          cases since this dialog is always reached from a contact
          detail page; the firm-wide picker ships with /documents/new
          when that lands. */}
      <div>
        <Label
          className="text-[12px] font-semibold mb-1.5 block"
          style={{ color: 'var(--text-primary)' }}
        >
          Matter
        </Label>
        <div className="relative">
          <select
            value={row.matter}
            onChange={(e) => onChange({ matter: e.target.value })}
            className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: row.matter
                ? 'var(--text-primary)'
                : 'var(--text-muted)',
              colorScheme: 'light',
            }}
          >
            <option value="">Find a matter by matter name or client</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <CaretDown
            size={13}
            strokeWidth={1.75}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
      </div>

      {/* Received date + Category — side by side at md+, stacked
          below to mirror the reference two-up row. */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label
            className="text-[12px] font-semibold mb-1.5 block"
            style={{ color: 'var(--text-primary)' }}
          >
            Received date
          </Label>
          <input
            type="date"
            value={row.receivedDate}
            onChange={(e) => onChange({ receivedDate: e.target.value })}
            className="w-full h-10 rounded-lg border px-3 text-[13px]"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
              colorScheme: 'light',
            }}
          />
        </div>
        <div>
          <Label
            className="text-[12px] font-semibold mb-1.5 block"
            style={{ color: 'var(--text-primary)' }}
          >
            Category
          </Label>
          <div className="relative">
            <select
              value={row.category}
              onChange={(e) => onChange({ category: e.target.value })}
              className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: row.category
                  ? 'var(--text-primary)'
                  : 'var(--text-muted)',
                colorScheme: 'light',
              }}
            >
              <option value="">Find a document category</option>
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <CaretDown
              size={13}
              strokeWidth={1.75}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
        </div>
      </div>

      {/* Author — free text. Kept here for parity with the standard pattern; persisted
          once the contact-detail migration adds an author column. */}
      <div>
        <Label
          className="text-[12px] font-semibold mb-1.5 block"
          style={{ color: 'var(--text-primary)' }}
        >
          Author
        </Label>
        <input
          value={row.author}
          onChange={(e) => onChange({ author: e.target.value })}
          className="w-full h-10 rounded-lg border px-3 text-[13px]"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
          }}
        />
      </div>
    </section>
  )
}

/**
 * UploadSimple-folder dialog. Variant of UploadDialog where the user picks
 * a whole directory; we display the folder name (read-only chip), the
 * matter / received date / category metadata, and create one Document
 * row per file in the folder on submit.
 *
 * The native folder picker is opt-in via the non-standard
 * `webkitdirectory` / `directory` attributes — Chromium, Safari, and
 * Firefox all support it on `<input type="file">`. The TS DOM lib
 * doesn't include either attribute yet, so we set them via ref after
 * mount.
 */
function UploadFolderDialog({
  open,
  onOpenChange,
  contactId,
  contactCases,
  parentId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  contactId: string
  contactCases: Case[]
  // Folder the uploaded tree roots under (null = library root).
  parentId: string | null
}) {
  const createMutation = useCreateDocument()
  const createFolderMutation = useCreateDocumentFolder()
  const { uploadFile } = useUploadDocumentFile()
  const [files, setFiles] = useState<File[]>([])
  const [folderName, setFolderName] = useState('')
  const [matter, setMatter] = useState('')
  const [receivedDate, setReceivedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [category, setCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // The directory attributes must be on the <input> *before* the user clicks,
  // but base-ui's Dialog mounts the modal body lazily for its open animation —
  // so an effect keyed on `open` can run while the input is still null and
  // silently no-op (leaving a plain file picker). A callback ref fixes this:
  // it fires the moment the node attaches, however late, and React DOM doesn't
  // type these vendor attributes so we set them imperatively.
  const setFolderInputRef = useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el
    if (el) {
      el.setAttribute('webkitdirectory', '')
      el.setAttribute('directory', '')
      el.setAttribute('mozdirectory', '')
    }
  }, [])

  useEffect(() => {
    if (open) {
      setFiles([])
      setFolderName('')
      setMatter('')
      setCategory('')
      setReceivedDate(new Date().toISOString().slice(0, 10))
    }
  }, [open])

  const onPickFolder = () => inputRef.current?.click()
  const onFolderChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? [])
    if (list.length === 0) return
    // `webkitRelativePath` carries the relative path inside the
    // picked folder ("folderName/sub/file.ext"). The first segment
    // is the folder's own name — pull it out for the display chip.
    const first = list[0] as File & { webkitRelativePath?: string }
    const root = first.webkitRelativePath?.split('/')[0] ?? 'New folder'
    setFiles(list)
    setFolderName(root)
  }

  const canSubmit =
    files.length > 0 && folderName.trim().length > 0 && !submitting

  const handleUpload = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      // Recreate the picked directory tree. Every file's webkitRelativePath
      // (e.g. "Root/sub/a.pdf") tells us which folder it belongs in; we
      // create each unique directory once — parents before children — and
      // cache path → folder id so a deep tree maps faithfully into nested
      // DocumentFolders.
      const rel = (f: File) =>
        (f as File & { webkitRelativePath?: string }).webkitRelativePath ||
        f.name
      const dirOf = (f: File) => rel(f).split('/').slice(0, -1)

      // Collect every directory prefix across all files, sorted shallow→deep
      // so a parent always exists before we create its child.
      const dirSet = new Set<string>()
      for (const f of files) {
        const segs = dirOf(f)
        for (let i = 1; i <= segs.length; i++) {
          dirSet.add(segs.slice(0, i).join('/'))
        }
      }
      const dirs = [...dirSet].sort(
        (a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b),
      )

      const folderIdByPath = new Map<string, string>()
      for (const path of dirs) {
        const segs = path.split('/')
        const name = segs[segs.length - 1]
        const parentPath = segs.slice(0, -1).join('/')
        const parent = parentPath
          ? folderIdByPath.get(parentPath) ?? ''
          : parentId ?? ''
        const folder = await createFolderMutation.mutateAsync({
          name,
          client_id: contactId,
          parent_id: parent,
        })
        if (folder?.id) folderIdByPath.set(path, folder.id)
      }

      for (const f of files) {
        const asset = await uploadFile(f)
        const dirPath = dirOf(f).join('/')
        await createMutation.mutateAsync({
          title: f.name,
          template_type: category,
          case_id: matter,
          client_id: contactId,
          folder_id: folderIdByPath.get(dirPath) ?? parentId ?? '',
          received_date: receivedDate,
          file_url: asset.file_url,
          file_public_id: asset.file_public_id,
          file_thumbnail_url: asset.file_thumbnail_url,
          file_mime_type: asset.file_mime_type,
          file_size: asset.file_size,
          court: '',
          suit_number: '',
          parties: '',
          judge: '',
          content: '',
        })
      }
      const folderCount = folderIdByPath.size
      toast.success(
        `Created ${folderCount} folder${folderCount === 1 ? '' : 's'} with ${files.length} file${files.length === 1 ? '' : 's'}.`,
      )
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Folder upload failed: ${err.message}`
          : 'Folder upload failed. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle
            className="text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            UploadSimple
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-4">
          <div className="flex items-start gap-3">
            <span
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
              style={{
                background: 'var(--surface-sunken)',
                color: 'var(--gold-dark)',
              }}
              aria-hidden
            >
              <FolderOpen size={16} strokeWidth={1.75} />
            </span>
            <div className="flex-1 min-w-0">
              <Label
                className="text-[12px] font-semibold mb-1.5 block"
                style={{ color: 'var(--text-primary)' }}
              >
                Folder *
              </Label>
              <div
                className="flex items-center justify-between gap-2 rounded-lg border px-3 h-10 text-[13px]"
                style={{
                  borderColor: 'var(--border-default)',
                  background: folderName
                    ? 'var(--surface-card)'
                    : 'var(--surface-sunken)',
                  color: folderName
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                }}
              >
                <span className="truncate">
                  {folderName
                    ? `${folderName} (${files.length} file${files.length === 1 ? '' : 's'
                    })`
                    : 'No folder chosen'}
                </span>
                <button
                  type="button"
                  onClick={onPickFolder}
                  className="text-[12.5px] font-medium cursor-pointer shrink-0"
                  style={{ color: 'var(--gold-dark)' }}
                >
                  {folderName ? 'Replace folder' : 'Choose folder'}
                </button>
                <input
                  ref={setFolderInputRef}
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={onFolderChosen}
                  aria-label="Choose folder to upload"
                />
              </div>
            </div>
          </div>

          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Matter
            </Label>
            <div className="relative">
              <select
                value={matter}
                onChange={(e) => setMatter(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: matter
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  colorScheme: 'light',
                }}
              >
                <option value="">Find a matter by matter name or client</option>
                {contactCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <CaretDown
                size={13}
                strokeWidth={1.75}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                className="text-[12px] font-semibold mb-1.5 block"
                style={{ color: 'var(--text-primary)' }}
              >
                Received date
              </Label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-[13px]"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  colorScheme: 'light',
                }}
              />
            </div>
            <div>
              <Label
                className="text-[12px] font-semibold mb-1.5 block"
                style={{ color: 'var(--text-primary)' }}
              >
                Category
              </Label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-card)',
                    color: category
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                    colorScheme: 'light',
                  }}
                >
                  <option value="">Find a document category</option>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <CaretDown
                  size={13}
                  strokeWidth={1.75}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter
          className="px-6 py-4 border-t flex sm:flex-row sm:justify-start gap-2"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <PrimaryDialogBtn
            disabled={!canSubmit}
            onClick={handleUpload}
            label={
              submitting
                ? 'Uploading…'
                : files.length > 1
                  ? `UploadSimple ${files.length} files`
                  : 'Upload'
            }
          />
          <GhostDialogBtn
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            label="Cancel"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Create-folder dialog. Persists a contact-scoped folder via
 * {@link useCreateDocumentFolder}. The Category field is an optional
 * organisational hint stored alongside (kept in form state today; the
 * folder record itself is name + scope).
 */
function CreateFolderDialog({
  open,
  onOpenChange,
  contactId,
  parentId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  contactId: string
  // Folder the new one nests under (null = top level of the library).
  parentId: string | null
}) {
  const createFolderMutation = useCreateDocumentFolder()
  const [folderName, setFolderName] = useState('')
  const [category, setCategory] = useState('')
  const submitting = createFolderMutation.isPending

  // Clear the form on each open (render-phase reset — see
  // RenameDocumentDialog) so a cancelled draft doesn't leak forward.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setFolderName('')
      setCategory('')
    }
  }

  const canSubmit = folderName.trim().length > 0 && !submitting

  const handleCreate = async () => {
    if (!canSubmit) return
    try {
      await createFolderMutation.mutateAsync({
        name: folderName.trim(),
        client_id: contactId,
        parent_id: parentId ?? '',
      })
      toast.success(`Folder "${folderName}" created.`)
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error ? `Could not create folder: ${err.message}` : 'Could not create folder.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[520px] p-0 overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle
            className="text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Create folder
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-4">
          <div>
            <Label
              htmlFor="cf-folder-name"
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Folder name *
            </Label>
            <input
              id="cf-folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full h-10 rounded-lg border px-3 text-[13px]"
              style={{
                borderColor: folderName
                  ? 'var(--border-default)'
                  : '#E0788A',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
              }}
              autoFocus
            />
          </div>
          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Category
            </Label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: category
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  colorScheme: 'light',
                }}
              >
                <option value="">Find a document category</option>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <CaretDown
                size={13}
                strokeWidth={1.75}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
          </div>
        </div>

        <DialogFooter
          className="px-6 py-4 border-t flex sm:flex-row sm:justify-start gap-2"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <PrimaryDialogBtn
            disabled={!canSubmit}
            onClick={handleCreate}
            label={submitting ? 'Creating…' : 'Create'}
          />
          <GhostDialogBtn
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            label="Cancel"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Create-document-from-template dialog. Template picker is empty
 * today (no templates seeded), so the dropdown renders the "No
 * results found" state inline. Document name + "Create a PDF
 * document" toggle round out the form; footer carries the same
 * sub-processor disclosure the standard pattern shows.
 *
 * On Create we mint a real Document record with `template_type` set
 * to the chosen template name (or empty if none) and `content` left
 * blank for the editor to fill in. The PDF toggle is held in form
 * state until the export pipeline lands.
 */
function CreateFromTemplateDialog({
  open,
  onOpenChange,
  contactId,
  contactCases,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  contactId: string
  contactCases: Case[]
}) {
  const createMutation = useCreateDocument()
  const [templateQuery, setTemplateQuery] = useState('')
  const [docName, setDocName] = useState('')
  const [matter, setMatter] = useState('')
  const [makePdf, setMakePdf] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setTemplateQuery('')
      setDocName('')
      setMatter('')
      setMakePdf(true)
    }
  }, [open])

  const canSubmit = docName.trim().length > 0 && !submitting

  const handleCreate = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await createMutation.mutateAsync({
        title: docName.trim(),
        template_type: templateQuery.trim(), // empty if user didn't pick one
        case_id: matter,
        client_id: contactId,
        court: '',
        suit_number: '',
        parties: '',
        judge: '',
        content: '',
      })
      toast.success(
        makePdf
          ? `Document "${docName}" created (will be exported as PDF).`
          : `Document "${docName}" created.`,
      )
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Create failed: ${err.message}`
          : 'Create failed. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle
            className="text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Create document from template
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-4">
          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Document template *
            </Label>
            <input
              value={templateQuery}
              onChange={(e) => setTemplateQuery(e.target.value)}
              placeholder="Find a document template"
              className="w-full h-10 rounded-lg border px-3 text-[13px]"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
              }}
            />
            {/* Inline "no results" panel. Follows the standard pattern where
                the picker shows search results / empty state directly
                below the input rather than in a separate dropdown. */}
            <div
              className="mt-2 rounded-lg border px-4 py-12 text-center"
              style={{
                borderColor: 'var(--border-soft)',
                background: 'var(--surface-sunken)',
              }}
            >
              <p
                className="text-[13.5px] font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                No results found.
              </p>
              <p
                className="mt-1 text-[12px]"
                style={{ color: 'var(--text-muted)' }}
              >
                Document templates ship with the firm settings screen.
              </p>
            </div>
          </div>

          <div>
            <Label
              htmlFor="ct-name"
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Document name *
            </Label>
            <input
              id="ct-name"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Name your new document"
              className="w-full h-10 rounded-lg border px-3 text-[13px]"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Matter
            </Label>
            <div className="relative">
              <select
                value={matter}
                onChange={(e) => setMatter(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: matter
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  colorScheme: 'light',
                }}
              >
                <option value="">Find a matter by matter name or client</option>
                {contactCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <CaretDown
                size={13}
                strokeWidth={1.75}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          {/* Create as PDF checkbox — the reference default is on. */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-[13px]">
            <span
              className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
              style={{
                borderColor: makePdf
                  ? 'var(--gold)'
                  : 'var(--border-default)',
                background: makePdf ? 'var(--gold)' : 'transparent',
              }}
              aria-hidden
            >
              {makePdf && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6.5L5 9.5L10 3.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              Create a PDF document
            </span>
            <input
              type="checkbox"
              checked={makePdf}
              onChange={() => setMakePdf((v) => !v)}
              className="sr-only"
            />
          </label>

          {/* Sub-processor disclosure — the standard pattern surfaces this because
              they hand template rendering off to Nintex. LegaLite
              runs renders in-house today, so the copy is adapted
              to a generic disclaimer pointing at our Terms / Privacy
              Policy. Update once the official sub-processor list
              ships. */}
          <p
            className="text-[11.5px] leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            Documents made from templates are processed via LegaLite&rsquo;s
            document engine. For further information, please refer to our
            <button
              type="button"
              onClick={() => toast.info('Terms of Service ship next.')}
              className="underline cursor-pointer ml-1"
              style={{ color: 'var(--gold-dark)' }}
            >
              Terms of Service
            </button>{' '}
            and
            <button
              type="button"
              onClick={() => toast.info('Privacy Policy ships next.')}
              className="underline cursor-pointer ml-1"
              style={{ color: 'var(--gold-dark)' }}
            >
              Privacy Policy
            </button>
            .
          </p>
        </div>

        <DialogFooter
          className="px-6 py-4 border-t flex sm:flex-row sm:justify-start gap-2 items-center"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <PrimaryDialogBtn
            disabled={!canSubmit}
            onClick={handleCreate}
            label={submitting ? 'Creating…' : 'Create'}
          />
          <GhostDialogBtn
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            label="Cancel"
          />
          <button
            type="button"
            onClick={() =>
              toast.info('Document automation docs ship with the help centre.')
            }
            className="ml-auto text-[12.5px] font-medium cursor-pointer underline"
            style={{ color: 'var(--gold-dark)' }}
          >
            Learn more about document automation
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

