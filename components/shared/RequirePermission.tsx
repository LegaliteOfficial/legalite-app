'use client'

import Link from 'next/link'
import { LockSimple } from '@phosphor-icons/react'
import { useCan, usePermissionChecker } from '@/lib/access'

/**
 * Renders its children only when the member holds `permission`; otherwise a
 * short explanation. The backend refuses the underlying requests either way;
 * this keeps the page from showing controls that would only fail.
 */
export function RequirePermission({
  permission,
  anyOf,
  what,
  children,
}: {
  permission?: string
  /** Allow the page when the member holds at least one of these instead. */
  anyOf?: string[]
  /** What the page manages, for the message: "roles and permissions". */
  what: string
  children: React.ReactNode
}) {
  const check = usePermissionChecker()
  const single = useCan(permission ?? '')
  const allowed = anyOf ? anyOf.some(check) : permission ? single : true
  if (allowed) return <>{children}</>
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: 'rgba(13,27,42,0.06)' }}
      >
        <LockSimple size={22} style={{ color: 'var(--navy)' }} />
      </div>
      <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--navy)' }}>
        You don&rsquo;t have access to {what}
      </h2>
      <p className="mt-1.5 text-sm" style={{ color: '#6B7280' }}>
        Your roles in this firm don&rsquo;t include this. Ask a firm administrator if you need it.
      </p>
      <Link href="/dashboard" className="mt-5 text-sm font-semibold hover:underline" style={{ color: 'var(--gold-dark)' }}>
        Back to the dashboard
      </Link>
    </div>
  )
}
