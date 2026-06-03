'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  BookOpen,
  ChevronDown,
  Copy,
  Check,
  Scale,
  Building2,
  Briefcase,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import type {
  AskResponse,
  Citation,
  Confidence,
  StructuredCitation,
} from '@/lib/ai/types'

interface AnswerCardProps {
  response: AskResponse
}

const CONFIDENCE_META: Record<
  Confidence,
  { label: string; color: string; bg: string }
> = {
  high:   { label: 'High confidence',   color: '#2E7D4F', bg: 'rgba(46,125,79,0.10)' },
  medium: { label: 'Medium confidence', color: '#B8860B', bg: 'rgba(201,151,43,0.14)' },
  low:    { label: 'Low confidence',    color: '#C0392B', bg: 'rgba(192,57,43,0.10)' },
}

export function AnswerCard({ response }: AnswerCardProps) {
  const [copied, setCopied] = useState(false)
  const structured = response.structured_answer
  const directAnswer = structured?.direct_answer || response.answer
  const reasoning = structured?.legal_reasoning || response.reasoning_summary
  const confidenceText = structured?.confidence_assessment
  const confidence = CONFIDENCE_META[response.confidence]

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(buildPlainText(response))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard rejected — most browsers only allow it via secure context
    }
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Header — confidence + intent + copy */}
      <div
        className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
            style={{ background: confidence.bg, color: confidence.color }}
          >
            <span
              aria-hidden
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: confidence.color }}
            />
            {confidence.label}
          </span>
          {response.query_intent && (
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
              style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}
            >
              <Sparkles size={10} strokeWidth={1.75} />
              {humanizeIntent(response.query_intent)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={copyAll}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2 py-1 rounded-md transition-colors"
          style={{ color: copied ? '#2E7D4F' : 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            if (!copied) e.currentTarget.style.background = 'var(--surface-overlay)'
          }}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {copied ? <Check size={12} strokeWidth={1.75} /> : <Copy size={12} strokeWidth={1.75} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Direct answer */}
      <div className="px-5 pt-4 pb-2">
        <p
          className="text-[10.5px] font-medium uppercase tracking-wider mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Answer
        </p>
        <div
          className="text-[14.5px] leading-relaxed ai-markdown"
          style={{ color: 'var(--text-primary)' }}
        >
          <ReactMarkdown>{directAnswer}</ReactMarkdown>
        </div>
      </div>

      {/* Legal reasoning */}
      {reasoning && (
        <div className="px-5 pb-4">
          <Section title="Legal reasoning">
            <div className="text-[13px] leading-relaxed ai-markdown" style={{ color: 'var(--text-secondary)' }}>
              <ReactMarkdown>{reasoning}</ReactMarkdown>
            </div>
            {confidenceText && (
              <p
                className="mt-2 text-[12px] italic"
                style={{ color: 'var(--text-muted)' }}
              >
                {confidenceText}
              </p>
            )}
          </Section>
        </div>
      )}

      {/* Applicable law */}
      {structured?.applicable_law && structured.applicable_law.length > 0 && (
        <CitationGroup
          title="Applicable law"
          Icon={Scale}
          items={structured.applicable_law}
          kind="law"
        />
      )}

      {/* Relevant public cases */}
      {structured?.relevant_public_cases && structured.relevant_public_cases.length > 0 && (
        <CitationGroup
          title="Relevant cases"
          Icon={Building2}
          items={structured.relevant_public_cases}
          kind="case"
        />
      )}

      {/* Firm similar cases (tenant-private) */}
      {structured?.firm_similar_cases && structured.firm_similar_cases.length > 0 && (
        <CitationGroup
          title="Similar cases from your firm"
          Icon={Briefcase}
          items={structured.firm_similar_cases}
          kind="case"
          accent
        />
      )}

      {/* Raw citations (source provenance) */}
      {response.citations.length > 0 && (
        <SourcesBlock citations={response.citations} />
      )}

      {/* Disclaimer */}
      <p
        className="text-[11px] px-5 py-3 border-t"
        style={{
          color: 'var(--text-muted)',
          background: 'var(--surface-sunken)',
          borderColor: 'var(--border-soft)',
        }}
      >
        {response.disclaimer}
      </p>
    </div>
  )
}

// ── Pieces ───────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="text-[10.5px] font-medium uppercase tracking-wider mb-2"
        style={{ color: 'var(--text-muted)' }}
      >
        {title}
      </p>
      {children}
    </div>
  )
}

interface CitationGroupProps {
  title: string
  Icon: typeof Scale
  items: StructuredCitation[]
  kind: 'law' | 'case'
  accent?: boolean
}

function CitationGroup({ title, Icon, items, kind, accent }: CitationGroupProps) {
  const [expanded, setExpanded] = useState(items.length <= 3)

  return (
    <div className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left transition-colors"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-overlay)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <span className="inline-flex items-center gap-2">
          <Icon size={14} strokeWidth={1.75} style={{ color: accent ? 'var(--gold)' : 'var(--text-secondary)' }} />
          <span
            className="text-[12.5px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </span>
          <span
            className="inline-flex items-center justify-center h-[18px] min-w-[20px] px-1.5 rounded-full text-[10.5px] font-medium tabular-nums"
            style={{
              background: 'var(--surface-sunken)',
              color: 'var(--text-muted)',
            }}
          >
            {items.length}
          </span>
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          style={{
            color: 'var(--text-muted)',
            transform: expanded ? 'none' : 'rotate(-90deg)',
            transition: 'transform 180ms ease',
          }}
        />
      </button>
      {expanded && (
        <ul className="px-5 pb-4 space-y-2.5">
          {items.map((item) => (
            <li
              key={item.citation_id}
              className="flex gap-3 text-[12.5px] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span
                className="inline-flex items-center justify-center h-[18px] min-w-[22px] px-1.5 rounded text-[10.5px] font-semibold tabular-nums shrink-0"
                style={{
                  background: accent ? 'rgba(201,151,43,0.14)' : 'var(--surface-sunken)',
                  color: accent ? 'var(--gold-dark)' : 'var(--text-secondary)',
                }}
              >
                {item.citation_id}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className="font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {kind === 'law' ? formatLawHeading(item) : formatCaseHeading(item)}
                </div>
                {item.summary && (
                  <div className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {item.summary}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SourcesBlock({ citations }: { citations: Citation[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? citations : citations.slice(0, 3)

  return (
    <div className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
      <div className="px-5 py-3">
        <p
          className="text-[10.5px] font-medium uppercase tracking-wider mb-2.5"
          style={{ color: 'var(--text-muted)' }}
        >
          Sources ({citations.length})
        </p>
        <ul className="space-y-1.5">
          {visible.map((c, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[12px] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              <BookOpen
                size={11}
                strokeWidth={1.75}
                className="mt-1 shrink-0"
                style={{ color: c.source_scope === 'tenant_private' ? 'var(--gold)' : 'var(--text-muted)' }}
              />
              <span className="flex-1 min-w-0">
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatCitationHeading(c)}
                </span>
                {c.page_number && (
                  <span className="ml-1" style={{ color: 'var(--text-muted)' }}>
                    · p.{c.page_number}
                  </span>
                )}
                {c.relevance > 0 && (
                  <span className="ml-1 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    · {Math.round(c.relevance * 100)}% match
                  </span>
                )}
                {c.source_scope === 'tenant_private' && (
                  <span className="ml-1 text-[10.5px]" style={{ color: 'var(--gold-dark)' }}>
                    · firm
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        {citations.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-medium hover:underline underline-offset-2"
            style={{ color: 'var(--gold)' }}
          >
            <ExternalLink size={11} strokeWidth={1.75} />
            {expanded ? 'Show fewer' : `Show ${citations.length - 3} more`}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Formatters ───────────────────────────────────────────────────────────

function formatLawHeading(c: StructuredCitation): string {
  const parts: string[] = []
  if (c.law_name) parts.push(c.law_name)
  if (c.section) parts.push(`s.${c.section}`)
  else if (c.article) parts.push(`art.${c.article}`)
  return parts.join(' · ') || `Citation ${c.citation_id}`
}

function formatCaseHeading(c: StructuredCitation): string {
  const parts: string[] = []
  if (c.case_title) parts.push(c.case_title)
  if (c.court) parts.push(c.court)
  return parts.join(' — ') || c.law_name || `Citation ${c.citation_id}`
}

function formatCitationHeading(c: Citation): string {
  if (c.law_name) {
    const parts = [c.law_name]
    if (c.section) parts.push(`s.${c.section}`)
    else if (c.article) parts.push(`art.${c.article}`)
    return parts.join(', ')
  }
  if (c.law) return c.law
  return 'Source'
}

function humanizeIntent(intent: string): string {
  // The query planner emits snake_case identifiers. Render them in title case.
  return intent
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function buildPlainText(r: AskResponse): string {
  const sa = r.structured_answer
  const direct = sa?.direct_answer || r.answer
  const reasoning = sa?.legal_reasoning || r.reasoning_summary
  let out = direct
  if (reasoning) out += '\n\nLegal reasoning:\n' + reasoning
  if (r.citations.length) {
    out += '\n\nSources:\n'
    for (const c of r.citations) {
      out += `- ${formatCitationHeading(c)}`
      if (c.page_number) out += `, p.${c.page_number}`
      out += '\n'
    }
  }
  out += '\n\n' + r.disclaimer
  return out
}
