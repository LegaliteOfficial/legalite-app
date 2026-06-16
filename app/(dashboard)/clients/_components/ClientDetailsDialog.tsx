'use client'

import {
  Briefcase,
  Envelope,
  Funnel,
  PencilSimple,
  Phone,
  User as UserIcon,
  Users,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ROLE_LABEL, type Assignee } from '@/hooks/use-client-assignees'
import type { Case, Client } from '@/types'
import { DetailRow } from './DetailRow'

/**
 * Read-only snapshot of a client's record. Shows contact info +
 * primary-case status + the full assignee roster. An Edit button at
 * the bottom drops into the existing ClientForm modal for changes.
 */
export function ClientDetailsDialog({
  client,
  primaryCase,
  assignees,
  onOpenChange,
  onEdit,
}: {
  client: Client | null
  primaryCase: Case | undefined
  assignees: Assignee[]
  onOpenChange: (open: boolean) => void
  onEdit: () => void
}) {
  return (
    <Dialog open={!!client} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily: 'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            {client?.full_name ?? 'Client'}
          </DialogTitle>
        </DialogHeader>

        {client && (
          <div className="grid gap-4 py-2 text-[13px]">
            <DetailRow
              icon={<Phone size={13} strokeWidth={1.75} />}
              label="Phone"
              value={client.phone || '—'}
            />
            <DetailRow
              icon={<Envelope size={13} strokeWidth={1.75} />}
              label="Email"
              value={client.email || '—'}
            />
            <DetailRow
              icon={<UserIcon size={13} strokeWidth={1.75} />}
              label="Client ID"
              value={
                <span
                  className="font-mono text-[12px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {client.client_code ?? '—'}
                </span>
              }
            />
            <DetailRow
              icon={<Funnel size={13} strokeWidth={1.75} />}
              label="Client status"
              value={<StatusBadge status={client.status} />}
            />
            <DetailRow
              icon={<Briefcase size={13} strokeWidth={1.75} />}
              label="Primary case"
              value={
                primaryCase ? (
                  <span className="flex flex-col gap-1">
                    <span style={{ color: 'var(--text-primary)' }}>
                      {primaryCase.title}
                    </span>
                    <StatusBadge status={primaryCase.status} />
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    No cases on file
                  </span>
                )
              }
            />
            <DetailRow
              icon={<Users size={13} strokeWidth={1.75} />}
              label={`Assignees (${assignees.length})`}
              value={
                assignees.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Unassigned
                  </span>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {assignees.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between"
                      >
                        <span style={{ color: 'var(--text-primary)' }}>
                          {a.name}
                        </span>
                        <span
                          className="text-[11.5px]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {ROLE_LABEL[a.role]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )
              }
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={onEdit}
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
            }}
          >
            <PencilSimple size={13} strokeWidth={1.75} />
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
