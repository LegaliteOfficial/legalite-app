'use client'

import Link from 'next/link'
import {
  ArrowRight,
  ArrowsLeftRight,
  CalendarBlank,
  CreditCard,
  Crown,
  Shield,
  Users as UsersIcon,
  Warning,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { CURRENT_OWNER } from '../_constants'
import { PowerCard } from './primitives/PowerCard'
import { RefinedCallout } from './primitives/RefinedCallout'
import { Section } from './primitives/Section'
import { SectionEyebrow } from './primitives/SectionEyebrow'

export function AccountAdministrationTab() {
  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-10 gap-6 flex-wrap">
        <div className="max-w-2xl">
          <div className="text-[10px] font-bold tracking-[3px] uppercase mb-2" style={{ color: '#9CA3AF' }}>
            Account Administration
          </div>
          <h2 className="font-heading text-3xl font-extrabold mb-3 leading-tight" style={{ color: 'var(--navy)' }}>
            You are the Firm Owner
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            One person holds the keys to the firm. You manage billing, calendar control, and decide who can administer alongside you.
          </p>
        </div>
        <Link
          href="/settings/roles"
          className="inline-flex items-center gap-1 text-sm font-semibold mt-2 shrink-0 transition-opacity hover:opacity-70"
          style={{ color: 'var(--gold)' }}
        >
          Review all account roles <ArrowRight size={14} strokeWidth={2.25} />
        </Link>
      </div>

      {/* Current owner identity strip */}
      <SectionEyebrow>Current owner</SectionEyebrow>
      <div
        className="rounded-2xl border p-5 mb-10 flex items-center gap-4"
        style={{ background: 'var(--cream-white)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.05)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-heading text-base font-bold shrink-0"
          style={{ background: 'var(--navy)', color: 'white' }}
        >
          {CURRENT_OWNER.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base" style={{ color: 'var(--navy)' }}>{CURRENT_OWNER.name}</span>
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'rgba(201,151,43,0.15)', color: 'var(--gold)' }}
            >
              <Crown size={10} strokeWidth={2.5} /> Firm Owner
            </span>
          </div>
          <p className="text-sm mt-0.5 truncate" style={{ color: '#6B7280' }}>{CURRENT_OWNER.email}</p>
        </div>
      </div>

      {/* Owner powers — 2x2 grid */}
      <SectionEyebrow>Powers of this role</SectionEyebrow>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <PowerCard
          Icon={CreditCard}
          title="Subscription & Billing"
          body="Holds the firm’s LegaLite subscription. Manages plan changes, payment methods, and billing details."
          href="/firm/billing"
          ctaLabel="Manage billing"
        />
        <PowerCard
          Icon={CalendarBlank}
          title="Firm Calendar"
          body="Sole control over court dates, deadlines, and the firm-wide calendar."
          href="/firm/calendar"
          ctaLabel="Open firm calendar"
        />
        <PowerCard
          Icon={UsersIcon}
          title="Administrators"
          body="Delegate administrative power. Admins can invite, remove, and reassign members alongside you."
          href="/settings/roles"
          ctaLabel="Designate administrators"
        />
        <PowerCard
          Icon={ArrowsLeftRight}
          title="Ownership Transfer"
          body="There is only one firm owner. Ownership is transferable to another member, but never duplicated."
          href="/settings/transfer-ownership"
          ctaLabel="Begin transfer"
        />
      </div>

      {/* Edge-case + identity callouts */}
      <SectionEyebrow>If something goes wrong</SectionEyebrow>
      <div className="space-y-4">
        <RefinedCallout
          Icon={Warning}
          title="If the firm owner is no longer at the firm"
          body={
            <>
              If the owner has left the firm or is locked out of the account, the transfer can be done by{' '}
              <Link href="/settings/transfer-ownership/affidavit" className="underline underline-offset-2 font-semibold" style={{ color: '#92400E' }}>
                submitting a sworn affidavit
              </Link>
              . LegaLite Support will review and complete the transfer manually.
            </>
          }
        />

        <RefinedCallout
          Icon={Shield}
          title="Identity confirmation required"
          body="To secure your account, your identity must be confirmed before you can transfer ownership. This protects your firm from unauthorized changes."
          action={{
            label: 'Verify my identity',
            onClick: () => toast.message('Identity verification flow is not wired yet — coming with the auth-restore work.'),
          }}
        />
      </div>
    </div>
  )
}
