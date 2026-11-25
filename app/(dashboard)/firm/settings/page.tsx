'use client'

/**
 * Firm profile — composition root.
 *
 * The form hook loads the firm from the API, owns the draft and dirty
 * tracking, and saves through updateFirm. This file lays out the
 * header, the form sections, and a sticky save bar that only appears
 * when there are unsaved edits.
 */

import { RequirePermission } from '@/components/shared/RequirePermission'
import { Spinner } from '@/components/shared/Spinner'
import { FirmSettingsHeader } from './_components/FirmSettingsHeader'
import { FirmSettingsForm } from './_components/FirmSettingsForm'
import { FirmSaveBar } from './_components/FirmSaveBar'
import { useFirmSettingsForm } from './_hooks/use-firm-settings-form'

function FirmSettingsPageContent() {
  const { hydrated, loadError, draft, setField, dirty, saving, save, discard } =
    useFirmSettingsForm()

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ background: 'var(--surface-page)' }}
    >
      <FirmSettingsHeader />

      {loadError ? (
        <p className="py-24 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          {loadError}
        </p>
      ) : !hydrated || !draft ? (
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
            onSave={() => void save()}
            onDiscard={discard}
          />
        </>
      )}
    </div>
  )
}

export default function FirmSettingsPage() {
  return (
    <RequirePermission permission="manage-account-info" what="the firm profile">
      <FirmSettingsPageContent />
    </RequirePermission>
  )
}
