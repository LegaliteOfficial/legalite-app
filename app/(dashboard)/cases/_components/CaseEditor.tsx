'use client'

/**
 * Public surface of the case editor.
 *
 * The editor is shared by `/cases/new` (create) and `/cases/[id]/edit`
 * (edit). Both pages import `NewCasePageInner`; the edit page also
 * imports `caseToForm` to map an existing case into the rich form
 * shape. Composition + state + sections all live under `./case-editor/`
 * — this file exists to keep the public import path stable
 * (`'../_components/CaseEditor'`) regardless of internal moves.
 */

import { EditorShell, type EditorShellProps } from './case-editor/_components/EditorShell'

export { caseToForm } from './case-editor/_lib/serialize'
export { buildCaseDetails } from './case-editor/_lib/serialize'
export { INITIAL_FORM } from './case-editor/_constants'
export type { NewCaseForm } from './case-editor/_types'

/**
 * Renders the rich case editor in either `create` or `edit` mode. In
 * edit mode pass `caseId` plus the form pre-populated from the existing
 * record (use `caseToForm` for the mapping).
 */
export function NewCasePageInner(props: EditorShellProps = {}) {
  return <EditorShell {...props} />
}
