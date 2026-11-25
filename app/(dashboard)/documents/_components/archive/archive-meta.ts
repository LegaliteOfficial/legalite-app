/**
 * Labels for the firm archive. Document types mirror the AI service's list
 * (legalite-ai app/services/archive_analyzer.py DOCUMENT_TYPES).
 */

export const ARCHIVE_TYPE_LABELS: Record<string, string> = {
  pleading: 'Pleading',
  motion: 'Motion',
  affidavit: 'Affidavit',
  judgment: 'Judgment',
  ruling: 'Ruling',
  court_order: 'Court order',
  contract: 'Contract',
  deed: 'Deed',
  lease: 'Lease',
  will: 'Will',
  power_of_attorney: 'Power of attorney',
  legal_opinion: 'Legal opinion',
  memo: 'Memo',
  letter: 'Letter',
  notice: 'Notice',
  statute: 'Statute',
  regulation: 'Regulation',
  law_report: 'Law report',
  article: 'Article',
  book: 'Book',
  minutes: 'Minutes',
  report: 'Report',
  form: 'Form',
  financial_record: 'Financial record',
  identity_document: 'Identity document',
  evidence: 'Evidence',
  other: 'Other',
}

export function archiveTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Document'
  return ARCHIVE_TYPE_LABELS[type] ?? type.replace(/_/g, ' ')
}

export const EXTRACTION_LABELS: Record<string, string> = {
  text: 'Read from the text layer',
  ocr: 'Read with OCR',
  vision: 'Read from scanned pages',
  mixed: 'Text layer plus scanned pages',
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** True when the AI flagged something a lawyer should check before relying on it. */
export function needsReview(entry: {
  verification_notes?: string[] | null
  legibility?: string | null
  completeness?: string | null
}): boolean {
  return (
    (entry.verification_notes?.length ?? 0) > 0 ||
    entry.legibility === 'partial' ||
    entry.legibility === 'poor' ||
    entry.completeness === 'partial'
  )
}
