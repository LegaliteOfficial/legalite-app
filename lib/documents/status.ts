/**
 * Drafting workflow states for editor documents. Mirrors the CHECK
 * constraint on documents.status in the backend.
 */

export const DOCUMENT_STATUSES = ['draft', 'in_review', 'final', 'filed'] as const
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]

export const STATUS_META: Record<
  DocumentStatus,
  { label: string; hint: string; fg: string; bg: string; dot: string }
> = {
  draft: {
    label: 'Draft',
    hint: 'Being written',
    fg: 'var(--text-secondary)',
    bg: 'var(--surface-sunken)',
    dot: '#9CA3AF',
  },
  in_review: {
    label: 'In review',
    hint: 'Waiting on a colleague to check it',
    fg: '#1D4ED8',
    bg: 'rgba(37,99,235,0.08)',
    dot: '#2563EB',
  },
  final: {
    label: 'Final',
    hint: 'Approved and ready to file or send',
    fg: '#166534',
    bg: 'rgba(46,125,79,0.10)',
    dot: '#2E7D4F',
  },
  filed: {
    label: 'Filed',
    hint: 'Lodged with the court or sent out',
    fg: '#8A6516',
    bg: 'rgba(201,151,43,0.12)',
    dot: '#C9972B',
  },
}

export function normaliseStatus(value: string | null | undefined): DocumentStatus {
  return (DOCUMENT_STATUSES as readonly string[]).includes(value ?? '')
    ? (value as DocumentStatus)
    : 'draft'
}
