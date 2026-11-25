'use client'

import { useState } from 'react'
import {
  Clock,
  DotsThreeVertical,
  Envelope,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/errors'
import {
  roleLabel,
  titleLabel,
  useResendInvitation,
  useRevokeInvitation,
  type PendingInvitation,
} from '@/hooks/use-firm-members'
import { EmptyState } from './shared/EmptyState'
import { ExpiryLabel } from './shared/ExpiryLabel'
import { LoadingRow } from './shared/LoadingRow'
import { MenuItem } from './shared/MenuItem'
import { TableFooter } from './shared/TableFooter'

export function InvitationsTable({
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
    // Phones: scroll sideways rather than crush the columns.
    <div className="overflow-x-auto scrollbar-none">
    <div className="min-w-[640px]">
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
    </div>
    </div>
  )
}

function InvitationRowMenu({ invitation }: { invitation: PendingInvitation }) {
  const [open, setOpen] = useState(false)
  const resend = useResendInvitation()
  const revoke = useRevokeInvitation()

  // Resending rotates the link (the old one stops working), emails the new
  // one and copies it so it can also be shared directly.
  const handleResend = async () => {
    const id = toast.loading(`Resending the invitation to ${invitation.email}...`)
    try {
      const issued = await resend.mutateAsync(invitation.id)
      let copied = false
      if (issued?.accept_url) {
        try {
          await navigator.clipboard.writeText(issued.accept_url)
          copied = true
        } catch {
          // Clipboard can be unavailable; the email still went out.
        }
      }
      toast.success(
        copied
          ? `Invitation resent to ${invitation.email}. The new link is copied.`
          : `Invitation resent to ${invitation.email}.`,
        { id },
      )
    } catch (err) {
      toast.error(errorMessage(err, 'Unable to resend this invitation.'), { id })
    }
  }
  const handleRevoke = async () => {
    const id = toast.loading('Revoking the invitation...')
    try {
      await revoke.mutateAsync(invitation.id)
      toast.success(`Invitation to ${invitation.email} revoked.`, { id })
    } catch (err) {
      toast.error(errorMessage(err, 'Unable to revoke this invitation.'), { id })
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
          <MenuItem onClick={() => void handleResend()}>Resend and copy link</MenuItem>
          <MenuItem onClick={() => void handleRevoke()} tone="danger">Revoke invitation</MenuItem>
        </div>
      )}
    </div>
  )
}
