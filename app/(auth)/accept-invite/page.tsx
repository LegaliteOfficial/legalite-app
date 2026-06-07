'use client'

import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeSlash, Buildings, ShieldCheck, Warning } from '@phosphor-icons/react'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { acceptInviteSchema, type AcceptInviteFormData } from '@/schemas'
import { useAcceptInvite, useInvitationLookup } from '@/hooks/use-auth'
import { titleLabel, roleLabel } from '@/hooks/use-firm-members'

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AuthShell><CenteredNote text="Loading invitation…" /></AuthShell>}>
      <AcceptInviteInner />
    </Suspense>
  )
}

function AcceptInviteInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') ?? undefined

  const { invitation, loading: lookupLoading, error: lookupError } = useInvitationLookup(token)
  const { acceptInviteMutation, loading: accepting } = useAcceptInvite()

  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { token: token ?? '' },
  })

  // ── No token / invalid or expired invitation ──────────────────────────────
  if (!token) {
    return (
      <AuthShell>
        <InvalidState
          title="Invitation link is incomplete"
          body="This link is missing its invitation token. Please open the most recent invitation email and use the button there."
        />
      </AuthShell>
    )
  }

  if (lookupLoading) {
    return (
      <AuthShell>
        <CenteredNote text="Checking your invitation…" />
      </AuthShell>
    )
  }

  if (lookupError || !invitation) {
    const message =
      lookupError instanceof CombinedGraphQLErrors
        ? lookupError.errors[0]?.message
        : undefined
    return (
      <AuthShell>
        <InvalidState
          title="This invitation can't be opened"
          body={
            message ??
            'It may have expired, already been accepted, or been revoked. Ask your firm administrator to send a new invitation.'
          }
        />
      </AuthShell>
    )
  }

  // ── Accept form ───────────────────────────────────────────────────────────
  const onSubmit = async (data: AcceptInviteFormData) => {
    setServerError('')
    try {
      const res = await acceptInviteMutation({
        variables: { input: { token, name: data.name, password: data.password } },
      })
      if (!res.data) {
        setServerError('We could not accept this invitation. Please try again.')
        return
      }
      router.push('/dashboard')
    } catch (err: unknown) {
      const message =
        err instanceof CombinedGraphQLErrors
          ? err.errors[0]?.message
          : err instanceof Error
            ? err.message
            : null
      setServerError(message ?? 'We could not accept this invitation. Please try again.')
    }
  }

  return (
    <AuthShell>
      {/* Brand */}
      <div className="mb-8">
        <div
          className="font-heading text-4xl font-extrabold mb-1"
          style={{ color: 'var(--gold-light)', letterSpacing: '-1px' }}
        >
          LegaLite
        </div>
        <div
          className="text-[11px] tracking-[2.5px] uppercase"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Ghana Legal Practice Management
        </div>
      </div>

      {/* Heading */}
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-white mb-1.5">
          Join your firm
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          You&apos;ve been invited to collaborate on LegaLite. Set a password to accept.
        </p>
      </div>

      {/* Invitation summary card */}
      <div
        className="rounded-2xl px-5 py-4 mb-6"
        style={{ background: 'rgba(201,151,43,0.08)', border: '1px solid rgba(201,151,43,0.22)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(201,151,43,0.18)' }}
          >
            <Buildings size={17} strokeWidth={2} style={{ color: 'var(--gold-light)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
              You&apos;re joining
            </div>
            <div className="font-heading text-base font-semibold text-white truncate">
              {invitation.firm_name}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <SummaryRow label="Title" value={titleLabel(invitation.professional_title)} />
          <SummaryRow label="Access" value={roleLabel(invitation.firm_role)} />
        </div>
        <div className="mt-3 pt-3 flex items-center gap-1.5 text-[12px]" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}>
          <ShieldCheck size={13} strokeWidth={2} style={{ color: 'var(--gold-light)' }} />
          Invitation for <span className="font-semibold text-white">{invitation.email}</span>
        </div>
      </div>

      {/* Error */}
      {serverError && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm mb-5">
          {serverError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full name */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Full Name *
          </label>
          <input
            {...register('name')}
            placeholder="e.g. Nana Akuffo-Mensah"
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
          />
          {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Password *
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all pr-12"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              tabIndex={-1}
            >
              {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Confirm Password *
          </label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat your password"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all pr-12"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              tabIndex={-1}
            >
              {showConfirm ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || accepting}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all mt-1 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg,var(--gold),var(--gold-dark))',
            color: 'var(--navy)',
            boxShadow: '0 4px 20px rgba(201,151,43,0.35)',
          }}
        >
          {isSubmitting || accepting ? 'Joining firm…' : 'Accept & Join Firm'}
        </button>
      </form>

      {/* Footer */}
      <p className="text-sm mt-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-semibold underline underline-offset-2" style={{ color: 'var(--gold-light)' }}>
          Sign in →
        </Link>
      </p>
    </AuthShell>
  )
}

// ── Layout shell (left form panel + right image) ─────────────────────────────

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div
        className="flex flex-col justify-center w-full max-w-[560px] flex-shrink-0 px-14 py-12 overflow-y-auto"
        style={{ background: 'linear-gradient(160deg,#0a1520 0%,#0D1B2A 60%,#112030 100%)' }}
      >
        {children}

        <div className="mt-auto pt-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium"
            style={{
              background: 'rgba(201,151,43,0.1)',
              border: '1px solid rgba(201,151,43,0.2)',
              color: 'var(--gold-light)',
            }}
          >
            Built for Ghana&apos;s Legal Profession
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <Image
          src="/assets/images/law firm.jpg"
          alt="LegaLite — Ghana legal practice"
          fill
          sizes="(max-width: 768px) 100vw, calc(100vw - 560px)"
          className="object-cover"
          priority
          quality={90}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(13,27,42,0.55) 0%, rgba(13,27,42,0.1) 40%, transparent 100%)' }}
        />
        <div className="absolute bottom-10 left-8 right-8">
          <div
            className="backdrop-blur-sm rounded-2xl px-6 py-5"
            style={{ background: 'rgba(13,27,42,0.65)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <p className="font-heading text-lg font-semibold text-white leading-snug mb-2">
              &ldquo;Smart Legal Management for Modern Firms.&rdquo;
            </p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              LegaLite · Accra, Ghana All Rights Reserved · 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </div>
      <div className="font-semibold text-white">{value}</div>
    </div>
  )
}

function CenteredNote({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center">
      <div
        className="font-heading text-3xl font-extrabold mb-4"
        style={{ color: 'var(--gold-light)', letterSpacing: '-1px' }}
      >
        LegaLite
      </div>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{text}</p>
    </div>
  )
}

function InvalidState({ title, body }: { title: string; body: string }) {
  return (
    <>
      <div className="mb-8">
        <div
          className="font-heading text-4xl font-extrabold mb-1"
          style={{ color: 'var(--gold-light)', letterSpacing: '-1px' }}
        >
          LegaLite
        </div>
        <div className="text-[11px] tracking-[2.5px] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Ghana Legal Practice Management
        </div>
      </div>

      <div
        className="h-12 w-12 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(220,38,38,0.14)', border: '1px solid rgba(220,38,38,0.3)' }}
      >
        <Warning size={22} strokeWidth={2} style={{ color: '#FCA5A5' }} />
      </div>
      <h1 className="font-heading text-2xl font-bold text-white mb-2">{title}</h1>
      <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{body}</p>

      <Link
        href="/login"
        className="inline-flex w-fit items-center justify-center py-3 px-5 rounded-xl font-semibold text-sm transition-all"
        style={{
          background: 'linear-gradient(135deg,var(--gold),var(--gold-dark))',
          color: 'var(--navy)',
          boxShadow: '0 4px 20px rgba(201,151,43,0.35)',
        }}
      >
        Go to sign in
      </Link>
    </>
  )
}
