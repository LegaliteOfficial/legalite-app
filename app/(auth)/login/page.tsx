'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/schemas'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { isAxiosError } from 'axios'
import { createSupabaseClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'

// Wrap the form in Suspense so useSearchParams works during prerender
// (Next.js requires this for any client component that reads search params).
export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--navy, #0D1B2A)' }} />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth, isAuthenticated, token, logout } = useAuthStore()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // If we have a persisted token, validate it against the API before
  // redirecting away from /login. Only a real 401 clears the token —
  // network errors, 500s, or cold-start blips let the user proceed to
  // the dashboard so a flaky backend doesn't make login look broken.
  useEffect(() => {
    if (!isAuthenticated || !token) return
    let cancelled = false
    const goToNext = () => {
      if (cancelled) return
      const next = searchParams?.get('next') ?? '/dashboard'
      router.replace(next)
    }
    api
      .get('/auth/me')
      .then(goToNext)
      .catch((err: unknown) => {
        if (cancelled) return
        const status = isAxiosError(err) ? err.response?.status : undefined
        if (status === 401) {
          logout()
        } else {
          // Backend hiccup — keep the user logged in and proceed.
          goToNext()
        }
      })
    return () => { cancelled = true }
  }, [isAuthenticated, token, router, searchParams, logout])

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    const supabase = createSupabaseClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setServerError('')
    try {
      const res = await api.post('/auth/login', data)
      setAuth(res.data.data.user, res.data.data.token)
      const next = searchParams?.get('next') ?? '/dashboard'
      router.push(next)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setServerError(
        error.response?.data?.message ?? 'Login failed. Check your credentials.'
      )
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT — Form panel ─────────────────────────────────── */}
      <div
        className="flex flex-col justify-center w-full max-w-[560px] flex-shrink-0 px-14 py-12"
        style={{ background: 'linear-gradient(160deg,#0a1520 0%,#0D1B2A 60%,#112030 100%)' }}
      >
        {/* Brand */}
        <div className="mb-10">
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
        <div className="mb-8">
          <h1
            className="font-heading text-3xl font-bold text-white mb-1.5"
          >
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Sign in to access your legal workspace
          </p>
        </div>

        {/* Error */}
        {serverError && (
          <div className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm mb-6">
            ⚠ {serverError}
          </div>
        )}

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all mb-6 disabled:opacity-60"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1.5px solid rgba(255,255,255,0.13)',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>or sign in with email</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label
              className="block text-[11px] font-bold uppercase tracking-widest mb-2"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
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
            {errors.email && (
              <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              className="block text-[11px] font-bold uppercase tracking-widest mb-2"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Password
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all pr-12"
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
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all mt-2 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg,var(--gold),var(--gold-dark))',
              color: 'var(--navy)',
              boxShadow: '0 4px 20px rgba(201,151,43,0.35)',
            }}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In to LegaLite'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-sm mt-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
          No account yet?{' '}
          <Link
            href="/signup"
            className="font-semibold underline underline-offset-2 transition-colors"
            style={{ color: 'var(--gold-light)' }}
          >
            Create one free →
          </Link>
        </p>

        <div className="mt-auto pt-12">
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

      {/* ── RIGHT — Image panel ───────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">
        <Image
          src="/assets/images/law firm.jpg"
          alt="LegaLite — Ghana legal practice"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Dark overlay gradient from left for smooth blend */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(13,27,42,0.55) 0%, rgba(13,27,42,0.1) 40%, transparent 100%)',
          }}
        />
        {/* Bottom quote overlay */}
        <div className="absolute bottom-10 left-8 right-8">
          <div
            className="backdrop-blur-sm rounded-2xl px-6 py-5"
            style={{
              background: 'rgba(13,27,42,0.65)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <p
              className="font-heading text-lg font-semibold text-white leading-snug mb-2"
            >
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
