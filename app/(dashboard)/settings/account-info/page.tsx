'use client'

/**
 * Account and payment info — composition root.
 *
 * One scrollable page that brings the firm's subscription account and
 * billing together: who owns the account, the current plan (with an
 * inline change-plan picker), the payment method on file, billing
 * history, and account governance. Branding/address live on the Firm
 * profile page, not here.
 *
 * Data is the local subscription store (skipHydration), rehydrated once
 * on mount.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CaretRight } from '@phosphor-icons/react'
import { Spinner } from '@/components/shared/Spinner'
import { useSubscriptionStore } from '@/stores/subscription-local.store'
import { AccountOverviewCard } from './_components/AccountOverviewCard'
import { PlanSection } from './_components/PlanSection'
import { PaymentMethodCard } from './_components/PaymentMethodCard'
import { BillingHistoryCard } from './_components/BillingHistoryCard'
import { AccountFooter } from './_components/AccountFooter'

export default function AccountInfoPage() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    void Promise.resolve(useSubscriptionStore.persist.rehydrate()).then(() =>
      setHydrated(true),
    )
  }, [])

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ background: 'var(--surface-page)' }}
    >
      <div
        className="flex items-center gap-2 text-sm mb-5"
        style={{ color: 'var(--text-primary)' }}
      >
        <Link
          href="/settings"
          className="hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
        >
          Settings
        </Link>
        <CaretRight size={14} strokeWidth={2.25} style={{ color: 'var(--text-muted)' }} />
        <span className="font-bold">Account and payment info</span>
      </div>

      <div className="max-w-4xl mb-8">
        <div
          className="text-[10px] font-bold tracking-[3px] uppercase mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          System
        </div>
        <h1
          className="font-heading text-3xl font-extrabold mb-3 leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Account and payment info
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Manage your firm&rsquo;s LegaLite subscription — your plan, payment
          method, and billing history, all in one place.
        </p>
      </div>

      {!hydrated ? (
        <div
          className="flex items-center justify-center gap-2 py-24"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Spinner size={16} /> <span className="text-sm">Loading account…</span>
        </div>
      ) : (
        <div className="max-w-4xl space-y-6">
          <AccountOverviewCard />
          <PlanSection />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <PaymentMethodCard />
            <AccountFooter />
          </div>
          <BillingHistoryCard />
        </div>
      )}
    </div>
  )
}
