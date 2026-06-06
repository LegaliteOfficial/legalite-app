'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  FormDrawer,
  FormDrawerBody,
  FormDrawerFooter,
  FormDrawerHeader,
  FormDrawerSection,
} from '@/components/ui/form-drawer'
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

const EMPTY: CaseFormData = {
  title: '',
  client_id: '',
  court: '',
  suit_number: '',
  opposing_party: '',
  case_type: '',
  case_stage: '',
  assigned_lawyer: '',
  originating_lawyer: '',
  status: 'Open',
  next_court_date: '',
  date_opened: '',
  notes: '',
}

const labelCls =
  'text-[12px] font-semibold mb-1.5 block'

const inputCls = 'h-10 rounded-lg text-[13px]'

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
    defaultValues: EMPTY,
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
    if (isAdd) form.reset(EMPTY)
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
    <FormDrawer open onOpenChange={closeModal} size="lg">
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <FormDrawerHeader
          title={isEdit ? 'Edit case' : 'Open new case'}
          description={isEdit ? 'Update the details below.' : 'Fill in the details below to create a new case.'}
          onClose={closeModal}
        />

        <FormDrawerBody>
          <FormDrawerSection title="Basic info">
            <Field
              id="title"
              label="Case title *"
              error={form.formState.errors.title?.message}
            >
              <Input id="title" className={inputCls} {...form.register('title')} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field id="client_id" label="Client *" error={form.formState.errors.client_id?.message}>
                <Select value={form.watch('client_id')} onValueChange={(v) => v && form.setValue('client_id', v)}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="status" label="Status">
                <Select value={form.watch('status')} onValueChange={(v) => v && form.setValue('status', v as CaseFormData['status'])}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FormDrawerSection>

          <FormDrawerSection title="Court details">
            <div className="grid grid-cols-2 gap-3">
              <Field id="court" label="Court">
                <Input id="court" className={inputCls} {...form.register('court')} />
              </Field>
              <Field id="suit_number" label="Suit number">
                <Input id="suit_number" className={inputCls} {...form.register('suit_number')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field id="opposing_party" label="Opposing party">
                <Input id="opposing_party" className={inputCls} {...form.register('opposing_party')} />
              </Field>
              <Field id="next_court_date" label="Next court date">
                <Input id="next_court_date" type="date" className={inputCls} {...form.register('next_court_date')} />
              </Field>
            </div>
          </FormDrawerSection>

          <FormDrawerSection title="Practice details">
            <div className="grid grid-cols-2 gap-3">
              <Field id="case_type" label="Practice area">
                <Select
                  value={form.watch('case_type') ?? ''}
                  onValueChange={(v) => v && form.setValue('case_type', v)}
                >
                  <SelectTrigger id="case_type" className={inputCls}>
                    <SelectValue placeholder="Find a practice area" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRACTICE_AREAS.map((pa) => (
                      <SelectItem key={pa} value={pa}>{pa}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="case_stage" label="Case stage">
                <Select
                  value={form.watch('case_stage') ?? ''}
                  onValueChange={(v) => v && form.setValue('case_stage', v)}
                >
                  <SelectTrigger id="case_stage" className={inputCls}>
                    <SelectValue placeholder="Find a case stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field id="assigned_lawyer" label="Responsible lawyer">
                <Input id="assigned_lawyer" className={inputCls} {...form.register('assigned_lawyer')} />
              </Field>
              <Field id="originating_lawyer" label="Originating lawyer">
                <Input id="originating_lawyer" className={inputCls} {...form.register('originating_lawyer')} />
              </Field>
            </div>
            <Field id="date_opened" label="Open date">
              <Input id="date_opened" type="date" className={inputCls} {...form.register('date_opened')} />
            </Field>
          </FormDrawerSection>

          <FormDrawerSection title="Notes">
            <Field id="notes" label="Notes" hideLabel>
              <Textarea id="notes" rows={4} className="rounded-lg text-[13px]" {...form.register('notes')} />
            </Field>
          </FormDrawerSection>
        </FormDrawerBody>

        <FormDrawerFooter>
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? <><Spinner size={14} /> Saving…</> : isEdit ? 'Update' : 'Open case'}
          </Button>
        </FormDrawerFooter>
      </form>
    </FormDrawer>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────

function Field({
  id,
  label,
  error,
  hideLabel,
  children,
}: {
  id: string
  label: string
  error?: string
  hideLabel?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      {!hideLabel && (
        <Label htmlFor={id} className={labelCls} style={{ color: 'var(--text-primary)' }}>
          {label}
        </Label>
      )}
      {children}
      {error && <p className="text-[11.5px] mt-1" style={{ color: '#C0392B' }}>{error}</p>}
    </div>
  )
}
