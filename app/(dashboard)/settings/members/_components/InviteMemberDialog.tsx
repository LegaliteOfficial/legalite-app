'use client'

import { useMemo, useState } from 'react'
import { CheckCircle, Copy, Envelope, UserPlus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/shared/Spinner'
import { PROFESSIONAL_TITLES, titleLabel, useInviteMember } from '@/hooks/use-firm-members'
import { useFirmRoles } from '@/hooks/use-firm-roles'
import { useEffectiveFirmName } from '@/hooks/use-firm-name'
import { errorMessage } from '@/lib/errors'
import { EMAIL_RE } from '../_constants'
import { RolePicker, grantsFullAccess } from './RolePicker'

interface Sent {
  email: string
  acceptUrl: string
  expiresAt: string
}

/**
 * Invite someone to the firm. The backend creates the invitation and emails
 * the invitee a one-time link; following it, they set their own name and
 * password (or, with an existing Legalite account, sign in) and join with the
 * roles chosen here. The same link is shown afterwards so it can also be
 * shared directly.
 */
export function InviteMemberDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('associate')
  const [roleIds, setRoleIds] = useState<string[] | null>(null)
  const [touched, setTouched] = useState(false)
  const [sent, setSent] = useState<Sent | null>(null)
  const invite = useInviteMember()
  const { data: roles, isLoading: rolesLoading } = useFirmRoles()
  const firmName = useEffectiveFirmName({ fallback: 'sentence' }) ?? 'our firm'

  // Default to the Member system role until the inviter picks something.
  const defaultRoleIds = useMemo(() => {
    const member = (roles ?? []).find((r) => r.is_system && r.slug === 'member')
    return member ? [member.id] : []
  }, [roles])
  const selectedRoleIds = roleIds ?? defaultRoleIds

  const emailValid = EMAIL_RE.test(email.trim())
  const rolesValid = selectedRoleIds.length > 0

  const reset = () => {
    setEmail('')
    setTitle('associate')
    setRoleIds(null)
    setTouched(false)
    setSent(null)
  }

  const close = () => {
    if (invite.isPending) return
    reset()
    onClose()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!emailValid || !rolesValid) return
    const normalisedEmail = email.trim().toLowerCase()
    try {
      const issued = await invite.mutateAsync({
        email: normalisedEmail,
        professional_title: title,
        firm_role: grantsFullAccess(roles ?? [], selectedRoleIds) ? 'admin' : 'member',
        role_ids: selectedRoleIds,
      })
      if (!issued) throw new Error('The invitation could not be created. Please try again.')
      setSent({
        email: normalisedEmail,
        acceptUrl: issued.accept_url,
        expiresAt: issued.invitation.expires_at,
      })
      toast.success(`Invitation sent to ${normalisedEmail}.`)
    } catch (err) {
      toast.error(errorMessage(err, 'The invitation could not be sent. Please try again.'))
    }
  }

  const copyLink = async () => {
    if (!sent) return
    try {
      await navigator.clipboard.writeText(sent.acceptUrl)
      toast.success('Invitation link copied.')
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.')
    }
  }

  const mailto = sent
    ? `mailto:${encodeURIComponent(sent.email)}?subject=${encodeURIComponent(
        `Join ${firmName} on Legalite`,
      )}&body=${encodeURIComponent(
        `Hello,\n\nYou have been invited to join ${firmName} on Legalite as ${titleLabel(title)}.\n\n` +
          `Accept the invitation here:\n${sent.acceptUrl}\n\n` +
          `The link works once and expires on ${new Date(sent.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
      )}`
    : ''

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]" style={{ background: 'var(--cream-white)' }}>
        {sent ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--navy)' }}>
                <CheckCircle size={20} weight="fill" className="text-emerald-600" /> Invitation sent
              </DialogTitle>
              <DialogDescription>
                We emailed {sent.email} a link to join {firmName}. They choose their own password when they
                accept. If they already use Legalite, they sign in and the firm is added to their account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 pt-1">
              <Label className="block text-[12px] font-semibold" style={{ color: 'var(--navy)' }}>
                Invitation link
              </Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={sent.acceptUrl} className="h-10 font-mono text-[12px]" onFocus={(e) => e.target.select()} />
                <Button type="button" variant="outline" className="h-10 shrink-0" onClick={() => void copyLink()}>
                  <Copy size={14} /> Copy
                </Button>
              </div>
              <p className="text-[11.5px]" style={{ color: '#6B7280' }}>
                Works once. Expires{' '}
                {new Date(sent.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.
                You can resend or revoke it from the Invitations tab.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => { window.location.href = mailto }}>
                <Envelope size={14} /> Send from my email
              </Button>
              <Button type="button" variant="outline" onClick={reset}>
                Invite someone else
              </Button>
              <Button type="button" onClick={close}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--navy)' }}>Invite a firm member</DialogTitle>
              <DialogDescription>
                They receive an email with a link to join {firmName}. Their access comes from the roles you
                choose, and you can change it at any time.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} className="space-y-4 pt-1" noValidate>
              <div>
                <Label htmlFor="invite-email" className="mb-1.5 block text-[12px] font-semibold" style={{ color: 'var(--navy)' }}>
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
                {touched && !emailValid && <p className="mt-1 text-xs text-red-500">Enter a valid email address.</p>}
              </div>

              <div>
                <Label className="mb-1.5 block text-[12px] font-semibold" style={{ color: 'var(--navy)' }}>
                  Professional title
                </Label>
                <Select value={title} onValueChange={(v) => setTitle((v as string) || 'associate')}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFESSIONAL_TITLES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <RolePicker
                  roles={roles ?? []}
                  loading={rolesLoading}
                  value={selectedRoleIds}
                  onChange={setRoleIds}
                />
                {touched && !rolesValid && <p className="mt-1 text-xs text-red-500">Choose at least one role.</p>}
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={close} disabled={invite.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={invite.isPending}>
                  {invite.isPending ? <Spinner size={14} /> : <UserPlus size={14} />}
                  {invite.isPending ? 'Sending...' : 'Send invitation'}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
