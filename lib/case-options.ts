/**
 * Canonical option lists used by case forms and filters.
 *
 * Practice areas are referenced from at least three places (new-case form,
 * edit dialog, filter drawer). Living here means a single edit propagates
 * everywhere and they can't drift. Order matters — what's listed here is
 * the order users see in dropdowns.
 *
 * Eventually these will live in firm settings (per-firm configurable
 * practice areas, billing methods, etc.). Until that admin screen lands,
 * the constants act as the seed list.
 */

export const PRACTICE_AREAS = [
  'Administrative',
  'Bankruptcy',
  "Builder's Liens",
  'Business',
  'Civil Litigation',
  'Commercial',
  'Conveyance (Purchase)',
  'Conveyance (Sales)',
  'Corporate',
  'Criminal',
  'Employment',
  'Estate',
  'Family',
  'Immigration',
  'Insurance',
  'Personal Injury',
  'Wills',
  'Tax',
] as const

export type PracticeArea = (typeof PRACTICE_AREAS)[number]

/**
 * Case stage = workflow position within a case (where the case is in its
 * lifecycle), distinct from Case status (Open / Pending / Closed).
 *
 * Default list covers both litigation and transactional work. In the standard pattern
 * these are configurable per practice area; until that admin screen
 * ships, we expose one shared list. When firms want per-practice-area
 * stages, swap this for a hook that scopes by `practice_area`.
 */
export const CASE_STAGES = [
  'Intake',
  'Investigation',
  'Pleadings',
  'Discovery',
  'Negotiation',
  'Mediation',
  'Trial preparation',
  'Trial',
  'Settlement',
  'Appeal',
  'Closing',
] as const

export type CaseStage = (typeof CASE_STAGES)[number]
