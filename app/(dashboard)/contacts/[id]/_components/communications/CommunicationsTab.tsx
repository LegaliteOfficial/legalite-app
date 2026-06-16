'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretDown,
  CaretLeft,
  CaretRight,
  Columns,
  DownloadSimple,
  Envelope,
  Funnel,
  Phone,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PagerBtn } from '../PagerBtn'

const COMM_SUB_TABS = ['Logs', 'Secure messages', 'Client portals'] as const
type CommSubTab = (typeof COMM_SUB_TABS)[number]

const COMM_TYPE_FILTERS = ['All', 'Phone', 'Email'] as const
type CommTypeFilter = (typeof COMM_TYPE_FILTERS)[number]

const COMM_DATE_PRESETS = [
  'All dates',
  'Today',
  'This week',
  'This month',
  'This year',
] as const
type CommDatePreset = (typeof COMM_DATE_PRESETS)[number]

type CommColumnId =
  | 'recorded_time'
  | 'type'
  | 'date_time'
  | 'subject_body_attachment'
  | 'matter'
  | 'from'
  | 'to'
  | 'notifications'

interface CommColumn {
  id: CommColumnId
  label: string
  defaultVisible: boolean
}

const COMM_COLUMNS: CommColumn[] = [
  { id: 'recorded_time', label: 'Recorded time', defaultVisible: true },
  { id: 'type', label: 'Type', defaultVisible: true },
  { id: 'date_time', label: 'Date and time', defaultVisible: true },
  {
    id: 'subject_body_attachment',
    label: 'Subject, body and attachment',
    defaultVisible: true,
  },
  { id: 'matter', label: 'Matter', defaultVisible: true },
  { id: 'from', label: 'From', defaultVisible: true },
  { id: 'to', label: 'To', defaultVisible: true },
  { id: 'notifications', label: 'Notifications', defaultVisible: true },
]

/**
 * Communications tab body. Mirrors the reference contact-scoped
 * Communications view: sub-tabs (Logs / Secure messages / Client
 * portals) with Logs wired today; toolbar with All / Phone / Email
 * pills, date range, preset dropdown, keyword search, columns popover,
 * filters popover; empty state + paginated footer.
 *
 * The phone/email log table doesn't exist on the backend yet, so the
 * body permanently lands on the empty state. All controls are wired to
 * local state so the surface previews correctly.
 */
export function CommunicationsTab({ contactId }: { contactId: string }) {
  void contactId // wired through for future log queries

  const [subTab, setSubTab] = useState<CommSubTab>('Logs')
  const [typeFilter, setTypeFilter] = useState<CommTypeFilter>('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [datePreset, setDatePreset] = useState<CommDatePreset>('All dates')
  const [search, setSearch] = useState('')
  const [visibleCols, setVisibleCols] = useState<Set<CommColumnId>>(
    () =>
      new Set(COMM_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )
  const [expandRows, setExpandRows] = useState(false)
  void expandRows // reserved for the row-density toggle once logs render

  return (
    <section
      className="rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        className="px-6 py-3 flex items-end justify-between border-b gap-4 flex-wrap"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-end gap-1">
          {COMM_SUB_TABS.map((t) => (
            <CommSubTabButton
              key={t}
              active={subTab === t}
              onClick={() => {
                if (t === 'Logs') {
                  setSubTab(t)
                  return
                }
                toast.info(`${t} is coming next.`)
              }}
            >
              {t}
            </CommSubTabButton>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              toast.info('Notification settings ship with the comms backend.')
            }
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium cursor-pointer"
            style={{ color: 'var(--gold-dark)' }}
          >
            <Bell size={13} strokeWidth={1.75} />
            Notification settings
          </button>
          <CommNewDropdown />
        </div>
      </div>

      <div
        className="px-6 py-3 flex items-center gap-2 flex-wrap border-b"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div
          className="inline-flex rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--border-default)' }}
        >
          {COMM_TYPE_FILTERS.map((t) => {
            const active = typeFilter === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
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

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 rounded-lg border px-3 text-[13px]"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            colorScheme: 'light',
            width: 150,
          }}
          aria-label="From date"
        />
        <span aria-hidden style={{ color: 'var(--text-muted)' }}>
          –
        </span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 rounded-lg border px-3 text-[13px]"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            colorScheme: 'light',
            width: 150,
          }}
          aria-label="To date"
        />

        <div className="relative" style={{ width: 130 }}>
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as CommDatePreset)}
            className="w-full h-9 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
              colorScheme: 'light',
            }}
          >
            {COMM_DATE_PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <CaretDown
            size={12}
            strokeWidth={1.75}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
        </div>

        <div className="flex-1 min-w-[180px]">
          <Input
            placeholder="Filter by subject or body"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-[13px] rounded-lg"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
            }}
          />
        </div>

        <CommColumnsPopover visible={visibleCols} onChange={setVisibleCols} />
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.info('Advanced comm filters ship with the comms backend.')
          }
        >
          <Funnel size={13} strokeWidth={1.75} />
          Filters
          <CaretDown size={12} strokeWidth={1.75} />
        </Button>
      </div>

      <NoLogsEmptyState />

      <div
        className="flex items-center justify-between px-3 py-2.5 border-t"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-1">
          <PagerBtn onClick={() => {}} disabled aria-label="First page">
            <CaretDoubleLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => {}} disabled aria-label="Previous page">
            <CaretLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => {}} disabled aria-label="Next page">
            <CaretRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => {}} disabled aria-label="Last page">
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
            onClick={() => toast.info('Communications export ships next.')}
          >
            <DownloadSimple size={13} strokeWidth={1.75} />
            Export
          </Button>
        </div>
      </div>
    </section>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function CommSubTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative px-3 py-2 text-[13.5px] font-medium transition-colors cursor-pointer"
      style={{
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      }}
    >
      {children}
      {active && (
        <span
          className="absolute left-2 right-2 -bottom-px h-[2px] rounded-t"
          style={{ background: 'var(--gold)' }}
        />
      )}
    </button>
  )
}

function CommNewDropdown() {
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
              e.currentTarget.style.background = 'var(--gold-dark, #B0831F)'
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
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => toast.info('Phone log form is coming next.')}
          className="text-[12.5px] cursor-pointer"
        >
          <Phone size={12} strokeWidth={1.75} /> New phone log
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => toast.info('Email log form is coming next.')}
          className="text-[12.5px] cursor-pointer"
        >
          <Envelope size={12} strokeWidth={1.75} /> New email log
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CommColumnsPopover({
  visible,
  onChange,
}: {
  visible: Set<CommColumnId>
  onChange: (next: Set<CommColumnId>) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<CommColumnId>>(new Set(visible))
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

  const toggle = (id: CommColumnId) => {
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
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
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
              {COMM_COLUMNS.map((c) => {
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

function NoLogsEmptyState() {
  return (
    <div className="py-14 px-6 text-center">
      <div className="mx-auto mb-6 w-[180px]" aria-hidden>
        <NoLogsIllustration />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        No phone or email logs found.
      </p>
      <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        Keep track of every conversation.
      </p>
      <div className="mt-5 flex items-center justify-center gap-2">
        <Button
          size="sm"
          onClick={() => toast.info('Phone log form is coming next.')}
        >
          <Phone size={12} strokeWidth={1.75} />
          New phone log
        </Button>
        <Button
          size="sm"
          onClick={() => toast.info('Email log form is coming next.')}
        >
          <Envelope size={12} strokeWidth={1.75} />
          New email log
        </Button>
      </div>
    </div>
  )
}

/**
 * Inline SVG of two overlapping speech bubbles + "+" badge in the
 * bottom-right. Same 220×180 viewBox as the other tab empty-state
 * illustrations.
 */
function NoLogsIllustration() {
  const BUBBLE_FILL = '#FFFFFF'
  const STROKE = '#1F2A44'
  const DOT = '#9CA3AF'
  const SHADOW = 'rgba(13, 27, 42, 0.08)'
  const BADGE_FILL = '#1E88E5'
  const BADGE_PLUS = '#FFFFFF'

  return (
    <svg
      viewBox="0 0 220 180"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      role="img"
      aria-label="No phone or email logs illustration"
    >
      <ellipse cx="110" cy="158" rx="68" ry="5" fill={SHADOW} />
      <path
        d="
          M40 40
          h78
          a14 14 0 0 1 14 14
          v36
          a14 14 0 0 1 -14 14
          H72
          l-10 12
          l-2 -12
          H40
          a14 14 0 0 1 -14 -14
          V54
          a14 14 0 0 1 14 -14
          Z
        "
        fill={BUBBLE_FILL}
        stroke={STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="
          M102 68
          h64
          a14 14 0 0 1 14 14
          v38
          a14 14 0 0 1 -14 14
          h-22
          l8 14
          l-18 -14
          H102
          a14 14 0 0 1 -14 -14
          V82
          a14 14 0 0 1 14 -14
          Z
        "
        fill={BUBBLE_FILL}
        stroke={STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="118" cy="100" r="4" fill={DOT} />
      <circle cx="134" cy="100" r="4" fill={DOT} />
      <circle cx="150" cy="100" r="4" fill={DOT} />
      <circle cx="184" cy="140" r="16" fill={BADGE_FILL} />
      <line
        x1="184"
        y1="132"
        x2="184"
        y2="148"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="176"
        y1="140"
        x2="192"
        y2="140"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
