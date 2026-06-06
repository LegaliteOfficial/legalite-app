'use client'

import { Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean
  onClearFilters: () => void
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <Briefcase size={22} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        {hasFilters ? 'No cases found.' : 'No cases yet.'}
      </p>
      <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        {hasFilters
          ? 'Stay organised by keeping every case detail in one place.'
          : 'Click "New case" to file your first one.'}
      </p>
      {hasFilters && (
        <Button size="sm" className="mt-5" onClick={onClearFilters}>
          Clear all filters
        </Button>
      )}
    </div>
  )
}
