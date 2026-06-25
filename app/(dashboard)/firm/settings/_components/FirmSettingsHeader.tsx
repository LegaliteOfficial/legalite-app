'use client'

import Link from 'next/link'
import { CaretRight } from '@phosphor-icons/react'

export function FirmSettingsHeader() {
  return (
    <>
      <div
        className="flex items-center gap-2 text-sm mb-5"
        style={{ color: 'var(--text-primary)' }}
      >
        <Link
          href="/settings"
          className="hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
        >
          Settings
        </Link>
        <CaretRight size={14} strokeWidth={2.25} style={{ color: 'var(--text-muted)' }} />
        <span className="font-bold">Firm profile</span>
      </div>

      <div className="max-w-2xl mb-8">
        <div
          className="text-[10px] font-bold tracking-[3px] uppercase mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Firm preferences
        </div>
        <h1
          className="font-heading text-3xl font-extrabold mb-3 leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Firm profile
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Your firm’s name, registration details, contact information, and
          branding. These appear on bills, the client portal, and anywhere the
          firm presents itself.
        </p>
      </div>
    </>
  )
}
