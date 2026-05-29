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
import { useClient, useCreateClient, useUpdateClient } from '@/hooks/use-clients'
import { clientSchema, type ClientFormData } from '@/schemas'
import { Spinner } from '@/components/shared/Spinner'
import { toast } from 'sonner'
import { useEffect } from 'react'

export function ClientForm() {
  const { modal, closeModal } = useUIStore()
  const isAdd = modal?.type === 'addClient'
  const isEdit = modal?.type === 'editClient'
  const editId = isEdit ? modal.id : undefined

  const { data: existing } = useClient(editId)
  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient()

  const form = useForm<ClientFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      client_code: '',
      full_name: '',
      email: '',
      phone: '',
      ghana_card: '',
      date_of_birth: '',
      address: '',
      status: 'Active',
      notes: '',
    },
  })

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        client_code: existing.client_code ?? '',
        full_name: existing.full_name ?? '',
        email: existing.email ?? '',
        phone: existing.phone ?? '',
        ghana_card: existing.ghana_card ?? '',
        date_of_birth: existing.date_of_birth ?? '',
        address: existing.address ?? '',
        status: existing.status ?? 'Active',
        notes: existing.notes ?? '',
      })
    }
    if (isAdd) {
      form.reset({
        client_code: '',
        full_name: '',
        email: '',
        phone: '',
        ghana_card: '',
        date_of_birth: '',
        address: '',
        status: 'Active',
        notes: '',
      })
    }
  }, [isEdit, isAdd, existing, form])

  if (!isAdd && !isEdit) return null

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (isEdit && editId) {
        await updateMutation.mutateAsync({ id: editId, data })
        toast.success('Client record updated successfully.')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('New client added to your directory.')
      }
      closeModal()
    } catch {
      toast.error(isEdit ? 'Unable to update client. Please try again.' : 'Unable to create client. Please try again.')
    }
  }

  return (
    <Dialog open onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-2xl" style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}>
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-heading text-lg" style={{ color: 'var(--navy)' }}>
            {isEdit ? 'Edit Client' : 'Add Client'}
          </DialogTitle>
          <p className="text-[12px] text-gray-400 mt-0.5">{isEdit ? 'Update the details below.' : 'Fill in the details below to create a new client.'}</p>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {/* Identity: name is the only required field. */}
          <div>
            <Label htmlFor="full_name" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Full Name *</Label>
            <Input id="full_name" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('full_name')} />
            {form.formState.errors.full_name && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.full_name.message}</p>
            )}
          </div>

          {/* Metadata: firm-defined ID + Active/Inactive status. */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_code" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Client ID</Label>
              <Input id="client_code" placeholder="e.g. LL-0001" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('client_code')} />
            </div>
            <div>
              <Label htmlFor="status" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(v) => v && form.setValue('status', v as ClientFormData['status'])}
              >
                <SelectTrigger className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact: how to reach them. */}
          <div className="border-t pt-4" style={{ borderColor: 'rgba(13,27,42,0.06)' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Email</Label>
                <Input id="email" type="email" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('email')} />
              </div>
              <div>
                <Label htmlFor="phone" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Phone</Label>
                <Input id="phone" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('phone')} />
              </div>
            </div>
          </div>

          {/* Personal: Ghana Card + Date of Birth. */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ghana_card" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Ghana Card</Label>
              <Input id="ghana_card" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('ghana_card')} />
            </div>
            <div>
              <Label htmlFor="date_of_birth" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Date of Birth</Label>
              <Input id="date_of_birth" type="date" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('date_of_birth')} />
            </div>
          </div>

          {/* Address — full-width, addresses run long. */}
          <div>
            <Label htmlFor="address" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Address</Label>
            <Input id="address" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('address')} />
          </div>

          {/* Notes — free-form. */}
          <div className="border-t pt-4" style={{ borderColor: 'rgba(13,27,42,0.06)' }}>
            <Label htmlFor="notes" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Notes</Label>
            <Textarea id="notes" rows={3} className="rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('notes')} />
          </div>
          <DialogFooter className="px-6 py-4 border-t" style={{ borderColor: 'var(--border)', background: 'rgba(13,27,42,0.015)' }}>
            <Button type="button" variant="outline" onClick={closeModal} className="rounded-lg text-[13px]">Cancel</Button>
            <Button type="submit" disabled={isPending} className="rounded-lg text-[13px] font-semibold shadow-sm" style={{ background: 'var(--gold)' }}>
              {isPending ? <><Spinner size={14} /> Saving...</> : isEdit ? 'Update' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
