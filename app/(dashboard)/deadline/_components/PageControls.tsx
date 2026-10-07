'use client'

/**
 * Small connected pieces of the Deadline engine header and the page's
 * dialogs. Each subscribes to exactly the store slice or query it needs.
 */

import { useEffect } from 'react'
import { Plus } from '@phosphor-icons/react'
import { useApolloClient } from '@apollo/client/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/shared/Spinner'
import { QueryErrorBoundary } from '@/components/shared/QueryErrorBoundary'
import { useAttentionItems, type AttentionScope } from '@/hooks/use-attention-feed'
import { useDeadlineEngineStore } from '@/stores/deadline-engine.store'
import { useAttentionActions } from '../_hooks/use-attention-actions'
import { DeadlineFormDialog } from './DeadlineFormDialog'
import { HeaderSummarySkeleton } from './skeletons'

const POLL_MS = 5 * 60_000

/** One-line summary under the page title. Suspends on the feed. */
export function HeaderSummary() {
  const { activeItems, ready } = useAttentionItems()
  if (!ready) return <HeaderSummarySkeleton />
  const overdue = activeItems.filter((i) => i.bucket === 'overdue').length
  const n = activeItems.length
  return (
    <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
      {n === 0
        ? 'Deadlines, hearings and everything else that needs your attention.'
        : `${n} item${n === 1 ? '' : 's'} on your docket${overdue ? `, ${overdue} past due` : ''}.`}
    </p>
  )
}

export function ScopeToggle() {
  const value = useDeadlineEngineStore((s) => s.scope)
  const onChange = useDeadlineEngineStore((s) => s.setScope)
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

export function AddDeadlineButton() {
  const openCreate = useDeadlineEngineStore((s) => s.openCreate)
  return (
    <Button onClick={openCreate} size="lg" className="rounded-lg">
      <Plus size={14} weight="bold" />
      Add deadline
    </Button>
  )
}

/** Create / edit dialog plus the delete confirmation. */
export function DeadlineDialogs() {
  const form = useDeadlineEngineStore((s) => s.form)
  const closeForm = useDeadlineEngineStore((s) => s.closeForm)
  const pendingDelete = useDeadlineEngineStore((s) => s.pendingDelete)
  const setPendingDelete = useDeadlineEngineStore((s) => s.setPendingDelete)
  const { remove, isDeleting } = useAttentionActions()

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    if (await remove(pendingDelete)) setPendingDelete(null)
  }

  return (
    <>
      <DeadlineFormDialog key={form.key} open={form.open} deadline={form.deadline} onClose={closeForm} />

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
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? <><Spinner size={14} /> Deleting</> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Background refresh. Suspense queries do not poll, so this re-pulls the
 * feed in place every few minutes; the refetch updates the cache without
 * suspending, so sections update silently. Also clears view filters when
 * the user leaves the page.
 */
export function FeedLifecycle() {
  const client = useApolloClient()
  const resetView = useDeadlineEngineStore((s) => s.resetView)

  useEffect(() => {
    const id = setInterval(() => {
      void client.refetchQueries({ include: ['AttentionFeed'] })
    }, POLL_MS)
    return () => {
      clearInterval(id)
      resetView()
    }
  }, [client, resetView])

  return null
}

/**
 * Error boundary for a feed-backed section. "Try again" bumps the store's
 * retry nonce, which changes the suspense query key and starts a fresh
 * request instead of re-reading the cached error.
 */
export function FeedErrorBoundary({ label, children }: { label: string; children: React.ReactNode }) {
  const retry = useDeadlineEngineStore((s) => s.retry)
  return (
    <QueryErrorBoundary label={label} onRetry={retry}>
      {children}
    </QueryErrorBoundary>
  )
}
