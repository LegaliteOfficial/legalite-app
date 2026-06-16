'use client'

import { Input } from '@/components/ui/input'
import { Checkbox } from '../primitives/Checkbox'
import { FieldLabel } from '../primitives/FieldLabel'

/**
 * One allocation percentage row + a "use firm settings" override. Used
 * twice in the Reports section (originating + responsible allocations).
 */
export function AllocationField({
  label,
  value,
  useFirmSettings,
  onValueChange,
  onToggleFirmSettings,
}: {
  label: string
  value: string
  useFirmSettings: boolean
  onValueChange: (v: string) => void
  onToggleFirmSettings: (v: boolean) => void
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex">
        <Input
          inputMode="numeric"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={useFirmSettings}
          className="h-10 rounded-l-lg text-[13px] text-right tabular-nums"
          style={{ borderColor: 'var(--border-default)' }}
        />
        <span
          className="inline-flex items-center px-3 h-10 rounded-r-lg border border-l-0 text-[12px] font-medium"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-sunken)',
            color: 'var(--text-muted)',
          }}
        >
          %
        </span>
      </div>
      <div className="mt-2">
        <Checkbox
          checked={useFirmSettings}
          onChange={onToggleFirmSettings}
          label="Use firm settings"
        />
      </div>
    </div>
  )
}
