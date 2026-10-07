'use client'

/**
 * The grouped attention list with its filter bar and empty state.
 * Suspends on the attention feed; reads filters straight from the store
 * so picking a diary day or category re-renders this section alone.
 */

import { useMemo } from 'react'
import { ClockCountdown, Plus, SealCheck, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { startOfDay, useAttentionItems, type AttentionItem } from '@/hooks/use-attention-feed'
import { useDeadlines } from '@/hooks/use-deadlines'
import { PAST_DUE_FOCUS, useDeadlineEngineStore } from '@/stores/deadline-engine.store'
import { KIND_META } from '../_lib/attention-meta'
import { useAttentionActions } from '../_hooks/use-attention-actions'
import { AttentionTimeline } from './AttentionTimeline'
import { AttentionListSkeleton } from './skeletons'

export function AttentionList() {
  const { items, snoozedCount, ready, now } = useAttentionItems()
  const kindFilter = useDeadlineEngineStore((s) => s.kindFilter)
  const focusDay = useDeadlineEngineStore((s) => s.focusDay)
  const showSnoozed = useDeadlineEngineStore((s) => s.showSnoozed)
  const busyKey = useDeadlineEngineStore((s) => s.busyKey)
  const setKindFilter = useDeadlineEngineStore((s) => s.setKindFilter)
  const setFocusDay = useDeadlineEngineStore((s) => s.setFocusDay)
  const toggleShowSnoozed = useDeadlineEngineStore((s) => s.toggleShowSnoozed)
  const openCreate = useDeadlineEngineStore((s) => s.openCreate)
  const openEdit = useDeadlineEngineStore((s) => s.openEdit)
  const setPendingDelete = useDeadlineEngineStore((s) => s.setPendingDelete)
  const { complete, snooze, unsnooze } = useAttentionActions()

  // Full deadline records back the edit dialog; the feed only carries
  // the fields the list displays.
  const { data: deadlines } = useDeadlines('Pending')
  const deadlineById = useMemo(() => new Map((deadlines ?? []).map((d) => [d.id, d])), [deadlines])

  const visible = useMemo(
    () =>
      items.filter((i) => {
        if (kindFilter && i.kind !== kindFilter) return false
        if (focusDay === PAST_DUE_FOCUS) return i.bucket === 'overdue'
        if (focusDay !== null) return i.bucket !== 'overdue' && startOfDay(i.dueAt) === focusDay
        return true
      }),
    [items, kindFilter, focusDay],
  )

  if (!ready) return <AttentionListSkeleton />

  const filtered = kindFilter !== null || focusDay !== null

  const handleEdit = (item: AttentionItem) => {
    const deadline = deadlineById.get(item.id)
    if (deadline) openEdit(deadline)
  }

  return (
    <div>
      {(filtered || snoozedCount > 0) && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {filtered && (
            <span className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
              Showing {visible.length} of {items.length}
            </span>
          )}
          {kindFilter && (
            <FilterChip label={KIND_META[kindFilter].plural} onClear={() => setKindFilter(null)} />
          )}
          {focusDay !== null && (
            <FilterChip
              label={
                focusDay === PAST_DUE_FOCUS
                  ? 'Past due'
                  : new Date(focusDay).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
              }
              onClear={() => setFocusDay(null)}
            />
          )}
          {snoozedCount > 0 && (
            <button
              type="button"
              onClick={toggleShowSnoozed}
              aria-pressed={showSnoozed}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors hover:bg-[var(--surface-overlay)]"
              style={{
                borderColor: showSnoozed ? 'var(--gold)' : 'var(--border-default)',
                color: showSnoozed ? 'var(--gold-dark)' : 'var(--text-secondary)',
              }}
            >
              <ClockCountdown size={12} weight="bold" />
              {showSnoozed ? 'Hide' : 'Show'} {snoozedCount} deferred
            </button>
          )}
        </div>
      )}

      {visible.length > 0 ? (
        <AttentionTimeline
          items={visible}
          now={now}
          busyKey={busyKey}
          onComplete={complete}
          onEdit={handleEdit}
          onDelete={setPendingDelete}
          onSnooze={snooze}
          onUnsnooze={unsnooze}
        />
      ) : (
        <EmptyList filtered={filtered} onAdd={openCreate} />
      )}
    </div>
  )
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-[11.5px] font-semibold"
      style={{ background: 'var(--gold-muted)', color: 'var(--gold-dark)' }}
    >
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear ${label} filter`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-[rgba(201,151,43,0.2)]"
      >
        <X size={10} weight="bold" />
      </button>
    </span>
  )
}

function EmptyList({ filtered, onAdd }: { filtered: boolean; onAdd: () => void }) {
  return (
    <div
      className="rounded-2xl border border-dashed px-6 py-14 text-center"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <span
        className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl"
        style={{ background: 'var(--accent-today-tint)' }}
      >
        <SealCheck size={20} weight="fill" style={{ color: 'var(--gold-dark)' }} />
      </span>
      <p className="mt-3 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        {filtered ? 'Nothing matches this view' : 'Your docket is clear'}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        {filtered
          ? 'Clear the filters to see everything that needs attention.'
          : 'Deadlines, hearings, court dates, tasks and invoices due in the next thirty days are listed here automatically.'}
      </p>
      {!filtered && (
        <Button variant="outline" className="mt-4 rounded-lg" onClick={onAdd}>
          <Plus size={13} weight="bold" />
          Add a deadline
        </Button>
      )}
    </div>
  )
}
