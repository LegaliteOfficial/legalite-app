'use client'

import { Sparkle } from '@phosphor-icons/react'
export function StagesPlaceholder() {
  return (
    <div
      className="mt-8 rounded-2xl border px-10 py-16 text-center"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <Sparkle size={22} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        Stages admin is coming next
      </p>
      <p className="mt-1.5 text-[12.5px] max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
        Drop the screenshot for the Stages screen when you have it and we&rsquo;ll
        build it as the next sub-screen under Cases.
      </p>
    </div>
  )
}
