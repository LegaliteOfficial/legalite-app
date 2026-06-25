'use client'

import { useState } from 'react'
import { Check, PencilSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useSubscriptionStore } from '@/stores/subscription-local.store'
import { CURRENT_OWNER, PLANS } from '../_constants'

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: 'Active', bg: 'rgba(33,106,67,0.12)', color: '#216A43' },
  trial: { label: 'Trial', bg: 'var(--gold-muted)', color: 'var(--gold-dark)' },
  past_due: { label: 'Past due', bg: 'rgba(192,57,43,0.12)', color: '#C0392B' },
  canceled: { label: 'Canceled', bg: 'rgba(13,27,42,0.08)', color: 'var(--text-secondary)' },
}

/** Who owns the account, the plan it's on, and where receipts go. */
export function AccountOverviewCard() {
  const account = useSubscriptionStore((s) => s.account)
  const setBillingEmail = useSubscriptionStore((s) => s.setBillingEmail)

  const planName = PLANS.find((p) => p.id === account.plan)?.name ?? account.plan
  const status = STATUS_STYLE[account.status] ?? STATUS_STYLE.active

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(account.billingEmail)

  const saveEmail = () => {
    const email = draft.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid billing email.')
      return
    }
    setBillingEmail(email)
    setEditing(false)
    toast.success('Billing email updated.')
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
      <div className="flex items-center gap-4 p-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <span
          className="inline-flex items-center justify-center h-11 w-11 rounded-full text-[14px] font-bold shrink-0"
          style={{ background: 'var(--navy)', color: 'white' }}
        >
          {CURRENT_OWNER.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
            {CURRENT_OWNER.name}
          </p>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Account owner · {CURRENT_OWNER.email}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-bold"
            style={{ background: 'var(--gold-muted)', color: 'var(--gold-dark)' }}
          >
            {planName}
          </span>
          <span
            className="inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-semibold"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: 'var(--border)' }}>
        <Stat label="Licensed seats" value={`${account.seats} ${account.seats === 1 ? 'seat' : 'seats'}`} />
        <Stat
          label={account.status === 'trial' ? 'First charge' : 'Renews on'}
          value={new Date(account.renewsAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        />
        <div className="px-5 py-4">
          <dt className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            Billing email
          </dt>
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEmail()}
                autoFocus
                className="h-8 flex-1 min-w-0 rounded-md border bg-white px-2 text-[13px] focus:outline-none focus:border-yellow-600"
                style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
              />
              <button
                type="button"
                onClick={saveEmail}
                aria-label="Save billing email"
                className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center text-white"
                style={{ background: 'var(--gold)' }}
              >
                <Check size={14} weight="bold" />
              </button>
            </div>
          ) : (
            <dd className="flex items-center gap-1.5">
              <span className="text-[13.5px] truncate" style={{ color: 'var(--text-primary)' }}>
                {account.billingEmail}
              </span>
              <button
                type="button"
                onClick={() => {
                  setDraft(account.billingEmail)
                  setEditing(true)
                }}
                aria-label="Edit billing email"
                className="shrink-0 transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                <PencilSimple size={13} />
              </button>
            </dd>
          )}
        </div>
      </dl>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4">
      <dt className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </dt>
      <dd className="text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
        {value}
      </dd>
    </div>
  )
}
