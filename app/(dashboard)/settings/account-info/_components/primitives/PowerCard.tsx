'use client'

import Link from 'next/link'
import { ArrowRight, CreditCard } from '@phosphor-icons/react'

export function PowerCard({
  Icon, title, body, href, ctaLabel,
}: {
  Icon: typeof CreditCard
  title: string
  body: string
  href: string
  ctaLabel: string
}) {
  return (
    <div
      className="rounded-2xl border p-5 transition-colors group"
      style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
          style={{ background: 'rgba(201,151,43,0.10)' }}
        >
          <Icon size={18} strokeWidth={1.75} style={{ color: 'var(--gold)' }} />
        </span>
        <h4 className="font-heading text-base font-bold" style={{ color: 'var(--navy)' }}>
          {title}
        </h4>
      </div>
      <p className="text-sm leading-relaxed mb-4" style={{ color: '#6B7280' }}>
        {body}
      </p>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ color: 'var(--gold)' }}
      >
        {ctaLabel} <ArrowRight size={13} strokeWidth={2.25} />
      </Link>
    </div>
  )
}
