'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useFirmProfileStore } from '@/stores/firm-profile-local.store'
import { useFirmStore } from '@/stores/firm.store'
import type { DraftField, FirmSettingsDraft } from '../_types'

/** Build a draft from the persisted profile + branding stores. */
function readDraft(): FirmSettingsDraft {
  const { profile } = useFirmProfileStore.getState()
  const branding = useFirmStore.getState()
  return {
    ...profile,
    year_established: profile.year_established
      ? String(profile.year_established)
      : '',
    logoDataUrl: branding.firmLogoDataUrl,
    brandColor: branding.firmBrandColor,
  }
}

/**
 * Firm-settings form state.
 *
 * Holds a single editable draft merged from the firm-profile store
 * (the firm record) and firm.store (logo + brand colour). Tracks
 * dirtiness against the persisted baseline so the save bar only shows
 * when there's something to save, and writes back to both stores —
 * pushing the firm name into branding too so the sidebar wordmark
 * follows along.
 */
export function useFirmSettingsForm() {
  const [hydrated, setHydrated] = useState(false)
  const [draft, setDraft] = useState<FirmSettingsDraft | null>(null)
  const [baseline, setBaseline] = useState<FirmSettingsDraft | null>(null)
  const [saving, setSaving] = useState(false)

  const updateProfile = useFirmProfileStore((s) => s.updateProfile)
  const setBranding = useFirmStore((s) => s.setBranding)

  // Rehydrate the persisted profile, then seed the draft once.
  useEffect(() => {
    void Promise.resolve(useFirmProfileStore.persist.rehydrate()).then(() => {
      const initial = readDraft()
      setDraft(initial)
      setBaseline(initial)
      setHydrated(true)
    })
  }, [])

  const setField = useCallback(
    <K extends DraftField>(key: K, value: FirmSettingsDraft[K]) => {
      setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
    },
    [],
  )

  const dirty = useMemo(() => {
    if (!draft || !baseline) return false
    return JSON.stringify(draft) !== JSON.stringify(baseline)
  }, [draft, baseline])

  const discard = useCallback(() => {
    setDraft(baseline)
  }, [baseline])

  const save = useCallback(() => {
    if (!draft) return

    const name = draft.name.trim()
    if (!name) {
      toast.error('Firm name is required.')
      return
    }
    if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
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

    setSaving(true)
    // Persist the firm record.
    updateProfile({
      name,
      firm_type: draft.firm_type,
      registration_number: draft.registration_number.trim(),
      tin: draft.tin.trim(),
      year_established: year,
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      website: draft.website.trim(),
      office_address: draft.office_address.trim(),
      digital_address: draft.digital_address.trim(),
      city: draft.city.trim(),
      region: draft.region,
      default_jurisdiction: draft.default_jurisdiction,
      description: draft.description.trim(),
    })
    // Mirror name + logo + colour into branding so the sidebar updates.
    setBranding({
      firmName: name,
      firmLogoDataUrl: draft.logoDataUrl,
      firmBrandColor: draft.brandColor,
    })

    const saved = readDraft()
    setBaseline(saved)
    setDraft(saved)
    setSaving(false)
    toast.success('Firm settings saved.')
  }, [draft, setBranding, updateProfile])

  return {
    hydrated,
    draft,
    setField,
    dirty,
    saving,
    save,
    discard,
  }
}
