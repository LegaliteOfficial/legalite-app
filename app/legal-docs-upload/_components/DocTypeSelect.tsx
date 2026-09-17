'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * `doc_type` is a free-form string server-side (see
 * legalite-ai/app/api/routes/documents.py — "Constitution | Act |
 * Regulation | Case Law | ..."), applied to an entire bulk-upload batch.
 * This list is just a curated set of the conventional values; "Other"
 * falls back to a text input so nothing is actually restricted.
 */
const DOC_TYPES = ['Constitution', 'Act', 'Regulation', 'Case Law', 'Practice Direction', 'Legal Notice'] as const

interface DocTypeSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function DocTypeSelect({ value, onChange, disabled }: DocTypeSelectProps) {
  const isCustom = value !== '' && !(DOC_TYPES as readonly string[]).includes(value)
  // Derived from the value by default, so a restored custom type still
  // lands in the text input even though it arrives after first render.
  // An explicit choice ("Other…" / "Choose from list") overrides it,
  // which is what keeps the empty input open while it is being typed in.
  const [explicitMode, setExplicitMode] = useState<boolean | null>(null)
  const customMode = explicitMode ?? isCustom

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
        Upload type
      </Label>
      {customMode ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            placeholder="e.g. Practice Note"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="w-56"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setExplicitMode(false)
              onChange('')
            }}
            className="text-[12px] underline underline-offset-2 disabled:opacity-50"
            style={{ color: 'var(--text-secondary)' }}
          >
            Choose from list
          </button>
        </div>
      ) : (
        <Select
          value={value}
          disabled={disabled}
          onValueChange={(next) => {
            if (next === '__custom__') {
              setExplicitMode(true)
              onChange('')
            } else {
              onChange(next ?? '')
            }
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select a document type…" />
          </SelectTrigger>
          <SelectContent>
            {DOC_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
            <SelectItem value="__custom__">Other…</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
