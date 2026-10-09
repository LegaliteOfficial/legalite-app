'use client'

import Link from 'next/link'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityButton } from '@/components/shared/PriorityButton'
import type { Assignee } from '@/hooks/use-client-assignees'
import type { Case, Client } from '@/types'
import type { ColumnKey } from '../_types'
import { AssignedAvatars } from './AssignedAvatars'
import { Avatar } from './Avatar'
import { RowMenu } from './RowMenu'

/**
 * One <tr> in the clients table. Visible columns are gated by the
 * `showColumn` predicate; the Client column + actions are always
 * rendered.
 */
export function ClientsTableRow({
  client,
  primaryCase,
  assignees,
  showColumn,
  onManageAssignees,
  onView,
  onEdit,
  onAssignCase,
  onStartTimer,
  onDelete,
}: {
  client: Client
  primaryCase: Case | undefined
  assignees: Assignee[]
  showColumn: (key: ColumnKey) => boolean
  onManageAssignees: () => void
  onView: () => void
  onEdit: () => void
  onAssignCase: () => void
  onStartTimer: () => void
  onDelete: () => void
}) {
  const statusLabel = primaryCase?.status ?? 'Active'
  return (
    <tr
      className="border-t transition-colors"
      style={{ borderColor: 'var(--border-soft)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-sunken)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={client.full_name} />
          <Link
            href={`/clients/${client.id}`}
            className="font-medium truncate underline-offset-2 hover:underline"
            style={{ color: 'var(--text-primary)' }}
          >
            {client.full_name}
          </Link>
        </div>
      </td>
      {showColumn('phone') && (
        <td
          className="px-4 py-3 tabular-nums"
          style={{ color: 'var(--text-secondary)' }}
        >
          {client.phone || '—'}
        </td>
      )}
      {showColumn('email') && (
        <td
          className="px-4 py-3 truncate"
          style={{ color: 'var(--text-secondary)' }}
        >
          {client.email || '—'}
        </td>
      )}
      {showColumn('status') && (
        <td className="px-4 py-3">
          <StatusBadge status={statusLabel} />
        </td>
      )}
      {showColumn('assigned') && (
        <td className="px-4 py-3">
          <AssignedAvatars
            assignees={assignees}
            onManage={onManageAssignees}
          />
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          {/* Always-visible priority star — first-class affordance so
              users don't have to dig into the row menu to flag a
              client. */}
          <PriorityButton
            entityType="client"
            entityId={client.id}
            label={client.full_name}
          />
          <RowMenu
            clientName={client.full_name}
            onView={onView}
            onEdit={onEdit}
            onAssignCase={onAssignCase}
            onStartTimer={onStartTimer}
            onDelete={onDelete}
          />
        </div>
      </td>
    </tr>
  )
}
