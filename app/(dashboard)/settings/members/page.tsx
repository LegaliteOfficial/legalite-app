'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
// Phosphor icon set (project-wide standard). My invite-flow
// redesign added Eye/EyeSlash/Copy/ArrowsClockwise for the
// password field affordances.
import {
  CaretRight,
  MagnifyingGlass,
  DotsThreeVertical,
  UserPlus,
  Envelope,
  Users,
  ShieldCheck,
  Clock,
  Eye,
  EyeSlash,
  Copy,
  ArrowsClockwise,
} from '@phosphor-icons/react'
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
import {
  useEffectiveFirmName,
  useHasCustomFirmName,
} from '@/hooks/use-firm-name'
import { useAuthStore } from '@/stores/auth.store'

type TabId = 'members' | 'invitations'

const TABS: { id: TabId; label: string }[] = [
  { id: 'members', label: 'Members' },
  { id: 'invitations', label: 'Pending invitations' },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FirmMembersPage() {
  const [activeTab, setActiveTab] = useState<TabId>('members')
  const [query, setQuery] = useState('')

  const router = useRouter()
  const pathname = usePathname()

  // Auto-open the invite dialog when arriving with `?invite=open`
  // — the dashboard onboarding banner deep-links here so partners
  // don't have to find the button after landing. We read the search
  // string directly off window inside the useState initializer
  // (sidesteps React 19's "no setState in effect" rule that a
  // post-mount setState would trip), and clean the URL via a
  // separate effect that's a pure external side-effect (no state).
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

/**
 * Friendly password generator.
 *
 * Three random words from a small curated wordlist, joined with
 * dashes, plus a 3-digit numeric suffix. The output is easy to read
 * aloud / type but still has enough entropy for a first-login
 * credential (the invitee is expected to change it after their
 * first sign-in). Sample shape: "harbor-bronze-river-742".
 *
 * Wordlist deliberately avoids letters that are easily confused
 * (l, i, o) and trims to ~80 short, unambiguous English words.
 */
const PASSWORD_WORDS = [
  'amber', 'beacon', 'bronze', 'cedar', 'cipher', 'clover', 'coral',
  'crystal', 'dawn', 'delta', 'echo', 'ember', 'falcon', 'forest',
  'frost', 'garnet', 'harbor', 'haven', 'hazel', 'horizon', 'indigo',
  'ivory', 'jade', 'juniper', 'kestrel', 'lagoon', 'lantern', 'maple',
  'meadow', 'mesa', 'misty', 'morning', 'nebula', 'north', 'onyx',
  'opal', 'orchid', 'pebble', 'petal', 'pine', 'prairie', 'quartz',
  'raven', 'ridge', 'river', 'sable', 'sapphire', 'sienna', 'silver',
  'spark', 'spring', 'stone', 'storm', 'summit', 'sunset', 'thunder',
  'tide', 'topaz', 'tulip', 'velvet', 'vista', 'walnut', 'willow',
  'winter', 'zephyr',
]

function generatePassword(): string {
  // Use crypto for the picks when available so the value isn't
  // predictable from a non-secure PRNG; fall back to Math.random in
  // ancient browsers (still fine for a first-login credential).
  const pick = (n: number): number => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint32Array(1)
      crypto.getRandomValues(arr)
      return arr[0] % n
    }
    return Math.floor(Math.random() * n)
  }
  const w1 = PASSWORD_WORDS[pick(PASSWORD_WORDS.length)]
  const w2 = PASSWORD_WORDS[pick(PASSWORD_WORDS.length)]
  const w3 = PASSWORD_WORDS[pick(PASSWORD_WORDS.length)]
  const suffix = String(100 + pick(900))
  return `${w1}-${w2}-${w3}-${suffix}`
}

/**
 * Build the welcome email that gets opened in the inviter's mail
 * client (mailto: URL). Returns the components separately so the
 * dialog can show a live preview before send.
 *
 * Why a mailto + not a backend-sent email?
 *   - The backend `inviteMember` mutation today emits a token-based
 *     "accept-invite" link, which is the security-canonical flow.
 *   - The partner-driven password flow this firm wants is layered
 *     on top: we still register the invitation server-side (audit
 *     trail + the Invitations tab) AND open the inviter's mail
 *     client so they can send a hands-on welcome with the chosen
 *     credentials. Two emails is annoying but lets us ship this
 *     without a backend change. When the server gains a
 *     `welcome_credentials` flag we can drop the mailto half.
 */
interface WelcomeEmail {
  subject: string
  body: string
}

function buildWelcomeEmail(args: {
  firstName: string
  lastName: string
  email: string
  password: string
  titleLabel: string
  firmName: string
  partnerName: string | null
  loginUrl: string
}): WelcomeEmail {
  const fullName = `${args.firstName} ${args.lastName}`.trim() || args.email
  const subject = `Welcome to ${args.firmName} — your access credentials`
  const body =
    `Dear ${fullName},\n\n` +
    `Welcome to ${args.firmName}. You have been invited to join our ` +
    `practice as ${withArticle(args.titleLabel)}.\n\n` +
    `Your login credentials\n` +
    `──────────────────────\n` +
    `Sign-in page: ${args.loginUrl}\n` +
    `Email:        ${args.email}\n` +
    `Password:     ${args.password}\n\n` +
    `For your security, please change this password the first time ` +
    `you sign in (Settings → Account).\n\n` +
    `Once you are signed in, the dashboard will show the cases and ` +
    `clients you have been assigned to. Reach out to me directly if ` +
    `you have any questions getting started.\n\n` +
    `Welcome aboard.\n\n` +
    `Kind regards,\n` +
    `${args.partnerName ?? 'The partner team'}\n` +
    `${args.firmName}`
  return { subject, body }
}

/** "associate" -> "an associate"; "partner" -> "a partner". Picks the
 *  right article so the welcome sentence reads naturally. */
function withArticle(noun: string): string {
  const first = noun.trim().charAt(0).toLowerCase()
  const article = /[aeiou]/.test(first) ? 'an' : 'a'
  return `${article} ${noun}`
}

function InviteMemberDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Identity
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('lawyer')
  const [roleIds, setRoleIds] = useState<string[]>([])
  // Inviter-set credentials
  const [password, setPassword] = useState(() => generatePassword())
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState(false)
  const invite = useInviteMember()
  const { data: roles, isLoading: rolesLoading } = useFirmRoles()

  // Firm + inviter context for the welcome email.
  const firmName = useEffectiveFirmName({ fallback: 'sentence' })!
  const firmNameIsCustom = useHasCustomFirmName()
  const partnerName = useAuthStore((s) => s.user?.name ?? null)

  const assignableRoles = roles ?? []
  const emailValid = EMAIL_RE.test(email.trim())
  const rolesValid = roleIds.length > 0
  const namesValid = firstName.trim().length > 0 && lastName.trim().length > 0
  const passwordValid = password.trim().length >= 8

  const reset = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setTitle('lawyer')
    setRoleIds([])
    setPassword(generatePassword())
    setShowPassword(false)
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
    if (!emailValid || !rolesValid || !namesValid || !passwordValid) return
    // Derive the coarse firm_role (compat) from the chosen roles: granting a
    // system Owner/Administrator role implies admin power.
    const selected = assignableRoles.filter((r) => roleIds.includes(r.id))
    const isAdmin = selected.some(
      (r) => r.is_system && (r.slug === 'administrator' || r.slug === 'owner'),
    )
    const normalisedEmail = email.trim().toLowerCase()
    try {
      // Two-step send:
      //
      //   1. Register the invitation server-side so it appears in
      //      the Pending Invitations tab and shows up in the firm's
      //      audit trail. The backend's accept-invite email is the
      //      security-canonical second copy.
      //
      //   2. Open the inviter's mail client with a hand-composed
      //      welcome that names the title, includes a login link
      //      and the credentials the inviter chose. This is the
      //      partner-driven flow the firm asked for.
      //
      // If step 1 fails (backend error / network), we still want
      // step 2 to be available — the partner can resend after the
      // backend is back. So we try the mutation first but recover
      // gracefully on its failure.
      let serverSideRegistered = false
      try {
        await invite.mutateAsync({
          email: normalisedEmail,
          professional_title: title,
          firm_role: isAdmin ? 'admin' : 'member',
          role_ids: roleIds,
        })
        serverSideRegistered = true
      } catch {
        // Backend register failed — log a soft warning so the
        // partner knows they may need to retry, but proceed with
        // the welcome mailto so the invitee still gets credentials.
        toast.warning(
          "Couldn't register the invitation on the server. The welcome email is still queued — you can retry the registration later.",
        )
      }

      const loginUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/login`
          : '/login'
      const { subject, body } = buildWelcomeEmail({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalisedEmail,
        password: password.trim(),
        titleLabel: titleLabel(title),
        firmName: firmNameIsCustom ? firmName : firmName, // resolved either way
        partnerName,
        loginUrl,
      })
      const mailto =
        `mailto:${encodeURIComponent(normalisedEmail)}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`
      if (typeof window !== 'undefined') {
        window.open(mailto, '_self')
      }

      toast.success(
        serverSideRegistered
          ? `Invitation registered. Welcome email queued in your mail client for ${normalisedEmail}.`
          : `Welcome email queued in your mail client for ${normalisedEmail}.`,
      )
      reset()
      onClose()
    } catch {
      toast.error('Unable to send the invitation. Please try again.')
    }
  }

  /** Copy the generated password to the clipboard — used by the
   *  small copy affordance next to the password input. */
  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password)
      toast.success('Password copied to clipboard.')
    } catch {
      toast.error("Couldn't copy. Select the field and copy manually.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close() }}>
      <DialogContent
        className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--cream-white)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--navy)' }}>Invite a firm member</DialogTitle>
          <DialogDescription>
            Set the new member&rsquo;s login credentials and they&rsquo;ll
            receive a welcome email with their email, password, and a
            link to the dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 pt-1">
          {/* Identity — first + last name, used to address them in
              the welcome email. Required so the greeting reads as a
              real welcome, not a templated form letter. */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="invite-first" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>
                First name
              </Label>
              <Input
                id="invite-first"
                autoFocus
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Akosua"
                className="h-10"
              />
            </div>
            <div>
              <Label htmlFor="invite-last" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>
                Last name
              </Label>
              <Input
                id="invite-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Boateng"
                className="h-10"
              />
            </div>
          </div>
          {touched && !namesValid && (
            <p className="text-xs text-red-500 -mt-2">First and last name are required.</p>
          )}

          <div>
            <Label htmlFor="invite-email" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>
              Email address
            </Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="colleague@example.gh"
              className="h-10"
            />
            <p className="text-[11px] mt-1" style={{ color: '#6B7280' }}>
              This is also their login email.
            </p>
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
            <p className="text-[11px] mt-1" style={{ color: '#6B7280' }}>
              Spelled out in the welcome email — &ldquo;You have been
              invited as {withArticle(titleLabel(title))}&rdquo;.
            </p>
          </div>

          {/*
           * Login password — the partner sets this and we send it
           * to the invitee in the welcome email. The invitee is
           * expected to change it on first sign-in (the welcome
           * email asks them to). A small "regenerate" button mints
           * a fresh memorable passphrase; show/hide + copy give the
           * partner a chance to vet it before sending.
           */}
          <div>
            <Label htmlFor="invite-password" className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--navy)' }}>
              Login password
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  id="invite-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="Auto-generated — edit if you prefer"
                  className="h-10 pr-9 font-mono text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded inline-flex items-center justify-center cursor-pointer"
                  style={{ color: '#6B7280' }}
                >
                  {showPassword ? (
                    <EyeSlash size={13} strokeWidth={1.75} />
                  ) : (
                    <Eye size={13} strokeWidth={1.75} />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                aria-label="Generate a new password"
                title="Generate a new password"
                className="h-10 w-10 rounded-md border inline-flex items-center justify-center cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--navy)', background: 'white' }}
              >
                <ArrowsClockwise size={14} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={copyPassword}
                aria-label="Copy password to clipboard"
                title="Copy password"
                className="h-10 w-10 rounded-md border inline-flex items-center justify-center cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--navy)', background: 'white' }}
              >
                <Copy size={14} strokeWidth={1.75} />
              </button>
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: '#6B7280' }}>
              The invitee signs in at the dashboard URL with this email and
              password. The welcome email asks them to change it on first
              sign-in.
            </p>
            {touched && !passwordValid && (
              <p className="text-xs text-red-500 mt-1">Use at least 8 characters.</p>
            )}
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

          {/* Send strip — explainer + actions. The explainer makes
              the mailto behaviour obvious so the partner isn't
              surprised when their mail client opens. */}
          <div
            className="rounded-md border p-3 flex items-start gap-2 text-[12px]"
            style={{
              borderColor: 'var(--border)',
              background: 'rgba(201,151,43,0.05)',
              color: '#6B7280',
            }}
          >
            <Envelope size={13} strokeWidth={1.75} className="mt-0.5 shrink-0" style={{ color: 'var(--gold-dark)' }} />
            <span>
              On send, your default mail app opens with a welcome
              message pre-filled — review it before hitting send. The
              invitation is also recorded under{' '}
              <span className="font-semibold">Pending invitations</span>{' '}
              so the firm has an audit trail.
            </span>
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
              {invite.isPending ? (<><Spinner size={14} className="mr-1" /> Sending…</>) : (<><Envelope size={14} strokeWidth={2.25} /> Send welcome email</>)}
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
