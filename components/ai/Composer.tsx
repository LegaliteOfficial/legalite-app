'use client'

import { PaperPlaneTilt } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function Composer({
  value, onChange, onSend, onKeyDown, disabled,
}: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  disabled: boolean
}) {
  return (
    <div
      className="px-6 py-4 border-t"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask LegaLite anything…"
          rows={1}
          className="resize-none min-h-[44px] max-h-[120px]"
          disabled={disabled}
        />
        <Button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          size="icon-lg"
          className="h-11 w-11 shrink-0"
          aria-label="Send"
        >
          <PaperPlaneTilt size={15} strokeWidth={1.75} />
        </Button>
      </div>
      <p
        className="text-center text-[10.5px] mt-2"
        style={{ color: 'var(--text-muted)' }}
      >
        Answers are grounded in Ghana legal sources. Always verify before relying on them in practice.
      </p>
    </div>
  )
}
