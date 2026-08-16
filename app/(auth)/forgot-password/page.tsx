'use client'

/**
 * Forgot password — request a reset link.
 *
 * Passwords live in Supabase Auth (auth.users), but the reset flow is
 * routed through the NestJS backend rather than Supabase's built-in email:
 * requestPasswordReset resolves the email to a Supabase user server-side,
 * issues its own hashed token (see legalite-backend/src/auth/auth.service.ts),
 * and sends the link via Brevo — branded like every other LegaLite email
 * instead of Supabase's default sender.
 *
 * For privacy we never reveal whether an email is registered — the backend
 * returns the same generic message either way, and the success state here
 * shows unconditionally.
 */

import { useState } from 'react'
import Link from 'next/link'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { useRequestPasswordReset } from '@/hooks/use-auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { requestPasswordResetMutation, loading } = useRequestPasswordReset()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    try {
      await requestPasswordResetMutation({
        variables: { input: { email: email.trim() } },
      })
      setSent(true)
    } catch (err: unknown) {
      const message =
        err instanceof CombinedGraphQLErrors
          ? err.errors[0]?.message
          : err instanceof Error
            ? err.message
            : null
      setError(message ?? 'Could not send the reset link. Please try again.')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-12"
      style={{ background: 'linear-gradient(160deg,#0a1520 0%,#0D1B2A 60%,#112030 100%)' }}
    >
      <div className="w-full max-w-[440px]">
        {/* Brand */}
        <div className="mb-8">
          <div
            className="font-heading text-3xl font-extrabold mb-1"
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

        {sent ? (
          <div>
            <h1 className="font-heading text-2xl font-bold text-white mb-2">
              Check your email
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              If an account exists for <span className="text-white">{email.trim()}</span>,
              we&apos;ve sent a link to reset your password. Open it on this device
              to continue.
            </p>
            <p className="text-sm mt-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Didn&apos;t get it?{' '}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="font-semibold underline underline-offset-2"
                style={{ color: 'var(--gold-light)' }}
              >
                Try another email
              </button>
            </p>
            <p className="text-sm mt-8">
              <Link
                href="/login"
                className="font-semibold underline underline-offset-2"
                style={{ color: 'var(--gold-light)' }}
              >
                ← Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="font-heading text-2xl font-bold text-white mb-1.5">
                Reset your password
              </h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Enter your email and we&apos;ll send you a link to set a new one.
              </p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label
                  className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  Email Address
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="you@lawfirm.com"
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--gold)'
                    e.target.style.background = 'rgba(255,255,255,0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.target.style.background = 'rgba(255,255,255,0.06)'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg,var(--gold),var(--gold-dark))',
                  color: 'var(--navy)',
                  boxShadow: '0 4px 20px rgba(201,151,43,0.35)',
                }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="text-sm mt-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Remembered it?{' '}
              <Link
                href="/login"
                className="font-semibold underline underline-offset-2"
                style={{ color: 'var(--gold-light)' }}
              >
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
