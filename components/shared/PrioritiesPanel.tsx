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
  /**
   * Compact (top of card only) vs full (all three buckets). The
   * personal-dashboard version uses 'full', firm uses 'full' too;
   * keeping the prop here lets us drop into compact mode for, e.g.,
   * a sidebar widget later.
   */
  variant?: 'full' | 'compact'
}

const LEVEL_ORDER: PriorityLevel[] = ['high', 'medium', 'low']

export function PrioritiesPanel({
  scope,
  userId,
  variant = 'full',
}: PrioritiesPanelProps) {
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

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Star
            size={15}
            strokeWidth={1.75}
            style={{ color: 'var(--text-secondary)' }}
          />
          <CardTitle className="text-base">
            {scope === 'user' ? 'Your priorities' : 'Firm-wide priorities'}
          </CardTitle>
        </div>
        {totalCount > 0 && (
          <span
            className="text-[12px] tabular-nums"
            style={{ color: 'var(--text-muted)' }}
          >
            {totalCount} flagged
          </span>
        )}
      </div>

      <div className="px-3 pb-3">
        {totalCount === 0 ? (
          <EmptyState scope={scope} />
        ) : (
          <ul className="flex flex-col gap-3">
            {LEVEL_ORDER.map((level) => {
              if (variant === 'compact' && grouped[level].length === 0) {
                return null
              }
              return (
                <LevelBucket
                  key={level}
                  level={level}
                  records={grouped[level]}
                />
              )
            })}
          </ul>
        )}
      </div>
    </Card>
  )
}

/**
 * One level group — small section label + a list of priority rows.
 * Empty buckets collapse to a single muted line so the visual
 * hierarchy of "high then medium then low" stays readable.
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
        {records.length > 0 && (
          <span
            className="text-[11px] tabular-nums"
            style={{ color: 'var(--text-muted)' }}
          >
            · {records.length}
          </span>
        )}
      </div>
      {records.length === 0 ? (
        <p
          className="px-3 py-1.5 text-[12.5px]"
          style={{ color: 'var(--text-muted)' }}
        >
          Nothing flagged {style.label.toLowerCase()}.
        </p>
      ) : (
        <ul className="flex flex-col">
          {records.map((r) => (
            <PriorityRow key={`${r.entityType}:${r.entityId}`} record={r} />
          ))}
        </ul>
      )}
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

/**
 * No priorities yet — explain how to set one rather than leaving
 * the card blank. Differentiates the copy slightly so the firm
 * view doesn't tell partners to "go set one yourself".
 */
function EmptyState({ scope }: { scope: 'user' | 'firm' }) {
  return (
    <div
      className="px-4 py-6 text-center rounded-lg border border-dashed"
      style={{
        borderColor: 'var(--border-soft)',
        color: 'var(--text-muted)',
      }}
    >
      <Star
        size={18}
        strokeWidth={1.5}
        className="mx-auto mb-2"
        style={{ color: 'var(--text-subtle)' }}
      />
      <p className="text-[13px]">
        {scope === 'user'
          ? 'Nothing flagged yet.'
          : 'No firm priorities flagged yet.'}
      </p>
      <p className="text-[12px] mt-1">
        {scope === 'user'
          ? 'Tap the star on a case or client to flag what matters most.'
          : "Anyone in the firm can flag a case or client; it'll surface here."}
      </p>
    </div>
  )
}
