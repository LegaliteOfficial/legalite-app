import Link from 'next/link'
import { ArrowLeft, UserCircleMinus } from '@phosphor-icons/react'

/** Shown when the id does not match a client in the active firm. */
export function NotFoundPanel() {
  return (
    <div
      className="rounded-2xl border px-6 py-14 text-center"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border-default)' }}
    >
      <span
        className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <UserCircleMinus size={22} style={{ color: 'var(--text-muted)' }} />
      </span>
      <p className="mt-3 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        Client not found
      </p>
      <p className="mx-auto mt-1 max-w-sm text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        This client may have been removed, or belongs to a different firm.
      </p>
      <Link
        href="/clients"
        className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold hover:underline underline-offset-2"
        style={{ color: 'var(--gold-dark)' }}
      >
        <ArrowLeft size={13} weight="bold" />
        Back to clients
      </Link>
    </div>
  )
}
