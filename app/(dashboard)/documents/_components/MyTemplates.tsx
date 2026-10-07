'use client'

/**
 * "Your templates": documents the firm designed and saved as templates,
 * plus a blank document to start a new design from scratch. A template
 * card previews its letterhead colour and typeface so templates are easy
 * to tell apart.
 */

import { FilePlus, Trash } from '@phosphor-icons/react'
import { DOCUMENT_FONTS, normaliseDesign } from '@/lib/documents/design'
import type { Document } from '@/types'

export function MyTemplates({
  templates,
  onOpen,
  onBlank,
  onDelete,
}: {
  templates: Document[]
  onOpen: (doc: Document) => void
  onBlank: () => void
  onDelete: (id: string, title: string) => void
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-heading text-[17px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Your templates
        </h2>
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          Design a document once, then reuse its layout and wording.
        </p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        <button
          type="button"
          onClick={onBlank}
          className="flex h-[148px] w-[150px] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors hover:border-[var(--gold)]"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          <FilePlus size={22} />
          <span className="text-[12.5px] font-semibold">Blank document</span>
        </button>

        {templates.map((t) => {
          const design = normaliseDesign(t.design)
          const font = DOCUMENT_FONTS.find((f) => f.id === design.typography.font)
          return (
            <div key={t.id} className="group relative shrink-0">
              <button
                type="button"
                onClick={() => onOpen(t)}
                className="flex h-[148px] w-[150px] flex-col overflow-hidden rounded-xl border text-left transition-shadow hover:shadow-[var(--shadow-md)]"
                style={{ borderColor: 'var(--border-default)', background: '#fff' }}
              >
                <span
                  className="h-2 w-full"
                  style={{ background: design.letterhead.enabled ? design.accent : 'var(--surface-sunken)' }}
                />
                <span className="flex-1 space-y-1 px-3 pt-3" aria-hidden>
                  <span className="block h-1.5 w-3/4 rounded" style={{ background: design.accent, opacity: 0.7 }} />
                  {[90, 100, 80, 95].map((w, i) => (
                    <span key={i} className="block h-1 rounded" style={{ width: `${w}%`, background: '#e5e7eb' }} />
                  ))}
                </span>
                <span className="border-t px-3 py-2" style={{ borderColor: 'var(--border-soft)' }}>
                  <span className="block truncate text-[12.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {t.title}
                  </span>
                  <span className="block truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {font?.label ?? 'Custom'} · {design.page.size}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(t.id, t.title)}
                aria-label={`Delete template ${t.title}`}
                className="absolute right-1.5 top-3 flex h-6 w-6 items-center justify-center rounded-md bg-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
              >
                <Trash size={12} style={{ color: '#B42318' }} />
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
