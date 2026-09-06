'use client'

import Link from 'next/link'
import { useState } from 'react'

const PRODUCT_LINKS = [
  { href: '/product/case-management', label: 'Case management' },
  { href: '/product/legal-research', label: 'Legal intelligence' },
  { href: '/security-page', label: 'Security' },
]

const COMPANY_LINKS = [
  { href: '/contact-us', label: 'Contact us' },
  { href: 'https://www.linkedin.com/company/legalitetech/', label: 'LinkedIn', external: true },
  { href: 'https://x.com/LegaLite', label: 'X', external: true },
]

export function MarketingFooter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const year = new Date().getFullYear()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setTimeout(() => {
      setStatus('success')
      setEmail('')
    }, 600)
  }

  return (
    <footer className="bg-black">
      {/* Demo CTA band */}
      <section className="relative overflow-hidden border-t border-white/5">
        <div
          className="absolute inset-0 -z-10"
          aria-hidden
          style={{
            background:
              'radial-gradient(80% 130% at 50% 130%, rgba(201,151,43,0.14), transparent 60%)',
          }}
        />
        <div className="px-6 lg:px-12 py-28">
          <div className="mx-auto max-w-[1600px] text-center">
            <div className="text-[#E8B84B] text-[0.6rem] tracking-[5px] uppercase">
              Get a professional demo
            </div>
            <h2 className="mx-auto mt-6 max-w-3xl text-3xl md:text-5xl lg:text-6xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.04]">
              Ready to see LegaLite in action?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-white/55 text-base leading-relaxed">
              See your documents, research, billing, scheduling, and client communication
              working together in one secure platform. Book a walkthrough with our team.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact-us"
                className="inline-flex items-center justify-center rounded-md px-7 py-3.5 text-sm font-medium text-white bg-gradient-to-b from-[#C9972B] to-[#8C6A1E] hover:opacity-90 transition shadow-[0_1px_0_rgba(255,255,255,0.2)_inset]"
              >
                Join waitlist
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md px-7 py-3.5 text-sm font-medium text-white/90 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/25 transition"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer body */}
      <section className="border-t border-white/5 px-6 lg:px-12 py-16">
        <div className="mx-auto max-w-[1600px]">
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1.6fr]">
            {/* Brand */}
            <div>
              <Link href="/" aria-label="home" className="flex items-center gap-2 text-white">
                <svg viewBox="0 0 96 96" width="30" height="30" aria-hidden>
                  <rect width="96" height="96" rx="20" fill="#0D1B2A" />
                  <g
                    stroke="#C9972B"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  >
                    <path d="M48 9 L55 16 L48 23 L41 16 Z" />
                    <path d="M48 16 V68" />
                    <path d="M24 30 H72" />
                    <path d="M28 30 L20 48 M28 30 L36 48" />
                    <path d="M20 48 Q28 55 36 48" />
                    <path d="M68 30 L60 48 M68 30 L76 48" />
                    <path d="M60 48 Q68 55 76 48" />
                    <path d="M36 68 H60" />
                    <path d="M31 73 H65" />
                  </g>
                </svg>
                <span className="[font-family:Literata,'Times_New_Roman',serif] text-xl font-bold italic tracking-tight">
                  LegaLite
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm text-white/45 leading-relaxed">
                The intelligent platform for modern legal practice in Ghana.
              </p>
            </div>

            {/* Product */}
            <div>
              <div className="text-[#E8B84B] text-[0.6rem] tracking-[5px] uppercase">Product</div>
              <ul className="mt-5 flex flex-col gap-3">
                {PRODUCT_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/70 transition hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <div className="text-[#E8B84B] text-[0.6rem] tracking-[5px] uppercase">Company</div>
              <ul className="mt-5 flex flex-col gap-3">
                {COMPANY_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      target={l.external ? '_blank' : undefined}
                      rel={l.external ? 'noopener noreferrer' : undefined}
                      className="text-sm text-white/70 transition hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <div className="text-[#E8B84B] text-[0.6rem] tracking-[5px] uppercase">Newsletter</div>
              <p className="mt-5 text-sm text-white/50 leading-relaxed">
                Insights on where technology and law meet, straight to your inbox.
              </p>
              <form onSubmit={onSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9972B]/40"
                />
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="inline-flex items-center justify-center rounded-md bg-gradient-to-b from-[#C9972B] to-[#8C6A1E] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {status === 'submitting' ? 'Please wait...' : 'Subscribe'}
                </button>
              </form>
              {status === 'success' && (
                <p className="mt-3 text-sm text-emerald-400">
                  Thank you. Your submission has been received.
                </p>
              )}
              {status === 'error' && (
                <p className="mt-3 text-sm text-red-400">
                  Something went wrong. Please try again.
                </p>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
            <p className="text-xs text-white/40">Copyright {year} LegaLite. All rights reserved.</p>
            <p className="text-xs text-white/40">Accra, Ghana</p>
          </div>
        </div>
      </section>
    </footer>
  )
}
