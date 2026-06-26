'use client'

/**
 * Firm profile — composition root.
 *
 * The form hook owns the draft, dirty tracking, and save/discard
 * against the firm-profile and branding stores. This file lays out the
 * header, the form sections, and a sticky save bar that only appears
 * when there are unsaved edits.
 */

import { Spinner } from '@/components/shared/Spinner'
import { FirmSettingsHeader } from './_components/FirmSettingsHeader'
import { FirmSettingsForm } from './_components/FirmSettingsForm'
import { FirmSaveBar } from './_components/FirmSaveBar'
import { useFirmSettingsForm } from './_hooks/use-firm-settings-form'

export default function FirmSettingsPage() {
  const { hydrated, draft, setField, dirty, saving, save, discard } =
    useFirmSettingsForm()

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ background: 'var(--surface-page)' }}
    >
      <FirmSettingsHeader />

      {!hydrated || !draft ? (
        <div
          className="flex items-center justify-center gap-2 py-24"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Spinner size={16} /> <span className="text-sm">Loading firm…</span>
        </div>
      ) : (
        <>
          <FirmSettingsForm draft={draft} setField={setField} />
          <FirmSaveBar
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
