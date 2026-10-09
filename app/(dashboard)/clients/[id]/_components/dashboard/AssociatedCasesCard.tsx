'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CollapsibleCard } from '../CollapsibleCard'

/**
 * "Associated cases" panel — the variant where the contact appears in
 * a related-contacts list rather than as the primary client. Shows All
 * / Open scope toggle + Link case CTA. Empty until the
 * `case_contacts` join table ships.
 */
export function AssociatedCasesCard({ contactId }: { contactId: string }) {
  // contactId is reserved for the future query — `void` suppresses the
  // unused-arg lint until then.
  void contactId
  const [scope, setScope] = useState<'all' | 'open'>('all')
  return (
    <CollapsibleCard
      label="Associated cases"
      rightSlot={
        <div className="flex items-center gap-2">
          <div
            className="inline-flex rounded-md border overflow-hidden text-[12px] font-medium"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <ScopeBtn
              active={scope === 'all'}
              onClick={() => setScope('all')}
            >
              All
            </ScopeBtn>
            <ScopeBtn
              active={scope === 'open'}
              onClick={() => setScope('open')}
            >
              Open
            </ScopeBtn>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info(
                'Linking existing cases ships with the case-contacts table.',
              )
            }
          >
            Link case
          </Button>
        </div>
      }
    >
      <p
        className="text-[12.5px] py-2 text-center"
        style={{ color: 'var(--text-muted)' }}
      >
        This contact isn&rsquo;t associated with any cases.
      </p>
    </CollapsibleCard>
  )
}

function ScopeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 cursor-pointer transition-colors"
      style={{
        background: active ? 'var(--surface-sunken)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      }}
    >
      {children}
    </button>
  )
}
