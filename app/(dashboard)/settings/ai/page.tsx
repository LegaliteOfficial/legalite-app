'use client'

/**
 * AI settings — composition root.
 *
 * The form hook owns the draft, dirty tracking, and save/discard
 * against the AI-settings store. This file lays out the header, the
 * settings sections, and a sticky save bar shown only when dirty.
 */

import { Spinner } from '@/components/shared/Spinner'
import { AiSettingsHeader } from './_components/AiSettingsHeader'
import { AiSettingsForm } from './_components/AiSettingsForm'
import { AiSaveBar } from './_components/AiSaveBar'
import { useAiSettingsForm } from './_hooks/use-ai-settings-form'

export default function AiSettingsPage() {
  const { hydrated, draft, setField, dirty, saving, save, discard } =
    useAiSettingsForm()

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ background: 'var(--surface-page)' }}
    >
      <AiSettingsHeader />

      {!hydrated || !draft ? (
        <div
          className="flex items-center justify-center gap-2 py-24"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Spinner size={16} /> <span className="text-sm">Loading settings…</span>
        </div>
      ) : (
        <>
          <AiSettingsForm draft={draft} setField={setField} />
          <AiSaveBar
            visible={dirty}
            saving={saving}
            onSave={save}
            onDiscard={discard}
          />
        </>
      )}
    </div>
  )
}
