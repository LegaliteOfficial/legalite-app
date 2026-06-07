/**
 * Static category metadata + tab list for the documents route.
 */

import { BookOpen, Briefcase, FileText, Gavel, House, SquaresFour, PencilLine, Scales, Users } from '@phosphor-icons/react'
import type {
  Tab,
  TemplateCategory,
  TemplateCategoryColors,
  TemplateCategoryId,
} from './_types'

export { TABS, LIBRARY_CATEGORIES } from './_types'
export type { Tab, LibraryCategory, TemplateCategory, TemplateCategoryColors, TemplateCategoryId } from './_types'

export const CATEGORIES: TemplateCategory[] = [
  { id: 'all', label: 'All Templates', icon: SquaresFour },
  { id: 'litigation', label: 'Litigation', icon: Scales },
  { id: 'criminal', label: 'Criminal', icon: Gavel },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'corporate', label: 'Corporate', icon: Briefcase },
  { id: 'conveyancing', label: 'Conveyancing', icon: House },
]

/**
 * Per-category accent palette used by the mini "preview" rendered on each
 * template card. Falls back to muted gray for any unknown category.
 */
export const CATEGORY_COLORS: Record<string, TemplateCategoryColors> = {
  litigation: { bg: 'rgba(37,99,235,0.06)', accent: '#2563EB' },
  criminal: { bg: 'rgba(192,57,43,0.06)', accent: '#C0392B' },
  family: { bg: 'rgba(139,92,246,0.06)', accent: '#8B5CF6' },
  corporate: { bg: 'rgba(46,125,79,0.06)', accent: '#2E7D4F' },
  conveyancing: { bg: 'rgba(201,151,43,0.06)', accent: '#C9972B' },
}

export const CATEGORY_FALLBACK: TemplateCategoryColors = {
  bg: 'rgba(107,114,128,0.06)',
  accent: '#6B7280',
}

export const TAB_DESCRIPTORS: ReadonlyArray<{
  id: Tab
  label: string
  icon: typeof FileText
}> = [
  { id: 'templates', label: 'Templates', icon: SquaresFour },
  { id: 'drafts',    label: 'Drafts',    icon: FileText },
  { id: 'library',   label: 'Library',   icon: BookOpen },
  { id: 'editor',    label: 'Editor',    icon: PencilLine },
]

/** Per-library-category upload accept attribute. */
export const LIBRARY_ACCEPT: Record<string, string> = {
  book: '.pdf,.epub,.docx',
  article: '.pdf,.docx,.txt',
  document: '.pdf,.jpg,.jpeg,.png,.docx',
}

/** Per-library-category upload size cap (MB). Articles are smaller to
 *  push partners towards real-PDF books rather than scanned PDFs. */
export const LIBRARY_MAX_MB: Record<string, number> = {
  book: 50,
  article: 20,
  document: 50,
}
