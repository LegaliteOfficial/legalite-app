'use client'

import { Plus, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '../primitives/Checkbox'
import { FieldLabel } from '../primitives/FieldLabel'
import { NativeSelect } from '../primitives/NativeSelect'
import { BILLING_METHODS, CURRENCIES } from '../../_constants'
import type { BillingRateDraft, NewCaseForm, SetField } from '../../_types'

/**
 * Billing preferences. Billable toggle gates the rest of the section
 * (rates / budget / split / low-funds notification are all greyed when
 * the case isn't billable so the user can see they exist but knows
 * they're inert in that state).
 */
export function BillingSection({
  form,
  setField,
  firmUserOptions,
}: {
  form: NewCaseForm
  setField: SetField
  firmUserOptions: string[]
}) {
  const currencyMeta =
    CURRENCIES.find((c) => c.code === form.currency) ?? CURRENCIES[0]
  // Symbol portion before the parenthesis in the currency label, e.g.
  // "Ghanaian Cedi (GH₵)" → "GH₵". Used as the small prefix on rate
  // inputs.
  const currencySymbol =
    currencyMeta.label.match(/\(([^)]+)\)/)?.[1] ?? form.currency

  const addRate = () => {
    setField('custom_billing_rates', [
      ...form.custom_billing_rates,
      { id: crypto.randomUUID(), user_or_group: '', amount: '' },
    ])
  }
  const updateRate = (id: string, patch: Partial<BillingRateDraft>) => {
    setField(
      'custom_billing_rates',
      form.custom_billing_rates.map((r) =>
        r.id === id ? { ...r, ...patch } : r,
      ),
    )
  }
  const removeRate = (id: string) => {
    setField(
      'custom_billing_rates',
      form.custom_billing_rates.filter((r) => r.id !== id),
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div
          className="flex-1 min-w-[240px] rounded-xl border p-4"
          style={{
            background: form.is_billable
              ? 'rgba(201,151,43,0.06)'
              : 'var(--surface-sunken)',
            borderColor: form.is_billable
              ? 'rgba(201,151,43,0.35)'
              : 'var(--border-soft)',
          }}
        >
          <Checkbox
            checked={form.is_billable}
            onChange={(v) => setField('is_billable', v)}
            label="This case is billable"
            hint={
              <>
                Track time and issue invoices for this case. Switch off for
                pro-bono or internal matters.
              </>
            }
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <FieldLabel>Billing method</FieldLabel>
          <NativeSelect
            value={form.billing_method}
            onChange={(v) =>
              setField('billing_method', v as NewCaseForm['billing_method'])
            }
            options={BILLING_METHODS.map((b) => ({
              value: b.value,
              label: b.label,
            }))}
            disabled={!form.is_billable}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Currency</FieldLabel>
          <NativeSelect
            value={form.currency}
            onChange={(v) => setField('currency', v)}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
            disabled={!form.is_billable}
          />
        </div>
      </div>

      {/* ── Custom billing rates ─── */}
      <div
        className="pt-2 border-t"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div
          className="text-[13.5px] font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Custom billing rates
        </div>
        <div className="space-y-2">
          {form.custom_billing_rates.map((rate, idx) => (
            <div
              key={rate.id}
              className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,200px)_auto] gap-2 items-end"
            >
              <div>
                {idx === 0 && (
                  <FieldLabel required>Firm user or group</FieldLabel>
                )}
                <NativeSelect
                  value={rate.user_or_group}
                  onChange={(v) => updateRate(rate.id, { user_or_group: v })}
                  placeholder="Find user or group"
                  options={firmUserOptions}
                  disabled={!form.is_billable}
                />
              </div>
              <span
                className="pb-2.5 text-[13px] font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                at
              </span>
              <div>
                {idx === 0 && <FieldLabel required>Hourly rate</FieldLabel>}
                <div className="flex">
                  <span
                    className="inline-flex items-center px-3 h-10 rounded-l-lg border border-r-0 text-[12px] font-medium"
                    style={{
                      borderColor: 'var(--border-default)',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {currencySymbol}
                  </span>
                  <Input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={rate.amount}
                    onChange={(e) =>
                      updateRate(rate.id, {
                        amount: e.target.value.replace(/[^0-9.]/g, ''),
                      })
                    }
                    className="h-10 rounded-none text-[13px] flex-1 text-right tabular-nums"
                    style={{ borderColor: 'var(--border-default)' }}
                    disabled={!form.is_billable}
                  />
                  <span
                    className="inline-flex items-center px-3 h-10 rounded-r-lg border border-l-0 text-[12px] font-medium"
                    style={{
                      borderColor: 'var(--border-default)',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {form.currency}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeRate(rate.id)}
                className="p-1.5 rounded-md transition-colors cursor-pointer self-end mb-1"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-sunken)'
                  e.currentTarget.style.color = '#C0392B'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
                aria-label="Remove billing rate"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addRate}
          disabled={!form.is_billable}
          className="mt-2"
        >
          <Plus size={13} strokeWidth={2} />
          Add a custom billing rate
        </Button>
      </div>

      {/* ── Case budget ─── */}
      <div
        className="pt-2 border-t"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div
          className="text-[13.5px] font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Case budget
        </div>
        <Checkbox
          checked={form.budget_enabled}
          onChange={(v) => setField('budget_enabled', v)}
          label="Set a budget for this case"
          hint="Get notified as you approach the budget while logging time."
        />
        {form.budget_enabled && (
          <div className="mt-3 max-w-[320px]">
            <FieldLabel>Budget amount</FieldLabel>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[12.5px] font-medium pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              >
                {form.currency}
              </span>
              <Input
                inputMode="decimal"
                placeholder="0.00"
                value={form.budget_amount}
                onChange={(e) =>
                  setField(
                    'budget_amount',
                    e.target.value.replace(/[^0-9.]/g, ''),
                  )
                }
                className="h-10 rounded-lg text-[13px] pl-12"
                style={{ borderColor: 'var(--border-default)' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Split invoice ─── */}
      <div
        className="pt-2 border-t"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div
          className="text-[13.5px] font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Split invoice
        </div>
        <Checkbox
          checked={form.split_invoice}
          onChange={(v) => setField('split_invoice', v)}
          label="Split the invoices for this case"
          hint="When clients share the cost, invoices can be split among them."
        />
      </div>

      {/* ── Client balance notification ─── */}
      <div
        className="pt-2 border-t"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div
          className="text-[13.5px] font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Client balance notification
        </div>
        <Checkbox
          checked={form.notify_low_client_funds}
          onChange={(v) => setField('notify_low_client_funds', v)}
          label="Notify firm users when case client funds are low"
          hint="Triggers a heads-up email when the client's trust balance drops past the firm threshold."
        />
      </div>
    </div>
  )
}
