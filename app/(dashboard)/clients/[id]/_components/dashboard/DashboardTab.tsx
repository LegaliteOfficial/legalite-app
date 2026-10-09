'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCases } from '@/hooks/use-cases'
import { useClient } from '@/hooks/use-clients'
import type { Case } from '@/types'
import { AssociatedCasesCard } from './AssociatedCasesCard'
import { BillingInformationCard } from './BillingInformationCard'
import { CasesCard } from './CasesCard'
import { ContactInformationCard } from './ContactInformationCard'

/**
 * Two-column dashboard layout — the contact's structured info + billing
 * on the left, client's cases + associated cases on the right. Stacks
 * to a single column under lg breakpoint.
 */
export function DashboardTab({
  contact,
}: {
  contact: NonNullable<ReturnType<typeof useClient>['data']>
}) {
  const router = useRouter()
  const { data: cases } = useCases()

  const clientCases = useMemo(() => {
    if (!cases) return [] as Case[]
    return cases.filter((c) => c.client_id === contact.id)
  }, [cases, contact.id])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
      <div className="space-y-5">
        <ContactInformationCard contact={contact} />
        <BillingInformationCard />
      </div>
      <div className="space-y-5">
        <CasesCard
          title="Client's cases"
          cases={clientCases}
          emptyText="This contact has no cases yet."
          primaryActionLabel="New case"
          onPrimaryAction={() =>
            router.push(`/cases/new?client=${contact.id}`)
          }
        />
        <AssociatedCasesCard contactId={contact.id} />
      </div>
    </div>
  )
}
