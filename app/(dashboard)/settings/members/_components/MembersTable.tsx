'use client'

import { useState } from 'react'
import {
  DotsThreeVertical,
  ShieldCheck,
  Users,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  roleLabel,
  titleLabel,
  useDeactivateMember,
  useReactivateMember,
  type FirmMember,
} from '@/hooks/use-firm-members'
import { Avatar } from './shared/Avatar'
import { EmptyState } from './shared/EmptyState'
import { LoadingRow } from './shared/LoadingRow'
import { MenuItem } from './shared/MenuItem'
import { StatusBadge } from './shared/StatusBadge'
import { TableFooter } from './shared/TableFooter'

export function MembersTable({
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
