'use client'

/**
 * Attention timeline — every item grouped into urgency bands (Overdue,
 * Today, Tomorrow, This week, On the horizon) along a vertical rail.
 * Each row leads with a date tile tinted by urgency, so the eye can scan
 * the left edge for red and amber without reading titles.
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
  formatDueTime,
  relativeLabel,
} from '../_lib/attention-meta'

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

export function AttentionTimeline({ items, now, ...actions }: AttentionTimelineProps) {
  const groups = BUCKET_ORDER.map((bucket) => ({
    bucket,
    rows: items.filter((i) => i.bucket === bucket),
  })).filter((g) => g.rows.length > 0)

  return (
    <div className="relative">
      {/* The rail. */}
      <div
        aria-hidden
        className="absolute left-[15px] top-3 bottom-3 w-px"
        style={{ background: 'linear-gradient(to bottom, var(--border-strong), var(--border-soft))' }}
      />
      <div className="space-y-7">
        {groups.map(({ bucket, rows }) => (
          <BucketGroup key={bucket} bucket={bucket} rows={rows} now={now} {...actions} />
        ))}
      </div>
    </div>
  )
}

function BucketGroup({
  bucket, rows, now, ...actions
}: { bucket: AttentionBucket; rows: AttentionItem[]; now: number } & Omit<AttentionTimelineProps, 'items' | 'now'>) {
  const meta = BUCKET_META[bucket]
  return (
    <section>
      <header className="relative mb-3 flex items-center gap-3">
        <span
          className="relative z-10 flex h-[31px] w-[31px] items-center justify-center rounded-full"
          style={{ background: 'var(--surface-page)' }}
        >
          <span
            className="flex h-[19px] w-[19px] items-center justify-center rounded-full"
            style={{ background: meta.tint, boxShadow: `0 0 0 3px var(--surface-page)` }}
          >
            <span
              className={bucket === 'overdue' ? 'h-2 w-2 rounded-full animate-pulse' : 'h-2 w-2 rounded-full'}
              style={{ background: meta.color }}
            />
          </span>
        </span>
        <h3 className="text-[13px] font-semibold tracking-tight" style={{ color: meta.color }}>
          {meta.label}
        </h3>
        <span
          className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold tabular-nums"
          style={{ background: meta.tint, color: meta.color }}
        >
          {rows.length}
        </span>
        <span className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
          {meta.hint}
        </span>
      </header>

      <ul className="space-y-2 pl-11">
        {rows.map((item) => (
          <AttentionRow key={item.key} item={item} now={now} {...actions} />
        ))}
      </ul>
    </section>
  )
}

function AttentionRow({
  item, now, busyKey, onComplete, onEdit, onDelete, onSnooze, onUnsnooze,
}: { item: AttentionItem; now: number } & Omit<AttentionTimelineProps, 'items' | 'now'>) {
  const kind = KIND_META[item.kind]
  const urgency = BUCKET_META[item.bucket]
  const d = new Date(item.dueAt)
  const busy = busyKey === item.key
  const snoozed = item.snoozedUntil !== null
  const completeLabel = item.kind === 'invoice' ? 'Mark paid' : 'Mark done'

  return (
    <li
      className="group relative flex items-stretch overflow-hidden rounded-2xl border transition-all hover:-translate-y-px"
      style={{
        background: 'var(--surface-card)',
        borderColor: item.bucket === 'overdue' && !snoozed ? 'rgba(192,57,43,0.22)' : 'var(--border-soft)',
        borderStyle: snoozed ? 'dashed' : 'solid',
        boxShadow: snoozed ? 'none' : 'var(--shadow-xs)',
        opacity: busy ? 0.55 : snoozed ? 0.7 : 1,
      }}
    >
      {/* Date tile */}
      <div
        className="flex w-[64px] shrink-0 flex-col items-center justify-center py-3"
        style={{ background: urgency.tint }}
      >
        <span
          className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
          style={{ color: urgency.color }}
        >
          {d.toLocaleDateString('en-GB', { month: 'short' })}
        </span>
        <span
          className="font-heading text-[22px] font-semibold leading-none tabular-nums"
          style={{ color: urgency.color }}
        >
          {d.getDate()}
        </span>
        <span className="mt-0.5 text-[10px] font-medium" style={{ color: urgency.color, opacity: 0.75 }}>
          {d.toLocaleDateString('en-GB', { weekday: 'short' })}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3.5 px-4 py-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: kind.tint }}
        >
          <kind.Icon size={17} weight="duotone" style={{ color: kind.color }} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: kind.color }}
            >
              {item.kind === 'event' && item.detail ? item.detail : kind.label}
            </span>
            {item.priority === 'High' && (
              <span
                className="rounded px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wider"
                style={{ background: 'rgba(192,57,43,0.10)', color: '#C0392B' }}
              >
                High
              </span>
            )}
          </div>
          <p
            className="mt-0.5 truncate text-[13.5px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {item.title}
          </p>
          <p className="mt-0.5 truncate text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
            {formatDueTime(item.dueAt, item.allDay)}
            {item.context && <> · {item.context}</>}
            {item.detail && item.kind !== 'event' && item.kind !== 'deadline' && <> · {item.detail}</>}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
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
                aria-label="Unsnooze"
                title="Unsnooze"
              >
                <BellRinging size={14} style={{ color: 'var(--gold-dark)' }} />
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={busy}
                  render={
                    <Button variant="ghost" size="icon-sm" aria-label="Snooze" title="Snooze">
                      <ClockCountdown size={14} style={{ color: 'var(--text-muted)' }} />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-[11px]">Remind me</DropdownMenuLabel>
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
                <Button variant="ghost" size="icon-sm" disabled={busy} onClick={() => onEdit(item)} aria-label="Edit deadline">
                  <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
                </Button>
                <Button variant="ghost" size="icon-sm" disabled={busy} onClick={() => onDelete(item)} aria-label="Delete deadline">
                  <Trash size={14} style={{ color: 'var(--text-muted)' }} />
                </Button>
              </>
            )}
            <Link
              href={item.href}
              aria-label="Open"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-overlay)]"
            >
              <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
            </Link>
          </div>
          {snoozed ? (
            <span
              className="min-w-[78px] rounded-full px-2.5 py-1 text-center text-[11px] font-semibold"
              style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}
              title={`Snoozed until ${formatDueTime(new Date(item.snoozedUntil!).getTime(), false)}`}
            >
              Snoozed
            </span>
          ) : (
            <span
              className="min-w-[78px] rounded-full px-2.5 py-1 text-center text-[11px] font-semibold tabular-nums"
              style={{ background: urgency.tint, color: urgency.color }}
            >
              {relativeLabel(item.dueAt, now)}
            </span>
          )}
        </div>
      </div>
    </li>
  )
}
