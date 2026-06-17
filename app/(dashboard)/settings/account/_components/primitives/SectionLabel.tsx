'use client'

import { Label } from '@/components/ui/label'

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label
      className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
      style={{ color: '#6B7280' }}
    >
      {children}
    </Label>
  )
}
