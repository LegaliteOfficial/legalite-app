'use client'

import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react'
import { toast } from 'sonner'

/**
 * Account-level governance: transfer ownership (one owner per firm) and
 * the destructive close-account action, kept apart at the bottom.
 */
export function AccountFooter() {
  return (
    <section
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border)',
        boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
      }}
    >
      <Link
        href="/settings/transfer-ownership"
        className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-[var(--surface-overlay)]"
      >
        <div>
          <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Transfer ownership
          </p>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Move the firm account to another member. There is only ever one owner.
          </p>
        </div>
        <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
      </Link>

      <div className="flex items-center justify-between gap-4 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-[14px] font-semibold" style={{ color: '#B91C1C' }}>
            Close account
          </p>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Permanently close the firm account and end the subscription.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            toast.error('Closing an account requires multi-step confirmation — disabled in this build.')
          }
          className="shrink-0 rounded-md border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-red-50"
          style={{ borderColor: '#FCA5A5', color: '#B91C1C' }}
        >
          Close account
        </button>
      </div>
    </section>
  )
}
