/**
 * Form ↔ Case serialization helpers.
 *
 * The form collects ~30 more fields than the Case schema persists today
 * (billing, permissions, tags, custom fields, etc.). The unmapped keys
 * are tucked into a `details` JSON column so nothing the user types is
 * lost — when the matching backend migration lands they can graduate to
 * first-class columns by promoting their key into `CORE_KEYS`.
 */

import type { Case } from '@/types'
import { EXTENDED_KEYS, INITIAL_FORM } from '../_constants'
import type { NewCaseForm } from '../_types'

/**
 * Date inputs want a bare `YYYY-MM-DD`; timestamptz columns (closed_at,
 * pending_at) arrive as full ISO strings — trim to the date part.
 */
export const toDateInput = (v?: string | null) => (v ? v.slice(0, 10) : '')

/** Serialize the extended form fields into the `details` JSON string. */
export function buildCaseDetails(form: NewCaseForm): string {
  const out: Record<string, unknown> = {}
  for (const k of EXTENDED_KEYS) out[k] = form[k]
  return JSON.stringify(out)
}

/** Parse `details` back into a partial form (defaults fill the rest). */
function parseCaseDetails(raw?: string | null): Partial<NewCaseForm> {
  if (!raw) return {}
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of EXTENDED_KEYS) {
      if (obj[k] !== undefined && obj[k] !== null) out[k] = obj[k]
    }
    return out as Partial<NewCaseForm>
  } catch {
    return {}
  }
}

/**
 * Map an existing case into the rich form shape so the edit page
 * pre-populates exactly the same fields the create page collects — core
 * columns plus every extended field stored in `details`. The create
 * flow derives the title from the first line of the description and
 * saves the whole description as notes, so we reconstruct a description
 * whose first line IS the title.
 */
export function caseToForm(kase: Case): NewCaseForm {
  const notes = kase.notes ?? ''
  const firstLine = notes.split('\n')[0]?.trim()
  const description =
    firstLine && firstLine === kase.title
      ? notes
      : [kase.title, notes].filter((s) => s && s.trim()).join('\n')

  return {
    ...INITIAL_FORM,
    ...parseCaseDetails(kase.details),
    client_ids: kase.client_id ? [kase.client_id] : [''],
    description,
    responsible_lawyer: kase.assigned_lawyer ?? '',
    originating_lawyer: kase.originating_lawyer ?? '',
    court: kase.court ?? '',
    suit_number: kase.suit_number ?? '',
    opposing_party: kase.opposing_party ?? '',
    next_court_date: toDateInput(kase.next_court_date),
    practice_area: kase.case_type ?? '',
    case_stage: kase.case_stage ?? '',
    status: kase.status,
    open_date: toDateInput(kase.date_opened) || INITIAL_FORM.open_date,
  }
}
