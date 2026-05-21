'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui.store'
import { useDeleteClient } from '@/hooks/use-clients'
import { useDeleteCase } from '@/hooks/use-cases'
import { useDeleteTask } from '@/hooks/use-tasks'
import { useDeleteDocument } from '@/hooks/use-documents'
import { useDeleteInvoice } from '@/hooks/use-invoices'
import { Spinner } from '@/components/shared/Spinner'
import { toast } from 'sonner'

export function DeleteDialog() {
  const { modal, closeModal } = useUIStore()
  const deleteClient = useDeleteClient()
  const deleteCase = useDeleteCase()
  const deleteTask = useDeleteTask()
  const deleteDocument = useDeleteDocument()
  const deleteInvoice = useDeleteInvoice()

  const isOpen = modal?.type === 'confirmDelete'
  if (!isOpen) return null

  const { entity, id, name } = modal

  const mutationMap: Record<string, { mutateAsync: (id: string) => Promise<void>; isPending: boolean }> = {
    client: deleteClient,
    case: deleteCase,
    task: deleteTask,
    document: deleteDocument,
    invoice: deleteInvoice,
  }

  const mutation = mutationMap[entity]
  if (!mutation) return null

  const handleDelete = async () => {
    try {
      await mutation.mutateAsync(id)
      toast.success(`${entity.charAt(0).toUpperCase() + entity.slice(1)} deleted`)
      closeModal()
    } catch {
      toast.error(`Failed to delete ${entity}`)
    }
  }

  return (
    <Dialog open onOpenChange={closeModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading" style={{ color: 'var(--navy)' }}>
            Delete {entity}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <><Spinner size={14} /> Deleting...</> : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
