'use client'

/**
 * The active firm's details, shaped for the document letterhead. Reads
 * the `currentFirm` query; in dev bypass falls back to the local firm
 * profile so the letterhead still previews.
 */

import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { CurrentFirmQueryDoc } from '@/lib/graphql/firms'
import { useFirmProfileStore } from '@/stores/firm-profile-local.store'
import type { LetterheadFirm } from '@/lib/documents/design'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export function useLetterheadFirm(): LetterheadFirm | null {
  const { data } = useQuery(CurrentFirmQueryDoc, { skip: DEV_BYPASS })
  const local = useFirmProfileStore((s) => s.profile)

  return useMemo(() => {
    if (DEV_BYPASS) {
      return {
        name: local.name,
        logoUrl: null,
        addressLines: [local.office_address, local.digital_address].filter(Boolean),
        phone: local.phone || null,
        email: local.email || null,
        website: local.website || null,
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
  }, [data, local])
}
