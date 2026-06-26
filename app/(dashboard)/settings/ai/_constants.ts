import type { AnswerMode, CitationStyle } from '@/stores/ai-settings-local.store'

export const CITATION_STYLES: {
  value: CitationStyle
  label: string
  example: string
}[] = [
  {
    value: 'ghana',
    label: 'Ghana Law Reports (GLR)',
    example: 'Republic v High Court; Ex parte Adjei [2020-2021] 1 GLR 45',
  },
  {
    value: 'oscola',
    label: 'OSCOLA',
    example: 'Contracts Act 1960 (Act 25) s 8',
  },
  {
    value: 'bluebook',
    label: 'Bluebook',
    example: 'Contracts Act, 1960, Act 25, § 8 (Ghana)',
  },
  {
    value: 'plain',
    label: 'Plain reference',
    example: 'Section 8 of the Contracts Act, 1960',
  },
]

export const ANSWER_MODES: { value: AnswerMode; label: string; hint: string }[] = [
  {
    value: 'balanced',
    label: 'Balanced',
    hint: 'A clear answer backed by the key authorities.',
  },
  {
    value: 'concise',
    label: 'Concise',
    hint: 'Short, direct answers with minimal elaboration.',
  },
  {
    value: 'detailed',
    label: 'Detailed research',
    hint: 'Full legal reasoning with all relevant authorities.',
  },
  {
    value: 'drafting',
    label: 'Drafting',
    hint: 'Geared toward producing document-ready text.',
  },
]

export const CITATION_STYLE_LABEL: Record<CitationStyle, string> =
  Object.fromEntries(CITATION_STYLES.map((s) => [s.value, s.label])) as Record<
    CitationStyle,
    string
  >
