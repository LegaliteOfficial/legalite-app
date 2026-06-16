'use client'

import { ROLE_LABEL, type Assignee } from '@/hooks/use-client-assignees'
import { MAX_VISIBLE_AVATARS } from '../_constants'
import { initialsOf } from '../_lib/initials'
import { overflowTitle, roleBg, roleFg } from '../_lib/role-styles'

/**
 * Stacked, overlapping avatar pile showing every firm member assigned
 * to the client. Renders the first N inline and collapses the rest
 * into a "+M" counter chip; hovering any avatar surfaces the member's
 * name + role via the `title` attribute; clicking the stack opens the
 * Manage-assignees dialog.
 *
 * Visual choices:
 *   - Avatars overlap by half their width so the eye reads them as a
 *     group rather than three separate chips.
 *   - Each avatar has a 2-px ring in the row background colour so the
 *     overlap stays legible against any row state (hover, etc.).
 *   - Each role gets a different tint so seniority reads at a glance.
 *   - "Unassigned" copy renders when the list is empty, rather than
 *     an empty cell — keeps the column legible.
 */
export function AssignedAvatars({
  assignees,
  onManage,
}: {
  assignees: Assignee[]
  onManage: () => void
}) {
  if (assignees.length === 0) {
    return (
      <button
        type="button"
        onClick={onManage}
        className="text-[12.5px] italic cursor-pointer"
        style={{ color: 'var(--text-muted)' }}
      >
        Unassigned
      </button>
    )
  }
  const visible = assignees.slice(0, MAX_VISIBLE_AVATARS)
  const overflow = assignees.length - visible.length
  return (
    <button
      type="button"
      onClick={onManage}
      aria-label={`Manage assignees (${assignees.length} on file)`}
      className="inline-flex items-center cursor-pointer"
    >
      {visible.map((a, i) => (
        <span
          key={a.id}
          aria-hidden
          title={`${a.name} — ${ROLE_LABEL[a.role]}`}
          className="inline-flex items-center justify-center h-7 w-7 rounded-full text-[10.5px] font-semibold"
          style={{
            marginLeft: i === 0 ? 0 : -10,
            boxShadow: '0 0 0 2px var(--surface-card)',
            background: roleBg(a.role),
            color: roleFg(a.role),
            // Higher avatars stack above lower ones so the leftmost
            // (usually most senior) reads on top.
            zIndex: MAX_VISIBLE_AVATARS - i,
            position: 'relative',
          }}
        >
          {initialsOf(a.name)}
        </span>
      ))}
      {overflow > 0 && (
        <span
          aria-hidden
          title={overflowTitle(assignees, MAX_VISIBLE_AVATARS)}
          className="inline-flex items-center justify-center h-7 px-2 rounded-full text-[11px] font-semibold tabular-nums"
          style={{
            marginLeft: -10,
            boxShadow: '0 0 0 2px var(--surface-card)',
            background: 'var(--surface-sunken)',
            color: 'var(--text-secondary)',
            position: 'relative',
            zIndex: 0,
          }}
        >
          +{overflow}
        </span>
      )}
    </button>
  )
}
