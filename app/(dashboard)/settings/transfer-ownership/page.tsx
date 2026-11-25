'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApolloClient, useMutation } from '@apollo/client/react'
import { ArrowLeft, Crown, LockSimple, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/shared/Spinner'
import { titleLabel, useFirmMembers } from '@/hooks/use-firm-members'
import { FirmMembersQueryDoc, TransferOwnershipMutationDoc } from '@/lib/graphql/members'
import { MyAccessQueryDoc } from '@/lib/graphql/auth'
import { useAuthStore } from '@/stores/auth.store'
import { errorMessage } from '@/lib/errors'
import { DEV_BYPASS } from '@/lib/access'

/**
 * Hand ownership of the firm to another active member. Only the current owner
 * can do this. The new owner gets full, permanent access; the outgoing owner
 * becomes an Administrator or a Member.
 */
export default function TransferOwnershipPage() {
  const router = useRouter()
  const apollo = useApolloClient()
  const me = useAuthStore((s) => s.user)
  const firmRole = useAuthStore((s) => s.activeMembership?.firm_role)
  const firmName = useAuthStore((s) => s.activeMembership?.firm_name ?? 'the firm')
  const setAccess = useAuthStore((s) => s.setAccess)
  const { data: members, isLoading } = useFirmMembers()
  const [mutate, { loading }] = useMutation(TransferOwnershipMutationDoc, {
    refetchQueries: [FirmMembersQueryDoc],
  })

  const [newOwnerId, setNewOwnerId] = useState<string | null>(null)
  const [outgoingRole, setOutgoingRole] = useState<'admin' | 'member'>('admin')
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState('')

  const candidates = useMemo(
    () => (members ?? []).filter((m) => m.status === 'active' && m.profile_id !== me?.id),
    [members, me?.id],
  )
  const chosen = candidates.find((m) => m.profile_id === newOwnerId) ?? null
  const ready = !!chosen && reason.trim().length > 0 && confirm.trim().toLowerCase() === 'transfer'

  if (!DEV_BYPASS && firmRole !== 'owner') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'rgba(13,27,42,0.06)' }}>
          <LockSimple size={22} style={{ color: 'var(--navy)' }} />
        </div>
        <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--navy)' }}>
          Only the firm owner can transfer ownership
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: '#6B7280' }}>
          Ask the owner of {firmName} if ownership needs to change.
        </p>
        <Link href="/settings" className="mt-5 text-sm font-semibold hover:underline" style={{ color: 'var(--gold-dark)' }}>
          Back to settings
        </Link>
      </div>
    )
  }

  const submit = async () => {
    if (!chosen || !ready) return
    const id = toast.loading(`Transferring ownership to ${chosen.name}...`)
    try {
      await mutate({
        variables: {
          input: {
            new_owner_profile_id: chosen.profile_id,
            new_role_for_outgoing_owner: outgoingRole,
            reason: reason.trim(),
          },
        },
      })
      // Pick up the new access level straight away.
      const { data } = await apollo.query({ query: MyAccessQueryDoc, fetchPolicy: 'network-only' })
      if (data?.myAccess) {
        setAccess({
          permissions: data.myAccess.permissions,
          firm_role: data.myAccess.firm_role,
          professional_title: data.myAccess.professional_title,
        })
      }
      toast.success(`${chosen.name} now owns ${firmName}.`, { id })
      router.push('/settings/members')
    } catch (err) {
      toast.error(errorMessage(err, 'Ownership could not be transferred. Please try again.'), { id })
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link href="/settings" className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: '#6B7280' }}>
        <ArrowLeft size={14} /> Settings
      </Link>
      <h1 className="font-heading text-2xl font-bold" style={{ color: 'var(--navy)' }}>
        Transfer ownership
      </h1>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: '#6B7280' }}>
        Make another member the owner of {firmName}. The owner always has full access and is the only person who
        can transfer ownership again.
      </p>

      <div
        className="mt-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[13px]"
        style={{ borderColor: 'rgba(217,119,6,0.35)', background: 'rgba(245,158,11,0.08)', color: '#92400E' }}
      >
        <Warning size={16} className="mt-0.5 shrink-0" />
        <span>
          You will stop being the owner as soon as you confirm. Only the new owner can give ownership back.
        </span>
      </div>

      <section className="mt-6 space-y-5 rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--border)' }}>
        <div>
          <Label className="mb-2 block text-[12px] font-semibold" style={{ color: 'var(--navy)' }}>
            New owner
          </Label>
          {isLoading ? (
            <div className="flex items-center gap-2 py-3 text-[13px]" style={{ color: '#6B7280' }}>
              <Spinner size={14} /> Loading members...
            </div>
          ) : candidates.length === 0 ? (
            <p className="rounded-lg border px-3 py-3 text-[13px]" style={{ borderColor: 'var(--border)', color: '#6B7280' }}>
              There is no other active member yet.{' '}
              <Link href="/settings/members?invite=open" className="font-semibold hover:underline" style={{ color: 'var(--gold-dark)' }}>
                Invite someone
              </Link>{' '}
              first.
            </p>
          ) : (
            <div className="divide-y overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
              {candidates.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-black/[0.02]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <input
                    type="radio"
                    name="new-owner"
                    checked={newOwnerId === m.profile_id}
                    onChange={() => setNewOwnerId(m.profile_id)}
                    className="h-4 w-4 accent-yellow-600"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold" style={{ color: 'var(--navy)' }}>
                      {m.name}
                    </span>
                    <span className="block truncate text-[12px]" style={{ color: '#6B7280' }}>
                      {titleLabel(m.professional_title)} · {m.email}
                    </span>
                  </span>
                  {newOwnerId === m.profile_id && <Crown size={16} style={{ color: 'var(--gold)' }} />}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label className="mb-1.5 block text-[12px] font-semibold" style={{ color: 'var(--navy)' }}>
            Your access afterwards
          </Label>
          <Select value={outgoingRole} onValueChange={(v) => setOutgoingRole(v === 'member' ? 'member' : 'admin')}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrator (full access)</SelectItem>
              <SelectItem value="member">Member (standard access)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="transfer-reason" className="mb-1.5 block text-[12px] font-semibold" style={{ color: 'var(--navy)' }}>
            Reason
          </Label>
          <Textarea
            id="transfer-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="For the firm's records, e.g. retiring from practice."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="transfer-confirm" className="mb-1.5 block text-[12px] font-semibold" style={{ color: 'var(--navy)' }}>
            Type <span className="font-mono">transfer</span> to confirm
          </Label>
          <input
            id="transfer-confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:border-yellow-600"
            style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
          />
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={() => void submit()} disabled={!ready || loading} variant="destructive">
            {loading && <Spinner size={14} />}
            {loading ? 'Transferring...' : chosen ? `Make ${chosen.name} the owner` : 'Transfer ownership'}
          </Button>
        </div>
      </section>
    </div>
  )
}
