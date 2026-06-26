import type { OutcomeType } from '@/stores/performance-local.store'

export const OUTCOME_TYPES: {
  id: OutcomeType
  label: string
  /** 'positive' tints green, 'negative' tints red. */
  tone: 'positive' | 'negative'
  /** Which subject the label field refers to. */
  subject: 'case' | 'client'
}[] = [
  { id: 'case_won', label: 'Case won', tone: 'positive', subject: 'case' },
  { id: 'case_lost', label: 'Case lost', tone: 'negative', subject: 'case' },
  { id: 'client_acquired', label: 'Client acquired', tone: 'positive', subject: 'client' },
  { id: 'client_lost', label: 'Client lost', tone: 'negative', subject: 'client' },
]

export const OUTCOME_META: Record<
  OutcomeType,
  { label: string; tone: 'positive' | 'negative'; subject: 'case' | 'client' }
> = Object.fromEntries(
  OUTCOME_TYPES.map((t) => [t.id, { label: t.label, tone: t.tone, subject: t.subject }]),
) as Record<OutcomeType, { label: string; tone: 'positive' | 'negative'; subject: 'case' | 'client' }>

export const POSITIVE = '#216A43'
export const NEGATIVE = '#C0392B'
