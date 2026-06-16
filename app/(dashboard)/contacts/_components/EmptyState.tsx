'use client'

import { Plus, Users } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

/**
 * Empty state — renders when the list is genuinely empty AND when the
 * user has filtered down to nothing. The CTA swaps between Clear
 * filters / New contact based on which case we're in.
 */
export function EmptyState({
  hasFilters,
  onClearFilters,
  onNewPerson,
}: {
  hasFilters: boolean
  onClearFilters: () => void
  onNewPerson: () => void
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <Users
          size={22}
          strokeWidth={1.5}
          style={{ color: 'var(--text-muted)' }}
        />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {hasFilters ? 'No contacts found.' : 'No contacts yet.'}
      </p>
      <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        {hasFilters
          ? 'Stay organised by keeping every client, witness, and expert in one place.'
          : 'Add the people and firms you work with to track their cases and communications.'}
      </p>
      {hasFilters ? (
        <Button size="sm" className="mt-5" onClick={onClearFilters}>
          Clear all filters
        </Button>
      ) : (
        <Button size="sm" className="mt-5" onClick={onNewPerson}>
          <Plus size={13} strokeWidth={2} />
          New contact
        </Button>
      )}
    </div>
  )
}
