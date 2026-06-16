'use client'

import type { NewCaseForm, SetField } from '../../_types'
import { AllocationField } from './AllocationField'

/**
 * Allocation percentages for the Originating / Responsible solicitor
 * reports. Each one has a "Use firm settings" toggle — when checked the
 * input is disabled and the firm-wide default applies; unchecked lets
 * the user override per case.
 */
export function ReportsSection({
  form,
  setField,
}: {
  form: NewCaseForm
  setField: SetField
}) {
  const clamp = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, '')
    if (!cleaned) return ''
    const n = Number(cleaned)
    if (Number.isNaN(n)) return ''
    return String(Math.min(100, Math.max(0, n)))
  }
  return (
    <div className="grid grid-cols-2 gap-6">
      <AllocationField
        label="Originating lawyer allocation"
        value={form.originating_allocation}
        useFirmSettings={form.use_firm_settings_originating}
        onValueChange={(v) => setField('originating_allocation', clamp(v))}
        onToggleFirmSettings={(v) =>
          setField('use_firm_settings_originating', v)
        }
      />
      <AllocationField
        label="Responsible lawyer allocation"
        value={form.responsible_allocation}
        useFirmSettings={form.use_firm_settings_responsible}
        onValueChange={(v) => setField('responsible_allocation', clamp(v))}
        onToggleFirmSettings={(v) =>
          setField('use_firm_settings_responsible', v)
        }
      />
    </div>
  )
}
