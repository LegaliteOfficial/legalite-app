'use client'

import Image from 'next/image'
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
    <footer>
      {/* Demo CTA band */}
      <section className="bg-[#F8F4EE] px-6 lg:px-12 py-20 lg:py-24">
        <div className="mx-auto grid max-w-[1400px] overflow-hidden rounded-3xl bg-white shadow-[0_30px_60px_-34px_rgba(13,27,42,0.45)] lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[2.5px] text-[#A67A1C]">
              <span className="h-px w-8 bg-[#C9972B]/60" aria-hidden />
              Free walkthrough
            </div>
            <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl text-[#0D1B2A] [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.08]">
              See LegaLite in your practice.
            </h2>
            <p className="mt-5 max-w-md text-lg text-[#0D1B2A]/65 leading-relaxed">
              A walkthrough with our team, built around matters like yours.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact-us"
                className="inline-flex items-center justify-center rounded-lg px-6 py-3.5 text-sm font-semibold text-[#0D1B2A] bg-gradient-to-b from-[#F2C65A] to-[#C9972B] shadow-[0_12px_28px_-12px_rgba(201,151,43,0.9)] transition hover:brightness-105"
              >
                See it in action
              </Link>
              <Link
                href="mailto:contact@legalite.app"
                className="inline-flex items-center justify-center rounded-lg border border-[#0D1B2A]/15 px-6 py-3.5 text-sm font-semibold text-[#0D1B2A] transition hover:border-[#C9972B]"
              >
                contact@legalite.app
              </Link>
            </div>
          </div>
          <div className="relative min-h-[280px] lg:min-h-[420px]">
            <Image
              src="/marketing/photos/firm-team.jpg"
              alt="A legal team working together around a boardroom table"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Footer body */}
      <section className="bg-[#0D1B2A] text-white px-6 lg:px-12 py-16">
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
