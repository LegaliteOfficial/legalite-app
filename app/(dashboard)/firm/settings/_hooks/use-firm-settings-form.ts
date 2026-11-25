'use client'

import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { toast } from 'sonner'
import { CurrentFirmQueryDoc, UpdateFirmMutationDoc } from '@/lib/graphql/firms'
import { errorMessage } from '@/lib/errors'
import { useFirmStore } from '@/stores/firm.store'
import type { CurrentFirmQuery } from '@/types/generated/graphql'
import type { DraftField, FirmSettingsDraft } from '../_types'

type Firm = NonNullable<CurrentFirmQuery['currentFirm']>

/** Build a form draft from the saved firm record and the local branding. */
function toDraft(firm: Firm): FirmSettingsDraft {
  const branding = useFirmStore.getState()
  return {
    name: firm.name ?? '',
    firm_type: firm.firm_type ?? '',
    registration_number: firm.registration_number ?? '',
    tin: firm.tin ?? '',
    year_established: firm.year_established ? String(firm.year_established) : '',
    email: firm.email ?? '',
    phone: firm.phone ?? '',
    website: firm.website ?? '',
    office_address: firm.office_address ?? '',
    digital_address: firm.digital_address ?? '',
    city: firm.city ?? '',
    region: firm.region ?? '',
    description: firm.description ?? '',
    logoDataUrl: branding.firmLogoDataUrl,
    brandColor: branding.firmBrandColor,
  }
}

/**
 * Firm settings form state. Loads the firm from `currentFirm`, tracks edits
 * against the saved record, and saves through `updateFirm`. The firm name is
 * mirrored into the branding store so the sidebar follows.
 */
export function useFirmSettingsForm() {
  const { data, loading, error } = useQuery(CurrentFirmQueryDoc)
  const [updateFirm, { loading: saving }] = useMutation(UpdateFirmMutationDoc)
  const setBranding = useFirmStore((s) => s.setBranding)

  const firm = data?.currentFirm ?? null
  // The saved baseline follows the server; edits live in `edits` until saved.
  const baseline = useMemo(() => (firm ? toDraft(firm) : null), [firm])
  const [edits, setEdits] = useState<Partial<FirmSettingsDraft>>({})
  const draft = useMemo(() => (baseline ? { ...baseline, ...edits } : null), [baseline, edits])

  const setField = useCallback(<K extends DraftField>(key: K, value: FirmSettingsDraft[K]) => {
    setEdits((prev) => ({ ...prev, [key]: value }))
  }, [])

  const dirty = useMemo(() => {
    if (!draft || !baseline) return false
    return JSON.stringify(draft) !== JSON.stringify(baseline)
  }, [draft, baseline])

  const discard = useCallback(() => setEdits({}), [])

  const save = useCallback(async () => {
    if (!draft) return
    const name = draft.name.trim()
    if (!name) {
      toast.error('Firm name is required.')
      return
    }
    const email = draft.email.trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email address.')
      return
    }
    let year: number | null = null
    if (draft.year_established.trim()) {
      const parsed = Number(draft.year_established)
      const thisYear = new Date().getFullYear()
      if (!Number.isInteger(parsed) || parsed < 1800 || parsed > thisYear) {
        toast.error(`Enter a year between 1800 and ${thisYear}.`)
        return
      }
      year = parsed
    }
    let website = draft.website.trim()
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`

    const id = toast.loading('Saving firm settings...')
    try {
      await updateFirm({
        variables: {
          input: {
            name,
            firm_type: draft.firm_type || undefined,
            registration_number: draft.registration_number.trim(),
            tin: draft.tin.trim(),
            ...(year !== null ? { year_established: year } : {}),
            email: email || undefined,
            phone: draft.phone.trim(),
            website: website || undefined,
            office_address: draft.office_address.trim(),
            digital_address: draft.digital_address.trim(),
            city: draft.city.trim(),
            region: draft.region || undefined,
            description: draft.description.trim(),
          },
        },
        refetchQueries: [CurrentFirmQueryDoc],
        awaitRefetchQueries: true,
      })
      setBranding({ firmName: name, firmLogoDataUrl: draft.logoDataUrl, firmBrandColor: draft.brandColor })
      setEdits({})
      toast.success('Firm settings saved.', { id })
    } catch (err) {
      toast.error(errorMessage(err, 'Firm settings could not be saved.'), { id })
    }
  }, [draft, setBranding, updateFirm])

  return {
    hydrated: !loading || Boolean(firm),
    loadError: error ? errorMessage(error, 'The firm could not be loaded.') : null,
    draft,
    setField,
    dirty,
    saving,
    save,
    discard,
  }
}
