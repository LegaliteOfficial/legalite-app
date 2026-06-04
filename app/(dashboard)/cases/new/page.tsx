'use client'

/**
 * New case route. The form itself lives in the shared CaseEditor component
 * (used by both this create page and `/cases/[id]/edit`), so create and edit
 * collect exactly the same fields. useSearchParams() inside the editor needs a
 * Suspense boundary for prerendering.
 */

import { Suspense } from 'react'
import { NewCasePageInner } from '../_components/CaseEditor'

export default function NewCasePage() {
  return (
    <Suspense fallback={null}>
      <NewCasePageInner mode="create" />
    </Suspense>
  )
}
