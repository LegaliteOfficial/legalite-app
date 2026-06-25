/**
 * Root fallback for unmatched URLs outside the authenticated app
 * (marketing / auth space). Dashboard routes have their own catch-all
 * that keeps the sidebar; this is the bare-shell version.
 */

import Link from 'next/link'
import { ArrowLeft, Wrench } from '@phosphor-icons/react/dist/ssr'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--surface-page)' }}
    >
      <div className="max-w-md text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'var(--gold-muted)' }}
        >
          <Wrench size={30} weight="duotone" style={{ color: 'var(--gold-dark)' }} />
        </div>
        <h1
          className="font-heading text-2xl font-extrabold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Page under construction
        </h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
          We’re still building this page. It’ll be ready soon — thanks for your
          patience.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--gold)' }}
        >
          <ArrowLeft size={15} weight="bold" /> Back to app
        </Link>
      </div>
    </div>
  )
}
