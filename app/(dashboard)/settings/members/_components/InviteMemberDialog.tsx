'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowsClockwise,
  Copy,
  Envelope,
  Eye,
  EyeSlash,
  UserPlus,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  PROFESSIONAL_TITLES,
  titleLabel,
  useInviteMember,
} from '@/hooks/use-firm-members'
import { useFirmRoles } from '@/hooks/use-firm-roles'
import {
  useEffectiveFirmName,
  useHasCustomFirmName,
} from '@/hooks/use-firm-name'
import Link from 'next/link'
import { Spinner } from '@/components/shared/Spinner'
import { useAuthStore } from '@/stores/auth.store'
import { EMAIL_RE } from '../_constants'
import { generatePassword } from '../_lib/password'

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

export function InviteMemberDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
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
