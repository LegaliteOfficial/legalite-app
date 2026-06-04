'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useUIStore } from '@/stores/ui.store'
import { useInvoice, useCreateInvoice, useUpdateInvoice } from '@/hooks/use-invoices'
import { useClients } from '@/hooks/use-clients'
import { invoiceSchema, type InvoiceFormData } from '@/schemas'
import { Spinner } from '@/components/shared/Spinner'
import { toast } from 'sonner'
import { useEffect } from 'react'

export function InvoiceForm() {
  const { modal, closeModal } = useUIStore()
  const isAdd = modal?.type === 'addInvoice'
  const isEdit = modal?.type === 'editInvoice'
  const editId = isEdit ? modal.id : undefined

  const { data: existing } = useInvoice(editId)
  const { data: clients } = useClients()
  const createMutation = useCreateInvoice()
  const updateMutation = useUpdateInvoice()

  const form = useForm<InvoiceFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: {
      client_id: '', amount_ghs: 0, status: 'Draft', due_date: '', description: '',
    },
  })

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        client_id: existing.client_id ?? '',
        amount_ghs: Number(existing.amount_ghs) || 0,
        status: existing.status ?? 'Draft',
        due_date: existing.due_date ?? '',
        description: existing.description ?? '',
      })
    }
    if (isAdd) {
      form.reset({ client_id: '', amount_ghs: 0, status: 'Draft', due_date: '', description: '' })
    }
    // form.reset is stable; depending on existing.id avoids re-running on
    // every TanStack Query data re-emission (which would loop with form.reset).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, isAdd, existing?.id])

  if (!isAdd && !isEdit) return null

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      if (isEdit && editId) {
        await updateMutation.mutateAsync({ id: editId, data })
        toast.success('Invoice updated successfully.')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('New invoice created successfully.')
      }
      closeModal()
    } catch {
      toast.error(isEdit ? 'Unable to update invoice. Please try again.' : 'Unable to create invoice. Please try again.')
    }
  }

  return (
    <Dialog open onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-2xl" style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}>
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-heading text-lg" style={{ color: 'var(--navy)' }}>
            {isEdit ? 'Edit Invoice' : 'New Invoice'}
          </DialogTitle>
          <p className="text-[12px] text-gray-400 mt-0.5">{isEdit ? 'Update the details below.' : 'Fill in the details below to create a new invoice.'}</p>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div>
            <Label htmlFor="client_id" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Client *</Label>
            <Select value={form.watch('client_id')} onValueChange={(v) => v && form.setValue('client_id', v)}>
              <SelectTrigger className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }}><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {(clients ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.client_id && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.client_id.message}</p>
            )}
          </div>
          <div className="border-t pt-4" style={{ borderColor: 'rgba(13,27,42,0.06)' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount_ghs" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Amount (GHS) *</Label>
                <Input id="amount_ghs" type="number" step="0.01" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('amount_ghs', { valueAsNumber: true })} />
                {form.formState.errors.amount_ghs && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.amount_ghs.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="status" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Status</Label>
                <Select value={form.watch('status')} onValueChange={(v) => v && form.setValue('status', v as InvoiceFormData['status'])}>
                  <SelectTrigger className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="due_date" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Due Date</Label>
            <Input id="due_date" type="date" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('due_date')} />
          </div>
          <div className="border-t pt-4" style={{ borderColor: 'rgba(13,27,42,0.06)' }}>
            <Label htmlFor="description" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Description</Label>
            <Textarea id="description" rows={3} className="rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('description')} />
          </div>
          <DialogFooter className="px-6 py-4 border-t" style={{ borderColor: 'var(--border)', background: 'rgba(13,27,42,0.015)' }}>
            <Button type="button" variant="outline" onClick={closeModal} className="rounded-lg text-[13px]">Cancel</Button>
            <Button type="submit" disabled={isPending} className="rounded-lg text-[13px] font-semibold shadow-sm" style={{ background: 'var(--gold)' }}>
              {isPending ? <><Spinner size={14} /> Saving...</> : isEdit ? 'Update' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
