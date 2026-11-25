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
 * Data comes from the firm record (currentFirm) and the member list.
 */

import { RequirePermission } from '@/components/shared/RequirePermission'
import { useQuery } from '@apollo/client/react'
import Link from 'next/link'
import { CaretRight } from '@phosphor-icons/react'
import { Spinner } from '@/components/shared/Spinner'
import { CurrentFirmQueryDoc } from '@/lib/graphql/firms'
import { errorMessage } from '@/lib/errors'
import { AccountOverviewCard } from './_components/AccountOverviewCard'
import { PlanSection } from './_components/PlanSection'
import { AccountFooter } from './_components/AccountFooter'

function AccountInfoPageContent() {
  const { data, loading, error } = useQuery(CurrentFirmQueryDoc)
  const firm = data?.currentFirm ?? null

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
          Your firm&rsquo;s Legalite account: who owns it, the plan it is on, and
          how to reach the billing team.
        </p>
      </div>

      {error ? (
        <p className="py-24 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          {errorMessage(error, 'The firm account could not be loaded.')}
        </p>
      ) : loading && !firm ? (
        <div
          className="flex items-center justify-center gap-2 py-24"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Spinner size={16} /> <span className="text-sm">Loading account…</span>
        </div>
      ) : firm ? (
        <div className="max-w-4xl space-y-6">
          <AccountOverviewCard firm={firm} />
          <PlanSection firm={firm} />
          <AccountFooter />
        </div>
      ) : null}
    </div>
  )
}

export default function AccountInfoPage() {
  return (
    <RequirePermission permission="manage-account-info" what="the firm's account information">
      <AccountInfoPageContent />
    </RequirePermission>
  )
}
