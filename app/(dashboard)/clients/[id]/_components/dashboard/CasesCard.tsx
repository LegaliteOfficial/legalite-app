'use client'

import { Plus, UserCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { Case } from '@/types'
import { CollapsibleCard } from '../CollapsibleCard'

/**
 * Cases panel — one row per case linked to the contact via
 * `client_id`. Inline empty state with a "New case" CTA when the
 * contact has no cases yet.
 */
export function CasesCard({
  title,
  cases,
  emptyText,
  primaryActionLabel,
  onPrimaryAction,
}: {
  title: string
  cases: Case[]
  emptyText: string
  primaryActionLabel: string
  onPrimaryAction: () => void
}) {
  return (
    <CollapsibleCard label={title}>
      {cases.length === 0 ? (
        <div className="py-2 text-center">
          <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
            {emptyText}
          </p>
          <Button size="sm" className="mt-4" onClick={onPrimaryAction}>
            <Plus size={13} strokeWidth={2} />
            {primaryActionLabel}
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {cases.map((c) => (
            <li key={c.id}>
              <a
                href={`/cases/${c.id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                style={{
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-overlay)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--surface-sunken)'
                }}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-flex items-center justify-center h-6 w-6 rounded-md shrink-0"
                    style={{
                      background: 'rgba(201,151,43,0.12)',
                      color: 'var(--gold-dark)',
                    }}
                    aria-hidden
                  >
                    <UserCircle size={12} strokeWidth={1.75} />
                  </span>
                  <span className="text-[13px] font-medium truncate">
                    {c.title}
                  </span>
                </span>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium shrink-0"
                  style={{
                    background:
                      c.status === 'Open'
                        ? 'rgba(34,197,94,0.12)'
                        : c.status === 'Closed'
                          ? 'var(--surface-sunken)'
                          : 'rgba(201,151,43,0.16)',
                    color:
                      c.status === 'Open'
                        ? '#16A34A'
                        : c.status === 'Closed'
                          ? 'var(--text-muted)'
                          : 'var(--gold-dark)',
                  }}
                >
                  {c.status}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </CollapsibleCard>
  )
}
