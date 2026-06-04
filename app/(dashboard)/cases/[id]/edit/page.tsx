'use client'

/**
 * Edit case page
 * --------------
 * Reuses the exact rich form from `/cases/new` (every section, every field)
 * but pre-populated from the existing case and wired to update instead of
 * create. Replaces the old slim edit dialog so create and edit are symmetric.
 */

import { Suspense, use } from 'react'
import Link from 'next/link'
import { Spinner } from '@/components/shared/Spinner'
import { useCase } from '@/hooks/use-cases'
import { NewCasePageInner, caseToForm } from '../../_components/CaseEditor'

export default function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: kase, isLoading, error } = useCase(id)

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
        <Spinner size={18} /> <span className="text-sm">Loading case…</span>
      </div>
    )
  }

  if (error || !kase) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          We couldn&apos;t load this case to edit.
        </p>
        <Link
          href="/cases"
          className="text-sm font-semibold hover:underline"
          style={{ color: 'var(--gold-dark)' }}
        >
          Back to cases
        </Link>
      </div>
    )
  }

  // Mount only once the case is loaded so the form's initial state captures the
  // mapped values (the editor seeds state once on mount). `key` forces a fresh
  // mount if the route id changes.
  return (
    <Suspense fallback={null}>
      <NewCasePageInner
        key={kase.id}
        mode="edit"
        caseId={kase.id}
        initialForm={caseToForm(kase)}
      />
    </Suspense>
  )
}
