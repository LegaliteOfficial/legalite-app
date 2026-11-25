'use client'

import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { Check, PencilSimple, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Spinner } from '@/components/shared/Spinner'
import { useFirmMembers } from '@/hooks/use-firm-members'
import { CurrentFirmQueryDoc, UpdateFirmMutationDoc } from '@/lib/graphql/firms'
import { errorMessage } from '@/lib/errors'
import type { CurrentFirmQuery } from '@/types/generated/graphql'
import { planLabel } from '../_constants'

type Firm = NonNullable<CurrentFirmQuery['currentFirm']>

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: 'Active', bg: 'rgba(33,106,67,0.12)', color: '#216A43' },
  suspended: { label: 'Suspended', bg: 'rgba(192,57,43,0.12)', color: '#C0392B' },
  archived: { label: 'Archived', bg: 'rgba(13,27,42,0.08)', color: 'var(--text-secondary)' },
}

/** Who owns the firm account, its plan, its members and where billing mail goes. */
export function AccountOverviewCard({ firm }: { firm: Firm }) {
  const { data: members } = useFirmMembers()
  const [updateFirm, { loading: saving }] = useMutation(UpdateFirmMutationDoc, {
    refetchQueries: [CurrentFirmQueryDoc],
    awaitRefetchQueries: true,
  })
  const owner = members?.find((m) => m.firm_role === 'owner')
  const activeCount = members?.filter((m) => m.status === 'active').length
  const status = STATUS_STYLE[firm.status] ?? { label: firm.status, bg: 'rgba(13,27,42,0.08)', color: 'var(--text-secondary)' }

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(firm.email ?? '')

  const saveEmail = async () => {
    const email = draft.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email address.')
      return
    }
    const id = toast.loading('Saving the firm email...')
    try {
      await updateFirm({ variables: { input: { email } } })
      setEditing(false)
      toast.success('Firm email updated.', { id })
    } catch (err) {
      toast.error(errorMessage(err, 'The email could not be saved.'), { id })
    }
  }

  const initials = (owner?.name ?? firm.name)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <section
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.05)' }}
    >
      <div className="flex flex-wrap items-center gap-4 p-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <span
          className="inline-flex items-center justify-center h-11 w-11 rounded-full text-[14px] font-bold shrink-0"
          style={{ background: 'var(--navy)', color: 'white' }}
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
            {owner?.name ?? (members ? 'Owner not found' : 'Loading owner...')}
          </p>
          <p className="truncate text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Account owner{owner?.email ? ` · ${owner.email}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-bold"
            style={{ background: 'var(--gold-muted)', color: 'var(--gold-dark)' }}
          >
            {planLabel(firm.plan)}
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
        <Stat
          label="Active members"
          value={activeCount === undefined ? '...' : `${activeCount} ${activeCount === 1 ? 'member' : 'members'}`}
        />
        <Stat
          label="On Legalite since"
          value={new Date(firm.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        />
        <div className="px-5 py-4">
          <dt className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            Firm email
          </dt>
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void saveEmail()}
                autoFocus
                disabled={saving}
                className="h-8 flex-1 min-w-0 rounded-md border bg-white px-2 text-[13px] focus:outline-none focus:border-yellow-600"
                style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
              />
              <button
                type="button"
                onClick={() => void saveEmail()}
                disabled={saving}
                aria-label="Save firm email"
                className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center text-white cursor-pointer"
                style={{ background: 'var(--gold)' }}
              >
                {saving ? <Spinner size={12} /> : <Check size={14} weight="bold" />}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                aria-label="Cancel"
                className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <dd className="flex items-center gap-1.5">
              <span className="text-[13.5px] truncate" style={{ color: firm.email ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {firm.email || 'Not set'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setDraft(firm.email ?? '')
                  setEditing(true)
                }}
                aria-label="Edit firm email"
                className="shrink-0 transition-opacity hover:opacity-70 cursor-pointer"
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
