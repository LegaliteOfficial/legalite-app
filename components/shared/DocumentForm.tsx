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
import { useDocument, useCreateDocument, useUpdateDocument } from '@/hooks/use-documents'
import { useClients } from '@/hooks/use-clients'
import { useCases } from '@/hooks/use-cases'
import { documentSchema, type DocumentFormData } from '@/schemas'
import { Spinner } from '@/components/shared/Spinner'
import { toast } from 'sonner'
import { useEffect } from 'react'

export function DocumentForm() {
  const { modal, closeModal } = useUIStore()
  const isAdd = modal?.type === 'addDocument'
  const isEdit = modal?.type === 'editDocument'
  const editId = isEdit ? modal.id : undefined

  const { data: existing } = useDocument(editId)
  const { data: clients } = useClients()
  const { data: cases } = useCases()
  const createMutation = useCreateDocument()
  const updateMutation = useUpdateDocument()

  const form = useForm<DocumentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(documentSchema) as any,
    defaultValues: {
      title: '', case_id: '', client_id: '', template_type: '',
      court: '', suit_number: '', parties: '', judge: '', content: '',
    },
  })

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        title: existing.title ?? '',
        case_id: existing.case_id ?? '',
        client_id: existing.client_id ?? '',
        template_type: existing.template_type ?? '',
        court: existing.court ?? '',
        suit_number: existing.suit_number ?? '',
        parties: existing.parties ?? '',
        judge: existing.judge ?? '',
        content: existing.content ?? '',
      })
    }
    if (isAdd) {
      form.reset({
        title: '', case_id: '', client_id: '', template_type: '',
        court: '', suit_number: '', parties: '', judge: '', content: '',
      })
    }
    // form.reset is stable; depending on existing.id avoids re-running on
    // every TanStack Query data re-emission (which would loop with form.reset).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, isAdd, existing?.id])

  if (!isAdd && !isEdit) return null

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = async (data: DocumentFormData) => {
    try {
      if (isEdit && editId) {
        await updateMutation.mutateAsync({ id: editId, data })
        toast.success('Document updated successfully.')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('New document created successfully.')
      }
      closeModal()
    } catch {
      toast.error(isEdit ? 'Unable to update document. Please try again.' : 'Unable to create document. Please try again.')
    }
  }

  return (
    <Dialog open onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-2xl" style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}>
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-heading text-lg" style={{ color: 'var(--navy)' }}>
            {isEdit ? 'Edit Document' : 'New Document'}
          </DialogTitle>
          <p className="text-[12px] text-gray-400 mt-0.5">{isEdit ? 'Update the details below.' : 'Fill in the details below to create a new document.'}</p>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div>
            <Label htmlFor="title" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Document Title *</Label>
            <Input id="title" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="border-t pt-4" style={{ borderColor: 'rgba(13,27,42,0.06)' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Client</Label>
                <Select value={form.watch('client_id')} onValueChange={(v) => v && form.setValue('client_id', v)}>
                  <SelectTrigger className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }}><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {(clients ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="case_id" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Case</Label>
                <Select value={form.watch('case_id')} onValueChange={(v) => v && form.setValue('case_id', v)}>
                  <SelectTrigger className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }}><SelectValue placeholder="Select case" /></SelectTrigger>
                  <SelectContent>
                    {(cases ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template_type" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Template Type</Label>
              <Input id="template_type" placeholder="e.g. Motion, Brief" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('template_type')} />
            </div>
            <div>
              <Label htmlFor="court" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Court</Label>
              <Input id="court" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('court')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="suit_number" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Suit Number</Label>
              <Input id="suit_number" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('suit_number')} />
            </div>
            <div>
              <Label htmlFor="judge" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Judge</Label>
              <Input id="judge" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('judge')} />
            </div>
          </div>
          <div>
            <Label htmlFor="parties" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Parties</Label>
            <Input id="parties" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('parties')} />
          </div>
          <div className="border-t pt-4" style={{ borderColor: 'rgba(13,27,42,0.06)' }}>
            <Label htmlFor="content" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Content</Label>
            <Textarea id="content" rows={4} className="rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('content')} />
          </div>
          <DialogFooter className="px-6 py-4 border-t" style={{ borderColor: 'var(--border)', background: 'rgba(13,27,42,0.015)' }}>
            <Button type="button" variant="outline" onClick={closeModal} className="rounded-lg text-[13px]">Cancel</Button>
            <Button type="submit" disabled={isPending} className="rounded-lg text-[13px] font-semibold shadow-sm" style={{ background: 'var(--gold)' }}>
              {isPending ? <><Spinner size={14} /> Saving...</> : isEdit ? 'Update' : 'Create Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
