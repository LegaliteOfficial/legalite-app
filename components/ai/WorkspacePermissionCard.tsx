'use client'

/**
 * Shown when the assistant paused before reading the user's workspace.
 * Lists, in plain words, what it wants to look at and lets the user
 * allow it for this request, allow it from now on, or decline. The
 * parent resends the same question with the decision.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CheckCircle, GearSix, LockKey, ShieldCheck, XCircle } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/shared/Spinner'
import type { PermissionRequest } from '@/lib/ai/types'

export type PermissionChoice = 'allow' | 'always' | 'deny'

export function WorkspacePermissionCard({
  request,
  onDecide,
  disabled,
}: {
  request: PermissionRequest
  /** Resolves once the follow-up request has started (or failed). */
  onDecide?: (choice: PermissionChoice) => Promise<void>
  /** Another request is in flight. */
  disabled?: boolean
}) {
  const [busy, setBusy] = useState<PermissionChoice | null>(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const ms = request.expires_at * 1000 - Date.now()
    if (ms <= 0) {
      setExpired(true)
      return
    }
    const t = window.setTimeout(() => setExpired(true), Math.min(ms, 2 ** 31 - 1))
    return () => window.clearTimeout(t)
  }, [request.expires_at])

  const decide = async (choice: PermissionChoice) => {
    if (!onDecide || busy) return
    setBusy(choice)
    try {
      await onDecide(choice)
    } finally {
      setBusy(null)
    }
  }

  const locked = disabled || busy !== null || !onDecide
  const scopes = request.scopes.length > 0 ? request.scopes : ['Read your workspace']

  return (
    <section
      className="ll-perm-card overflow-hidden rounded-2xl border"
      style={{ background: 'var(--surface-card)', borderColor: 'rgba(201,151,43,0.35)', boxShadow: 'var(--shadow-xs)' }}
      aria-labelledby={`perm-${request.request_id}`}
    >
      <div className="flex items-start gap-3 px-5 pt-4">
        <span
          className="ll-perm-icon mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'rgba(201,151,43,0.14)', color: 'var(--gold-dark, #8A6D1E)' }}
          aria-hidden
        >
          <ShieldCheck size={19} weight="duotone" />
        </span>
        <div className="min-w-0">
          <h3 id={`perm-${request.request_id}`} className="text-[14.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Allow Legalite AI to access your workspace?
          </h3>
          <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            To answer, the assistant wants to:
          </p>
        </div>
      </div>

      <ul className="space-y-1.5 px-5 pt-3">
        {scopes.map((s, i) => (
          <li
            key={s}
            className="ll-perm-scope flex items-start gap-2 text-[13.5px]"
            style={{ color: 'var(--text-primary)', animationDelay: `${80 + i * 50}ms` }}
          >
            <CheckCircle size={15} weight="fill" className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
            <span className="min-w-0 break-words">{s}</span>
          </li>
        ))}
      </ul>

      <p className="mx-5 mt-3 flex items-start gap-1.5 rounded-lg px-3 py-2 text-[12px] leading-relaxed" style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
        <LockKey size={13} className="mt-0.5 shrink-0" />
        <span>
          It only sees what you can already see in Legalite. Nothing is created or changed without your confirmation.
          {' '}&ldquo;Allow&rdquo; covers this question only.
        </span>
      </p>

      {expired && (
        <p className="mx-5 mt-2 text-[12px]" style={{ color: '#B54708' }} role="status">
          This request has expired. Choosing an option will run your question again.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 px-5 pt-3 pb-4">
        <Button size="sm" onClick={() => void decide('allow')} disabled={locked}>
          {busy === 'allow' && <Spinner size={12} />}
          Allow
        </Button>
        <Button size="sm" variant="outline" onClick={() => void decide('always')} disabled={locked}>
          {busy === 'always' && <Spinner size={12} />}
          Always allow
        </Button>
        <Button size="sm" variant="ghost" onClick={() => void decide('deny')} disabled={locked}>
          {busy === 'deny' ? <Spinner size={12} /> : <XCircle size={14} />}
          Don&rsquo;t allow
        </Button>
        <Link
          href="/settings/ai#workspace-access"
          className="ml-auto inline-flex items-center gap-1 text-[12px] underline-offset-2 hover:underline"
          style={{ color: 'var(--text-muted)' }}
        >
          <GearSix size={13} /> Manage in Settings
        </Link>
      </div>
    </section>
  )
}
