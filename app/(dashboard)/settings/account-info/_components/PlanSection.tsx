'use client'

import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  useSubscriptionStore,
  type BillingPeriod,
} from '@/stores/subscription-local.store'
import { PLANS } from '../_constants'
import type { Plan } from '../_types'
import { formatGhs } from '../_lib/format'

/**
 * Current plan summary with an inline "Change plan" picker. The picker
 * reuses the firm's plan catalogue and writes the choice to the
 * subscription store.
 */
export function PlanSection() {
  const account = useSubscriptionStore((s) => s.account)
  const setPlan = useSubscriptionStore((s) => s.setPlan)
  const [picking, setPicking] = useState(false)
  const [period, setPeriod] = useState<BillingPeriod>(account.period)

  const current = PLANS.find((p) => p.id === account.plan)
  const currentPrice =
    account.period === 'annual' ? current?.annual : current?.monthly

  const choose = (plan: Plan) => {
    setPlan(plan.id, period)
    setPicking(false)
    toast.success(`Switched to ${plan.name} (${period}).`)
  }

  return (
    <section
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border)',
        boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
      }}
    >
      <div className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            Plan
          </h2>
          <p className="text-[13.5px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {current?.name}
            {currentPrice != null ? (
              <>
                {' '}· {formatGhs(currentPrice)} per seat / month, billed{' '}
                {account.period === 'annual' ? 'annually' : 'monthly'}
              </>
            ) : (
              ' · custom pricing'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPeriod(account.period)
            setPicking((v) => !v)
          }}
          className="shrink-0 rounded-md border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-black/[0.02]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          {picking ? 'Close' : 'Change plan'}
        </button>
      </div>

      {picking && (
        <div className="px-5 pb-5 border-t pt-5" style={{ borderColor: 'var(--border)' }}>
          {/* Billing period toggle */}
          <div className="flex items-center justify-center gap-1 mb-5">
            {(['monthly', 'annual'] as BillingPeriod[]).map((p) => {
              const active = period === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className="rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
                  style={{
                    background: active ? 'var(--navy)' : 'transparent',
                    color: active ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {p === 'monthly' ? 'Monthly' : 'Annual'}
                  {p === 'annual' && (
                    <span className="ml-1.5 text-[11px]" style={{ color: active ? 'var(--gold-light)' : 'var(--gold-dark)' }}>
                      save 20%
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                period={period}
                isCurrent={plan.id === account.plan}
                onChoose={() => choose(plan)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function PlanCard({
  plan,
  period,
  isCurrent,
  onChoose,
}: {
  plan: Plan
  period: BillingPeriod
  isCurrent: boolean
  onChoose: () => void
}) {
  const price = period === 'annual' ? plan.annual : plan.monthly
  const isCustom = price === null

  return (
    <div
      className="rounded-xl border h-full flex flex-col p-5"
      style={{
        background: isCurrent ? 'var(--gold-muted)' : 'var(--surface-card)',
        borderColor: isCurrent ? 'var(--gold)' : 'var(--border)',
        boxShadow: isCurrent ? '0 0 0 1px var(--gold)' : 'none',
      }}
    >
      <h3 className="font-heading text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>
        {plan.name}
      </h3>
      {isCustom ? (
        <p className="mt-1 text-[13px] font-semibold" style={{ color: 'var(--gold-dark)' }}>
          Custom pricing
        </p>
      ) : (
        <p className="mt-1">
          <span className="font-heading text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {formatGhs(price)}
          </span>
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {' '}/ seat / mo
          </span>
        </p>
      )}

      <p className="text-[12.5px] font-semibold mt-3 mb-2" style={{ color: 'var(--text-secondary)' }}>
        {plan.tagline}
      </p>
      <ul className="space-y-1.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-1.5 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
            <Check size={13} weight="bold" className="mt-0.5 shrink-0" style={{ color: 'var(--gold-dark)' }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        {isCurrent ? (
          <button
            type="button"
            disabled
            className="w-full rounded-md px-4 py-2 text-[13px] font-semibold"
            style={{ background: 'rgba(201,151,43,0.18)', color: 'var(--gold-dark)', cursor: 'default' }}
          >
            Current plan
          </button>
        ) : (
          <button
            type="button"
            onClick={onChoose}
            className="w-full rounded-md px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: isCustom ? 'var(--navy)' : 'var(--gold)' }}
          >
            {isCustom ? 'Contact sales' : `Choose ${plan.name}`}
          </button>
        )}
      </div>
    </div>
  )
}
