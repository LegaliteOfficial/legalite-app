'use client'

/**
 * Assign a client to firm members — the lawyers and staff who work on it.
 *
 * Lists the firm's active members (the real roster, not just people who
 * already have clients), with search, a toggle per member and a "Lead"
 * marker for the one responsible lawyer. Saving replaces the client's team
 * through `setClientAssignments`; the backend emails anyone newly added.
 *
 * Self-contained so it can open from the clients table and from the
 * client profile alike.
 */

import { useMemo, useState } from 'react'
import { MagnifyingGlass, Star } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/shared/Spinner'
import {
  ROLE_LABEL,
  useAssignableMembers,
  useSetClientAssignments,
  type Assignee,
  type AssignmentRole,
} from '@/hooks/use-client-assignees'
import { initialsOf } from '../_lib/initials'

interface ClientRef {
  id: string
  full_name: string
}

export function ManageAssigneesDialog({
  client,
  current,
  onOpenChange,
}: {
  client: ClientRef | null
  current: Assignee[]
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={!!client} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {/* Keyed by client so the draft starts fresh for each client. */}
        {client && (
          <AssigneeEditor
            key={client.id}
            client={client}
            current={current}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function AssigneeEditor({
  client,
  current,
  onDone,
}: {
  client: ClientRef
  current: Assignee[]
  onDone: () => void
}) {
  const { members, isLoading } = useAssignableMembers()
  const save = useSetClientAssignments()
  const [query, setQuery] = useState('')
  // member id -> role on this client's team
  const [draft, setDraft] = useState<Map<string, AssignmentRole>>(
    () => new Map(current.map((a) => [a.id, a.assignmentRole ?? 'collaborator'])),
  )

  // Current assignees who have since left the firm stay visible so they
  // can be removed explicitly.
  const roster = useMemo(() => {
    const byId = new Map(members.map((m) => [m.id, m]))
    for (const a of current) if (!byId.has(a.id)) byId.set(a.id, a)
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [members, current])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q
      ? roster.filter((m) => m.name.toLowerCase().includes(q) || ROLE_LABEL[m.role].toLowerCase().includes(q))
      : roster
  }, [roster, query])

  const toggle = (id: string) =>
    setDraft((prev) => {
      const next = new Map(prev)
      if (next.has(id)) next.delete(id)
      else next.set(id, next.size === 0 ? 'responsible' : 'collaborator')
      return next
    })

  const makeLead = (id: string) =>
    setDraft((prev) => {
      const next = new Map(prev)
      const isLead = next.get(id) === 'responsible'
      for (const [k, r] of next) if (r === 'responsible') next.set(k, 'collaborator')
      next.set(id, isLead ? 'collaborator' : 'responsible')
      return next
    })

  const handleSave = async () => {
    try {
      await save.mutateAsync(
        client.id,
        Array.from(draft, ([member_id, assignment_role]) => ({ member_id, assignment_role })),
      )
      toast.success(
        draft.size === 0
          ? `${client.full_name} is now unassigned.`
          : `Team updated for ${client.full_name}.`,
      )
      onDone()
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Unable to update the team.')
    }
  }

  const lead = roster.find((m) => draft.get(m.id) === 'responsible')

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading">Assign {client.full_name}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-3">
        <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
          Choose the lawyers and staff who work on this client. Mark one as
          lead. New team members are notified by email.
        </p>

        <div className="relative">
          <MagnifyingGlass
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-subtle)' }}
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members"
            className="h-9 pl-8 text-[13px]"
            aria-label="Search firm members"
          />
        </div>

        <ul
          className="max-h-72 overflow-y-auto rounded-lg border"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          {isLoading ? (
            <li className="flex items-center gap-2 px-3 py-4 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
              <Spinner size={13} /> Loading firm members
            </li>
          ) : visible.length === 0 ? (
            <li className="px-3 py-4 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
              {roster.length === 0
                ? 'No active members in your firm yet. Invite colleagues from Settings, Firm members.'
                : 'No members match your search.'}
            </li>
          ) : (
            visible.map((m) => {
              const selected = draft.has(m.id)
              const isLead = draft.get(m.id) === 'responsible'
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 border-t px-3 py-2 first:border-t-0"
                  style={{
                    borderColor: 'var(--border-soft)',
                    background: selected ? 'var(--accent-today-tint)' : 'transparent',
                  }}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggle(m.id)}
                      className="h-4 w-4 shrink-0 cursor-pointer rounded"
                      style={{ accentColor: 'var(--gold)' }}
                    />
                    <span
                      aria-hidden
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                      style={{ background: 'var(--accent-today-tint-strong)', color: 'var(--gold-dark)' }}
                    >
                      {initialsOf(m.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                        {m.name}
                      </span>
                      <span className="block truncate text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
                        {ROLE_LABEL[m.role]}
                      </span>
                    </span>
                  </label>
                  {selected && (
                    <button
                      type="button"
                      onClick={() => makeLead(m.id)}
                      aria-pressed={isLead}
                      title={isLead ? 'Lead on this client' : 'Make lead'}
                      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-semibold transition-colors"
                      style={
                        isLead
                          ? { background: 'var(--gold)', color: 'var(--navy)' }
                          : { border: '1px solid var(--border-default)', color: 'var(--text-muted)' }
                      }
                    >
                      <Star size={11} weight={isLead ? 'fill' : 'regular'} />
                      Lead
                    </button>
                  )}
                </li>
              )
            })
          )}
        </ul>

        <p className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
          {draft.size === 0
            ? 'No one assigned.'
            : `${draft.size} assigned${lead ? ` · ${lead.name} leads` : ' · no lead chosen'}`}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={save.isPending}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={save.isPending}>
          {save.isPending ? <><Spinner size={13} /> Saving</> : 'Save team'}
        </Button>
      </DialogFooter>
    </>
  )
}
