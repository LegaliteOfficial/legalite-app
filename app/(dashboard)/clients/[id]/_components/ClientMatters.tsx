'use client'

/**
 * Matters (cases) where this client is the primary client. Suspends on
 * the cases query only. Each row opens the case; the next court date is
 * called out because it is usually the first thing a lawyer checks.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Briefcase, Gavel, Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Case } from '@/types'
import { useClientCases } from '../_hooks/use-client-profile'
import { SectionSkeleton } from './skeletons'

export function ClientMatters({ clientId }: { clientId: string }) {
  const { cases, ready } = useClientCases(clientId)
  const router = useRouter()

  if (!ready) return <SectionSkeleton rows={3} label="Loading matters" />

  const open = cases.filter((c) => c.status === 'Open').length

  return (
    <section
      className="overflow-hidden rounded-2xl border"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border-default)' }}
    >
      <header
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: cases.length ? '1px solid var(--border-soft)' : 'none' }}
      >
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Matters
          </h2>
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {cases.length === 0
              ? 'No matters on file for this client'
              : `${cases.length} matter${cases.length === 1 ? '' : 's'} · ${open} open`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-lg text-[12px]"
          onClick={() => router.push(`/cases/new?client=${clientId}`)}
        >
          <Plus size={13} weight="bold" />
          New matter
        </Button>
      </header>

      {cases.length > 0 && (
        <ul>
          {cases.map((c, i) => (
            <MatterRow key={c.id} matter={c} first={i === 0} />
          ))}
        </ul>
      )}
    </section>
  )
}

function MatterRow({ matter, first }: { matter: Case; first: boolean }) {
  const meta = [matter.case_code, matter.suit_number, matter.court].filter(Boolean)
  const nextCourt = matter.next_court_date ? new Date(matter.next_court_date) : null
  const upcoming = nextCourt && nextCourt.getTime() >= new Date().setHours(0, 0, 0, 0)

  return (
    <li style={{ borderTop: first ? 'none' : '1px solid var(--border-soft)' }}>
      <Link
        href={`/cases/${matter.id}`}
        className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--surface-card-hover)]"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'var(--gold-muted)' }}
        >
          <Briefcase size={17} weight="duotone" style={{ color: 'var(--gold-dark)' }} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {matter.title}
          </p>
          <p className="mt-0.5 truncate text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {[matter.case_type, matter.case_stage].filter(Boolean).join(' · ') || 'Matter'}
            {meta.length > 0 && <> · {meta.join(' · ')}</>}
          </p>
        </div>

        {upcoming && nextCourt && (
          <span
            className="hidden shrink-0 items-center gap-1.5 text-[12px] font-medium sm:inline-flex"
            style={{ color: '#4338CA' }}
            title="Next court date"
          >
            <Gavel size={13} weight="duotone" />
            {nextCourt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        )}
        <StatusBadge status={matter.status} />
        <ArrowUpRight
          size={14}
          className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: 'var(--text-muted)' }}
        />
      </Link>
    </li>
  )
}
