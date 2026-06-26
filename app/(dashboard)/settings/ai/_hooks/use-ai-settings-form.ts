'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  useAiSettingsStore,
  type AiSettings,
} from '@/stores/ai-settings-local.store'

/**
 * AI-settings form state. Holds an editable draft of the firm's AI
 * preferences, tracks dirtiness against the saved baseline so the save
 * bar only shows when there's something to save, and writes the whole
 * settings object back on save.
 */
export function useAiSettingsForm() {
  const [hydrated, setHydrated] = useState(false)
  const [draft, setDraft] = useState<AiSettings | null>(null)
  const [baseline, setBaseline] = useState<AiSettings | null>(null)
  const [saving, setSaving] = useState(false)

  const updateSettings = useAiSettingsStore((s) => s.updateSettings)

  useEffect(() => {
    void Promise.resolve(useAiSettingsStore.persist.rehydrate()).then(() => {
      const initial = useAiSettingsStore.getState().settings
      setDraft(initial)
      setBaseline(initial)
      setHydrated(true)
    })
  }, [])

  const setField = useCallback(
    <K extends keyof AiSettings>(key: K, value: AiSettings[K]) => {
      setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
    },
    [],
  )

  const dirty = useMemo(() => {
    if (!draft || !baseline) return false
    return JSON.stringify(draft) !== JSON.stringify(baseline)
  }, [draft, baseline])

  const discard = useCallback(() => setDraft(baseline), [baseline])

  const save = useCallback(() => {
    if (!draft) return
    setSaving(true)
    updateSettings(draft)
    setBaseline(draft)
    setSaving(false)
    toast.success('AI settings saved.')
  }, [draft, updateSettings])

  return { hydrated, draft, setField, dirty, saving, save, discard }
}
