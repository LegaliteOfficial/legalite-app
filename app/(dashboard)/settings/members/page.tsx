'use client'

/**
 * Firm members — composition root.
 *
 * Two tabs (Members / Pending invitations) + an Invite Member dialog.
 * Auto-opens the invite dialog when arriving with `?invite=open` (the
 * dashboard onboarding banner deep-links here).
 */

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CaretRight,
  MagnifyingGlass,
  UserPlus,
} from '@phosphor-icons/react'
import {
  titleLabel,
  useFirmMembers,
  usePendingInvitations,
} from '@/hooks/use-firm-members'
import { TABS } from './_constants'
import type { TabId } from './_types'
import { InvitationsTable } from './_components/InvitationsTable'
import { InviteMemberDialog } from './_components/InviteMemberDialog'
import { MembersTable } from './_components/MembersTable'

export default function FirmMembersPage() {
  const [activeTab, setActiveTab] = useState<TabId>('members')
  const [query, setQuery] = useState('')

  const router = useRouter()
  const pathname = usePathname()

  // We read the search string directly in the useState initialiser
  // (sidesteps React 19's "no setState in effect" rule that a
  // post-mount setState would trip), then clean the URL via a separate
  // effect that's a pure external side-effect.
  const [inviteOpen, setInviteOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      new URLSearchParams(window.location.search).get('invite') === 'open'
    )
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('invite') === 'open') {
      params.delete('invite')
      const cleaned = params.toString()
      router.replace(cleaned ? `${pathname}?${cleaned}` : pathname, {
        scroll: false,
      })
    }
  }, [pathname, router])

  const { data: members, isLoading: membersLoading } = useFirmMembers()
  const { data: invites, isLoading: invitesLoading } = usePendingInvitations()

  const filteredMembers = useMemo(() => {
    const list = members ?? []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        titleLabel(m.professional_title).toLowerCase().includes(q),
    )
  }, [members, query])

  const filteredInvites = useMemo(() => {
    const list = invites ?? []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((i) => i.email.toLowerCase().includes(q))
  }, [invites, query])

  const pendingCount = invites?.length ?? 0

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ background: 'var(--cream)' }}
    >
      {/* Breadcrumb */}
      <div
        className="flex items-center gap-2 text-sm mb-5"
        style={{ color: 'var(--navy)' }}
      >
        <Link
          href="/settings"
          className="hover:opacity-70 transition-opacity"
          style={{ color: '#6B7280' }}
        >
          Settings
        </Link>
        <CaretRight
          size={14}
          strokeWidth={2.25}
          style={{ color: '#9CA3AF' }}
        />
        <span className="font-bold">Firm members</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-6 flex-wrap">
        <div className="max-w-2xl">
          <div
            className="text-[10px] font-bold tracking-[3px] uppercase mb-2"
            style={{ color: '#9CA3AF' }}
          >
            Your firm
          </div>
          <h1
            className="font-heading text-3xl font-extrabold mb-3 leading-tight"
            style={{ color: 'var(--navy)' }}
          >
            Firm members
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: '#6B7280' }}
          >
            Invite colleagues to your firm and assign each person a
            professional title and a level of access. Invitations are sent
            by email and expire if not accepted.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
          style={{
            background: 'linear-gradient(135deg, #C9972B 0%, #B8860B 100%)',
          }}
        >
          <UserPlus size={14} strokeWidth={2.5} /> Invite member
        </button>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: 'var(--cream-white)',
          borderColor: 'var(--border)',
          boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
        }}
      >
        {/* Tabs + search */}
        <div
          className="flex items-center justify-between gap-4 flex-wrap px-5 pt-4 pb-3 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-1 flex-wrap">
            {TABS.map((t) => {
              const active = t.id === activeTab
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors"
                  style={{
                    background: active ? 'var(--navy)' : 'transparent',
                    color: active ? 'white' : '#6B7280',
                  }}
                >
                  {t.label}
                  {t.id === 'invitations' && pendingCount > 0 && (
                    <span
                      className="inline-flex items-center justify-center rounded-full min-w-[18px] h-[18px] px-1 text-[10px] font-bold"
                      style={{
                        background: active
                          ? 'rgba(255,255,255,0.2)'
                          : 'rgba(201,151,43,0.16)',
                        color: active ? 'white' : 'var(--gold-dark)',
                      }}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="relative">
            <MagnifyingGlass
              size={14}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: '#9CA3AF' }}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === 'members' ? 'Search members' : 'Search invitations'
              }
              className="h-9 w-64 rounded-md border bg-white pl-9 pr-3 text-sm transition-colors focus:outline-none focus:border-yellow-600"
              style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
            />
          </div>
        </div>

        {activeTab === 'members' ? (
          <MembersTable
            members={filteredMembers}
            loading={membersLoading}
            onInvite={() => setInviteOpen(true)}
          />
        ) : (
          <InvitationsTable
            invites={filteredInvites}
            loading={invitesLoading}
            onInvite={() => setInviteOpen(true)}
          />
        )}
      </div>

      <InviteMemberDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  )
}
