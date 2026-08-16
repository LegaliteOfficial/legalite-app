'use client'

/**
 * Reset password — the recovery link lands here.
 *
 * Supabase's recovery email redirects to this page. Two link shapes are
 * supported so it works regardless of how the email template is configured:
 *   - PKCE:  ?code=...           -> exchangeCodeForSession (same-browser only,
 *                                   because the verifier lives in localStorage)
 *   - OTP:   ?token_hash=&type=  -> verifyOtp (works cross-device)
 *
 * Either establishes a short-lived Supabase recovery session; we then call
 * updateUser({ password }) to set the new password. The app's real auth is
 * the backend JWT, not this Supabase session, so we sign the recovery session
 * out afterwards and send the user to /login to sign in normally.
 */

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase'

type Phase = 'verifying' | 'ready' | 'saving' | 'done' | 'invalid'

function ResetInner() {
  const router = useRouter()
  const params = useSearchParams()

  const [phase, setPhase] = useState<Phase>('verifying')
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Establish the recovery session from the link before showing the form.
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const supabase = createSupabaseClient()
      const code = params.get('code')
      const tokenHash = params.get('token_hash')
      const type = params.get('type')
      const errorDescription = params.get('error_description')

      if (errorDescription) {
        if (!cancelled) {
          setError(errorDescription)
          setPhase('invalid')
        }
        return
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: (type as EmailOtpType) || 'recovery',
          })
          if (error) throw error
        } else {
          throw new Error('This reset link is invalid or has expired.')
        }
        if (!cancelled) setPhase('ready')
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'This reset link is invalid or has expired.',
          )
          setPhase('invalid')
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [params])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setPhase('saving')
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      // The recovery session isn't the app session — clear it so the user
      // signs in cleanly through the normal (backend JWT) login flow.
      await supabase.auth.signOut()
      setPhase('done')
      setTimeout(() => router.replace('/login?reset=success'), 1600)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not update your password. Request a new link and try again.',
      )
      setPhase('ready')
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1.5px solid rgba(255,255,255,0.1)',
  }

  return (
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

      {phase === 'verifying' && (
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Verifying your reset link…
        </p>
      )}

      {phase === 'invalid' && (
        <div>
          <h1 className="font-heading text-2xl font-bold text-white mb-2">
            Link expired or invalid
          </h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {error || 'This password reset link is no longer valid.'} Reset links
            expire and can only be used once — and PKCE links must be opened on
            the same device you requested them from.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block py-3 px-5 rounded-xl font-semibold text-sm"
            style={{
              background: 'linear-gradient(135deg,var(--gold),var(--gold-dark))',
              color: 'var(--navy)',
            }}
          >
            Request a new link
          </Link>
        </div>
      )}

      {phase === 'done' && (
        <div>
          <h1 className="font-heading text-2xl font-bold text-white mb-2">
            Password updated
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Taking you to sign in…
          </p>
        </div>
      )}

      {(phase === 'ready' || phase === 'saving') && (
        <>
          <div className="mb-8">
            <h1 className="font-heading text-2xl font-bold text-white mb-1.5">
              Set a new password
            </h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Choose a new password for your account.
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
                New Password
              </label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all pr-12"
                  style={inputStyle}
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
            </div>

            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Confirm New Password
              </label>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={phase === 'saving'}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg,var(--gold),var(--gold-dark))',
                color: 'var(--navy)',
                boxShadow: '0 4px 20px rgba(201,151,43,0.35)',
              }}
            >
              {phase === 'saving' ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-12"
      style={{ background: 'linear-gradient(160deg,#0a1520 0%,#0D1B2A 60%,#112030 100%)' }}
    >
      <Suspense
        fallback={
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Loading…
          </p>
        }
      >
        <ResetInner />
      </Suspense>
    </div>
  )
}
