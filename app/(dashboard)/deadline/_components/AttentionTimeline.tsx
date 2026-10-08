'use client'

/**
 * Attention list — every item grouped into urgency sections (Past due,
 * Today, Tomorrow, This week, Later this month), each set out like a
 * ruled cause list: a diary date leaf, what the item is, the matter it
 * belongs to, and when it falls due in plain words.
 */

import Link from 'next/link'
import { ArrowUpRight, BellRinging, CheckCircle, ClockCountdown, Pencil, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  snoozePresets,
  type AttentionBucket,
  type AttentionItem,
} from '@/hooks/use-attention-feed'
import {
  BUCKET_META,
  BUCKET_ORDER,
  KIND_META,
  duePhrase,
  formatDueTime,
} from '../_lib/attention-meta'
import { DateLeaf } from './DateLeaf'

interface AttentionTimelineProps {
  items: AttentionItem[]
  now: number
  busyKey: string | null
  onComplete: (item: AttentionItem) => void
  onEdit: (item: AttentionItem) => void
  onDelete: (item: AttentionItem) => void
  onSnooze: (item: AttentionItem, until: Date) => void
  onUnsnooze: (item: AttentionItem) => void
}

type RowActions = Omit<AttentionTimelineProps, 'items' | 'now'>

export function AttentionTimeline({ items, now, ...actions }: AttentionTimelineProps) {
  const groups = BUCKET_ORDER.map((bucket) => ({
    bucket,
    rows: items.filter((i) => i.bucket === bucket),
  })).filter((g) => g.rows.length > 0)

  return (
    <div className="space-y-6">
      {groups.map(({ bucket, rows }) => (
        <BucketGroup key={bucket} bucket={bucket} rows={rows} now={now} {...actions} />
      ))}
    </div>
  )
}

function BucketGroup({
  bucket, rows, now, ...actions
}: { bucket: AttentionBucket; rows: AttentionItem[]; now: number } & RowActions) {
  const meta = BUCKET_META[bucket]
  return (
    <section>
      <header className="mb-2 flex items-baseline gap-2 px-1">
        <h3 className="font-heading text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {meta.label}
        </h3>
        <span className="text-[12.5px] font-medium tabular-nums" style={{ color: meta.color }}>
          {rows.length}
        </span>
        <span className="ml-auto text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {meta.hint}
        </span>
      </header>

      <ul
        className="overflow-hidden rounded-xl border"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border-default)',
          borderLeft: `3px solid ${meta.color}`,
        }}
      >
        {rows.map((item, i) => (
          <AttentionRow key={item.key} item={item} now={now} first={i === 0} {...actions} />
        ))}
      </ul>
    </section>
  )
}

function AttentionRow({
  item, now, first, busyKey, onComplete, onEdit, onDelete, onSnooze, onUnsnooze,
}: { item: AttentionItem; now: number; first: boolean } & RowActions) {
  const kind = KIND_META[item.kind]
  const urgency = BUCKET_META[item.bucket]
  const busy = busyKey === item.key
  const snoozed = item.snoozedUntil !== null
  const completeLabel = item.kind === 'invoice' ? 'Mark paid' : 'Mark done'

  return (
    <li
      className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-[var(--surface-card-hover)] sm:flex-nowrap"
      style={{
        borderTop: first ? 'none' : '1px solid var(--border-soft)',
        opacity: busy ? 0.55 : snoozed ? 0.65 : 1,
      }}
    >
      <DateLeaf ts={item.dueAt} tone={snoozed ? 'var(--text-subtle)' : urgency.color} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: kind.color }}>
          <kind.Icon size={13} weight="duotone" />
          <span>{item.kind === 'event' && item.detail ? item.detail : kind.label}</span>
          {item.priority === 'High' && item.kind !== 'hearing' && item.kind !== 'court' && (
            <span className="ml-1 text-[11px] font-semibold" style={{ color: '#C0392B' }}>
              High priority
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
          {item.title}
        </p>
        {(item.context || (item.detail && item.kind !== 'event' && item.kind !== 'deadline')) && (
          <p className="mt-0.5 truncate text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {[item.context, item.kind !== 'event' && item.kind !== 'deadline' ? item.detail : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {/* Phones: timing sits under the title instead of in a column. */}
        <p className="mt-1 text-[12.5px] font-semibold sm:hidden" style={{ color: snoozed ? 'var(--text-muted)' : urgency.color }}>
          {snoozed ? 'Reminder set' : duePhrase(item, now)}
        </p>
      </div>

      <div className="flex w-full shrink-0 items-center justify-end gap-3 sm:w-auto">
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {item.completable && (
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={busy}
              onClick={() => onComplete(item)}
              aria-label={completeLabel}
              title={completeLabel}
            >
              <CheckCircle size={15} style={{ color: '#2E7D4F' }} />
            </Button>
          )}
          {snoozed ? (
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={busy}
              onClick={() => onUnsnooze(item)}
              aria-label="Remind me now"
              title="Remind me now"
            >
              <BellRinging size={14} style={{ color: 'var(--gold-dark)' }} />
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={busy}
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Remind me later" title="Remind me later">
                    <ClockCountdown size={14} style={{ color: 'var(--text-muted)' }} />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-[11px]">Remind me later</DropdownMenuLabel>
                {snoozePresets(now).map((p) => (
                  <DropdownMenuItem
                    key={p.label}
                    onClick={() => onSnooze(item, p.until)}
                    className="text-[12.5px] cursor-pointer"
                  >
                    {p.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {item.kind === 'deadline' && (
            <>
              <Button variant="ghost" size="icon-sm" disabled={busy} onClick={() => onEdit(item)} aria-label="Edit deadline" title="Edit">
                <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
              </Button>
              <Button variant="ghost" size="icon-sm" disabled={busy} onClick={() => onDelete(item)} aria-label="Delete deadline" title="Delete">
                <Trash size={14} style={{ color: 'var(--text-muted)' }} />
              </Button>
            </>
          )}
          <Link
            href={item.href}
            aria-label="Open"
            title="Open"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-overlay)]"
          >
            <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
          </Link>
        </div>

        <div className="hidden w-[150px] text-right sm:block">
          {snoozed ? (
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              Reminder set for {formatDueTime(new Date(item.snoozedUntil!).getTime(), false)}
            </p>
          ) : (
            <p className="text-[12.5px] font-semibold leading-snug" style={{ color: urgency.color }}>
              {duePhrase(item, now)}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}
