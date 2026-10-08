'use client'

/**
 * Mobile list primitives — the phone counterpart to the desktop data
 * tables. Rows are large tap targets (the native-app list pattern):
 * leading mark, title, one or two lines of detail, an optional trailing
 * badge and a chevron.
 *
 * Pages render these below `md` and keep their tables from `md` up.
 */

import type { ReactNode } from 'react'
import Link from 'next/link'
import { CaretRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function MobileList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul
      className={cn('overflow-hidden rounded-2xl border', className)}
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)' }}
    >
      {children}
    </ul>
  )
}

interface MobileListItemProps {
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  href?: string
  onClick?: () => void
}

export function MobileListItem({ title, subtitle, meta, leading, trailing, href, onClick }: MobileListItemProps) {
  const body = (
    <>
      {leading && <span className="shrink-0">{leading}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>
          {title}
        </span>
        {subtitle && (
          <span className="mt-0.5 block truncate text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </span>
        )}
        {meta && (
          <span className="mt-0.5 block truncate text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {meta}
          </span>
        )}
      </span>
      {trailing && <span className="shrink-0">{trailing}</span>}
      {(href || onClick) && (
        <CaretRight size={14} weight="bold" className="shrink-0" style={{ color: 'var(--text-subtle)' }} />
      )}
    </>
  )
  const rowClass =
    'flex w-full min-h-[64px] items-center gap-3 px-4 py-3 text-left transition-colors active:bg-[var(--surface-sunken)]'

  return (
    <li className="border-t first:border-t-0" style={{ borderColor: 'var(--border-soft)' }}>
      {href ? (
        <Link href={href} className={rowClass}>{body}</Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={rowClass}>{body}</button>
      ) : (
        <div className={rowClass}>{body}</div>
      )}
    </li>
  )
}

/** Round initials mark used as a list row's leading element. */
export function InitialsMark({ name, tone = 'gold' }: { name: string; tone?: 'gold' | 'navy' }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      aria-hidden
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold"
      style={
        tone === 'navy'
          ? { background: 'var(--navy)', color: 'var(--gold-light)' }
          : { background: 'var(--accent-today-tint-strong)', color: 'var(--gold-dark)' }
      }
    >
      {initials || '?'}
    </span>
  )
}
