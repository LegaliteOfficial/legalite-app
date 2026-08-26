'use client'

import Link from 'next/link'
import { useState } from 'react'
import { List, X } from '@phosphor-icons/react'
const NAV_LINKS = [
  { href: '/product/case-management', label: 'Case management' },
  { href: '/product/legal-research', label: 'Legal intelligence' },
  { href: '/security-page', label: 'Security' },
]

export function MarketingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-[#070A0F]/80 backdrop-blur border-b border-white/5">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12 flex items-center h-20">
        <div className="flex flex-1 items-center">
          <Link
            href="/"
            aria-label="home"
            className="flex items-center gap-1 text-white"
          >
            <svg
              aria-hidden
              viewBox="0 0 32 32"
              width="36"
              height="36"
            >
              <path d="M16 2 L1 30 L31 30 Z" fill="#9D7C32" />
              <path
                d="M8 21 L24 21"
                stroke="#0A1622"
                strokeWidth="1.75"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="[font-family:Literata,'Times_New_Roman',serif] text-xl font-bold italic tracking-tight">
              LegaLite
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/80 hover:text-white transition"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-4">
          <Link
            href="/contact-us"
            className="hidden md:inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-b from-[#9D7C32] to-[#88661D] hover:opacity-90 transition shadow-[0_1px_0_rgba(255,255,255,0.18)_inset]"
          >
            Join waitlist
          </Link>
          <button
            type="button"
            aria-label="menu"
            aria-expanded={open}
            className="md:hidden text-white p-2"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-[#070A0F]">
          <div className="mx-auto max-w-[1600px] px-6 py-6 flex flex-col gap-5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-base text-white/80 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact-us"
              onClick={() => setOpen(false)}
              className="inline-flex w-fit items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-b from-[#9D7C32] to-[#88661D]"
            >
              Join waitlist
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
