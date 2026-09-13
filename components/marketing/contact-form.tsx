'use client'

import { useState } from 'react'
import Image from 'next/image'

interface FormState {
  name: string
  email: string
  company: string
  phone: string
  message: string
}

const INITIAL: FormState = {
  name: '',
  email: '',
  company: '',
  phone: '',
  message: '',
}

const fieldClass =
  'w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white transition ' +
  'placeholder:text-white/35 hover:border-white/20 ' +
  'focus:border-[#C9972B]/60 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[#C9972B]/25'

const labelClass =
  'mb-2 block text-[11px] uppercase tracking-[1.5px] text-white/45 [font-family:Inter,Arial,sans-serif]'

export function ContactForm() {
  const [values, setValues] = useState<FormState>(INITIAL)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setError('')

    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? 'Something went wrong while submitting the form.')
        setStatus('error')
        return
      }

      setStatus('success')
      setValues(INITIAL)
    } catch {
      setError('We could not reach the server. Please check your connection and try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#232E3C]/85 p-9 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.75)] backdrop-blur-md">
        <Image
          src="/marketing/contact/check.svg"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12"
        />
        <p className="mt-6 text-base text-white">
          Thank you. We have sent an email to your inbox with the next steps.
        </p>
        <p className="mt-3 text-sm text-white/50 leading-relaxed">
          It has the details of the session and a button to set up your account.
          If it does not arrive within a few minutes, check your spam folder.
        </p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#232E3C]/85 p-6 md:p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.75)] backdrop-blur-md">
      {/* Gold hairline picks the card out from the illustration behind it */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9972B]/60 to-transparent"
        aria-hidden
      />

      <div className="mb-6">
        <h2 className="text-lg text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold">
          Tell us about your practice
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-white/45">
          Takes under a minute. We reply within one working day.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Enter your full name"
            value={values.name}
            onChange={(e) => update('name', e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="Enter your email address"
            value={values.email}
            onChange={(e) => update('email', e.target.value)}
            className={fieldClass}
          />
        </div>

        </div>

        <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="company" className={labelClass}>
            Company / firm name
          </label>
          <input
            id="company"
            name="Company-name"
            type="text"
            required
            placeholder="Enter your company name"
            value={values.company}
            onChange={(e) => update('company', e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone number
          </label>
          <input
            id="phone"
            name="Phone"
            type="tel"
            required
            placeholder="Enter your phone number"
            value={values.phone}
            onChange={(e) => update('phone', e.target.value)}
            className={fieldClass}
          />
        </div>

        </div>

        <div>
          <label htmlFor="message" className={labelClass}>
            Message
          </label>
          <input
            id="message"
            name="Message"
            type="text"
            placeholder="Tell us about your practice (optional)"
            value={values.message}
            onChange={(e) => update('message', e.target.value)}
            className={fieldClass}
          />
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg px-7 py-3.5 text-sm font-semibold text-white bg-gradient-to-b from-[#C9972B] to-[#8C6A1E] transition hover:opacity-90 shadow-[0_1px_0_rgba(255,255,255,0.18)_inset] disabled:opacity-50"
        >
          {status === 'submitting' ? 'Please wait...' : 'Request a demo'}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-white/35">
          We will use these details to arrange your demo.
        </p>

        {status === 'error' && (
          <p className="text-sm text-red-400">
            {error || 'Oops! Something went wrong while submitting the form.'}
          </p>
        )}
      </form>
    </div>
  )
}
