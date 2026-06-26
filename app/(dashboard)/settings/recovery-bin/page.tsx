'use client'

/**
 * Recovery bin — composition root.
 *
 * Owns: the two destructive confirmations (permanent delete of one
 * item, and empty-the-whole-bin). The list state lives in the page-state
 * hook; the deleted-item data lives in the local persisted store.
 *
 * Restore is intentionally one-click (it's the safe, reversible-ish
 * action); permanent deletion is gated behind a confirm.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { Spinner } from '@/components/shared/Spinner'
import {
  useRecoveryBinStore,
  type DeletedItem,
} from '@/stores/recovery-bin-local.store'
import { KIND_LABEL } from './_constants'
import { RecoveryBinHeader } from './_components/RecoveryBinHeader'
import { RecoveryBinToolbar } from './_components/RecoveryBinToolbar'
import { RecoveryBinTable } from './_components/RecoveryBinTable'
import { EmptyState } from './_components/EmptyState'
import { ConfirmDialog } from './_components/ConfirmDialog'
import { useRecoveryBinState } from './_hooks/use-recovery-bin-state'

export default function RecoveryBinPage() {
  const state = useRecoveryBinState()
  const restoreItem = useRecoveryBinStore((s) => s.restoreItem)
  const purgeItem = useRecoveryBinStore((s) => s.purgeItem)
  const purgeAll = useRecoveryBinStore((s) => s.purgeAll)

  // Pending confirmations: a single item to purge, or the empty-bin flag.
  const [toPurge, setToPurge] = useState<DeletedItem | null>(null)
  const [emptyOpen, setEmptyOpen] = useState(false)

  const handleRestore = (item: DeletedItem) => {
    restoreItem(item.id)
    toast.success(`${KIND_LABEL[item.kind]} restored — “${item.title}”.`)
  }

  const handleConfirmPurge = () => {
    if (!toPurge) return
    purgeItem(toPurge.id)
    toast.success(`Permanently deleted “${toPurge.title}”.`)
  }

  const handleEmptyBin = () => {
    purgeAll()
    toast.success('Recovery bin emptied.')
  }

  const isFiltered = state.activeTab !== 'all' || state.query.trim() !== ''

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ background: 'var(--surface-page)' }}
    >
      <RecoveryBinHeader
        binCount={state.binCount}
        onEmptyBin={() => setEmptyOpen(true)}
      />

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
          boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
        }}
      >
        <RecoveryBinToolbar
          activeTab={state.activeTab}
          onTabChange={state.changeTab}
          query={state.query}
          onQueryChange={state.changeQuery}
        />

        {state.isLoading ? (
          <div
            className="flex items-center justify-center gap-2 py-16"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Spinner size={16} /> <span className="text-sm">Loading bin…</span>
          </div>
        ) : state.total === 0 ? (
          <EmptyState filtered={isFiltered} />
        ) : (
          <RecoveryBinTable
            rows={state.items}
            onRestore={handleRestore}
            onPurge={setToPurge}
          />
        )}
      </div>

      <ConfirmDialog
        open={toPurge !== null}
        onOpenChange={(open) => !open && setToPurge(null)}
        title="Delete permanently"
        description={
          <>
            Permanently delete <strong>{toPurge?.title}</strong>? This cannot be
            undone.
          </>
        }
        confirmLabel="Delete permanently"
        onConfirm={handleConfirmPurge}
      />

      <ConfirmDialog
        open={emptyOpen}
        onOpenChange={setEmptyOpen}
        title="Empty recovery bin"
        description={
          <>
            Permanently delete all {state.binCount} item
            {state.binCount === 1 ? '' : 's'} in the bin? This cannot be undone.
          </>
        }
        confirmLabel="Empty bin"
        onConfirm={handleEmptyBin}
      />
    </div>
  )
}
