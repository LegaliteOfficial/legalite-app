/**
 * Avatar tinting + overflow tooltip helpers — keyed by an assignee's
 * role so the table reads the seniority hierarchy at a glance.
 *
 *   senior_partner → gold tint (most prominent)
 *   lawyer         → navy tint
 *   associate      → sunken neutral
 *   paralegal      → softer neutral
 */

import { ROLE_LABEL, type Assignee } from '@/hooks/use-client-assignees'

export function roleBg(role: Assignee['role']): string {
  if (role === 'senior_partner') return 'var(--accent-today-tint-strong)'
  if (role === 'lawyer') return 'var(--navy-tint, #E7ECF3)'
  if (role === 'associate') return 'var(--surface-sunken)'
  if (role === 'paralegal') return 'var(--border-soft)'
  return 'var(--surface-sunken)'
}

export function roleFg(role: Assignee['role']): string {
  if (role === 'senior_partner') return 'var(--accent-today)'
  if (role === 'lawyer') return 'var(--navy, #0D1B2A)'
  return 'var(--text-secondary)'
}

/**
 * Tooltip text for the "+N" overflow chip — newline-separated list of
 * the hidden assignees so the user can read who's behind the chip
 * without opening the manage-assignees dialog.
 */
export function overflowTitle(
  assignees: Assignee[],
  visibleCount: number,
): string {
  return assignees
    .slice(visibleCount)
    .map((a) => `${a.name} (${ROLE_LABEL[a.role]})`)
    .join('\n')
}
