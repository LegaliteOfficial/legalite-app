'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarBlank, Check, Crown } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CURRENT_PLAN, PLANS } from '../_constants'
import type { BillingPeriod, Plan, PlanId } from '../_types'

export function PaymentInfoTab() {
  const [period, setPeriod] = useState<BillingPeriod>('annual')

  return (
    <div className="max-w-6xl">
      <div className="text-center mb-2">
        <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--navy)' }}>Choose your plan</h2>
      </div>
      <p className="text-center text-sm mb-1" style={{ color: '#6B7280' }}>
        Choose your plan and continue using LegaLite to help run your firm.
      </p>
      <p className="text-center text-sm font-bold mb-6" style={{ color: 'var(--navy)' }}>
        You&rsquo;ve been trialing <span style={{ color: 'var(--gold)' }}>Premium</span>.
      </p>

      {/* Billing period toggle */}
      <div className="flex flex-col items-center mb-8">
        <div className="inline-flex items-center gap-6">
          <PeriodOption label="Pay monthly"   value="monthly" active={period === 'monthly'} onSelect={setPeriod} />
          <PeriodOption label="Pay annually"  value="annual"  active={period === 'annual'}  onSelect={setPeriod} />
        </div>
        <p className="text-xs mt-1.5" style={{ color: '#6B7280' }}>(save more with an annual plan)</p>
      </div>

      {/* Plan grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            period={period}
            isCurrent={plan.id === CURRENT_PLAN}
          />
        ))}
      </div>
    </div>
  )
}

function PeriodOption({
  label, value, active, onSelect,
}: {
  label: string
  value: BillingPeriod
  active: boolean
  onSelect: (v: BillingPeriod) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className="inline-flex items-center gap-2 text-sm font-semibold"
      style={{ color: active ? 'var(--navy)' : '#6B7280' }}
    >
      <span
        aria-hidden
        className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
        style={{ borderColor: active ? 'var(--gold)' : '#9CA3AF' }}
      >
        {active && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)' }} />}
      </span>
      {label}
    </button>
  )
}

function PlanCard({
  plan, period, isCurrent,
}: {
  plan: Plan
  period: BillingPeriod
  isCurrent: boolean
}) {
  const price = period === 'annual' ? plan.annual : plan.monthly
  const isCustom = price === null

  return (
    <div className="relative">
      {isCurrent && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase shadow-sm"
          style={{ background: 'var(--gold)', color: 'white' }}
        >
          You&rsquo;ve been trialing
        </div>
      )}
      <div
        className="rounded-2xl border h-full flex flex-col p-6"
        style={{
          background: 'var(--cream-white)',
          borderColor: isCurrent ? 'var(--gold)' : 'var(--border)',
          borderWidth: isCurrent ? '2px' : '1px',
          boxShadow: isCurrent ? '0 8px 32px rgba(201,151,43,0.18)' : '0 4px 24px rgba(13,27,42,0.06)',
        }}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <h3 className="font-heading text-2xl font-extrabold mb-3" style={{ color: 'var(--navy)' }}>
            {plan.name}
          </h3>

          {isCustom ? (
            <div className="py-4">
              <Link
                href="/contact-us"
                className="inline-block text-base font-semibold underline underline-offset-2"
                style={{ color: 'var(--gold)' }}
              >
                Talk to our Team for Pricing
              </Link>
            </div>
          ) : (
            <>
              <div className="font-heading text-4xl font-extrabold" style={{ color: 'var(--navy)' }}>
                GHS {price?.toLocaleString()}
              </div>
              <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
                per user / month (GHS)
              </p>
              <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                {period === 'annual' ? 'billed annually' : 'billed monthly'} · before relevant discounts
              </p>
            </>
          )}
        </div>

        {/* Features */}
        <div className="flex-1">
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--navy)' }}>
            {plan.tagline}
          </p>
          <ul className="space-y-2">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--navy)' }}>
                <Check size={14} strokeWidth={2.5} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Link
            href={`/settings/account-info/plans/${plan.id}`}
            className="block mt-5 text-center text-xs font-semibold underline underline-offset-2"
            style={{ color: 'var(--gold)' }}
          >
            See full feature list
          </Link>
        </div>

        {/* CTA */}
        <div className="mt-6">
          {isCurrent ? (
            <button
              type="button"
              disabled
              className="w-full rounded-md px-4 py-2.5 text-sm font-semibold"
              style={{ background: 'rgba(201,151,43,0.12)', color: 'var(--gold)', cursor: 'default' }}
            >
              Current plan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => toast.success(`Plan switch to ${plan.name} captured (dev preview).`)}
              className="w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--navy)' }}
            >
              {isCustom ? 'Contact Sales' : `Choose ${plan.name}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
