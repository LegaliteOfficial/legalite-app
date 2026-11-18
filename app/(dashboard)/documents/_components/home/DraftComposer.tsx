'use client'

/**
 * The top of the Documents home: "What do you need to draft?". Typing an
 * instruction and pressing Draft creates a document, opens it in the
 * studio and has the AI write the first version there, using the linked
 * case's facts and the legal library. Blank and From template sit beside
 * it, so every way of starting a document begins in the same place.
 */

import { useMemo, useState } from 'react'
import { Briefcase, FilePlus, Sparkle, SquaresFour } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/shared/Spinner'
import { DRAFT_LIMITS } from '@/lib/ai/drafting'
import type { Case } from '@/types'

const NO_CASE = '__none__'

const SUGGESTIONS = [
  'Statement of claim to recover an unpaid debt',
  'Affidavit in support of a motion for summary judgment',
  'Letter before action demanding payment within 14 days',
  'Tenancy agreement for a residential flat in Accra',
  'Notice of motion for an interlocutory injunction',
]

export function DraftComposer({
  cases,
  defaultCaseId,
  starting,
  onDraft,
  onBlank,
  onBrowseTemplates,
}: {
  cases: Case[]
  defaultCaseId: string | null
  starting: 'blank' | 'template' | 'ai' | null
  onDraft: (instruction: string, linkedCase: Case | null) => void
  onBlank: (linkedCase: Case | null) => void
  onBrowseTemplates: () => void
}) {
  const [instruction, setInstruction] = useState('')
  const [casePick, setCasePick] = useState<string | null>(null)
  const caseId = casePick ?? defaultCaseId ?? NO_CASE
  const linkedCase = cases.find((c) => c.id === caseId) ?? null

  const caseItems = useMemo(
    () => [
      { value: NO_CASE, label: 'No case' },
      ...cases.map((c) => ({ value: c.id, label: c.client_name ? `${c.title} · ${c.client_name}` : c.title })),
    ],
    [cases],
  )

  const busy = starting !== null
  const canDraft = instruction.trim().length >= 8 && !busy

  const submit = () => {
    if (canDraft) onDraft(instruction, linkedCase)
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)', boxShadow: 'var(--shadow-xs)' }}
    >
      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <label htmlFor="draft-instruction" className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          <Sparkle size={14} weight="fill" style={{ color: 'var(--gold)' }} />
          What do you need to draft?
        </label>
        <textarea
          id="draft-instruction"
          value={instruction}
          maxLength={DRAFT_LIMITS.instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              submit()
            }
          }}
          rows={3}
          placeholder="e.g. Defence to a claim for breach of a supply contract. The client says the goods were defective and payment was withheld lawfully."
          className="mt-2 w-full resize-none bg-transparent text-[14px] leading-relaxed outline-none placeholder:text-[var(--text-subtle)]"
          style={{ color: 'var(--text-primary)' }}
        />
        {!instruction && (
          <div className="mb-1 flex gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInstruction(s)}
                className="shrink-0 cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] transition-colors hover:border-[var(--gold)]"
                style={{ borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className="flex flex-wrap items-center gap-2 border-t px-3 py-2.5 sm:px-4"
        style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-sunken)' }}
      >
        <Select items={caseItems} value={caseId} onValueChange={(v) => setCasePick((v as string) || NO_CASE)}>
          <SelectTrigger className="h-8 max-w-[260px] rounded-lg bg-[var(--surface-card)] text-[12.5px]" aria-label="Case to draft for">
            <Briefcase size={14} className="shrink-0" style={{ color: linkedCase ? 'var(--gold-dark)' : 'var(--text-muted)' }} />
            <span className="min-w-0 truncate">
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {caseItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="hidden text-[11.5px] md:inline" style={{ color: 'var(--text-muted)' }}>
          {linkedCase ? 'Uses the case facts and cites the legal library' : 'Cites the legal library where it can'}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 rounded-lg bg-[var(--surface-card)]" disabled={busy} onClick={() => onBlank(linkedCase)}>
            {starting === 'blank' ? <Spinner size={13} /> : <FilePlus size={14} />}
            <span className="hidden sm:inline">Blank</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-lg bg-[var(--surface-card)]" disabled={busy} onClick={onBrowseTemplates}>
            <SquaresFour size={14} />
            <span className="hidden sm:inline">From template</span>
          </Button>
          <Button size="sm" className="h-8 rounded-lg" disabled={!canDraft} onClick={submit} title="Draft with AI (Ctrl/Cmd + Enter)">
            {starting === 'ai' ? <Spinner size={13} /> : <Sparkle size={14} weight="fill" />}
            Draft with AI
          </Button>
        </div>
      </div>
    </section>
  )
}
