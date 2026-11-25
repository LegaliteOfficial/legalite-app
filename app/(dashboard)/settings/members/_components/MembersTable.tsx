'use client'

import { useState } from 'react'
import {
  DotsThreeVertical,
  ShieldCheck,
  Users,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  titleLabel,
  useDeactivateMember,
  useReactivateMember,
  type FirmMember,
} from '@/hooks/use-firm-members'
import { useAuthStore } from '@/stores/auth.store'
import { useCan } from '@/lib/access'
import { errorMessage } from '@/lib/errors'
import { Avatar } from './shared/Avatar'
import { MemberAccessDialog } from './MemberAccessDialog'
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
  onInvite?: () => void
}) {
  const canManage = useCan('manage-users')
  const myId = useAuthStore((s) => s.user?.id)
  const [editing, setEditing] = useState<FirmMember | null>(null)
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
    // Phones: scroll sideways rather than crush the columns.
    <div className="overflow-x-auto scrollbar-none">
    <div className="min-w-[640px]">
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
            <MemberRoles member={m} />
            <StatusBadge status={m.status} />
            <div className="flex justify-end">
              {canManage && m.firm_role !== 'owner' && m.profile_id !== myId ? (
                <MemberRowMenu member={m} onEditAccess={() => setEditing(m)} />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <TableFooter count={members.length} noun="member" />
    </div>
    <MemberAccessDialog member={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

/** The roles a member holds, as compact chips. */
function MemberRoles({ member }: { member: FirmMember }) {
  const roles = member.roles ?? []
  if (roles.length === 0) {
    return <span className="text-sm" style={{ color: '#9CA3AF' }}>No role</span>
  }
  return (
    <div className="flex min-w-0 flex-wrap gap-1">
      {roles.map((r) => (
        <span
          key={r.id}
          className="inline-flex max-w-full items-center truncate rounded px-1.5 py-0.5 text-[11.5px] font-medium"
          style={{
            background: r.is_system ? 'rgba(13,27,42,0.06)' : 'rgba(201,151,43,0.12)',
            color: r.is_system ? 'var(--navy)' : 'var(--gold-dark)',
          }}
          title={r.name}
        >
          {r.name}
        </span>
      ))}
    </div>
  )
}

function MemberRowMenu({ member, onEditAccess }: { member: FirmMember; onEditAccess: () => void }) {
  const [open, setOpen] = useState(false)
  const deactivate = useDeactivateMember()
  const reactivate = useReactivateMember()
  const isActive = member.status === 'active'

  const handleDeactivate = async () => {
    const id = toast.loading(`Removing ${member.name}'s access...`)
    try {
      await deactivate.mutateAsync(member.id)
      toast.success(`${member.name} no longer has access to the firm.`, { id })
    } catch (err) {
      toast.error(errorMessage(err, 'Unable to deactivate this member.'), { id })
    }
  }
  const handleReactivate = async () => {
    const id = toast.loading(`Restoring ${member.name}'s access...`)
    try {
      await reactivate.mutateAsync(member.id)
      toast.success(`${member.name} has been reactivated.`, { id })
    } catch (err) {
      toast.error(errorMessage(err, 'Unable to reactivate this member.'), { id })
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
          className="absolute right-0 top-9 z-10 w-52 rounded-md border shadow-lg overflow-hidden"
          style={{ background: 'white', borderColor: 'var(--border)' }}
        >
          {isActive && <MenuItem onClick={onEditAccess}>Change roles and title</MenuItem>}
          {isActive ? (
            <MenuItem onClick={() => void handleDeactivate()} tone="danger">
              Deactivate
            </MenuItem>
          ) : (
            <MenuItem onClick={() => void handleReactivate()}>Reactivate</MenuItem>
          )}
        </div>
      )}
    </div>
  )
}
