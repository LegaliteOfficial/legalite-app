'use client'

import { CaretDown } from '@phosphor-icons/react'
import type { AiSettings, AnswerMode, CitationStyle } from '@/stores/ai-settings-local.store'
import { ANSWER_MODES, CITATION_STYLES } from '../_constants'
import { ToggleRow } from './primitives/ToggleRow'

type SetField = <K extends keyof AiSettings>(key: K, value: AiSettings[K]) => void

export function AiSettingsForm({
  draft,
  setField,
}: {
  draft: AiSettings
  setField: SetField
}) {
  const citationExample =
    CITATION_STYLES.find((s) => s.value === draft.citationStyle)?.example ?? ''

  return (
    <div className="space-y-6">
      {/* Citations */}
      <SectionCard
        title="Citations"
        subtitle="How the assistant references statutes and case law in answers."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="ai-citation"
              className="block text-xs font-semibold"
              style={{ color: 'var(--text-secondary)' }}
            >
              Citation style
            </label>
            <div className="relative max-w-sm">
              <select
                id="ai-citation"
                value={draft.citationStyle}
                onChange={(e) => setField('citationStyle', e.target.value as CitationStyle)}
                className="appearance-none w-full rounded-lg border bg-white h-10 px-3 pr-9 text-sm transition-colors focus:outline-none focus:border-yellow-600"
                style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
              >
                {CITATION_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <CaretDown
                size={13}
                strokeWidth={2.25}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
            {citationExample && (
              <p
                className="text-[12px] mt-1 rounded-md px-2.5 py-1.5 font-mono inline-block"
                style={{ background: 'var(--surface-overlay)', color: 'var(--text-secondary)' }}
              >
                {citationExample}
              </p>
            )}
          </div>

          <Divider />

          <ToggleRow
            label="Show citation excerpts"
            description="Display the quoted passage under each cited authority."
            checked={draft.showCitationExcerpts}
            onChange={(v) => setField('showCitationExcerpts', v)}
          />
          <ToggleRow
            label="Always show sources"
            description="List the sources panel on every answer, not just low-confidence ones."
            checked={draft.alwaysShowSources}
            onChange={(v) => setField('alwaysShowSources', v)}
          />
        </div>
      </SectionCard>

      {/* Default mode */}
      <SectionCard
        title="Default mode"
        subtitle="The answering style new conversations start in. Users can switch per chat."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ANSWER_MODES.map((mode) => (
              <ModeCard
                key={mode.value}
                active={draft.defaultMode === mode.value}
                label={mode.label}
                hint={mode.hint}
                onSelect={() => setField('defaultMode', mode.value as AnswerMode)}
              />
            ))}
          </div>

          <Divider />

          <ToggleRow
            label="Show confidence badge"
            description="Mark each answer high, medium, or low confidence."
            checked={draft.showConfidence}
            onChange={(v) => setField('showConfidence', v)}
          />
          <ToggleRow
            label="Show reasoning summary"
            description="Reveal the assistant's reasoning by default instead of on demand."
            checked={draft.showReasoning}
            onChange={(v) => setField('showReasoning', v)}
          />
        </div>
      </SectionCard>

      {/* Firm knowledge base */}
      <SectionCard
        title="Firm knowledge base"
        subtitle="Which sources retrieval may draw on. Ghana statutes and public case law are always included."
      >
        <div>
          <ToggleRow
            label="Search firm documents"
            description="Let the assistant retrieve from your firm's uploaded documents."
            checked={draft.searchFirmDocuments}
            onChange={(v) => setField('searchFirmDocuments', v)}
          />
          <ToggleRow
            label="Include firm precedents"
            description="Surface your firm's past matters as precedent alongside public cases."
            checked={draft.includeFirmPrecedents}
            onChange={(v) => setField('includeFirmPrecedents', v)}
          />
          <ToggleRow
            label="Restrict to verified authorities"
            description="Only cite published, verified sources — excludes draft or unverified material."
            checked={draft.restrictToVerified}
            onChange={(v) => setField('restrictToVerified', v)}
          />
        </div>
      </SectionCard>

      {/* Safety */}
      <SectionCard
        title="Safety"
        subtitle="Guardrails on every answer."
      >
        <ToggleRow
          label="Always show the legal-advice disclaimer"
          description="Append the standard notice that AI output is not a substitute for professional advice."
          checked={draft.alwaysShowDisclaimer}
          onChange={(v) => setField('alwaysShowDisclaimer', v)}
        />
      </SectionCard>
    </div>
  )
}

function ModeCard({
  active,
  label,
  hint,
  onSelect,
}: {
  active: boolean
  label: string
  hint: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className="rounded-xl border px-4 py-3 text-left transition-colors"
      style={{
        borderColor: active ? 'var(--gold)' : 'var(--border)',
        background: active ? 'var(--gold-muted)' : 'var(--surface-card)',
        boxShadow: active ? '0 0 0 1px var(--gold)' : 'none',
      }}
    >
      <span className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        {label}
      </span>
      <span className="block text-[12.5px] mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
        {hint}
      </span>
    </button>
  )
}

function Divider() {
  return <div className="h-px" style={{ background: 'var(--border)' }} />
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border)',
        boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
      }}
    >
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="font-heading text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        <p className="text-[13px] mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
          {subtitle}
        </p>
      </div>
      <div className="px-5 py-2">{children}</div>
    </section>
  )
}
