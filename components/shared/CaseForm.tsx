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
import { useCase, useCreateCase, useUpdateCase } from '@/hooks/use-cases'
import { useClients } from '@/hooks/use-clients'
import { caseSchema, type CaseFormData } from '@/schemas'
import { CASE_STAGES, PRACTICE_AREAS } from '@/lib/case-options'
import { Spinner } from '@/components/shared/Spinner'
import { toast } from 'sonner'
import { useEffect } from 'react'

export function CaseForm() {
  const { modal, closeModal } = useUIStore()
  const isAdd = modal?.type === 'addCase'
  const isEdit = modal?.type === 'editCase'
  const editId = isEdit ? modal.id : undefined

  const { data: existing } = useCase(editId)
  const { data: clients } = useClients()
  const createMutation = useCreateCase()
  const updateMutation = useUpdateCase()

  const form = useForm<CaseFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(caseSchema) as any,
    defaultValues: {
      title: '', client_id: '', court: '', suit_number: '', opposing_party: '',
      case_type: '', case_stage: '', assigned_lawyer: '', originating_lawyer: '',
      status: 'Open', next_court_date: '', date_opened: '', notes: '',
    },
  })

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        title: existing.title ?? '',
        client_id: existing.client_id ?? '',
        court: existing.court ?? '',
        suit_number: existing.suit_number ?? '',
        opposing_party: existing.opposing_party ?? '',
        case_type: existing.case_type ?? '',
        case_stage: existing.case_stage ?? '',
        assigned_lawyer: existing.assigned_lawyer ?? '',
        originating_lawyer: existing.originating_lawyer ?? '',
        status: existing.status ?? 'Open',
        next_court_date: existing.next_court_date ?? '',
        date_opened: existing.date_opened ?? '',
        notes: existing.notes ?? '',
      })
    }
    if (isAdd) {
      form.reset({
        title: '', client_id: '', court: '', suit_number: '', opposing_party: '',
        case_type: '', case_stage: '', assigned_lawyer: '', originating_lawyer: '',
        status: 'Open', next_court_date: '', date_opened: '', notes: '',
      })
    }
    // form.reset is stable; depending on existing.id avoids re-running on
    // every TanStack Query data re-emission (which would loop with form.reset).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, isAdd, existing?.id])

  if (!isAdd && !isEdit) return null

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = async (data: CaseFormData) => {
    try {
      if (isEdit && editId) {
        await updateMutation.mutateAsync({ id: editId, data })
        toast.success('Case record updated successfully.')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('New case opened successfully.')
      }
      closeModal()
    } catch {
      toast.error(isEdit ? 'Unable to update case. Please try again.' : 'Unable to open case. Please try again.')
    }
  }

  return (
    <Dialog open onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-2xl" style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}>
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-heading text-lg" style={{ color: 'var(--navy)' }}>
            {isEdit ? 'Edit Case' : 'Open New Case'}
          </DialogTitle>
          <p className="text-[12px] text-gray-400 mt-0.5">{isEdit ? 'Update the details below.' : 'Fill in the details below to create a new case.'}</p>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div>
            <Label htmlFor="title" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Case Title *</Label>
            <Input id="title" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="border-t pt-4" style={{ borderColor: 'rgba(13,27,42,0.06)' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Client *</Label>
                <Select value={form.watch('client_id')} onValueChange={(v) => v && form.setValue('client_id', v)}>
                  <SelectTrigger className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }}>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
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
              <div>
                <Label htmlFor="status" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Status</Label>
                <Select value={form.watch('status')} onValueChange={(v) => v && form.setValue('status', v as CaseFormData['status'])}>
                  <SelectTrigger className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="court" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Court</Label>
              <Input id="court" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('court')} />
            </div>
            <div>
              <Label htmlFor="suit_number" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Suit Number</Label>
              <Input id="suit_number" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('suit_number')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="opposing_party" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Opposing Party</Label>
              <Input id="opposing_party" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('opposing_party')} />
            </div>
            <div>
              <Label htmlFor="next_court_date" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Next Court Date</Label>
              <Input id="next_court_date" type="date" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('next_court_date')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="case_type" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Practice area</Label>
              <Select
                value={form.watch('case_type') ?? ''}
                onValueChange={(v) => v && form.setValue('case_type', v)}
              >
                <SelectTrigger
                  id="case_type"
                  className="h-10 rounded-lg text-[13px]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <SelectValue placeholder="Find a practice area" />
                </SelectTrigger>
                <SelectContent>
                  {PRACTICE_AREAS.map((pa) => (
                    <SelectItem key={pa} value={pa}>
                      {pa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="case_stage" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Case stage</Label>
              <Select
                value={form.watch('case_stage') ?? ''}
                onValueChange={(v) => v && form.setValue('case_stage', v)}
              >
                <SelectTrigger
                  id="case_stage"
                  className="h-10 rounded-lg text-[13px]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <SelectValue placeholder="Find a case stage" />
                </SelectTrigger>
                <SelectContent>
                  {CASE_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assigned_lawyer" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Responsible lawyer</Label>
              <Input id="assigned_lawyer" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('assigned_lawyer')} />
            </div>
            <div>
              <Label htmlFor="originating_lawyer" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Originating lawyer</Label>
              <Input id="originating_lawyer" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('originating_lawyer')} />
            </div>
          </div>
          <div>
            <Label htmlFor="date_opened" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Open date</Label>
            <Input id="date_opened" type="date" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('date_opened')} />
          </div>
          <div className="border-t pt-4" style={{ borderColor: 'rgba(13,27,42,0.06)' }}>
            <Label htmlFor="notes" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Notes</Label>
            <Textarea id="notes" rows={3} className="rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('notes')} />
          </div>
          <DialogFooter className="px-6 py-4 border-t" style={{ borderColor: 'var(--border)', background: 'rgba(13,27,42,0.015)' }}>
            <Button type="button" variant="outline" onClick={closeModal} className="rounded-lg text-[13px]">Cancel</Button>
            <Button type="submit" disabled={isPending} className="rounded-lg text-[13px] font-semibold shadow-sm" style={{ background: 'var(--gold)' }}>
              {isPending ? <><Spinner size={14} /> Saving...</> : isEdit ? 'Update' : 'Open Case'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
