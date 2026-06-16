'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretDown,
  CaretLeft,
  CaretRight,
  Columns,
  DownloadSimple,
  HighlighterCircle,
  Link as LinkIcon,
  List,
  ListNumbers,
  MagnifyingGlass,
  Pause,
  Play,
  Plus,
  TextB,
  TextItalic,
  TextUnderline,
  ArrowUUpLeft,
  ArrowUUpRight,
  X,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapUnderline from '@tiptap/extension-underline'
import TiptapHighlight from '@tiptap/extension-highlight'
import TiptapLink from '@tiptap/extension-link'
import TiptapPlaceholder from '@tiptap/extension-placeholder'
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
import { useClient } from '@/hooks/use-clients'
import { useAuthStore } from '@/stores/auth.store'
import { PagerBtn } from '../PagerBtn'
import { GhostDialogBtn, PrimaryDialogBtn } from '../DialogButtons'

// ── Notes tab ──────────────────────────────────────────────────────────

const NOTE_TIME_FILTERS = ['All', 'With time', 'Without time'] as const
type NoteTimeFilter = (typeof NOTE_TIME_FILTERS)[number]

type NoteColumnId =
  | 'recorded_time'
  | 'date'
  | 'subject'
  | 'note'
  | 'author'
  | 'notifications'

interface NoteColumn {
  id: NoteColumnId
  label: string
  defaultVisible: boolean
}

const NOTE_COLUMNS: NoteColumn[] = [
  { id: 'recorded_time', label: 'Recorded time', defaultVisible: true },
  { id: 'date', label: 'Date', defaultVisible: true },
  { id: 'subject', label: 'Subject', defaultVisible: true },
  { id: 'note', label: 'Note', defaultVisible: true },
  { id: 'author', label: 'Author', defaultVisible: true },
  { id: 'notifications', label: 'Notifications', defaultVisible: true },
]

/**
 * Notes tab body. Mirrors the reference contact-scoped Notes view:
 *
 *   - Card label "Notes" + "New note" gold primary button.
 *   - Toolbar: All / With time / Without time pill toggle (filters
 *     by whether the note has a recorded-time entry attached) plus a
 *     keyword search and Columns popover.
 *   - Body: table or empty state. We don't have a Notes table on the
 *     backend yet, so this currently lands on the empty state until
 *     that migration ships.
 *   - Footer: paging + Expand rows + Export.
 *
 * The "New note" button opens a dialog with a Subject, a rich-text
 * Note area, a File-note-to (Matter/IdentificationCard) toggle, a contact
 * picker, a Date, an optional Recorded time entry, and a
 * Notifications picker.
 */
export function NotesTab({
  contact,
}: {
  contact: NonNullable<ReturnType<typeof useClient>['data']>
}) {
  const [timeFilter, setTimeFilter] = useState<NoteTimeFilter>('All')
  const [search, setSearch] = useState('')
  const [visibleCols, setVisibleCols] = useState<Set<NoteColumnId>>(
    () =>
      new Set(NOTE_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )
  const [expandRows, setExpandRows] = useState(false)
  const [newNoteOpen, setNewNoteOpen] = useState(false)
  // `timeFilter` is held in state but doesn't filter anything yet
  // because the Notes table doesn't exist. Suppresses the unused-var
  // lint without leaking the placeholder into runtime.
  void timeFilter

  return (
    <section
      className="rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Card label + New note button. */}
      <div
        className="px-6 pt-5 pb-4 border-b flex items-center justify-between gap-4"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <h2
          className="text-[15px] font-semibold inline-flex items-center"
          style={{ color: 'var(--text-primary)' }}
        >
          Notes
          <span
            className="ml-3 inline-block h-[2px] w-12 rounded-full"
            style={{ background: 'var(--gold)' }}
            aria-hidden
          />
        </h2>
        <button
          type="button"
          onClick={() => setNewNoteOpen(true)}
          className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap"
          style={{
            background: 'var(--gold)',
            color: 'var(--navy)',
            boxShadow:
              '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--gold-dark, #B0831F)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--gold)'
          }}
        >
          New note
        </button>
      </div>

      {/* Toolbar */}
      <div
        className="px-6 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div
          className="inline-flex rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--border-default)' }}
        >
          {NOTE_TIME_FILTERS.map((t) => {
            const active = timeFilter === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTimeFilter(t)}
                className="px-3 h-9 text-[12.5px] font-medium transition-colors cursor-pointer"
                style={{
                  background: active
                    ? 'var(--surface-sunken)'
                    : 'var(--surface-card)',
                  color: active
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                }}
              >
                {t}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-56">
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
          <NoteColumnsPopover
            visible={visibleCols}
            onChange={setVisibleCols}
          />
        </div>
      </div>

      {/* Body — currently always empty until the Notes table lands. */}
      <NoNotesEmptyState onNewNote={() => setNewNoteOpen(true)} />

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-t"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-1">
          <PagerBtn onClick={() => { }} disabled aria-label="First page">
            <CaretDoubleLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => { }} disabled aria-label="Previous page">
            <CaretLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => { }} disabled aria-label="Next page">
            <CaretRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => { }} disabled aria-label="Last page">
            <CaretDoubleRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <span
            className="ml-2 text-[12px] tabular-nums"
            style={{ color: 'var(--text-muted)' }}
          >
            No results found
          </span>
        </div>
        <div className="flex items-center gap-3">
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

          <Button
            variant="outline"
            size="sm"
            disabled
            onClick={() => toast.info('Notes export ships next.')}
          >
            <DownloadSimple size={13} strokeWidth={1.75} />
            Export
          </Button>
        </div>
      </div>

      <NewNoteDialog
        open={newNoteOpen}
        onOpenChange={setNewNoteOpen}
        contact={contact}
      />
    </section>
  )
}

/**
 * Empty state for the Notes tab. Reuses the same composition family
 * (custom inline SVG of a note card with a pen + "+" badge) as the
 * other contact-detail empty states.
 */
function NoNotesEmptyState({ onNewNote }: { onNewNote: () => void }) {
  return (
    <div className="py-14 px-6 text-center">
      <div className="mx-auto mb-6 w-[180px]" aria-hidden>
        <NoNotesIllustration />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        No results found
      </p>
      <p
        className="mt-1 text-[12.5px] max-w-md mx-auto"
        style={{ color: 'var(--text-muted)' }}
      >
        Capture call summaries, meeting notes, and matter updates so
        nothing falls through the cracks.
      </p>
      <div className="mt-5">
        <Button size="sm" onClick={onNewNote}>
          <Plus size={13} strokeWidth={2} />
          New note
        </Button>
      </div>
    </div>
  )
}

/**
 * Inline SVG illustration for the Notes empty state — a stylised
 * notepad with three text lines and a small pen overlapping the
 * bottom-right corner, plus the same blue "+" badge used by the
 * other empty states in this file.
 *
 * Same 220×180 viewBox, navy outline, white paper, and accent badge
 * as Documents / Bank accounts / Communications / Bills.
 */
function NoNotesIllustration() {
  const PAPER = '#FFFFFF'
  const STROKE = '#1F2A44'
  const TEXT_LINE = '#C7D2DD'
  const SHADOW = 'rgba(13, 27, 42, 0.08)'
  const PEN_BARREL = '#1E88E5'
  const PEN_TIP = '#1F2A44'
  const BADGE_FILL = '#1E88E5'
  const BADGE_PLUS = '#FFFFFF'

  return (
    <svg
      viewBox="0 0 220 180"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      role="img"
      aria-label="No notes illustration"
    >
      <ellipse cx="110" cy="160" rx="68" ry="5" fill={SHADOW} />

      {/* Notepad — single rounded rectangle, drawn with a slight
          counter-clockwise tilt for visual interest. */}
      <g transform="rotate(-3 110 90)">
        {/* Top binder strip — darker stripe with three "rings". */}
        <rect
          x="42"
          y="32"
          width="136"
          height="118"
          rx="10"
          ry="10"
          fill={PAPER}
          stroke={STROKE}
          strokeWidth="3"
        />
        <rect
          x="42"
          y="32"
          width="136"
          height="14"
          fill="#E0E7EF"
        />
        <line
          x1="42"
          y1="46"
          x2="178"
          y2="46"
          stroke={STROKE}
          strokeWidth="2"
        />
        <circle cx="68" cy="39" r="2" fill={STROKE} />
        <circle cx="110" cy="39" r="2" fill={STROKE} />
        <circle cx="152" cy="39" r="2" fill={STROKE} />

        {/* Text lines — three rows on the notepad body. */}
        <line
          x1="58"
          y1="68"
          x2="162"
          y2="68"
          stroke={TEXT_LINE}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="58"
          y1="84"
          x2="148"
          y2="84"
          stroke={TEXT_LINE}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="58"
          y1="100"
          x2="158"
          y2="100"
          stroke={TEXT_LINE}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="58"
          y1="116"
          x2="124"
          y2="116"
          stroke={TEXT_LINE}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* Pen — drawn outside the rotated group so the badge sits
          flat. Pen barrel is sky blue with a navy tip; sits at a
          ~30° angle overlapping the lower-right corner of the pad. */}
      <g transform="rotate(35 150 132)">
        <rect
          x="116"
          y="128"
          width="52"
          height="8"
          rx="2"
          fill={PEN_BARREL}
          stroke={STROKE}
          strokeWidth="2"
        />
        <path
          d="M168 128 L176 132 L168 136 Z"
          fill={PEN_TIP}
          stroke={STROKE}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <line
          x1="124"
          y1="128"
          x2="124"
          y2="136"
          stroke={STROKE}
          strokeWidth="2"
        />
      </g>

      {/* "+" badge — bottom-right, identical pattern to the other
          empty-state illustrations. */}
      <circle cx="184" cy="142" r="16" fill={BADGE_FILL} />
      <line
        x1="184"
        y1="134"
        x2="184"
        y2="150"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="176"
        y1="142"
        x2="192"
        y2="142"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Columns popover for the Notes tab — same staged-changes pattern
 * as the rest of the column pickers in this file. Actions is fixed;
 * the rest are toggleable.
 */
function NoteColumnsPopover({
  visible,
  onChange,
}: {
  visible: Set<NoteColumnId>
  onChange: (next: Set<NoteColumnId>) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<NoteColumnId>>(new Set(visible))
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

  const toggle = (id: NoteColumnId) => {
    const next = new Set(draft)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setDraft(next)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (!open) setDraft(new Set(visible))
          setOpen(!open)
        }}
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
            width: 260,
          }}
        >
          <div className="p-4 max-h-[320px] overflow-y-auto">
            <ul className="space-y-1.5">
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
                  Actions
                </span>
              </li>
              {NOTE_COLUMNS.map((c) => {
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
            <Button
              size="sm"
              onClick={() => {
                onChange(draft)
                setOpen(false)
              }}
            >
              Update columns
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * "New note" dialog. Follows the standard pattern:
 *   - Subject (required-ish text)
 *   - Note: a rich-text style block. The toolbar is a row of icon
 *     buttons (TextB / TextItalic / TextUnderline / Highlight / Ordered list /
 *     Bullet list / Link / Undo / Redo) sitting above a textarea.
 *     Today the toolbar buttons are visual-only — the editor uses
 *     a plain textarea until the Tiptap version drift is resolved.
 *   - File note to… Matter / IdentificationCard pill toggle (IdentificationCard-default
 *     since this dialog is reached from a contact page).
 *   - IdentificationCard picker (locked to the current contact today).
 *   - Date (defaults to today).
 *   - Recorded time — optional time entry with the duration input
 *     and the gold play button (timer is a future enhancement).
 *   - Notifications — chip-list of firm users (auto-populated with
 *     the current user as a starting point).
 *   - Footer: Save note / Cancel.
 *
 * Persistence: notes table doesn't exist yet — Save toasts and
 * closes for now. The local state collects all the structured
 * fields so the migration ships a complete payload.
 */
function NewNoteDialog({
  open,
  onOpenChange,
  contact,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  contact: NonNullable<ReturnType<typeof useClient>['data']>
}) {
  // Pull the signed-in user's name so we can default-notify them on
  // every new note. Falls back to a stub label when auth hasn't
  // hydrated yet (e.g. on the very first SSR pass).
  const currentUserName = useAuthStore((s) => s.user?.name) || 'You'

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [fileTo, setFileTo] = useState<'matter' | 'contact'>('contact')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [recordedTime, setRecordedTime] = useState('')
  const [notifyUsers, setNotifyUsers] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Reset every open so the previous draft doesn't bleed across sessions.
  useEffect(() => {
    if (open) {
      setSubject('')
      setBody('')
      setFileTo('contact')
      setDate(new Date().toISOString().slice(0, 10))
      setRecordedTime('')
      // Default-notify the current user so the author is always
      // in the loop. They can remove themselves if they don't want
      // a notification.
      setNotifyUsers([currentUserName])
    }
  }, [open, currentUserName])

  const canSave = subject.trim().length > 0 && !submitting

  const handleSave = async () => {
    if (!canSave) return
    setSubmitting(true)
    try {
      // Persistence stub — Notes table lands later.
      await new Promise((r) => setTimeout(r, 250))
      toast.success(`Note "${subject}" saved.`)
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[760px] p-0 overflow-hidden rounded-2xl"
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
            New note
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 max-h-[70vh] overflow-y-auto space-y-5">
          {/* Subject */}
          <div>
            <Label
              htmlFor="note-subject"
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Subject
            </Label>
            <input
              id="note-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-10 rounded-lg border px-3 text-[13px]"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
              }}
              autoFocus
            />
          </div>

          {/* Note (rich text) */}
          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Note
            </Label>
            <NoteEditor value={body} onChange={setBody} />
          </div>

          {/* File note to + IdentificationCard picker — split row. */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                className="text-[12px] font-semibold mb-1.5 block"
                style={{ color: 'var(--text-primary)' }}
              >
                File note to…
              </Label>
              <div
                className="inline-flex rounded-lg border overflow-hidden"
                style={{ borderColor: 'var(--border-default)' }}
              >
                {([
                  { value: 'matter', label: 'Matter' },
                  { value: 'contact', label: 'Contact' },
                ] as const).map((opt) => {
                  const active = fileTo === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFileTo(opt.value)}
                      className="px-4 h-9 text-[12.5px] font-medium transition-colors cursor-pointer"
                      style={{
                        background: active
                          ? 'var(--surface-sunken)'
                          : 'var(--surface-card)',
                        color: active
                          ? 'var(--text-primary)'
                          : 'var(--text-muted)',
                      }}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <Label
                className="text-[12px] font-semibold mb-1.5 block"
                style={{ color: 'var(--text-primary)' }}
              >
                {fileTo === 'matter' ? 'Matter *' : 'Contact *'}
              </Label>
              <div className="relative">
                <select
                  value={contact.id}
                  disabled
                  className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-not-allowed"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-primary)',
                    colorScheme: 'light',
                  }}
                >
                  <option value={contact.id}>
                    {contact.full_name}
                    {contact.email ? ` (${contact.email})` : ''}
                  </option>
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

          {/* Date */}
          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Date
            </Label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-lg border px-3 text-[13px]"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
                colorScheme: 'light',
                width: 220,
              }}
            />
          </div>

          {/* Recorded time — duration input + live stopwatch. */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--border-soft)' }}>
            <div
              className="text-[13px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Recorded time
            </div>
            <p
              className="mt-0.5 text-[12px]"
              style={{ color: 'var(--text-muted)' }}
            >
              Add a time entry to this note
            </p>
            <div className="mt-3 flex items-center gap-3">
              <input
                value={recordedTime}
                onChange={(e) => setRecordedTime(e.target.value)}
                placeholder="1h 12m, 1:12…"
                className="flex-1 max-w-[260px] h-10 rounded-lg border px-3 text-[13px]"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                }}
              />
              <Stopwatch onCommit={(formatted) => setRecordedTime(formatted)} />
            </div>
          </div>

          {/* Notifications */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--border-soft)' }}>
            <div
              className="text-[13px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Notifications
            </div>
            <p
              className="mt-0.5 text-[12px]"
              style={{ color: 'var(--text-muted)' }}
            >
              Select firm users to receive notifications about this note.
            </p>
            <div className="mt-3">
              <NotificationsPicker
                value={notifyUsers}
                onChange={setNotifyUsers}
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
            disabled={!canSave}
            onClick={handleSave}
            label={submitting ? 'Saving…' : 'Save note'}
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
 * Real rich-text editor backed by Tiptap. Renders the reference icon
 * toolbar above a `contenteditable` surface; every button is wired
 * to a Tiptap command and lights up with a gold-tinted background
 * when the cursor is sitting inside that mark/format.
 *
 * Active extensions:
 *   - StarterKit  → paragraph, bold, italic, strike, lists, history
 *   - TextUnderline   → <u> mark
 *   - Highlight   → <mark> mark (multi-colour off; single yellow)
 *   - Link        → <a> mark with safe-URL sanitisation
 *   - Placeholder → "Type something" prompt when the doc is empty
 *
 * Bridges to the parent via a single `value` (HTML string) +
 * `onChange` prop so the dialog can persist a single field without
 * leaking Tiptap internals.
 */
function NoteEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TiptapUnderline,
      TiptapHighlight.configure({ multicolor: false }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      TiptapPlaceholder.configure({ placeholder: 'Type something' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'tiptap-editor block w-full min-h-[140px] px-3 py-3 text-[13px] outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Keep external resets (dialog re-open, programmatic clears) in
  // sync with the editor's internal doc.
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const promptForLink = () => {
    if (!editor) return
    const current = editor.getAttributes('link').href as string | undefined
    const next = window.prompt('URL', current ?? 'https://')
    if (next === null) return
    if (next === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: next })
      .run()
  }

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: 'var(--border-default)',
        background: 'var(--surface-card)',
      }}
    >
      <div
        className="flex items-center gap-1 px-2 py-1.5 border-b"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <ToolbarBtn
          label="Bold"
          active={editor?.isActive('bold')}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <TextB size={14} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Italic"
          active={editor?.isActive('italic')}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <TextItalic size={14} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Underline"
          active={editor?.isActive('underline')}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <TextUnderline size={14} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Highlight"
          active={editor?.isActive('highlight')}
          onClick={() => editor?.chain().focus().toggleHighlight().run()}
        >
          <HighlighterCircle size={14} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarSep />
        <ToolbarBtn
          label="Ordered list"
          active={editor?.isActive('orderedList')}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListNumbers size={14} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Bullet list"
          active={editor?.isActive('bulletList')}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List size={14} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarSep />
        <ToolbarBtn
          label="Link"
          active={editor?.isActive('link')}
          onClick={promptForLink}
        >
          <LinkIcon size={14} strokeWidth={2} />
        </ToolbarBtn>
        <span className="ml-auto inline-flex items-center gap-1">
          <ToolbarBtn
            label="Undo"
            disabled={!editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <ArrowUUpLeft size={14} strokeWidth={2} />
          </ToolbarBtn>
          <ToolbarBtn
            label="Redo"
            disabled={!editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <ArrowUUpRight size={14} strokeWidth={2} />
          </ToolbarBtn>
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

function ToolbarBtn({
  onClick,
  label,
  children,
  active,
  disabled,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
}) {
  // Active state uses a gold-tinted background so the user can see
  // at a glance whether the cursor is sitting inside that mark. The
  // disabled state (e.g. Undo when there's nothing to undo) just
  // greys out the icon without changing the hit target.
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active ?? undefined}
      disabled={disabled}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        color: active ? 'var(--gold-dark)' : 'var(--text-muted)',
        background: active ? 'rgba(201,151,43,0.18)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        if (active) return
        e.currentTarget.style.background = 'var(--surface-sunken)'
        e.currentTarget.style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        if (active) return
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-muted)'
      }}
    >
      {children}
    </button>
  )
}

function ToolbarSep() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-px mx-1"
      style={{ background: 'var(--border-soft)' }}
    />
  )
}

/**
 * Stub list of firm users used by the Notifications picker. The
 * current authenticated user is folded in at render time via the
 * `useAuthStore`. Once a real `useFirmUsers` hook ships, swap this
 * constant for the live list — the picker UI stays the same.
 */
const STUB_FIRM_USERS = [
  'Kofi Mensah',
  'Ama Owusu',
  'Yaw Boateng',
  'Akosua Asante',
  'Esi Annan',
] as const

/**
 * Multi-select dropdown for picking which firm users get notified
 * about a note. The trigger renders selected users as chips; an
 * arrow opens a popover with checkboxes for the full firm-user
 * list (including the signed-in user). Closes on click-outside.
 */
function NotificationsPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const currentUserName = useAuthStore((s) => s.user?.name) || 'You'
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Click-outside closes — same pattern as the other popovers in
  // this file.
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

  // Compose the full options list. `Set` de-dupes the current user
  // against the stub list in case they share a name.
  const allOptions = useMemo(() => {
    const set = new Set<string>()
    set.add(currentUserName)
    for (const u of STUB_FIRM_USERS) set.add(u)
    // Anything previously selected stays in the list (so removed
    // stub users don't vanish mid-edit).
    for (const v of value) set.add(v)
    return Array.from(set)
  }, [currentUserName, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allOptions
    return allOptions.filter((o) => o.toLowerCase().includes(q))
  }, [allOptions, query])

  const toggle = (name: string) => {
    onChange(
      value.includes(name) ? value.filter((v) => v !== name) : [...value, name],
    )
  }

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Trigger — chips + dropdown chevron. Acts as the "selected
          users" surface AND the open affordance.
          Rendered as a div (not a button) because each chip contains
          its own remove-× button; nested <button> elements are
          invalid HTML and trigger a hydration mismatch. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((v) => !v)
          }
        }}
        className="w-full flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-2 min-h-[40px] text-left cursor-pointer"
        style={{
          borderColor: open ? 'var(--gold)' : 'var(--border-default)',
          background: 'var(--surface-card)',
          boxShadow: open
            ? '0 0 0 2px rgba(201,151,43,0.16)'
            : 'none',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value.length === 0 ? (
          <span
            className="text-[13px] px-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Select firm users…
          </span>
        ) : (
          value.map((u) => (
            <span
              key={u}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium"
              style={{
                background: 'rgba(14,165,233,0.15)',
                color: '#0369A1',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {u}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggle(u)
                }}
                className="cursor-pointer"
                aria-label={`Remove ${u} from notifications`}
              >
                <X size={11} strokeWidth={2} />
              </button>
            </span>
          ))
        )}
        <CaretDown
          size={13}
          strokeWidth={1.75}
          className="ml-auto"
          style={{ color: 'var(--text-muted)' }}
        />
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border overflow-hidden"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
          }}
          role="listbox"
        >
          {/* MagnifyingGlass row — narrows the option list by name. */}
          <div
            className="px-3 py-2 border-b"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search firm users…"
              className="w-full h-8 text-[13px] bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
              autoFocus
            />
          </div>
          <ul className="max-h-[220px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li
                className="px-3 py-3 text-[12.5px]"
                style={{ color: 'var(--text-muted)' }}
              >
                No firm users match &ldquo;{query}&rdquo;.
              </li>
            ) : (
              filtered.map((name) => {
                const checked = value.includes(name)
                return (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => toggle(name)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] cursor-pointer transition-colors"
                      style={{
                        color: 'var(--text-primary)',
                        background: checked
                          ? 'rgba(201,151,43,0.08)'
                          : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (checked) return
                        e.currentTarget.style.background =
                          'var(--surface-sunken)'
                      }}
                      onMouseLeave={(e) => {
                        if (checked) return
                        e.currentTarget.style.background = 'transparent'
                      }}
                      role="option"
                      aria-selected={checked}
                    >
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                        style={{
                          borderColor: checked
                            ? 'var(--gold)'
                            : 'var(--border-default)',
                          background: checked
                            ? 'var(--gold)'
                            : 'transparent',
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
                      <span className="flex-1 truncate">
                        {name}
                        {name === currentUserName && (
                          <span
                            className="ml-2 text-[11.5px]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            (you)
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * Live stopwatch used by the New-note dialog (and reusable elsewhere
 * when we wire time tracking into the rest of the app). Counts up in
 * seconds, formats as `HH:MM:SS`, toggles play/pause on the gold
 * pill, and emits the human-readable duration (`Nh Nm Ns`) back to
 * the parent via `onCommit` so the user can hit "Save note" with a
 * sensible string baked into the recorded-time input.
 *
 * Implementation notes:
 *   - `setInterval` is intentionally 1s tick; cumulative drift is
 *     tolerable for short note durations and the simpler code is
 *     worth more than millisecond accuracy.
 *   - The interval is cleared on unmount AND on each effect re-run
 *     so paused timers don't leak.
 *   - "Commit" fires every tick while running, so the input stays in
 *     sync with the running clock and the user can hit Save mid-run
 *     without losing the elapsed time.
 */
function Stopwatch({
  onCommit,
}: {
  onCommit: (formatted: string) => void
}) {
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])

  // Push the latest reading up to the parent every tick (or pause).
  useEffect(() => {
    if (seconds === 0) return
    onCommit(humanizeDuration(seconds))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds])

  const display = formatClock(seconds)

  return (
    <button
      type="button"
      onClick={() => setRunning((v) => !v)}
      className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border text-[13px] font-medium tabular-nums cursor-pointer transition-colors"
      style={{
        borderColor: running ? 'var(--gold)' : 'var(--border-default)',
        background: running
          ? 'rgba(201,151,43,0.10)'
          : 'var(--surface-card)',
        color: 'var(--text-primary)',
      }}
      aria-pressed={running}
      aria-label={running ? 'Pause timer' : 'Start timer'}
    >
      <span
        className="inline-flex items-center justify-center h-5 w-5 rounded-full"
        style={{
          background: 'var(--gold)',
          color: 'var(--navy)',
        }}
        aria-hidden
      >
        {running ? (
          <Pause size={10} strokeWidth={2.5} />
        ) : (
          <Play size={10} strokeWidth={2.5} />
        )}
      </span>
      {display}
    </button>
  )
}

/** Format an integer second count as `HH:MM:SS`. */
function formatClock(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/**
 * Format a second count as a compact human-readable string —
 * e.g. `1h 12m`, `42s`, `2h 5m 30s`. Matches the reference "1h 12m, 1:12…"
 * placeholder so users see a familiar shape when the timer commits.
 */
function humanizeDuration(secs: number): string {
  if (secs <= 0) return ''
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 || parts.length === 0) parts.push(`${s}s`)
  return parts.join(' ')
}

