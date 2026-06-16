'use client'

import { Label } from '@/components/ui/label'

/**
 * Section-form field label. Renders an optional red asterisk for
 * required fields so the user can scan a section and see which inputs
 * are mandatory at a glance.
 */
export function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <Label
      className="text-[12.5px] font-semibold mb-1.5 block"
      style={{ color: 'var(--text-primary)' }}
    >
      {children}
      {required && (
        <span style={{ color: '#C0392B', marginLeft: 2 }}>*</span>
      )}
    </Label>
  )
}
