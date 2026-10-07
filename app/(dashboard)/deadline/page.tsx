'use client'

/**
 * Deadline engine
 * ---------------
 * One place for everything that needs the user's attention before a
 * point in time: manual deadlines, tasks, calendar events, hearings,
 * case court dates and unpaid invoices, plus past events still waiting
 * on an outcome. Data comes from `useAttentionFeed`, which folds the
 * existing backend queries into a single chronological feed.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClockCountdown, Plus, SealCheck, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { Spinner } from '@/components/shared/Spinner'
import {
  startOfDay,
  useAttentionFeed,
  useCompleteAttentionItem,
  useSnoozeAttentionItem,
  useUnsnoozeAttentionItem,
  type AttentionItem,
  type AttentionKind,
  type AttentionScope,
} from '@/hooks/use-attention-feed'
import { useDeleteDeadline, type Deadline } from '@/hooks/use-deadlines'
import {
  checkAndNotifyDeadlines,
  disableNotifications,
  getNotificationPreference,
  isNotificationSupported,
  requestNotificationPermission,
} from '@/lib/notifications'
import { PressureHero, PAST_COLUMN, type DayFocus } from './_components/PressureHero'
import { AttentionTimeline } from './_components/AttentionTimeline'
import { NotificationsCard, OutcomePanel, SourceBreakdown } from './_components/SidePanels'
import { DeadlineFormDialog } from './_components/DeadlineFormDialog'
import { KIND_META } from './_lib/attention-meta'

export default function DeadlinePage() {
  const [scope, setScope] = useState<AttentionScope>('mine')
  const [showSnoozed, setShowSnoozed] = useState(false)
  const { items, awaitingOutcome, pendingDeadlines, summary, isLoading, now } = useAttentionFeed({
    scope,
    includeSnoozed: showSnoozed,
  })
  // Snoozed rows are listed when asked for, but never count as pressure.
  const activeItems = useMemo(() => items.filter((i) => !i.snoozedUntil), [items])
  const snoozedCount = summary?.snoozed ?? 0

  const [kindFilter, setKindFilter] = useState<AttentionKind | null>(null)
  const [focusDay, setFocusDay] = useState<DayFocus>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Deadline | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [pendingDelete, setPendingDelete] = useState<AttentionItem | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => getNotificationPreference())

  const deleteDeadline = useDeleteDeadline()
  const completeItem = useCompleteAttentionItem()
  const snoozeItem = useSnoozeAttentionItem()
  const unsnoozeItem = useUnsnoozeAttentionItem()

  useEffect(() => {
    if (notificationsEnabled && pendingDeadlines.length) {
      checkAndNotifyDeadlines(pendingDeadlines)
    }
  }, [pendingDeadlines, notificationsEnabled])

  const visible = useMemo(
    () =>
      items.filter((i) => {
        if (kindFilter && i.kind !== kindFilter) return false
        if (focusDay === PAST_COLUMN) return i.bucket === 'overdue'
        if (focusDay !== null) return i.bucket !== 'overdue' && startOfDay(i.dueAt) === focusDay
        return true
      }),
    [items, kindFilter, focusDay],
  )

  const handleToggleNotifications = useCallback(async () => {
    if (notificationsEnabled) {
      disableNotifications()
      setNotificationsEnabled(false)
      toast.success('Deadline notifications disabled.')
      return
    }
    const granted = await requestNotificationPermission()
    if (granted) {
      setNotificationsEnabled(true)
      toast.success('Deadline notifications enabled.')
    } else {
      toast.error('Notification permission was denied. Enable it in your browser settings.')
    }
  }, [notificationsEnabled])

  const handleComplete = useCallback(async (item: AttentionItem) => {
    const label = KIND_META[item.kind].label
    setBusyKey(item.key)
    try {
      await completeItem.mutateAsync({ kind: item.kind, id: item.id })
      toast.success(item.kind === 'invoice' ? 'Invoice marked as paid.' : `${label} marked as done.`)
    } catch {
      toast.error(`Unable to update ${label.toLowerCase()}.`)
    } finally {
      setBusyKey(null)
    }
  }, [completeItem])

  const handleSnooze = useCallback(async (item: AttentionItem, until: Date) => {
    setBusyKey(item.key)
    try {
      await snoozeItem.mutateAsync({ kind: item.kind, id: item.id, until })
      toast.success(`Snoozed until ${until.toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}.`)
    } catch {
      toast.error('Unable to snooze this item.')
    } finally {
      setBusyKey(null)
    }
  }, [snoozeItem])

  const handleUnsnooze = useCallback(async (item: AttentionItem) => {
    setBusyKey(item.key)
    try {
      await unsnoozeItem.mutateAsync({ kind: item.kind, id: item.id })
      toast.success('Item is back in your feed.')
    } catch {
      toast.error('Unable to unsnooze this item.')
    } finally {
      setBusyKey(null)
    }
  }, [unsnoozeItem])

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return
    setBusyKey(pendingDelete.key)
    try {
      await deleteDeadline.mutateAsync(pendingDelete.id)
      toast.success('Deadline removed.')
      setPendingDelete(null)
    } catch {
      toast.error('Unable to delete deadline.')
    } finally {
      setBusyKey(null)
    }
  }, [deleteDeadline, pendingDelete])

  const openCreate = () => { setEditing(null); setFormKey((k) => k + 1); setFormOpen(true) }
  const openEdit = (item: AttentionItem) => {
    if (!item.deadline) return
    setEditing(item.deadline)
    setFormKey((k) => k + 1)
    setFormOpen(true)
  }

  if (isLoading && items.length === 0) return <PageSkeleton />

  const overdue = activeItems.filter((i) => i.bucket === 'overdue').length
  const filtered = kindFilter !== null || focusDay !== null

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <PageHeader
          title="Deadline engine"
          description={
            activeItems.length === 0
              ? 'Everything that needs your attention, in one timeline.'
              : `${activeItems.length} item${activeItems.length === 1 ? '' : 's'} need attention${overdue ? `, ${overdue} overdue` : ''}.`
          }
          actions={
            <>
              <ScopeToggle value={scope} onChange={setScope} />
              <Button onClick={openCreate} size="lg" className="rounded-lg">
                <Plus size={14} weight="bold" />
                Add deadline
              </Button>
            </>
          }
        />

        <div className="mt-6">
          <PressureHero items={activeItems} now={now} focusDay={focusDay} onFocusDay={setFocusDay} />
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
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
                      focusDay === PAST_COLUMN
                        ? 'Overdue'
                        : new Date(focusDay).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
                    }
                    onClear={() => setFocusDay(null)}
                  />
                )}
                {snoozedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSnoozed((v) => !v)}
                    aria-pressed={showSnoozed}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors hover:bg-[var(--surface-overlay)]"
                    style={{
                      borderColor: showSnoozed ? 'var(--gold)' : 'var(--border-default)',
                      color: showSnoozed ? 'var(--gold-dark)' : 'var(--text-secondary)',
                    }}
                  >
                    <ClockCountdown size={12} weight="bold" />
                    {showSnoozed ? 'Hide' : 'Show'} {snoozedCount} snoozed
                  </button>
                )}
              </div>
            )}

            {visible.length > 0 ? (
              <AttentionTimeline
                items={visible}
                now={now}
                busyKey={busyKey}
                onComplete={handleComplete}
                onEdit={openEdit}
                onDelete={setPendingDelete}
                onSnooze={handleSnooze}
                onUnsnooze={handleUnsnooze}
              />
            ) : (
              <EmptyTimeline filtered={filtered} onAdd={openCreate} />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4">
            <OutcomePanel events={awaitingOutcome} now={now} />
            <SourceBreakdown items={activeItems} active={kindFilter} onToggle={setKindFilter} />
            {isNotificationSupported() && (
              <NotificationsCard enabled={notificationsEnabled} onToggle={handleToggleNotifications} />
            )}
          </aside>
        </div>

        <DeadlineFormDialog key={formKey} open={formOpen} deadline={editing} onClose={() => setFormOpen(false)} />

        <Dialog open={pendingDelete !== null} onOpenChange={(o) => { if (!o) setPendingDelete(null) }}>
          <DialogContent className="sm:max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg" style={{ color: 'var(--text-primary)' }}>
                Delete deadline?
              </DialogTitle>
            </DialogHeader>
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              &ldquo;{pendingDelete?.title}&rdquo; will be removed permanently.
            </p>
            <DialogFooter className="pt-3">
              <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteDeadline.isPending}>
                {deleteDeadline.isPending ? <><Spinner size={14} /> Deleting</> : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function ScopeToggle({ value, onChange }: { value: AttentionScope; onChange: (v: AttentionScope) => void }) {
  const options: { id: AttentionScope; label: string }[] = [
    { id: 'mine', label: 'Mine' },
    { id: 'firm', label: 'Whole firm' },
  ]
  return (
    <div
      role="radiogroup"
      aria-label="Feed scope"
      className="inline-flex h-10 items-center rounded-lg p-1"
      style={{ background: 'var(--surface-sunken)' }}
    >
      {options.map((o) => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className="h-8 rounded-md px-3 text-[12.5px] font-semibold transition-colors"
            style={{
              background: active ? 'var(--surface-card)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: active ? 'var(--shadow-xs)' : 'none',
            }}
          >
            {o.label}
          </button>
        )
      })}
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

function EmptyTimeline({ filtered, onAdd }: { filtered: boolean; onAdd: () => void }) {
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
        {filtered ? 'Nothing matches this view' : 'Your horizon is clear'}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        {filtered
          ? 'Clear the filters to see everything that needs attention.'
          : 'Tasks, hearings, court dates and invoices due in the next thirty days will appear here automatically.'}
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
