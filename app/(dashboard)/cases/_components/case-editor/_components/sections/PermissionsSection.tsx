'use client'

import { useRef, useState } from 'react'
import { FieldLabel } from '../primitives/FieldLabel'
import { RadioOption } from '../primitives/RadioOption'
import { FirmUserMultiPicker } from '../pickers/FirmUserMultiPicker'
import type { NewCaseForm, SetField } from '../../_types'

/**
 * Who-can-see-this-case picker. Two modes: everyone (default — no
 * extra controls) or specific (reveals a user/group multi-picker plus
 * a focus-aware empty-state hint).
 */
export function PermissionsSection({
  form,
  setField,
  firmUserOptions,
}: {
  form: NewCaseForm
  setField: SetField
  firmUserOptions: string[]
}) {
  // Tracks whether the user has the picker focused. The empty-state
  // hint panel only shows while the picker is focused AND the list is
  // empty — it no longer takes up space when the user has scrolled
  // past or hasn't engaged the field. Blur uses a small timeout so a
  // mousedown on the dropdown options doesn't immediately re-hide the
  // hint.
  const [pickerFocused, setPickerFocused] = useState(false)
  const blurTimer = useRef<number | null>(null)
  const handleFocus = () => {
    if (blurTimer.current) {
      window.clearTimeout(blurTimer.current)
      blurTimer.current = null
    }
    setPickerFocused(true)
  }
  const handleBlur = () => {
    blurTimer.current = window.setTimeout(
      () => setPickerFocused(false),
      120,
    )
  }

  const showEmptyHint =
    pickerFocused && form.permitted_users.length === 0

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel required>Firm users with access</FieldLabel>
        <div className="flex flex-col gap-3 pt-1">
          <RadioOption
            checked={form.permissions_mode === 'everyone'}
            onChange={() => setField('permissions_mode', 'everyone')}
            label="Everyone"
            hint="All firm users see this case."
          />
          <RadioOption
            checked={form.permissions_mode === 'specific'}
            onChange={() => setField('permissions_mode', 'specific')}
            label="Specific users or groups"
            hint="Only users you add see this case."
          />
        </div>
      </div>
      {form.permissions_mode === 'specific' && (
        <div className="space-y-2 pl-7">
          <FieldLabel required>Add users or groups</FieldLabel>
          <FirmUserMultiPicker
            value={form.permitted_users}
            onChange={(v) => setField('permitted_users', v)}
            firmUsers={firmUserOptions}
            groups={['Everyone']}
            placeholder="Find users or groups"
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {showEmptyHint && (
            <div
              className="rounded-xl border px-5 py-6 text-center"
              style={{
                background: 'var(--surface-sunken)',
                borderColor: 'var(--border-soft)',
              }}
            >
              <p
                className="text-[13px] font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                No users or groups have access to this case.
              </p>
              <p
                className="mt-1 text-[12px]"
                style={{ color: 'var(--text-muted)' }}
              >
                Add at least one user above so the case isn&rsquo;t locked
                out for everyone.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
