/**
 * Shared types for the documents route.
 */

export const TABS = ['templates', 'drafts', 'library', 'editor'] as const
export type Tab = (typeof TABS)[number]

export const LIBRARY_CATEGORIES = ['book', 'article', 'document'] as const
export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number]

export type TemplateCategoryId =
  | 'all'
  | 'litigation'
  | 'criminal'
  | 'family'
  | 'corporate'
  | 'conveyancing'

export interface TemplateCategory {
  id: TemplateCategoryId
  label: string
  /** Lucide icon component reference. Not typed strictly so callers can
   *  pass any LucideIcon without parametric generics noise. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
}

export interface TemplateCategoryColors {
  bg: string
  accent: string
}
