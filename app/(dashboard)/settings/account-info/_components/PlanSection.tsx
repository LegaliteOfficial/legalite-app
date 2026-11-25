'use client'

import Link from 'next/link'
import { ArrowRight, Envelope } from '@phosphor-icons/react'
import type { CurrentFirmQuery } from '@/types/generated/graphql'
import { BILLING_EMAIL, planLabel } from '../_constants'

type Firm = NonNullable<CurrentFirmQuery['currentFirm']>

/**
 * The firm's current plan and how to change it. Plan changes and invoices
 * are handled by the Legalite billing team, so this links to the plans page
 * (which sends a request) and to the billing contact.
 */
export function PlanSection({ firm }: { firm: Firm }) {
  const mailto =
    `mailto:${BILLING_EMAIL}?subject=${encodeURIComponent(`Billing question: ${firm.name}`)}` +
    `&body=${encodeURIComponent(`Hello Legalite team,\n\nFirm: ${firm.name}\nPlan: ${planLabel(firm.plan)}\n\n`)}`

  return (
    <section
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.05)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            Plan
          </h2>
          <p className="text-[13.5px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {firm.name} is on the <strong>{planLabel(firm.plan)}</strong> plan.
          </p>
        </div>
        <Link
          href="/billing/plans"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-black/[0.02]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          Compare plans <ArrowRight size={13} />
        </Link>
      </div>
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-[13px]"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        <span>Subscription payments and invoices are handled by the Legalite billing team.</span>
        <a href={mailto} className="inline-flex items-center gap-1.5 font-semibold hover:underline" style={{ color: 'var(--gold-dark)' }}>
          <Envelope size={14} /> {BILLING_EMAIL}
        </a>
      </div>
    </section>
  )
}
