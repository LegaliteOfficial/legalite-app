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
  'w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#88661D]/40'

const labelClass = 'block text-sm text-white/70 mb-2 [font-family:Inter,Arial,sans-serif]'

export function ContactForm() {
  const [values, setValues] = useState<FormState>(INITIAL)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setTimeout(() => {
      setStatus('success')
      setValues(INITIAL)
    }, 700)
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10">
        <Image
          src="/marketing/contact/check.svg"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12"
        />
        <p className="mt-6 text-base text-white">
          Thank you! Your submission has been received!
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="name" className={labelClass}>
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
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

        <div>
          <label htmlFor="company" className={labelClass}>
            Company / firm name
          </label>
          <input
            id="company"
            name="Company-name"
            type="text"
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

        <div>
          <label htmlFor="message" className={labelClass}>
            Message
          </label>
          <input
            id="message"
            name="Message"
            type="text"
            placeholder="Enter a message"
            value={values.message}
            onChange={(e) => update('message', e.target.value)}
            className={fieldClass}
          />
        </div>

        <p className="text-xs text-white/40 leading-relaxed">
          We&rsquo;d reach out to you with the contact information you provide here.
        </p>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="mt-2 inline-flex items-center justify-center rounded-md px-7 py-3.5 text-sm font-medium text-white bg-gradient-to-b from-[#9D7C32] to-[#88661D] hover:opacity-90 transition shadow-[0_1px_0_rgba(255,255,255,0.18)_inset] disabled:opacity-50"
        >
          {status === 'submitting' ? 'Please wait...' : 'Submit'}
        </button>

        {status === 'error' && (
          <p className="text-sm text-red-400">
            Oops! Something went wrong while submitting the form.
          </p>
        )}
      </form>
    </div>
  )
}
