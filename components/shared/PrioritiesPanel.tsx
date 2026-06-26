'use client'

/**
 * PrioritiesPanel
 * ---------------
 * Dashboard card that lists prioritised entities, grouped by level
 * (High → Medium → Low). Used in two places:
 *
 *   - Personal dashboard: scope="user" — only the current user's
 *     priorities show, since these are *their* working set.
 *   - Firm dashboard:     scope="firm" — every priority anyone in
 *     the firm has flagged, so partners can see the overall
 *     pressure across matters.
 *
 * The card always renders all three level buckets so the user sees
 * the structure even when a bucket is empty; an empty bucket
 * collapses to a one-line "nothing flagged here" hint.
 *
 * Empty overall? A friendly empty-state CTA explains how to flag
 * something — points users at the star button on a case / client.
 */

import { useMemo } from 'react'
import Link from 'next/link'
import { Star, ArrowRight } from '@phosphor-icons/react'
import { Card, CardTitle } from '@/components/ui/card'
import {
  usePriorityStore,
  type PriorityLevel,
  type PriorityEntityType,
  type PriorityRecord,
} from '@/stores/priority.store'
import { PRIORITY_STYLE } from './PriorityButton'

interface PrioritiesPanelProps {
  /**
   * `'user'` filters to the current user's priorities; `'firm'`
   * shows the union of everyone's. Today firm = all records since
   * we don't have a firm scope on the persisted records, but the
   * shape is ready for that filter the moment it lands.
   */
  scope: 'user' | 'firm'
  /** When `scope='user'`, the current user's id. Ignored for firm. */
  userId?: string
}

const LEVEL_ORDER: PriorityLevel[] = ['high', 'medium', 'low']

/** Compact labels for the header per-level summary. */
const LEVEL_SHORT: Record<PriorityLevel, string> = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
}

export function PrioritiesPanel({ scope, userId }: PrioritiesPanelProps) {
  // Re-render hook: subscribe only to a stable primitive — the
  // store's `revision` counter, bumped on every setter call. The
  // actual records list is read fresh from the store inside the
  // `useMemo` via `getState()`. This pattern avoids the
  // "getServerSnapshot should be cached" warnings that fire when a
  // selector returns an object whose identity differs between
  // SSR's initial `{}` and CSR's hydrated map.
  const revision = usePriorityStore((s) => s.revision)

  // Apply scope. Sort within each level by most-recently-updated so
  // freshly-flagged items float to the top.
  const grouped = useMemo(() => {
    const out: Record<PriorityLevel, PriorityRecord[]> = {
      high: [],
      medium: [],
      low: [],
    }
    const recordsMap = usePriorityStore.getState().records
    for (const r of Object.values(recordsMap)) {
      if (scope === 'user' && r.userId !== userId) continue
      out[r.level].push(r)
    }
    for (const level of LEVEL_ORDER) {
      out[level].sort((a, b) =>
        a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0,
      )
    }
    return out
    // `revision` bumps on any setter — covers adds, removes, AND
    // same-key level changes (re-flagging medium → high).
  }, [revision, scope, userId])

  const totalCount = grouped.high.length + grouped.medium.length + grouped.low.length

  // Empty overall: collapse the whole card to a single slim line rather
  // than render a tall empty box. Keeps a light day's dashboard quiet.
  if (totalCount === 0) {
    return (
      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4">
          <Star size={15} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
          <CardTitle className="text-base shrink-0">
            {scope === 'user' ? 'Your priorities' : 'Firm-wide priorities'}
          </CardTitle>
          <span className="text-[12.5px] truncate" style={{ color: 'var(--text-muted)' }}>
            {scope === 'user'
              ? '— star a case or client to flag it.'
              : '— nothing flagged across the firm yet.'}
          </span>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Star
            size={15}
            strokeWidth={1.75}
            style={{ color: 'var(--text-secondary)' }}
          />
          <CardTitle className="text-base">
            {scope === 'user' ? 'Your priorities' : 'Firm-wide priorities'}
          </CardTitle>
        </div>
        {/* Per-level summary so empty buckets are accounted for without
            spending a full row on each one. */}
        <div className="flex items-center gap-2 shrink-0">
          {LEVEL_ORDER.map((level, i) => (
            <span key={level} className="flex items-center gap-2">
              {i > 0 && (
                <span style={{ color: 'var(--border-strong)' }} aria-hidden>
                  ·
                </span>
              )}
              <span className="flex items-center gap-1">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: PRIORITY_STYLE[level].color }}
                />
                <span
                  className="text-[11.5px] font-medium tabular-nums"
                  style={{
                    color:
                      grouped[level].length > 0
                        ? 'var(--text-secondary)'
                        : 'var(--text-muted)',
                  }}
                >
                  {LEVEL_SHORT[level]} {grouped[level].length}
                </span>
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="px-3 pb-3">
        <ul className="flex flex-col gap-3">
          {LEVEL_ORDER.map((level) => {
            // Only render buckets that actually have records — empty
            // levels are already reflected in the header summary.
            if (grouped[level].length === 0) return null
            return (
              <LevelBucket key={level} level={level} records={grouped[level]} />
            )
          })}
        </ul>
      </div>
    </Card>
  )
}

/**
 * One level group — small section label + a list of priority rows.
 * Only rendered for levels that have at least one record; empty levels
 * are summarised in the card header instead.
 */
function LevelBucket({
  level,
  records,
}: {
  level: PriorityLevel
  records: PriorityRecord[]
}) {
  const style = PRIORITY_STYLE[level]
  return (
    <li className="flex flex-col gap-1">
      <div className="px-3 pt-1 flex items-center gap-1.5">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: style.color }}
        />
        <span
          className="text-[11.5px] font-semibold uppercase tracking-wider"
          style={{ color: style.color }}
        >
          {style.label}
        </span>
        <span
          className="text-[11px] tabular-nums"
          style={{ color: 'var(--text-muted)' }}
        >
          · {records.length}
        </span>
      </div>
      <ul className="flex flex-col">
        {records.map((r) => (
          <PriorityRow key={`${r.entityType}:${r.entityId}`} record={r} />
        ))}
      </ul>
    </li>
  )
}

/**
 * One row in the panel — label + entity-type chip + click-through
 * to the relevant detail page. We don't show the timestamp; the
 * sort order already encodes recency.
 */
function PriorityRow({ record }: { record: PriorityRecord }) {
  const href = detailHrefFor(record.entityType, record.entityId)
  const typeLabel =
    record.entityType === 'case'
      ? 'Case'
      : record.entityType === 'client'
        ? 'Client'
        : 'Invoice'
  // Cases sometimes carry a tracked court date in metadata — surface
  // it inline so the personal panel reads "case · 4 Jun" without a
  // detail-page click.
  const dateHint = formatDateHint(record.metadata?.next_court_date)
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--surface-overlay)]"
      >
        <div className="min-w-0">
          <div
            className="text-[13.5px] font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {record.label}
          </div>
          <div
            className="text-[12px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {typeLabel}
            {dateHint ? ` · ${dateHint}` : ''}
          </div>
        </div>
        <ArrowRight
          size={13}
          strokeWidth={1.75}
          style={{ color: 'var(--text-muted)' }}
        />
      </Link>
    </li>
  )
}

/**
 * Map entity type to its detail page. Centralised so a future
 * route rename only touches this one switch.
 */
function detailHrefFor(type: PriorityEntityType, id: string): string {
  if (type === 'case') return `/cases/${id}`
  if (type === 'client') return `/clients/${id}`
  if (type === 'invoice') return `/billing/${id}`
  return '/dashboard'
}

/**
 * Short date hint shown next to the entity type. Drops the year
 * when it matches the current year to keep the line compact.
 */
function formatDateHint(value: string | number | null | undefined): string {
  if (!value) return ''
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return ''
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric'
  return d.toLocaleDateString('en-GB', opts)
}
