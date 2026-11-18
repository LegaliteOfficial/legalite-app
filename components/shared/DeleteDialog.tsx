'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useUIStore } from '@/stores/ui.store'
import { useDeleteClient } from '@/hooks/use-clients'
import { useDeleteCase } from '@/hooks/use-cases'
import { useDeleteTask } from '@/hooks/use-tasks'
import { useDeleteDocument } from '@/hooks/use-documents'
import { useDeleteInvoice } from '@/hooks/use-invoices'
import { ConfirmDialogView } from '@/components/shared/ConfirmDialog'

// What the database actually does on delete (see the ON DELETE rules in the
// backend migrations). Only stated where it is known.
const CONSEQUENCES: Record<string, string[]> = {
  client: [
    'Their cases, invoices and messages are deleted with them',
    'Documents, tasks and events stay, without the client link',
  ],
  case: [
    'The case team assignments are removed',
    'Documents, tasks and events stay, unlinked from the case',
  ],
}

// Deletes that take other records with them ask the user to type a word.
const TYPE_TO_CONFIRM: Record<string, string> = { client: 'delete' }

/**
 * Delete confirmation driven by the UI store's `confirmDelete` modal. Runs
 * the matching mutation inside the animated confirm dialog.
 */
export function DeleteDialog() {
  const { modal, closeModal } = useUIStore()
  const deleteClient = useDeleteClient()
  const deleteCase = useDeleteCase()
  const deleteTask = useDeleteTask()
  const deleteDocument = useDeleteDocument()
  const deleteInvoice = useDeleteInvoice()

  const isOpen = modal?.type === 'confirmDelete'
  // Keep the last request so the dialog still has content while it animates out.
  const [last, setLast] = useState<Extract<typeof modal, { type: 'confirmDelete' }> | null>(null)
  if (isOpen && modal !== last) setLast(modal)
  const current = isOpen ? modal : last
  if (!current) return null

  const { entity, id, name } = current
  const mutationMap: Record<string, { mutateAsync: (id: string) => Promise<void> }> = {
    client: deleteClient,
    case: deleteCase,
    task: deleteTask,
    document: deleteDocument,
    invoice: deleteInvoice,
  }
  const mutation = mutationMap[entity]
  if (!mutation) return null
  const Entity = entity.charAt(0).toUpperCase() + entity.slice(1)

  return (
    <ConfirmDialogView
      key={`${entity}:${id}`}
      open={isOpen}
      tone="danger"
      title={`Delete this ${entity}?`}
      description={
        <>
          <strong style={{ color: 'var(--navy)' }}>{name}</strong> will be permanently deleted. This cannot be undone.
        </>
      }
      details={CONSEQUENCES[entity]}
      requireText={TYPE_TO_CONFIRM[entity]}
      confirmLabel={`Delete ${entity}`}
      successLabel={`${Entity} deleted`}
      action={async () => {
        try {
          await mutation.mutateAsync(id)
          toast.success(`${Entity} deleted`)
        } catch (err) {
          toast.error(`Failed to delete ${entity}`)
          throw err
        }
      }}
      onCancel={closeModal}
      onDone={closeModal}
      onOpenChangeComplete={(open) => {
        if (!open) setLast(null)
      }}
    />
  )
}
