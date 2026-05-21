'use client'

import Link from 'next/link'
import { useState } from 'react'

const PRODUCT_LINKS = [
  { href: '#', label: 'Practice management' },
  { href: '/product/legal-research', label: 'Legal Research' },
  { href: '/product/case-management', label: 'Case management' },
]

const COMPANY_LINKS = [
  { href: '/security-page', label: 'Security' },
  { href: '/contact-us', label: 'Contact us' },
  { href: 'https://www.linkedin.com/company/legalitetech/', label: 'Linkedin' },
  { href: 'https://x.com/LegaLite', label: 'X' },
]

export function MarketingFooter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setTimeout(() => {
      setStatus('success')
      setEmail('')
    }, 600)
  }

  return (
    <footer className="bg-black border-t border-white/5">
      <section className="px-6 lg:px-12 py-32">
        <div className="mx-auto max-w-[1600px]">
          <div className="text-[#03f7eb] text-[0.6rem] tracking-[5px] uppercase">
            Get a personalised demo
          </div>
          <div className="h-px bg-white/10 mt-3 mb-6" />

          <div className="grid lg:grid-cols-2 gap-10 items-end">
            <h2 className="text-3xl md:text-5xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.05]">
              Ready to see LegaLite in action?
            </h2>
            <div>
              <p className="text-white/50 text-base leading-relaxed max-w-md">
                LegaLite brings your entire workflow, documents, research, billing, scheduling, and client communication, into a secure, intuitive platform.
              </p>
              <div className="mt-6">
                <Link
                  href="/contact-us"
                  className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-b from-[#9D7C32] to-[#88661D] hover:opacity-90 transition shadow-[0_1px_0_rgba(255,255,255,0.18)_inset]"
                >
                  Request a demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-12 pb-16">
        <div className="mx-auto max-w-[1600px] grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <h4 className="text-white text-xl font-semibold [font-family:Literata,'Times_New_Roman',serif]">
              Join our newsletters
            </h4>
            <p className="text-white/50 text-sm mt-3 leading-relaxed max-w-md">
              Sign up for our newsletter to get actionable insights how technology and Law marries going into the future.
            </p>
            <form onSubmit={onSubmit} className="mt-5 flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#88661D]/40"
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-b from-[#9D7C32] to-[#88661D] disabled:opacity-50"
              >
                {status === 'submitting' ? 'Please wait...' : 'Submit'}
              </button>
            </form>
            {status === 'success' && (
              <p className="mt-3 text-sm text-emerald-400">
                Thank you! Your submission has been received!
              </p>
            )}
            {status === 'error' && (
              <p className="mt-3 text-sm text-red-400">
                Oops! Something went wrong while submitting the form.
              </p>
            )}
          </div>

          <div>
            <div className="text-[#03f7eb] text-[0.6rem] tracking-[5px] uppercase">Product</div>
            <ul className="mt-5 flex flex-col gap-3">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-white/70 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[#03f7eb] text-[0.6rem] tracking-[5px] uppercase">Company</div>
            <ul className="mt-5 flex flex-col gap-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-white/70 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-[1600px] mt-16 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-white/40">
            Copyright © 2025 LegaLite
          </p>
        </div>
      </section>
    </footer>
  )
}
