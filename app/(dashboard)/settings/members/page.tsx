'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CaretRight, MagnifyingGlass, Plus, DotsThreeVertical, UserPlus, Envelope, Users, ShieldCheck, Clock } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/shared/Spinner'
import {
  useFirmMembers,
  usePendingInvitations,
  useInviteMember,
  useResendInvitation,
  useRevokeInvitation,
  useDeactivateMember,
  useReactivateMember,
  PROFESSIONAL_TITLES,
  titleLabel,
  roleLabel,
  type FirmMember,
  type PendingInvitation,
} from '@/hooks/use-firm-members'
import { useFirmRoles } from '@/hooks/use-firm-roles'

type TabId = 'members' | 'invitations'

const TABS: { id: TabId; label: string }[] = [
  { id: 'members', label: 'Members' },
  { id: 'invitations', label: 'Pending invitations' },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FirmMembersPage() {
  const [activeTab, setActiveTab] = useState<TabId>('members')
  const [query, setQuery] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)

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
    <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--cream)' }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-5" style={{ color: 'var(--navy)' }}>
        <Link href="/settings" className="hover:opacity-70 transition-opacity" style={{ color: '#6B7280' }}>Gear</Link>
        <CaretRight size={14} strokeWidth={2.25} style={{ color: '#9CA3AF' }} />
        <span className="font-bold">Firm members</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-6 flex-wrap">
        <div className="max-w-2xl">
          <div className="text-[10px] font-bold tracking-[3px] uppercase mb-2" style={{ color: '#9CA3AF' }}>
            Your firm
          </div>
          <h1 className="font-heading text-3xl font-extrabold mb-3 leading-tight" style={{ color: 'var(--navy)' }}>
            Firm members
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            Invite colleagues to your firm and assign each person a professional title and a level of access. Invitations are sent by email and expire if not accepted.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
          style={{ background: 'linear-gradient(135deg, #C9972B 0%, #B8860B 100%)' }}
        >
          <UserPlus size={14} strokeWidth={2.5} /> Invite member
        </button>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--cream-white)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.05)' }}
      >
        {/* Tabs + search */}
        <div className="flex items-center justify-between gap-4 flex-wrap px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
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
                        background: active ? 'rgba(255,255,255,0.2)' : 'rgba(201,151,43,0.16)',
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
            <MagnifyingGlass size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeTab === 'members' ? 'Search members' : 'Search invitations'}
              className="h-9 w-64 rounded-md border bg-white pl-9 pr-3 text-sm transition-colors focus:outline-none focus:border-yellow-600"
              style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
            />
          </div>
        </div>

        {activeTab === 'members'
          ? <MembersTable members={filteredMembers} loading={membersLoading} onInvite={() => setInviteOpen(true)} />
          : <InvitationsTable invites={filteredInvites} loading={invitesLoading} onInvite={() => setInviteOpen(true)} />}
      </div>

      <InviteMemberDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}

// ── Members table ────────────────────────────────────────────────────────────

function MembersTable({
  members, loading, onInvite,
}: {
  members: FirmMember[]
  loading: boolean
  onInvite: () => void
}) {
  if (loading) return <LoadingRow />
  if (members.length === 0) {
    return (
      <EmptyState
        icon={<Users size={28} strokeWidth={1.5} style={{ color: 'var(--navy)' }} />}
        title="No members yet"
        body="Invite colleagues to collaborate on matters, clients, and documents across your firm."
        action={onInvite}
        actionLabel="Invite member"
      />
    )
  }

  return (
    <>
      <div className="grid grid-cols-[1.6fr_1fr_0.9fr_0.7fr_48px] gap-4 px-5 py-3 border-b text-[11px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--border)', color: '#6B7280' }}>
        <span>Member</span>
        <span>Title</span>
        <span>Access</span>
        <span>Status</span>
        <span className="text-right">Action</span>
      </div>
      <ul>
        {members.map((m, i) => (
          <li
            key={m.id}
            className="grid grid-cols-[1.6fr_1fr_0.9fr_0.7fr_48px] gap-4 px-5 py-4 items-center"
            style={{ borderBottom: i === members.length - 1 ? 'none' : '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={m.name} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold truncate" style={{ color: 'var(--navy)' }}>{m.name}</span>
                  {m.verification_status === 'verified' && (
                    <ShieldCheck size={13} strokeWidth={2.25} style={{ color: 'var(--gold)' }} aria-label="Verified" />
                  )}
                </div>
                <p className="text-[13px] truncate" style={{ color: '#6B7280' }}>{m.email}</p>
              </div>
            </div>
            <span className="text-sm" style={{ color: 'var(--navy)' }}>{titleLabel(m.professional_title)}</span>
            <span className="text-sm" style={{ color: '#6B7280' }}>{roleLabel(m.firm_role)}</span>
            <StatusBadge status={m.status} />
            <div className="flex justify-end">
              <MemberRowMenu member={m} />
            </div>
          </li>
        ))}
      </ul>
      <TableFooter count={members.length} noun="member" />
    </>
  )
}

function MemberRowMenu({ member }: { member: FirmMember }) {
  const [open, setOpen] = useState(false)
  const deactivate = useDeactivateMember()
  const reactivate = useReactivateMember()
  const isOwner = member.firm_role === 'owner'
  const isActive = member.status === 'active'

  const handleDeactivate = async () => {
    try {
      await deactivate.mutateAsync(member.id)
      toast.success(`${member.name} has been deactivated.`)
    } catch {
      toast.error('Unable to deactivate this member.')
    }
  }
  const handleReactivate = async () => {
    try {
      await reactivate.mutateAsync(member.id)
      toast.success(`${member.name} has been reactivated.`)
    } catch {
      toast.error('Unable to reactivate this member.')
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-label={`Actions for ${member.name}`}
        className="h-8 w-8 rounded-md flex items-center justify-center transition-colors hover:bg-black/[0.04]"
        style={{ color: 'var(--navy)' }}
      >
        <DotsThreeVertical size={16} strokeWidth={2} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-9 z-10 w-48 rounded-md border shadow-lg overflow-hidden"
          style={{ background: 'white', borderColor: 'var(--border)' }}
        >
          <MenuItem onClick={() => toast.message('Member detail view — coming next.')}>View profile</MenuItem>
          <MenuItem
            onClick={() => toast.message('Role and title editing — coming next.')}
            tone={isOwner ? 'disabled' : 'default'}
          >
            Change role and title
          </MenuItem>
          {isActive ? (
            <MenuItem onClick={handleDeactivate} tone={isOwner ? 'disabled' : 'danger'}>
              Deactivate
            </MenuItem>
          ) : (
            <MenuItem onClick={handleReactivate}>Reactivate</MenuItem>
          )}
        </div>
      )}
    </div>
  )
}

// ── Invitations table ────────────────────────────────────────────────────────

function InvitationsTable({
  invites, loading, onInvite,
}: {
  invites: PendingInvitation[]
  loading: boolean
  onInvite: () => void
}) {
  if (loading) return <LoadingRow />
  if (invites.length === 0) {
    return (
      <EmptyState
        icon={<Envelope size={28} strokeWidth={1.5} style={{ color: 'var(--navy)' }} />}
        title="No pending invitations"
        body="Invitations you send appear here until they are accepted or expire."
        action={onInvite}
        actionLabel="Invite member"
      />
    )
  }

  return (
    <>
      <div className="grid grid-cols-[1.6fr_1fr_0.9fr_0.9fr_48px] gap-4 px-5 py-3 border-b text-[11px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--border)', color: '#6B7280' }}>
        <span>Email</span>
        <span>Title</span>
        <span>Access</span>
        <span>Expires</span>
        <span className="text-right">Action</span>
      </div>
      <ul>
        {invites.map((inv, i) => (
          <li
            key={inv.id}
            className="grid grid-cols-[1.6fr_1fr_0.9fr_0.9fr_48px] gap-4 px-5 py-4 items-center"
            style={{ borderBottom: i === invites.length - 1 ? 'none' : '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(13,27,42,0.06)' }}
              >
                <Clock size={15} strokeWidth={2} style={{ color: '#6B7280' }} />
              </div>
              <span className="text-sm font-semibold truncate" style={{ color: 'var(--navy)' }}>{inv.email}</span>
            </div>
            <span className="text-sm" style={{ color: 'var(--navy)' }}>{titleLabel(inv.professional_title)}</span>
            <span className="text-sm" style={{ color: '#6B7280' }}>{roleLabel(inv.firm_role)}</span>
            <ExpiryLabel expiresAt={inv.expires_at} />
            <div className="flex justify-end">
              <InvitationRowMenu invitation={inv} />
            </div>
          </li>
        ))}
      </ul>
      <TableFooter count={invites.length} noun="invitation" />
    </>
  )
}

function InvitationRowMenu({ invitation }: { invitation: PendingInvitation }) {
  const [open, setOpen] = useState(false)
  const resend = useResendInvitation()
  const revoke = useRevokeInvitation()

  const handleResend = async () => {
    try {
      await resend.mutateAsync(invitation.id)
      toast.success(`Invitation resent to ${invitation.email}.`)
    } catch {
      toast.error('Unable to resend this invitation.')
    }
  }
  const handleRevoke = async () => {
    try {
      await revoke.mutateAsync(invitation.id)
      toast.success(`Invitation to ${invitation.email} revoked.`)
    } catch {
      toast.error('Unable to revoke this invitation.')
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-label={`Actions for invitation to ${invitation.email}`}
        className="h-8 w-8 rounded-md flex items-center justify-center transition-colors hover:bg-black/[0.04]"
        style={{ color: 'var(--navy)' }}
      >
        <DotsThreeVertical size={16} strokeWidth={2} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-9 z-10 w-44 rounded-md border shadow-lg overflow-hidden"
          style={{ background: 'white', borderColor: 'var(--border)' }}
        >
          <MenuItem onClick={handleResend}>Resend invitation</MenuItem>
          <MenuItem onClick={handleRevoke} tone="danger">Revoke invitation</MenuItem>
        </div>
      )}
    </div>
  )
}

// ── Invite dialog ────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function InviteMemberDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('lawyer')
  const [roleIds, setRoleIds] = useState<string[]>([])
  const [touched, setTouched] = useState(false)
  const invite = useInviteMember()
  const { data: roles, isLoading: rolesLoading } = useFirmRoles()

  const assignableRoles = roles ?? []
  const emailValid = EMAIL_RE.test(email.trim())
  const rolesValid = roleIds.length > 0

  const reset = () => {
    setEmail('')
    setTitle('lawyer')
    setRoleIds([])
    setTouched(false)
  }

  const close = () => {
    if (invite.isPending) return
    reset()
    onClose()
  }

  const toggleRole = (id: string) => {
    setRoleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!emailValid || !rolesValid) return
    // Derive the coarse firm_role (compat) from the chosen roles: granting a
    // system Owner/Administrator role implies admin power.
    const selected = assignableRoles.filter((r) => roleIds.includes(r.id))
    const isAdmin = selected.some(
      (r) => r.is_system && (r.slug === 'administrator' || r.slug === 'owner'),
    )
    try {
      await invite.mutateAsync({
        email: email.trim().toLowerCase(),
        professional_title: title,
        firm_role: isAdmin ? 'admin' : 'member',
        role_ids: roleIds,
      })
      toast.success(`Invitation sent to ${email.trim().toLowerCase()}.`)
      reset()
      onClose()
    } catch {
      toast.error('Unable to send the invitation. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close() }}>
      <DialogContent className="sm:max-w-[460px]" style={{ background: 'var(--cream-white)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--navy)' }}>Invite a firm member</DialogTitle>
          <DialogDescription>
            They will receive an email invitation to join your firm with the title and access you choose.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 pt-1">
          <div>
            <Label htmlFor="invite-email" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>
              Email address
            </Label>
            <Input
              id="invite-email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="colleague@example.gh"
              className="h-10"
            />
            {touched && !emailValid && (
              <p className="text-xs text-red-500 mt-1">Enter a valid email address.</p>
            )}
          </div>

          <div>
            <Label className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>
              Professional title
            </Label>
            <Select value={title} onValueChange={(v) => setTitle(v ?? 'lawyer')}>
              <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROFESSIONAL_TITLES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role assignment — the access this person will have. */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[12px] font-semibold block" style={{ color: 'var(--navy)' }}>
                Roles
              </Label>
              <Link
                href="/settings/roles/new"
                className="text-[11px] font-semibold hover:underline"
                style={{ color: 'var(--gold-dark)' }}
              >
                + Create role
              </Link>
            </div>
            <div
              className="rounded-lg border divide-y max-h-52 overflow-y-auto"
              style={{ borderColor: 'var(--border)' }}
            >
              {rolesLoading ? (
                <div className="flex items-center gap-2 px-3 py-4 text-[13px]" style={{ color: '#6B7280' }}>
                  <Spinner size={14} /> Loading roles…
                </div>
              ) : assignableRoles.length === 0 ? (
                <div className="px-3 py-4 text-[13px]" style={{ color: '#6B7280' }}>
                  No roles yet. <Link href="/settings/roles/new" className="font-semibold hover:underline" style={{ color: 'var(--gold-dark)' }}>Create one</Link> to assign access.
                </div>
              ) : (
                assignableRoles.map((r) => {
                  const checked = roleIds.includes(r.id)
                  return (
                    <label
                      key={r.id}
                      className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors hover:bg-black/[0.02]"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRole(r.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-yellow-600"
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold" style={{ color: 'var(--navy)' }}>{r.name}</span>
                          {r.is_system && (
                            <span
                              className="inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                              style={{ background: 'rgba(13,27,42,0.06)', color: '#6B7280' }}
                            >
                              System
                            </span>
                          )}
                        </span>
                        {r.description && r.description !== '—' && (
                          <span className="block text-[12px] leading-snug mt-0.5" style={{ color: '#6B7280' }}>{r.description}</span>
                        )}
                      </span>
                    </label>
                  )
                })
              )}
            </div>
            {touched && !rolesValid && (
              <p className="text-xs text-red-500 mt-1">Assign at least one role.</p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={close}
              disabled={invite.isPending}
              className="rounded-md px-4 py-2 text-sm font-semibold border transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--border)', color: 'var(--navy)', background: 'white' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={invite.isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-md px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #C9972B 0%, #B8860B 100%)' }}
            >
              {invite.isPending ? (<><Spinner size={14} className="mr-1" /> Sending…</>) : (<><Plus size={14} strokeWidth={2.5} /> Send invitation</>)}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Shared bits ──────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <div
      className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
      style={{ background: 'rgba(201,151,43,0.16)', color: 'var(--gold-dark)' }}
    >
      {initials || '?'}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const active = status === 'active'
  return (
    <span
      className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
      style={{
        background: active ? 'rgba(34,160,94,0.12)' : 'rgba(13,27,42,0.06)',
        color: active ? '#1B8A4C' : '#6B7280',
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: active ? '#1B8A4C' : '#9CA3AF' }} />
      {status}
    </span>
  )
}

function ExpiryLabel({ expiresAt }: { expiresAt: string }) {
  const expired = new Date(expiresAt).getTime() < Date.now()
  const formatted = new Date(expiresAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <span className="text-sm" style={{ color: expired ? '#B91C1C' : '#6B7280' }}>
      {expired ? 'Expired' : formatted}
    </span>
  )
}

function MenuItem({
  children, onClick, tone = 'default',
}: {
  children: React.ReactNode
  onClick: () => void
  tone?: 'default' | 'danger' | 'disabled'
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); if (tone !== 'disabled') onClick() }}
      disabled={tone === 'disabled'}
      className="w-full text-left text-sm px-3 py-2 transition-colors hover:bg-black/[0.04] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ color: tone === 'danger' ? '#B91C1C' : 'var(--navy)' }}
    >
      {children}
    </button>
  )
}

function TableFooter({ count, noun }: { count: number; noun: string }) {
  return (
    <div className="flex items-center px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
      <span className="text-sm" style={{ color: '#6B7280' }}>
        {count} {noun}{count === 1 ? '' : 's'}
      </span>
    </div>
  )
}

function LoadingRow() {
  return (
    <div className="flex items-center justify-center gap-2 py-16" style={{ color: '#6B7280' }}>
      <Spinner size={16} /> <span className="text-sm">Loading…</span>
    </div>
  )
}

function EmptyState({
  icon, title, body, action, actionLabel,
}: {
  icon: React.ReactNode
  title: string
  body: string
  action: () => void
  actionLabel: string
}) {
  return (
    <div className="py-16 px-5 text-center">
      <div
        className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(13,27,42,0.06)' }}
      >
        {icon}
      </div>
      <h3 className="font-heading text-lg font-bold mb-1" style={{ color: 'var(--navy)' }}>{title}</h3>
      <p className="text-sm mb-5 max-w-sm mx-auto leading-relaxed" style={{ color: '#6B7280' }}>{body}</p>
      <button
        type="button"
        onClick={action}
        className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: 'var(--navy)' }}
      >
        <UserPlus size={14} strokeWidth={2.5} /> {actionLabel}
      </button>
    </div>
  )
}
