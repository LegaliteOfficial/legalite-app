'use client'

import Link from 'next/link'
import { useState } from 'react'
import { List, X } from '@phosphor-icons/react'
const NAV_LINKS = [
  { href: '/product/case-management', label: 'Case management' },
  { href: '/product/legal-research', label: 'Legal intelligence' },
  { href: '/security-page', label: 'Security' },
  { href: '/news', label: 'News' },
]

export function MarketingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-[#1F2937]/80 backdrop-blur border-b border-white/5">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12 flex items-center h-20">
        <div className="flex flex-1 items-center">
          <Link
            href="/"
            aria-label="home"
            className="flex items-center gap-2 text-white"
          >
            <svg aria-hidden viewBox="0 0 96 96" width="34" height="34">
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
            Request a demo
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
        <div className="md:hidden border-t border-white/5 bg-[#1F2937]">
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
              Request a demo
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
