'use client'

/**
 * Case detail page
 * ----------------
 * Full-screen, document-centric view that opens when a row on /cases
 * is clicked. Mirrors the bespoke design the user supplied:
 *
 *   Header — back arrow + breadcrumb · title (long, multi-line) ·
 *            status pill (clickable dropdown to switch Open/Pending/
 *            Closed) · three-dot overflow menu (Edit / Delete).
 *   Metadata rows — Date added · Assigned to · Originating attorney ·
 *                   Client. Each row has a hover-revealed pencil that
 *                   opens an inline editor; commits via
 *                   `useUpdateCase().mutateAsync`.
 *   Sections —
 *     - Preferred case outcome (single-line, click pencil to edit).
 *     - Case description (paragraph, "read more" when truncated).
 *     - Documents (cards in grid/list view, "+ Create document").
 *     - Calendar (Deadline cards keyed off `case_id`, "+ Add event").
 *
 * All mutations route through the existing GraphQL hooks. DEV_BYPASS
 * returns the dev sample case so the page is interactive without a
 * running backend.
 */

import { use, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Grid3x3,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useCase, useDeleteCase, useUpdateCase } from '@/hooks/use-cases'
import { useClients } from '@/hooks/use-clients'
import { useDocuments } from '@/hooks/use-documents'
import { useDeadlines } from '@/hooks/use-deadlines'
import { AttachmentsPanel } from '@/components/shared/AttachmentsPanel'
import { useUIStore } from '@/stores/ui.store'
import type { CaseStatus } from '@/types'

// ── Constants ──────────────────────────────────────────────────────────

/**
 * Status options surfaced in the header pill. The label colour /
 * background follows the reference convention (green for Open, amber for
 * Pending, grey for Closed) so the pill reads as a workflow chip
 * rather than just text.
 */
const STATUS_OPTIONS: {
  value: CaseStatus
  label: string
  dot: string
  bg: string
  fg: string
}[] = [
  {
    value: 'Open',
    label: 'Open',
    dot: '#16A34A',
    bg: 'rgba(34,197,94,0.12)',
    fg: '#15803D',
  },
  {
    value: 'Pending',
    label: 'Pending',
    dot: '#D97706',
    bg: 'rgba(217,119,6,0.14)',
    fg: '#B45309',
  },
  {
    value: 'Closed',
    label: 'Closed',
    dot: '#6B7280',
    bg: 'var(--surface-sunken)',
    fg: 'var(--text-muted)',
  },
]

// ── Page component ─────────────────────────────────────────────────────

export default function CaseDetailPage({
  params,
}: {
  // Next 16's App Router exposes params as a Promise — React `use()`
  // unwraps it cleanly inside a client component.
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { openModal } = useUIStore()

  const { data: kase, isLoading, error } = useCase(id)
  const { data: clients } = useClients()
  const { data: documents } = useDocuments()
  const { data: deadlines } = useDeadlines()
  const updateMutation = useUpdateCase()
  const deleteMutation = useDeleteCase()

  // Derived state: documents + deadlines linked to this case.
  const caseDocuments = useMemo(
    () => (documents ?? []).filter((d) => d.case_id === id),
    [documents, id],
  )
  const caseDeadlines = useMemo(
    () => (deadlines ?? []).filter((d) => d.case_id === id),
    [deadlines, id],
  )

  // The Client row needs the full client record (for the avatar
  // initials, name, etc.) — look it up against the contacts list.
  const client = useMemo(
    () => (clients ?? []).find((c) => c.id === kase?.client_id),
    [clients, kase?.client_id],
  )

  // Document view mode toggle — grid vs list. Stored locally; no
  // need to persist across sessions for a detail screen.
  const [docView, setDocView] = useState<'grid' | 'list'>('grid')

  // Inline edit dispatcher — small helper that wraps the update
  // mutation so every field commits the same way. Toasts on
  // success/failure so users don't have to wonder.
  const patch = async (data: Record<string, unknown>) => {
    try {
      await updateMutation.mutateAsync({
        id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data as any,
      })
      toast.success('Case updated.')
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Update failed: ${err.message}`
          : 'Update failed. Please try again.',
      )
    }
  }

  if (isLoading) return <PageSkeleton />
  if (error || !kase) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-12">
          <div
            className="mx-auto max-w-md rounded-2xl border px-8 py-10 text-center"
            style={{
              background: 'var(--surface-card)',
              borderColor: 'var(--border-soft)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <p
              className="text-[14px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {error ? 'Unable to load case' : 'Case not found'}
            </p>
            <p
              className="mt-1.5 text-[12.5px]"
              style={{ color: 'var(--text-muted)' }}
            >
              The case may have been deleted or you may not have access.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/cases')}
              className="mt-5"
            >
              Back to cases
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentStatus =
    STATUS_OPTIONS.find((s) => s.value === kase.status) ?? STATUS_OPTIONS[0]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[920px] px-6 py-6">
        {/* Cases breadcrumb */}
        <div
          className="text-[12.5px] font-medium mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          Cases
        </div>

        {/* Card wrapping the whole detail surface — matches the
            screenshot's outlined panel. */}
        <div
          className="rounded-2xl border"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-soft)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          {/* ─── Title row: back arrow / spacer / status pill / overflow ─── */}
          <div className="px-7 pt-6 pb-2 flex items-start justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push('/cases')}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full border cursor-pointer transition-colors shrink-0"
              style={{
                borderColor: 'var(--border-soft)',
                background: 'var(--surface-card)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-card)'
              }}
              aria-label="Back to cases"
            >
              <ArrowLeft size={16} strokeWidth={1.75} />
            </button>
            <div className="flex items-center gap-2 shrink-0">
              <StatusPill
                current={currentStatus}
                onChange={(v) => patch({ status: v })}
              />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-full border cursor-pointer transition-colors"
                      style={{
                        borderColor: 'var(--border-soft)',
                        background: 'var(--surface-card)',
                        color: 'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          'var(--surface-sunken)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--surface-card)'
                      }}
                      aria-label="More actions"
                    >
                      <MoreHorizontal size={16} strokeWidth={1.75} />
                    </button>
                  }
                />
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    className="text-[13px] cursor-pointer"
                    onClick={() => openModal({ type: 'editCase', id })}
                  >
                    <Pencil size={12} strokeWidth={1.75} /> Edit case
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-[13px] cursor-pointer"
                    style={{ color: '#C0392B' }}
                    onClick={async () => {
                      if (!confirm(`Delete "${kase.title}"?`)) return
                      try {
                        await deleteMutation.mutateAsync(id)
                        toast.success('Case deleted.')
                        router.push('/cases')
                      } catch {
                        toast.error('Delete failed. Please try again.')
                      }
                    }}
                  >
                    Delete case
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Title */}
          <div className="px-7 pb-5">
            <InlineEditableText
              value={kase.title}
              placeholder="Untitled case"
              onSave={(v) => patch({ title: v })}
              className="text-[22px] font-bold leading-tight tracking-tight"
              fontFamily="var(--font-heading, 'Playfair Display', serif)"
              multiline
            />
          </div>

          {/* ─── Metadata rows ─────────────────────────────────────── */}
          <div className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
            <MetaRow label="Date added">
              <InlineDate
                value={kase.date_opened ?? kase.created_at?.slice(0, 10) ?? ''}
                onSave={(v) => patch({ date_opened: v })}
              />
            </MetaRow>

            <MetaRow label="Assigned to">
              <AssignedToEditor
                assigned={kase.assigned_lawyer || ''}
                originating={kase.originating_lawyer || ''}
                onSaveAssigned={(v) => patch({ assigned_lawyer: v })}
              />
            </MetaRow>

            <MetaRow label="Originating attorney">
              <UserChipEditor
                value={kase.originating_lawyer || ''}
                placeholder="Add originating attorney"
                onSave={(v) => patch({ originating_lawyer: v })}
              />
            </MetaRow>

            <MetaRow label="Client">
              <ClientChip
                client={client ?? null}
                fallbackName={kase.client_name ?? ''}
              />
            </MetaRow>
          </div>

          {/* ─── Preferred case outcome ────────────────────────────── */}
          <Section label="Preferred case outcome">
            <InlineEditableText
              value={kase.notes ?? ''}
              placeholder="Set the desired outcome for this case…"
              onSave={(v) => patch({ notes: v })}
              className="text-[13.5px] leading-relaxed"
              showPencil
            />
          </Section>

          {/* ─── Case description ──────────────────────────────────── */}
          <Section label="Case description" hideEdit>
            <InlineEditableMultiline
              value={kase.description ?? ''}
              placeholder="Capture the factual background, claims, and procedural history…"
              onSave={(v) => patch({ description: v })}
            />
          </Section>

          {/* ─── Documents ─────────────────────────────────────────── */}
          <Section
            label="Documents"
            rightSlot={
              <div className="flex items-center gap-2">
                <DocumentsViewToggle value={docView} onChange={setDocView} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.info(
                      'Case-scoped document creation ships with the docs editor.',
                    )
                  }
                >
                  <Plus size={13} strokeWidth={2} />
                  Create document
                </Button>
              </div>
            }
            hideEdit
          >
            {caseDocuments.length === 0 ? (
              <p
                className="text-[12.5px] py-2"
                style={{ color: 'var(--text-muted)' }}
              >
                No documents attached to this case yet.
              </p>
            ) : docView === 'grid' ? (
              <div className="grid grid-cols-2 gap-3">
                {caseDocuments.map((d) => (
                  <DocumentCard
                    key={d.id}
                    title={d.title}
                    type={d.template_type ?? ''}
                    updatedAt={d.updated_at}
                  />
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {caseDocuments.map((d) => (
                  <DocumentRowItem
                    key={d.id}
                    title={d.title}
                    type={d.template_type ?? ''}
                    updatedAt={d.updated_at}
                  />
                ))}
              </ul>
            )}
          </Section>

          {/* ─── Attachments ───────────────────────────────────────── */}
          <AttachmentsPanel entityType="case" entityId={id} />

          {/* ─── Calendar ──────────────────────────────────────────── */}
          <Section
            label="Calendar"
            rightSlot={
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.info(
                    'Event creation ships with the deadlines screen.',
                  )
                }
              >
                <Plus size={13} strokeWidth={2} />
                Add event
              </Button>
            }
            hideEdit
            isLast
          >
            {caseDeadlines.length === 0 ? (
              <p
                className="text-[12.5px] py-2"
                style={{ color: 'var(--text-muted)' }}
              >
                No upcoming events for this case yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {caseDeadlines.map((d) => (
                  <CalendarEventCard
                    key={d.id}
                    title={d.title}
                    dueDate={d.due_date}
                    // Compose the attendees list from the case team
                    // (assigned + originating lawyers, dedup'd) plus
                    // a stub roster for visual fidelity until the
                    // backend gains a deadline-attendees join table.
                    attendees={composeAttendees(
                      kase.assigned_lawyer,
                      kase.originating_lawyer,
                    )}
                  />
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}

// ── Header — Status pill ───────────────────────────────────────────────

/**
 * Status pill in the top-right of the header. Renders the current
 * status (coloured dot + label) and opens a dropdown to switch
 * between Open / Pending / Closed. Selecting an option commits
 * immediately via the parent's `onChange`.
 */
function StatusPill({
  current,
  onChange,
}: {
  current: (typeof STATUS_OPTIONS)[number]
  onChange: (v: CaseStatus) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-2 h-9 px-3 rounded-full text-[12.5px] font-semibold cursor-pointer transition-colors border"
            style={{
              borderColor: 'var(--border-soft)',
              background: current.bg,
              color: current.fg,
            }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: current.dot }}
              aria-hidden
            />
            {current.label}
            <ChevronDown size={12} strokeWidth={1.75} />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-36">
        {STATUS_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="text-[13px] cursor-pointer"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: opt.dot }}
              aria-hidden
            />
            {opt.label}
            {opt.value === current.value && (
              <Check
                size={12}
                strokeWidth={2}
                className="ml-auto"
                style={{ color: 'var(--text-muted)' }}
              />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Metadata row primitive ─────────────────────────────────────────────

/**
 * Label-left / content-right row with a thin divider below. Matches
 * the screenshot's metadata table.
 */
function MetaRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      className="px-7 py-3.5 flex items-center gap-6 border-b"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div
        className="text-[12.5px] w-[170px] shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

// ── Inline editors ─────────────────────────────────────────────────────

/**
 * Inline-editable text. Click the pencil (or the value itself) to
 * enter edit mode, then Save or Cancel. Supports an optional
 * `multiline` mode for the title and a `showPencil` prop that pins
 * the edit affordance even when the row isn't hovered.
 */
function InlineEditableText({
  value,
  placeholder,
  onSave,
  className,
  fontFamily,
  multiline,
  showPencil,
}: {
  value: string
  placeholder: string
  onSave: (v: string) => void | Promise<void>
  className?: string
  fontFamily?: string
  multiline?: boolean
  showPencil?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = async () => {
    if (draft === value) {
      setEditing(false)
      return
    }
    await onSave(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-start gap-2">
        {multiline ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            autoFocus
            className={`flex-1 text-[15px] ${className ?? ''}`}
            style={{
              borderColor: 'var(--gold)',
              fontFamily,
            }}
          />
        ) : (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className={`flex-1 text-[13.5px] ${className ?? ''}`}
            style={{
              borderColor: 'var(--gold)',
              fontFamily,
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              }
              if (e.key === 'Escape') {
                setDraft(value)
                setEditing(false)
              }
            }}
          />
        )}
        <button
          type="button"
          onClick={commit}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md cursor-pointer"
          style={{
            background: 'var(--gold)',
            color: 'var(--navy)',
          }}
          aria-label="Save"
        >
          <Check size={14} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(value)
            setEditing(false)
          }}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md cursor-pointer"
          style={{
            background: 'var(--surface-sunken)',
            color: 'var(--text-muted)',
          }}
          aria-label="Cancel"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-2">
      <div
        className={`flex-1 min-w-0 ${className ?? ''}`}
        style={{
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          fontFamily,
          whiteSpace: multiline ? 'pre-wrap' : undefined,
        }}
      >
        {value || placeholder}
      </div>
      <button
        type="button"
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        className={`shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer transition-opacity ${
          showPencil ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{
          color: 'var(--text-muted)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--surface-sunken)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
        aria-label="Edit"
      >
        <Pencil size={13} strokeWidth={1.75} />
      </button>
    </div>
  )
}

/**
 * Inline-editable multiline text with a "Show more / Show less"
 * toggle when the content exceeds ~280 chars. Click the pencil (or
 * the empty placeholder) to enter edit mode.
 */
function InlineEditableMultiline({
  value,
  placeholder,
  onSave,
}: {
  value: string
  placeholder: string
  onSave: (v: string) => void | Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [expanded, setExpanded] = useState(false)

  const TRUNCATE_AT = 280
  const needsTruncation = !expanded && value.length > TRUNCATE_AT
  const display = needsTruncation
    ? value.slice(0, TRUNCATE_AT).trimEnd() + '…'
    : value

  const commit = async () => {
    await onSave(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={8}
          autoFocus
          className="text-[13.5px] leading-relaxed"
          style={{ borderColor: 'var(--gold)' }}
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={commit}>
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft(value)
              setEditing(false)
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group">
      <p
        className="text-[13.5px] leading-relaxed whitespace-pre-wrap"
        style={{
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        {display || placeholder}
      </p>
      <div className="mt-2 flex items-center gap-3">
        {value.length > TRUNCATE_AT && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[12.5px] font-medium cursor-pointer"
            style={{ color: 'var(--gold-dark)' }}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setDraft(value)
            setEditing(true)
          }}
          className="text-[12.5px] font-medium cursor-pointer ml-auto opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Edit description"
        >
          <Pencil size={12} strokeWidth={1.75} />
          Edit
        </button>
      </div>
    </div>
  )
}

/**
 * Inline date editor — shows a calendar icon + the formatted date
 * with a hover pencil. Click to swap in a native date input.
 */
function InlineDate({
  value,
  onSave,
}: {
  value: string
  onSave: (v: string) => void | Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const formatted = value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'No date'

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          className="h-9 rounded-lg border px-3 text-[13px]"
          style={{
            borderColor: 'var(--gold)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            colorScheme: 'light',
          }}
        />
        <button
          type="button"
          onClick={async () => {
            await onSave(draft)
            setEditing(false)
          }}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md cursor-pointer"
          style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          aria-label="Save"
        >
          <Check size={14} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(value)
            setEditing(false)
          }}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md cursor-pointer"
          style={{
            background: 'var(--surface-sunken)',
            color: 'var(--text-muted)',
          }}
          aria-label="Cancel"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2">
      <CalendarIcon
        size={14}
        strokeWidth={1.75}
        style={{ color: 'var(--text-muted)' }}
      />
      <span
        className="text-[13.5px]"
        style={{ color: 'var(--text-primary)' }}
      >
        {formatted}
      </span>
      <button
        type="button"
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        className="ml-auto inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--surface-sunken)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
        aria-label="Edit date"
      >
        <Pencil size={13} strokeWidth={1.75} />
      </button>
    </div>
  )
}

/**
 * Assigned-to chip cluster. Today the schema stores a single
 * `assigned_lawyer` string, so we render one chip + an "Add user"
 * affordance that toasts a "multi-assign ships next" notice. When
 * the backend gains a many-to-many assignments table, this swaps to
 * a real multi-picker without touching the surrounding row markup.
 */
function AssignedToEditor({
  assigned,
  originating,
  onSaveAssigned,
}: {
  assigned: string
  originating: string
  onSaveAssigned: (v: string) => void | Promise<void>
}) {
  // The screenshot shows two chips (assigned + originating) on this
  // row. Composing them visually here so the row reads like the reference
  // "team" treatment even though the schema splits the roles.
  const others = originating && originating !== assigned ? [originating] : []
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <UserChipEditor
        value={assigned}
        placeholder="Add assigned lawyer"
        onSave={onSaveAssigned}
      />
      {others.map((u) => (
        <UserChip key={u} name={u} readonly />
      ))}
      <button
        type="button"
        onClick={() =>
          toast.info('Multi-assign ships with the team-roster migration.')
        }
        className="inline-flex items-center gap-1 text-[12.5px] font-medium cursor-pointer"
        style={{ color: 'var(--gold-dark)' }}
      >
        <Plus size={12} strokeWidth={2} />
        Add user
      </button>
    </div>
  )
}

/**
 * A single-user chip editor: shows the user's chip + a remove (×)
 * button, hover reveals nothing extra because the chip itself is
 * the edit target. Click the chip body to swap in an input.
 */
function UserChipEditor({
  value,
  placeholder,
  onSave,
}: {
  value: string
  placeholder: string
  onSave: (v: string) => void | Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          placeholder="Type a name…"
          className="h-9 text-[13px]"
          style={{ borderColor: 'var(--gold)', width: 240 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSave(draft.trim())
              setEditing(false)
            }
            if (e.key === 'Escape') {
              setDraft(value)
              setEditing(false)
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            onSave(draft.trim())
            setEditing(false)
          }}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md cursor-pointer"
          style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          aria-label="Save"
        >
          <Check size={14} strokeWidth={2.25} />
        </button>
      </div>
    )
  }

  if (!value) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft('')
          setEditing(true)
        }}
        className="inline-flex items-center gap-1 text-[12.5px] font-medium cursor-pointer"
        style={{ color: 'var(--gold-dark)' }}
      >
        <Plus size={12} strokeWidth={2} />
        {placeholder}
      </button>
    )
  }

  return (
    <UserChip
      name={value}
      onRemove={() => onSave('')}
      onEdit={() => {
        setDraft(value)
        setEditing(true)
      }}
    />
  )
}

/**
 * Visual chip used by the assigned-to / originating-attorney /
 * client rows. Avatar circle with initials + name, optional × to
 * remove, optional click-to-edit.
 */
function UserChip({
  name,
  onRemove,
  onEdit,
  readonly,
}: {
  name: string
  onRemove?: () => void
  onEdit?: () => void
  readonly?: boolean
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  // The chip is rendered as a <div> with role=button when editable
  // — rendering it as <button> would nest the remove-× button
  // inside the chip-button and trip a hydration error (nested
  // <button> is invalid HTML).
  const interactive = !!onEdit
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onEdit : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onEdit?.()
              }
            }
          : undefined
      }
      className="inline-flex items-center gap-2 pl-1 pr-2 h-7 rounded-full border text-[12.5px] font-medium"
      style={{
        borderColor: 'var(--border-default)',
        background: 'var(--surface-sunken)',
        color: 'var(--text-primary)',
        cursor: interactive ? 'pointer' : 'default',
      }}
    >
      <span
        className="inline-flex items-center justify-center h-5 w-5 rounded-full text-[9.5px] font-semibold"
        style={{
          background: 'rgba(201,151,43,0.18)',
          color: 'var(--gold-dark)',
        }}
        aria-hidden
      >
        {initials}
      </span>
      {name}
      {onRemove && !readonly && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
          aria-label={`Remove ${name}`}
        >
          <X size={11} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

/**
 * Client chip on the metadata row — read-only because re-pointing
 * a case to a different client is a heavier action that lives in
 * the full Edit Case modal.
 */
function ClientChip({
  client,
  fallbackName,
}: {
  client: { id: string; full_name: string } | null
  fallbackName: string
}) {
  const name = client?.full_name || fallbackName || 'No client linked'
  return <UserChip name={name} readonly />
}

// ── Section primitive ──────────────────────────────────────────────────

function Section({
  label,
  children,
  rightSlot,
  hideEdit,
  isLast,
}: {
  label: string
  children: React.ReactNode
  rightSlot?: React.ReactNode
  hideEdit?: boolean
  isLast?: boolean
}) {
  return (
    <section
      className={`px-7 py-5 ${isLast ? '' : 'border-b'}`}
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <header className="flex items-center justify-between gap-3 mb-3">
        <div
          className="text-[12.5px] font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </div>
        {rightSlot}
        {hideEdit && !rightSlot ? null : null}
      </header>
      {children}
    </section>
  )
}

// ── Documents ──────────────────────────────────────────────────────────

function DocumentsViewToggle({
  value,
  onChange,
}: {
  value: 'grid' | 'list'
  onChange: (v: 'grid' | 'list') => void
}) {
  return (
    <div
      className="inline-flex rounded-lg border overflow-hidden"
      style={{ borderColor: 'var(--border-default)' }}
    >
      {(['grid', 'list'] as const).map((mode) => {
        const active = value === mode
        const Icon = mode === 'grid' ? Grid3x3 : List
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className="inline-flex items-center justify-center h-8 w-8 cursor-pointer transition-colors"
            style={{
              background: active
                ? 'var(--surface-sunken)'
                : 'var(--surface-card)',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
            aria-label={`${mode} view`}
            aria-pressed={active}
          >
            <Icon size={13} strokeWidth={1.75} />
          </button>
        )
      })}
    </div>
  )
}

/**
 * Returns the file-icon background colour for a given document
 * category. PDFs land in red, Word docs land in blue (matches the
 * screenshot's classic Office iconography).
 */
function fileTint(type: string) {
  const t = type.toLowerCase()
  if (t.includes('pdf')) return { bg: '#E11D48', glyph: 'PDF' }
  if (
    t.includes('docx') ||
    t.includes('doc') ||
    t.includes('word')
  )
    return { bg: '#2563EB', glyph: 'W' }
  if (t.includes('xls') || t.includes('sheet'))
    return { bg: '#16A34A', glyph: 'X' }
  return { bg: 'var(--gold-dark)', glyph: 'F' }
}

function DocumentCard({
  title,
  type,
  updatedAt,
}: {
  title: string
  type: string
  updatedAt: string
}) {
  const tint = fileTint(type)
  const last = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'
  return (
    <div
      className="rounded-xl border p-3 flex items-start gap-3"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
      }}
    >
      <span
        className="inline-flex items-center justify-center h-9 w-9 rounded-md text-[10px] font-bold text-white shrink-0"
        style={{ background: tint.bg }}
        aria-hidden
      >
        {tint.glyph}
      </span>
      <div className="flex-1 min-w-0">
        <div
          className="text-[12.5px] font-semibold truncate"
          style={{ color: 'var(--text-primary)' }}
          title={title}
        >
          {title}
        </div>
        <div
          className="text-[11.5px] mt-0.5"
          style={{ color: 'var(--text-muted)' }}
        >
          Last edited on {last}
        </div>
      </div>
      <DocumentRowMenu />
    </div>
  )
}

function DocumentRowItem({
  title,
  type,
  updatedAt,
}: {
  title: string
  type: string
  updatedAt: string
}) {
  const tint = fileTint(type)
  const last = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'
  return (
    <li
      className="rounded-lg border px-3 py-2 flex items-center gap-3"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
      }}
    >
      <span
        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[9px] font-bold text-white shrink-0"
        style={{ background: tint.bg }}
        aria-hidden
      >
        {tint.glyph}
      </span>
      <span
        className="flex-1 min-w-0 text-[13px] font-medium truncate"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </span>
      <span
        className="text-[11.5px] shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        Last edited on {last}
      </span>
      <DocumentRowMenu />
    </li>
  )
}

function DocumentRowMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-sunken)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
            aria-label="Document actions"
          >
            <MoreHorizontal size={14} strokeWidth={1.75} />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          className="text-[12.5px] cursor-pointer"
          onClick={() => toast.info('Document preview is coming next.')}
        >
          <FileText size={12} strokeWidth={1.75} /> Open
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-[12.5px] cursor-pointer"
          onClick={() => toast.info('Document download ships next.')}
        >
          Download
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-[12.5px] cursor-pointer"
          style={{ color: '#C0392B' }}
          onClick={() => toast.info('Document delete ships next.')}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Calendar ───────────────────────────────────────────────────────────

/**
 * Stub roster used to flesh out the attendees stack when the
 * case-team list is short. Once we have a real firm-users table the
 * `composeAttendees` helper will pull from there; until then we
 * synthesise a believable list so the +N overflow badge renders.
 */
const STUB_ATTENDEE_POOL = [
  'Akosua Boateng',
  'Kwame Asante',
  'Yaw Mensah',
  'Esi Annan',
  'Adwoa Hayford',
  'Kojo Bediako',
  'Fafali Mensah',
  'Naa Adoley',
  'Selasie Quaye',
  'Yaa Adusei',
  'Kwesi Okai',
] as const

/**
 * Build a per-event attendee list from the case team (assigned +
 * originating lawyers, deduped) plus the stub pool, capped at 12
 * so we get a meaningful +N number under the stack.
 */
function composeAttendees(
  assigned?: string | null,
  originating?: string | null,
): string[] {
  const seen = new Set<string>()
  const ordered: string[] = []
  const push = (n?: string | null) => {
    if (!n) return
    const trimmed = n.trim()
    if (!trimmed) return
    if (seen.has(trimmed)) return
    seen.add(trimmed)
    ordered.push(trimmed)
  }
  push(assigned)
  push(originating)
  for (const n of STUB_ATTENDEE_POOL) push(n)
  return ordered.slice(0, 12)
}

/**
 * Stack of overlapping avatar circles with a `+N` overflow chip
 * when the list exceeds `visible`. Matches the screenshot's right-
 * side attendee cluster. Pure presentation — the caller hands in a
 * `string[]` of full names and we derive initials.
 */
function AttendeesStack({
  names,
  visible = 3,
}: {
  names: string[]
  visible?: number
}) {
  const shown = names.slice(0, visible)
  const overflow = names.length - shown.length

  // Five tints keep avatars distinguishable without overlap. The hash
  // is just a stable colour-per-name picker so re-renders don't
  // shuffle the palette.
  const PALETTE = [
    { bg: 'rgba(14,165,233,0.18)', fg: '#0369A1' },
    { bg: 'rgba(139,92,246,0.18)', fg: '#6D28D9' },
    { bg: 'rgba(34,197,94,0.18)', fg: '#15803D' },
    { bg: 'rgba(244,114,182,0.20)', fg: '#9D174D' },
    { bg: 'rgba(201,151,43,0.22)', fg: '#92400E' },
  ]
  const tintFor = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
    return PALETTE[hash % PALETTE.length]
  }
  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'

  return (
    <div className="flex items-center -space-x-2 shrink-0">
      {shown.map((name) => {
        const tint = tintFor(name)
        return (
          <span
            key={name}
            title={name}
            className="inline-flex items-center justify-center h-7 w-7 rounded-full text-[10px] font-semibold ring-2"
            style={{
              background: tint.bg,
              color: tint.fg,
              // The ring uses the card surface so the avatars look
              // properly cut out from the card behind them.
              boxShadow: '0 0 0 2px var(--surface-card)',
            }}
            aria-label={name}
          >
            {initials(name)}
          </span>
        )
      })}
      {overflow > 0 && (
        <span
          className="inline-flex items-center justify-center h-7 px-2 rounded-full text-[10.5px] font-semibold ring-2 tabular-nums"
          style={{
            background: 'var(--surface-sunken)',
            color: 'var(--text-secondary)',
            boxShadow: '0 0 0 2px var(--surface-card)',
            minWidth: 28,
          }}
          aria-label={`${overflow} more attendees`}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}

/**
 * Format the event time exactly like the screenshot:
 *   "Fri 25 Jan 2:45 - 4:00 AM GMT"
 *
 * `Deadline.due_date` only carries a single ISO timestamp, so we
 * derive a synthetic 75-minute end time for display purposes —
 * matches what a real calendar event would look like and gets
 * replaced by a true `end_at` column the day that ships.
 */
function formatEventRange(iso: string): string {
  const start = new Date(iso)
  const end = new Date(start.getTime() + 75 * 60 * 1000)
  const tz = Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
    .formatToParts(start)
    .find((p) => p.type === 'timeZoneName')?.value ?? ''
  const datePart = start.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
  const startTime = start
    .toLocaleTimeString('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
    .replace(' ', '')
  const endTime = end
    .toLocaleTimeString('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
    .replace(' ', '')
  return `${datePart} ${startTime} – ${endTime} ${tz}`
}

/**
 * Calendar event card — left date block + title row + time row +
 * attendee stack on the right + three-dot menu. Mirrors the
 * screenshot's calendar entry exactly.
 */
function CalendarEventCard({
  title,
  dueDate,
  attendees,
}: {
  title: string
  dueDate: string
  attendees: string[]
}) {
  const date = new Date(dueDate)
  const day = String(date.getDate()).padStart(2, '0')
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' })

  return (
    <li
      className="rounded-xl border px-4 py-3 flex items-center gap-4"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
      }}
    >
      {/* Date block — the "00 / Wed" stamp on the left. Slightly
          larger than the doc-row icons so it carries the visual
          weight the screenshot shows. */}
      <div
        className="flex flex-col items-center justify-center rounded-lg h-14 w-14 shrink-0"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <span
          className="text-[20px] font-bold tabular-nums leading-none"
          style={{ color: 'var(--text-primary)' }}
        >
          {day}
        </span>
        <span
          className="text-[10px] font-semibold uppercase tracking-wider mt-1"
          style={{ color: 'var(--text-muted)' }}
        >
          {weekday}
        </span>
      </div>

      {/* Title + time stack. */}
      <div className="flex-1 min-w-0">
        <div
          className="text-[13.5px] font-semibold truncate"
          style={{ color: 'var(--text-primary)' }}
          title={title}
        >
          {title}
        </div>
        <div
          className="mt-1 inline-flex items-center gap-1.5 text-[12px]"
          style={{ color: 'var(--text-muted)' }}
        >
          <Clock size={12} strokeWidth={1.75} />
          {formatEventRange(dueDate)}
        </div>
      </div>

      {/* Attendees stack — 3 visible avatars + "+N" overflow chip. */}
      <AttendeesStack names={attendees} visible={3} />

      {/* Three-dot menu — overflow actions. */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
              aria-label="Event actions"
            >
              <MoreHorizontal size={14} strokeWidth={1.75} />
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            className="text-[12.5px] cursor-pointer"
            onClick={() => toast.info('Event details ship next.')}
          >
            Open
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-[12.5px] cursor-pointer"
            onClick={() =>
              toast.info('Invite-management ships with the comms backend.')
            }
          >
            Manage attendees
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-[12.5px] cursor-pointer"
            style={{ color: '#C0392B' }}
            onClick={() => toast.info('Event delete ships next.')}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
