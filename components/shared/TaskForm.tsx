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
import { useTask, useCreateTask, useUpdateTask } from '@/hooks/use-tasks'
import { useClients } from '@/hooks/use-clients'
import { useCases } from '@/hooks/use-cases'
import { taskSchema, type TaskFormData } from '@/schemas'
import { Spinner } from '@/components/shared/Spinner'
import { toast } from 'sonner'
import { useEffect } from 'react'

export function TaskForm() {
  const { modal, closeModal } = useUIStore()
  const isAdd = modal?.type === 'addTask'
  const isEdit = modal?.type === 'editTask'
  const editId = isEdit ? modal.id : undefined

  const { data: existing } = useTask(editId)
  const { data: clients } = useClients()
  const { data: cases } = useCases()
  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()

  const form = useForm<TaskFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(taskSchema) as any,
    defaultValues: {
      title: '', client_id: '', case_id: '', priority: 'Medium',
      status: 'Pending', due_date: '', assigned_to: '', notes: '',
    },
  })

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        title: existing.title ?? '',
        client_id: existing.client_id ?? '',
        case_id: existing.case_id ?? '',
        priority: existing.priority ?? 'Medium',
        status: existing.status ?? 'Pending',
        due_date: existing.due_date ?? '',
        assigned_to: existing.assigned_to ?? '',
        notes: existing.notes ?? '',
      })
    }
    if (isAdd) {
      form.reset({
        title: '', client_id: '', case_id: '', priority: 'Medium',
        status: 'Pending', due_date: '', assigned_to: '', notes: '',
      })
    }
    // form.reset is stable; depending on existing.id avoids re-running on
    // every TanStack Query data re-emission (which would loop with form.reset).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, isAdd, existing?.id])

  if (!isAdd && !isEdit) return null

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (isEdit && editId) {
        await updateMutation.mutateAsync({ id: editId, data })
        toast.success('Task updated successfully.')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('New task created successfully.')
      }
      closeModal()
    } catch {
      toast.error(isEdit ? 'Unable to update task. Please try again.' : 'Unable to create task. Please try again.')
    }
  }

  return (
    <Dialog open onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-2xl" style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}>
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-heading text-lg" style={{ color: 'var(--navy)' }}>
            {isEdit ? 'Edit Task' : 'Add Task'}
          </DialogTitle>
          <p className="text-[12px] text-gray-400 mt-0.5">{isEdit ? 'Update the details below.' : 'Fill in the details below to create a new task.'}</p>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div>
            <Label htmlFor="title" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Task Title *</Label>
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="priority" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Priority</Label>
              <Select value={form.watch('priority')} onValueChange={(v) => v && form.setValue('priority', v as TaskFormData['priority'])}>
                <SelectTrigger className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Status</Label>
              <Select value={form.watch('status')} onValueChange={(v) => v && form.setValue('status', v as TaskFormData['status'])}>
                <SelectTrigger className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="due_date" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Due Date</Label>
              <Input id="due_date" type="date" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('due_date')} />
            </div>
          </div>
          <div>
            <Label htmlFor="assigned_to" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Assigned To</Label>
            <Input id="assigned_to" className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('assigned_to')} />
          </div>
          <div className="border-t pt-4" style={{ borderColor: 'rgba(13,27,42,0.06)' }}>
            <Label htmlFor="notes" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Notes</Label>
            <Textarea id="notes" rows={2} className="rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('notes')} />
          </div>
          <DialogFooter className="px-6 py-4 border-t" style={{ borderColor: 'var(--border)', background: 'rgba(13,27,42,0.015)' }}>
            <Button type="button" variant="outline" onClick={closeModal} className="rounded-lg text-[13px]">Cancel</Button>
            <Button type="submit" disabled={isPending} className="rounded-lg text-[13px] font-semibold shadow-sm" style={{ background: 'var(--gold)' }}>
              {isPending ? <><Spinner size={14} /> Saving...</> : isEdit ? 'Update' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
