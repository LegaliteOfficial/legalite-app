'use client'

/**
 * Item actions for the Deadline engine — complete, snooze, unsnooze and
 * delete — with their toasts and busy state. Any section can call this
 * directly, so the page shell never has to pass handlers down (and never
 * re-renders when one runs).
 */

import { useCallback } from 'react'
import { toast } from 'sonner'
import {
  useCompleteAttentionItem,
  useSnoozeAttentionItem,
  useUnsnoozeAttentionItem,
  type AttentionItem,
} from '@/hooks/use-attention-feed'
import { useDeleteDeadline } from '@/hooks/use-deadlines'
import { useDeadlineEngineStore } from '@/stores/deadline-engine.store'
import { KIND_META } from '../_lib/attention-meta'

export function useAttentionActions() {
  const setBusyKey = useDeadlineEngineStore((s) => s.setBusyKey)
  const completeItem = useCompleteAttentionItem()
  const snoozeItem = useSnoozeAttentionItem()
  const unsnoozeItem = useUnsnoozeAttentionItem()
  const deleteDeadline = useDeleteDeadline()

  const run = useCallback(
    async (item: AttentionItem, action: () => Promise<unknown>, success: string, failure: string) => {
      setBusyKey(item.key)
      try {
        await action()
        toast.success(success)
        return true
      } catch {
        toast.error(failure)
        return false
      } finally {
        setBusyKey(null)
      }
    },
    [setBusyKey],
  )

  const complete = useCallback(
    (item: AttentionItem) => {
      const label = KIND_META[item.kind].label
      return run(
        item,
        () => completeItem.mutateAsync({ kind: item.kind, id: item.id }),
        item.kind === 'invoice' ? 'Invoice marked as paid.' : `${label} marked as done.`,
        `Unable to update ${label.toLowerCase()}.`,
      )
    },
    [run, completeItem],
  )

  const snooze = useCallback(
    (item: AttentionItem, until: Date) =>
      run(
        item,
        () => snoozeItem.mutateAsync({ kind: item.kind, id: item.id, until }),
        `We will bring this back ${until.toLocaleString('en-GB', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}.`,
        'Unable to set a reminder for this item.',
      ),
    [run, snoozeItem],
  )

  const unsnooze = useCallback(
    (item: AttentionItem) =>
      run(
        item,
        () => unsnoozeItem.mutateAsync({ kind: item.kind, id: item.id }),
        'Item restored to your list.',
        'Unable to restore this item.',
      ),
    [run, unsnoozeItem],
  )

  const remove = useCallback(
    (item: AttentionItem) =>
      run(item, () => deleteDeadline.mutateAsync(item.id), 'Deadline removed.', 'Unable to delete deadline.'),
    [run, deleteDeadline],
  )

  return { complete, snooze, unsnooze, remove, isDeleting: deleteDeadline.isPending }
}
