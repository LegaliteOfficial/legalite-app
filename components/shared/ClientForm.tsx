'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FormDrawer,
  FormDrawerBody,
  FormDrawerFooter,
  FormDrawerHeader,
} from '@/components/ui/form-drawer'
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
import { useEffect, useState } from 'react'
import {
  useClientRatesStore,
  type RateKind,
} from '@/stores/client-rates-local.store'

export function ClientForm() {
  const { modal, closeModal } = useUIStore()
  const isAdd = modal?.type === 'addClient'
  const isEdit = modal?.type === 'editClient'
  const editId = isEdit ? modal.id : undefined

  const { data: existing } = useClient(editId)
  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient()

  // ── Billing rate (local persisted store) ────────────────────────
  // The backend Client shape doesn't carry rate fields yet, so rate
  // config rides on a sibling local store keyed by client_id. We
  // gather the fields into form-local state here, hydrate from the
  // store on edit, and write through to the store on save (after the
  // mutation resolves so we know the client_id we're keying on).
  const setClientRate = useClientRatesStore((s) => s.setClientRate)
  const clearClientRate = useClientRatesStore((s) => s.clearClientRate)
  const firmDefaultRate = useClientRatesStore((s) => s.firm_default_hourly_rate)
  const [rateKind, setRateKind] = useState<RateKind>('hourly')
  const [hourlyRate, setHourlyRate] = useState<string>('')
  const [flatFee, setFlatFee] = useState<string>('')
  const [contingencyPct, setContingencyPct] = useState<string>('')
  const [rateNotes, setRateNotes] = useState<string>('')

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
      // Hydrate the rate fields from the local store. We rehydrate
      // first because the store uses skipHydration, so the in-memory
      // map is empty on a cold dialog open if this is the first time
      // the form mounts in this tab. `rehydrate()` returns
      // `void | Promise<void>` depending on storage backend, so we
      // normalise via Promise.resolve.
      void Promise.resolve(useClientRatesStore.persist.rehydrate()).then(
        () => {
          const rate = useClientRatesStore.getState().client_rates[existing.id]
          if (rate) {
            setRateKind(rate.rate_kind)
            setHourlyRate(rate.default_hourly_rate?.toString() ?? '')
            setFlatFee(rate.flat_fee?.toString() ?? '')
            setContingencyPct(rate.contingency_pct?.toString() ?? '')
            setRateNotes(rate.notes ?? '')
          } else {
            // No client-specific rate yet — start from the default
            // hourly kind with empty fields so the form invites the
            // partner to set one.
            setRateKind('hourly')
            setHourlyRate('')
            setFlatFee('')
            setContingencyPct('')
            setRateNotes('')
          }
        },
      )
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
      // New client — blank rate fields, defaulting to hourly so the
      // common case (set an hourly rate at intake) is one click away.
      setRateKind('hourly')
      setHourlyRate('')
      setFlatFee('')
      setContingencyPct('')
      setRateNotes('')
      void useClientRatesStore.persist.rehydrate()
    }
    // form.reset is stable; depending on existing.id avoids re-running on
    // every TanStack Query data re-emission (which would loop with form.reset).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, isAdd, existing?.id])

  if (!isAdd && !isEdit) return null

  const isPending = createMutation.isPending || updateMutation.isPending

  /**
   * Persist the form's rate fields into the local client-rates store
   * after the client mutation lands. Split out so the create + edit
   * branches share the exact same write path.
   *
   *   - If rate_kind is 'none' the store row is cleared rather than
   *     stored — "no standard rate" is a deliberate choice that we
   *     remember by *removing* any prior config so the BillComposer
   *     falls back to the firm default.
   *   - Empty hourly/flat strings parse to null so partial entries
   *     don't get coerced to 0 (which would silently look "set" to
   *     downstream readers).
   */
  const persistRateFor = (clientId: string) => {
    if (rateKind === 'none') {
      clearClientRate(clientId)
      return
    }
    const parsedHourly = hourlyRate.trim() ? Number(hourlyRate) : null
    const parsedFlat = flatFee.trim() ? Number(flatFee) : null
    const parsedContingency = contingencyPct.trim()
      ? Number(contingencyPct)
      : null
    setClientRate(clientId, {
      rate_kind: rateKind,
      default_hourly_rate:
        parsedHourly != null && Number.isFinite(parsedHourly) && parsedHourly > 0
          ? parsedHourly
          : null,
      flat_fee:
        parsedFlat != null && Number.isFinite(parsedFlat) && parsedFlat > 0
          ? parsedFlat
          : null,
      contingency_pct:
        parsedContingency != null &&
        Number.isFinite(parsedContingency) &&
        parsedContingency > 0
          ? parsedContingency
          : null,
      notes: rateNotes.trim() || null,
    })
  }

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (isEdit && editId) {
        await updateMutation.mutateAsync({ id: editId, data })
        persistRateFor(editId)
        toast.success('Client record updated successfully.')
      } else {
        const created = await createMutation.mutateAsync(data)
        // Edge case: the mutation can succeed without returning a
        // populated id under DEV_BYPASS — guard the rate write so we
        // don't strand it under an empty key.
        if (created?.id) persistRateFor(created.id)
        toast.success('New client added to your directory.')
      }
      closeModal()
    } catch {
      toast.error(isEdit ? 'Unable to update client. Please try again.' : 'Unable to create client. Please try again.')
    }
  }

  return (
    <FormDrawer open onOpenChange={closeModal} size="lg">
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <FormDrawerHeader
          title={isEdit ? 'Edit client' : 'Add client'}
          description={
            isEdit
              ? 'Update the details below.'
              : 'Fill in the details below to create a new client.'
          }
          onClose={closeModal}
        />
        <FormDrawerBody className="space-y-4">
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

          {/*
           * Billing & Rate — per-client rate config that flows into
           * the BillComposer when this client is picked. Lives below
           * Address so the form reads identity -> contact -> billing
           * -> notes, mirroring the order partners think in.
           *
           * Rate kinds: hourly / flat / mixed / contingency / none.
           * Inputs are conditionally rendered so the form doesn't
           * ask for an hourly rate when the partner picked Flat fee,
           * which would otherwise be a confusing empty field.
           */}
          <div className="border-t pt-4" style={{ borderColor: 'rgba(13,27,42,0.06)' }}>
            <div className="flex items-baseline justify-between mb-2">
              <Label className="text-[12px] font-semibold block" style={{ color: 'var(--navy)' }}>
                Billing & rate
              </Label>
              <span className="text-[11px] text-gray-400">
                {firmDefaultRate != null
                  ? `Firm default: GHS ${firmDefaultRate.toLocaleString('en-GH')}/hr`
                  : 'No firm default set'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rate-kind" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>
                  Rate type
                </Label>
                <Select
                  value={rateKind}
                  onValueChange={(v) => v && setRateKind(v as RateKind)}
                >
                  <SelectTrigger className="h-10 rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="flat">Flat fee per matter</SelectItem>
                    <SelectItem value="mixed">Mixed (hourly + flat)</SelectItem>
                    <SelectItem value="contingency">Contingency (% of recovery)</SelectItem>
                    <SelectItem value="none">No standard rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Hourly rate — shown for hourly + mixed. */}
              {(rateKind === 'hourly' || rateKind === 'mixed') && (
                <div>
                  <Label htmlFor="hourly-rate" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>
                    Hourly rate (GHS)
                  </Label>
                  <Input
                    id="hourly-rate"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={50}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder={
                      firmDefaultRate != null
                        ? `e.g. ${firmDefaultRate}`
                        : 'e.g. 600'
                    }
                    className="h-10 rounded-lg text-[13px]"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
              )}

              {/* Flat fee — shown for flat + mixed. */}
              {(rateKind === 'flat' || rateKind === 'mixed') && (
                <div>
                  <Label htmlFor="flat-fee" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>
                    Flat fee per matter (GHS)
                  </Label>
                  <Input
                    id="flat-fee"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={100}
                    value={flatFee}
                    onChange={(e) => setFlatFee(e.target.value)}
                    placeholder="e.g. 8500"
                    className="h-10 rounded-lg text-[13px]"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
              )}

              {/* Contingency percentage — shown for contingency only. */}
              {rateKind === 'contingency' && (
                <div>
                  <Label htmlFor="contingency-pct" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>
                    Recovery percentage (%)
                  </Label>
                  <Input
                    id="contingency-pct"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step={1}
                    value={contingencyPct}
                    onChange={(e) => setContingencyPct(e.target.value)}
                    placeholder="e.g. 30"
                    className="h-10 rounded-lg text-[13px]"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
              )}
            </div>

            {/* Rate notes — free-form rationale so the next partner
                looking at the file knows why the rate is what it is. */}
            <div className="mt-3">
              <Label htmlFor="rate-notes" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>
                Rate notes (optional)
              </Label>
              <Textarea
                id="rate-notes"
                rows={2}
                value={rateNotes}
                onChange={(e) => setRateNotes(e.target.value)}
                placeholder="e.g. Discounted relationship rate; review at FY-end partner meeting."
                className="rounded-lg text-[13px]"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            {rateKind === 'none' && (
              <p className="text-[11.5px] mt-2" style={{ color: 'var(--text-muted, #6b7280)' }}>
                Bills for this client will fall back to the firm default rate.
                You can still set a rate per line item.
              </p>
            )}
          </div>

          {/* Notes — free-form. */}
          <div className="border-t pt-4" style={{ borderColor: 'rgba(13,27,42,0.06)' }}>
            <Label htmlFor="notes" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>Notes</Label>
            <Textarea id="notes" rows={3} className="rounded-lg text-[13px]" style={{ borderColor: 'var(--border)' }} {...form.register('notes')} />
          </div>
        </FormDrawerBody>
        <FormDrawerFooter>
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? <><Spinner size={14} /> Saving…</> : isEdit ? 'Update' : 'Add client'}
          </Button>
        </FormDrawerFooter>
      </form>
    </FormDrawer>
  )
}
