'use client'

import { PencilLine, Scales } from '@phosphor-icons/react'
import type { DocumentTemplate } from '@/lib/templates'
import { CATEGORY_COLORS, CATEGORY_FALLBACK } from '../_constants'

/**
 * One card in the templates carousel — a clickable mini-preview of a
 * real legal document (letterhead → suit number → parties → title →
 * body → signature block) so partners can identify the template at a
 * glance. Tap the card to load the template into the editor; tap the
 * "Quick setup" pill to open the case-driven assembly view.
 *
 * Scaled-down 8.5×11 page with everything sized in 3-5 pixel
 * increments — looks intentional, not crammed.
 */
export function TemplateCard({
  template,
  onSelect,
  onQuickSetup,
}: {
  template: DocumentTemplate
  onSelect: (id: string) => void
  onQuickSetup: (id: string) => void
}) {
  const colors = CATEGORY_COLORS[template.category] ?? CATEGORY_FALLBACK

  return (
    <div className="flex-shrink-0 snap-start" style={{ width: 180 }}>
      <button
        type="button"
        onClick={() => onSelect(template.id)}
        className="group text-left w-full transition-all hover:shadow-xl hover:-translate-y-1"
      >
        <DocumentPreview template={template} colors={colors} />
        <h3
          className="font-heading text-[12px] font-bold mt-2 mb-0 leading-tight group-hover:text-[var(--gold)] transition-colors truncate"
          style={{ color: 'var(--navy)' }}
        >
          {template.name}
        </h3>
        <p className="text-[10px] mt-0.5 truncate" style={{ color: '#9CA3AF' }}>
          {template.category.charAt(0).toUpperCase() + template.category.slice(1)} ·{' '}
          {template.fields.length} fields
        </p>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onQuickSetup(template.id)
        }}
        className="w-full mt-1.5 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all hover:shadow-sm"
        style={{
          background: 'rgba(201,151,43,0.08)',
          color: 'var(--gold)',
          border: '1px solid rgba(201,151,43,0.2)',
        }}
      >
        <PencilLine size={10} />
        Quick Setup
      </button>
    </div>
  )
}

// ── Mini document preview ──────────────────────────────────────────────────

function DocumentPreview({
  template,
  colors,
}: {
  template: DocumentTemplate
  colors: { bg: string; accent: string }
}) {
  // Category-driven court letterhead text.
  const courtName =
    template.category === 'criminal'
      ? 'CRIMINAL'
      : template.category === 'family'
        ? 'FAMILY'
        : 'HIGH'

  return (
    <div
      className="rounded-lg border-2 overflow-hidden transition-all group-hover:border-[var(--gold)] shadow-sm"
      style={{
        borderColor: 'var(--border)',
        background: 'white',
        aspectRatio: '8.5/11',
      }}
    >
      <div
        className="p-3 h-full flex flex-col"
        style={{
          fontSize: '4px',
          fontFamily: "'Times New Roman', serif",
          color: '#374151',
          lineHeight: '1.6',
        }}
      >
        {/* Letterhead — coat of arms + court name. */}
        <div
          className="text-center mb-1.5 pb-1.5 border-b-2"
          style={{ borderColor: colors.accent + '40' }}
        >
          <div
            className="w-5 h-5 rounded-full mx-auto mb-1 flex items-center justify-center"
            style={{
              background: colors.accent + '15',
              border: `0.5px solid ${colors.accent}40`,
            }}
          >
            <Scales size={8} style={{ color: colors.accent }} />
          </div>
          <div
            className="font-bold tracking-wide"
            style={{ fontSize: '5px', color: colors.accent }}
          >
            IN THE {courtName} COURT
          </div>
          <div style={{ fontSize: '3.5px', color: '#9CA3AF' }}>
            REPUBLIC OF GHANA
          </div>
        </div>

        <div className="text-right mb-1" style={{ fontSize: '3.5px', color: '#6B7280' }}>
          SUIT NO: HC/0042/2025
        </div>

        {/* Parties block. */}
        <div className="mb-1.5 text-center" style={{ fontSize: '4px' }}>
          <div className="font-bold" style={{ color: 'var(--navy)' }}>
            JOHN MENSAH
          </div>
          <div style={{ fontSize: '3px', color: '#9CA3AF', letterSpacing: '0.5px' }}>
            ... {template.fields[0]?.label?.toUpperCase() ?? 'PLAINTIFF'}
          </div>
          <div className="font-bold my-0.5" style={{ color: '#6B7280', fontSize: '3.5px' }}>
            VS.
          </div>
          <div className="font-bold" style={{ color: 'var(--navy)' }}>
            KWAME ASANTE
          </div>
          <div style={{ fontSize: '3px', color: '#9CA3AF', letterSpacing: '0.5px' }}>
            ... {template.fields[1]?.label?.toUpperCase() ?? 'DEFENDANT'}
          </div>
        </div>

        {/* Document title — the template name in its accent color. */}
        <div
          className="text-center py-1 mb-1.5 border-y-2"
          style={{ borderColor: colors.accent + '30' }}
        >
          <div
            className="font-bold tracking-wider"
            style={{ fontSize: '5px', color: colors.accent }}
          >
            {template.name.toUpperCase()}
          </div>
        </div>

        {/* Body block. */}
        <div
          className="flex-1 px-1"
          style={{ fontSize: '3.5px', color: '#6B7280', lineHeight: '1.8' }}
        >
          <div className="mb-1">
            The {template.fields[0]?.label ?? 'Plaintiff'} herein states as follows:
          </div>
          <div className="mb-0.5">
            1. That the {template.fields[0]?.label ?? 'Plaintiff'} is a person of full legal capacity and is currently residing within the jurisdiction of this Honourable Court at Accra, Greater Accra Region.
          </div>
          <div className="mb-0.5">
            2. That on or about the date herein stated, the above-named parties did enter into an agreement pertaining to the subject matter of this action.
          </div>
          <div className="mb-0.5">
            3. That the {template.fields[1]?.label ?? 'Defendant'} has failed, refused and/or neglected to comply with the terms and conditions as agreed upon by both parties.
          </div>
          <div className="mb-0.5">
            4. That by reason of the foregoing, the {template.fields[0]?.label ?? 'Plaintiff'} has suffered loss and damage and seeks the reliefs endorsed hereon.
          </div>
          <div>
            5. WHEREFORE the {template.fields[0]?.label ?? 'Plaintiff'} claims against the {template.fields[1]?.label ?? 'Defendant'} as per the endorsement on this document.
          </div>
        </div>

        {/* Signature block. */}
        <div
          className="mt-auto pt-1 border-t"
          style={{ borderColor: '#f3f4f6', fontSize: '3px', color: '#9CA3AF' }}
        >
          <div>Dated this 23rd day of March, 2026</div>
          <div className="mt-1 w-12 border-b" style={{ borderColor: '#d1d5db' }} />
          <div className="font-bold mt-0.5" style={{ fontSize: '3.5px', color: '#6B7280' }}>
            Counsel for {template.fields[0]?.label ?? 'Plaintiff'}
          </div>
        </div>
      </div>
    </div>
  )
}
