'use client'

import { Suspense } from 'react'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { NewCasePageInner } from '../_components/CaseEditor'

export default function NewCasePage() {
  // Visible fallback (was `null`): if anything inside the editor ever
  // suspends mid-interaction, React would render the fallback and the
  // page would look completely blank. A skeleton makes that case
  // recoverable instead of presenting as a broken UI.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewCasePageInner mode="create" />
    </Suspense>
  )
}
