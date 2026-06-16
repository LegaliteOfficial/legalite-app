'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretDown,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { PagerBtn } from '../PagerBtn'

// Self-contained module: column registry + popover + empty state +
// illustration all live here because they're not reused elsewhere.
// When the bank-accounts table ships and the body starts rendering
// real rows, this file is the obvious split point for a sub-folder.

type TxnColumnId =
  | 'date'
  | 'source_destination'
  | 'reference'
  | 'client'
  | 'matter'
  | 'funds_out'
  | 'funds_in'
  | 'running_balance'

interface TxnColumn {
  id: TxnColumnId
  label: string
  defaultVisible: boolean
}

/**
 * Every column defaults to visible — matches the all-checked state on
 * first open.
 */
const TXN_COLUMNS: TxnColumn[] = [
  { id: 'date', label: 'Date', defaultVisible: true },
  {
    id: 'source_destination',
    label: 'Source/Destination',
    defaultVisible: true,
  },
  { id: 'reference', label: 'Reference', defaultVisible: true },
  { id: 'client', label: 'Client', defaultVisible: true },
  { id: 'matter', label: 'Matter', defaultVisible: true },
  { id: 'funds_out', label: 'Funds out', defaultVisible: true },
  { id: 'funds_in', label: 'Funds in', defaultVisible: true },
  { id: 'running_balance', label: 'Running balance', defaultVisible: true },
]

/**
 * Transactions tab body. We don't yet have a bank-accounts table or a
 * ledger, so this whole tab is structurally complete but permanently
 * lands on the "No bank accounts found" empty state. The toolbar (date
 * range + Columns popover) and the table-shaped scaffold render so the
 * surface is ready to hold rows the moment the ledger ships.
 */
export function TransactionsTab({ contactId }: { contactId: string }) {
  void contactId // wired through for future ledger queries
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [visibleCols, setVisibleCols] = useState<Set<TxnColumnId>>(
    () =>
      new Set(TXN_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )

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
        className="px-6 pt-5 pb-4 border-b"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <h2
          className="text-[15px] font-semibold inline-flex items-center"
          style={{ color: 'var(--text-primary)' }}
        >
          Transactions
          <span
            className="ml-3 inline-block h-[2px] w-16 rounded-full"
            style={{ background: 'var(--gold)' }}
            aria-hidden
          />
        </h2>
      </div>

      <div
        className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-2">
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
              width: 160,
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
              width: 160,
            }}
            aria-label="To date"
          />
        </div>
        <TxnColumnsPopover visible={visibleCols} onChange={setVisibleCols} />
      </div>

      <NoBankAccountsEmptyState />

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
      </div>
    </section>
  )
}

// ── Columns popover ────────────────────────────────────────────────────────

function TxnColumnsPopover({
  visible,
  onChange,
}: {
  visible: Set<TxnColumnId>
  onChange: (next: Set<TxnColumnId>) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<TxnColumnId>>(new Set(visible))
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

  const toggle = (id: TxnColumnId) => {
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
          <div className="p-4 max-h-[360px] overflow-y-auto">
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
              {TXN_COLUMNS.map((c) => {
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

// ── Empty state ────────────────────────────────────────────────────────────

function NoBankAccountsEmptyState() {
  return (
    <div className="py-16 px-6 text-center">
      <div className="mx-auto mb-6 w-[180px]" aria-hidden>
        <NoBankAccountsIllustration />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        No bank accounts found
      </p>
      <p
        className="mt-1 text-[12.5px] max-w-md mx-auto"
        style={{ color: 'var(--text-muted)' }}
      >
        You don&rsquo;t have a bank account in the matter&rsquo;s currency
        yet. Create a bank account in this currency to start recording
        transactions.
      </p>
    </div>
  )
}

/**
 * Inline SVG of a stylised bank building sitting on a tilted card,
 * with a "+" badge in the bottom-right corner. Composition (z-order):
 * ground shadow → tilted card panel → bank silhouette (pediment,
 * cornice, four columns, base) → upright "+" badge.
 */
function NoBankAccountsIllustration() {
  const CARD_FILL = '#FFFFFF'
  const STROKE = '#1F2A44'
  const BANK_INTERIOR = '#E0E7EF'
  const SHADOW = 'rgba(13, 27, 42, 0.08)'
  const BADGE_FILL = '#1E88E5'
  const BADGE_PLUS = '#FFFFFF'

  return (
    <svg
      viewBox="0 0 220 180"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      role="img"
      aria-label="No bank accounts illustration"
    >
      <ellipse cx="110" cy="158" rx="68" ry="5" fill={SHADOW} />

      <g transform="rotate(-4 110 92)">
        <rect
          x="36"
          y="34"
          width="148"
          height="116"
          rx="10"
          ry="10"
          fill={CARD_FILL}
          stroke={STROKE}
          strokeWidth="3"
        />
        <path
          d="M70 70 L110 52 L150 70 Z"
          fill={CARD_FILL}
          stroke={STROKE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <rect
          x="65"
          y="70"
          width="90"
          height="6"
          rx="1.5"
          fill={CARD_FILL}
          stroke={STROKE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <rect
          x="72"
          y="82"
          width="10"
          height="34"
          rx="2"
          fill={BANK_INTERIOR}
          stroke={STROKE}
          strokeWidth="2.5"
        />
        <rect
          x="91"
          y="82"
          width="10"
          height="34"
          rx="2"
          fill={BANK_INTERIOR}
          stroke={STROKE}
          strokeWidth="2.5"
        />
        <rect
          x="110"
          y="82"
          width="10"
          height="34"
          rx="2"
          fill={BANK_INTERIOR}
          stroke={STROKE}
          strokeWidth="2.5"
        />
        <rect
          x="129"
          y="82"
          width="10"
          height="34"
          rx="2"
          fill={BANK_INTERIOR}
          stroke={STROKE}
          strokeWidth="2.5"
        />
        <rect
          x="62"
          y="120"
          width="96"
          height="8"
          rx="2"
          fill={CARD_FILL}
          stroke={STROKE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </g>

      <circle cx="178" cy="138" r="16" fill={BADGE_FILL} />
      <line
        x1="178"
        y1="130"
        x2="178"
        y2="146"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="170"
        y1="138"
        x2="186"
        y2="138"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
