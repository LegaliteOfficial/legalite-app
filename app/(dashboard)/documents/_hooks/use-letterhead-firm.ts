'use client'

/**
 * The active firm's details, shaped for the document letterhead. Reads
 * the `currentFirm` query. In dev bypass (no backend) a sample firm keeps
 * the letterhead previewable.
 */

import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { CurrentFirmQueryDoc } from '@/lib/graphql/firms'
import type { LetterheadFirm } from '@/lib/documents/design'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export function useLetterheadFirm(): LetterheadFirm | null {
  const { data } = useQuery(CurrentFirmQueryDoc, { skip: DEV_BYPASS })

  return useMemo(() => {
    if (DEV_BYPASS) {
      return {
        name: 'Sample Chambers',
        logoUrl: null,
        addressLines: ['1 Example Road, Accra'],
        phone: null,
        email: null,
        website: null,
      }
    }
    const firm = data?.currentFirm
    if (!firm) return null
    return {
      name: firm.name,
      logoUrl: firm.logo_url ?? null,
      addressLines: [firm.office_address, firm.city, firm.digital_address].filter(
        (l): l is string => Boolean(l),
      ),
      phone: firm.phone ?? null,
      email: firm.email ?? null,
      website: firm.website ?? null,
    }
  }, [data])
}
