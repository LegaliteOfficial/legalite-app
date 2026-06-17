'use client'

import Link from 'next/link'
import { Info, X } from '@phosphor-icons/react'

/**
 * Welcome strip pointing first-run users at the three onboarding
 * surfaces (Settings → Account Info, Settings → Members invite,
 * Billing → Plans). Dismissable; the page persists the dismissal in
 * `BANNER_DISMISSED_KEY` so it stays hidden across sessions.
 */
export function OnboardingBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="relative flex items-start gap-3 rounded-xl border pl-5 pr-4 py-3.5"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full"
        style={{ background: 'var(--gold)' }}
      />
      <Info
        size={16}
        strokeWidth={1.75}
        className="mt-0.5 shrink-0"
        style={{ color: 'var(--gold)' }}
      />
      <p
        className="flex-1 text-[13px] leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Welcome to LegaLite.
        </span>{' '}
        <Link
          // Routes to Settings → Account Info, the live surface where
          // firm-level setup (firm name, address, country, billing
          // contact) actually lives.
          href="/settings/account-info"
          className="font-medium hover:underline underline-offset-2"
          style={{ color: 'var(--gold)' }}
        >
          Set up your firm
        </Link>
        ,{' '}
        <Link
          // Routes to the firm-members admin surface; the `invite=open`
          // query param tells the page to auto-open the
          // InviteMemberDialog on mount.
          href="/settings/members?invite=open"
          className="font-medium hover:underline underline-offset-2"
          style={{ color: 'var(--gold)' }}
        >
          invite a teammate
        </Link>
        , or{' '}
        <Link
          // Plan picker / upgrade flow lives at /billing/plans —
          // /billing itself is the bills management UI.
          href="/billing/plans"
          className="font-medium hover:underline underline-offset-2"
          style={{ color: 'var(--gold)' }}
        >
          subscribe
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="rounded p-1 transition-colors hover:bg-black/5 shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        <X size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}
