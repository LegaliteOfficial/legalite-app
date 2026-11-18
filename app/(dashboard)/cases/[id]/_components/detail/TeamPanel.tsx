'use client'

/**
 * The case team, from the real case assignments (firm members with a
 * responsible / originating / collaborator role). Members can be added,
 * re-roled and removed in place; each change replaces the full set via
 * setCaseAssignments.
 *
 * The case also carries free-text "assigned" and "originating" lawyer
 * names from before the team model. When nobody is assigned through the
 * roster those names are still shown, so the people on older cases are
 * not hidden.
 */

import { useMemo, useState } from 'react'
import { DotsThree, Plus, UsersThree } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/shared/Spinner'
import { confirmAction } from '@/stores/confirm.store'
import { ASSIGNMENT_ROLE_LABEL, useCaseAssignments, useSetCaseAssignments, type CaseAssignment } from '@/hooks/use-case-assignments'
import { useFirmMembers } from '@/hooks/use-firm-members'
import { titleCase } from '../../_lib/case-details'
import { Avatar, Panel } from './primitives'

const ROLE_ORDER = ['responsible', 'originating', 'collaborator'] as const
const ROLE_STYLE: Record<string, { fg: string; bg: string }> = {
  responsible: { fg: '#0D1B2A', bg: 'rgba(201,151,43,0.18)' },
  originating: { fg: '#2E6F95', bg: 'rgba(46,111,149,0.12)' },
  collaborator: { fg: '#4B5563', bg: 'rgba(13,27,42,0.06)' },
}

export function TeamPanel({
  caseId,
  assignedLawyer,
  originatingLawyer,
}: {
  caseId: string
  assignedLawyer?: string | null
  originatingLawyer?: string | null
}) {
  const { data: assignments, isLoading } = useCaseAssignments(caseId)
  const { data: members } = useFirmMembers()
  const setAssignments = useSetCaseAssignments()
  const [busy, setBusy] = useState(false)

  const team = useMemo(
    () =>
      [...(assignments ?? [])].sort(
        (a, b) => ROLE_ORDER.indexOf(a.assignment_role as never) - ROLE_ORDER.indexOf(b.assignment_role as never),
      ),
    [assignments],
  )
  const available = useMemo(
    () => (members ?? []).filter((m) => m.status === 'active' && !team.some((t) => t.member_id === m.id)),
    [members, team],
  )

  const save = async (next: { member_id: string; assignment_role: string }[], message: string) => {
    setBusy(true)
    try {
      await setAssignments.mutateAsync(caseId, next)
      toast.success(message)
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Unable to update the team.')
    } finally {
      setBusy(false)
    }
  }
  const current = () => team.map((t) => ({ member_id: t.member_id, assignment_role: t.assignment_role }))

  const add = (memberId: string, name: string) =>
    save([...current(), { member_id: memberId, assignment_role: team.length === 0 ? 'responsible' : 'collaborator' }], `${name} added to the team.`)

  const changeRole = (a: CaseAssignment, role: string) =>
    save(
      current().map((t) => (t.member_id === a.member_id ? { ...t, assignment_role: role } : t)),
      `${a.name} is now ${ASSIGNMENT_ROLE_LABEL[role]?.toLowerCase() ?? role}.`,
    )

  const remove = async (a: CaseAssignment) => {
    const ok = await confirmAction({
      title: `Remove ${a.name} from this case?`,
      description: 'They will no longer see this case in their assigned work. You can add them back at any time.',
      tone: 'warning',
      confirmLabel: 'Remove',
    })
    if (ok) await save(current().filter((t) => t.member_id !== a.member_id), `${a.name} removed from the team.`)
  }

  // Older cases: names typed before the roster existed.
  const legacy = [
    assignedLawyer ? { name: assignedLawyer, role: 'Responsible lawyer' } : null,
    originatingLawyer && originatingLawyer !== assignedLawyer ? { name: originatingLawyer, role: 'Originating lawyer' } : null,
  ].filter(Boolean) as { name: string; role: string }[]

  return (
    <Panel
      title="Team"
      icon={<UsersThree size={15} weight="duotone" />}
      count={team.length || undefined}
      action={
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                disabled={busy}
                className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[12.5px] font-medium transition-colors hover:bg-black/5 disabled:opacity-50"
                style={{ color: 'var(--gold-dark)' }}
              >
                {busy ? <Spinner size={12} /> : <Plus size={12} weight="bold" />}
                Add
              </button>
            }
          />
          <DropdownMenuContent align="end" className="max-h-72 w-60 overflow-y-auto">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Add a firm member</DropdownMenuLabel>
              {available.length === 0 ? (
                <p className="px-2 py-2 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
                  {members ? 'Everyone active is already on this case.' : 'Firm members are unavailable.'}
                </p>
              ) : (
                available.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => void add(m.id, m.name || m.email)} className="cursor-pointer gap-2">
                    <Avatar name={m.name || m.email} size={22} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px]">{m.name || m.email}</span>
                      <span className="block truncate text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
                        {titleCase(m.professional_title) || 'Member'}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      {isLoading && !assignments ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl" style={{ background: 'var(--surface-sunken)' }} />
          ))}
        </div>
      ) : team.length > 0 ? (
        <ul className="-mx-2 space-y-0.5">
          {team.map((a) => {
            const rs = ROLE_STYLE[a.assignment_role] ?? ROLE_STYLE.collaborator
            return (
              <li key={a.id} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-black/[0.025]">
                <Avatar name={a.name} src={a.avatar_url} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>{a.name}</p>
                  <p className="truncate text-[12px]" style={{ color: 'var(--text-muted)' }}>{titleCase(a.professional_title ?? '') || 'Member'}</p>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: rs.fg, background: rs.bg }}>
                  {ASSIGNMENT_ROLE_LABEL[a.assignment_role] ?? titleCase(a.assignment_role)}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        aria-label={`Change ${a.name}'s role`}
                        disabled={busy}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg opacity-60 transition hover:bg-black/5 group-hover:opacity-100"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <DotsThree size={16} weight="bold" />
                      </button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Role</DropdownMenuLabel>
                      {ROLE_ORDER.map((r) => (
                        <DropdownMenuItem
                          key={r}
                          disabled={r === a.assignment_role}
                          onClick={() => void changeRole(a, r)}
                          className="cursor-pointer text-[13px]"
                        >
                          {ASSIGNMENT_ROLE_LABEL[r]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => void remove(a)} className="cursor-pointer text-[13px]" style={{ color: '#B42318' }}>
                      Remove from case
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            )
          })}
        </ul>
      ) : legacy.length > 0 ? (
        <ul className="space-y-2">
          {legacy.map((p) => (
            <li key={p.role} className="flex items-center gap-3">
              <Avatar name={p.name} size={32} />
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{p.role}</p>
              </div>
            </li>
          ))}
          <li className="pt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Add them from the firm roster to give them access and notifications.
          </li>
        </ul>
      ) : (
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          No one is assigned yet. Add a responsible lawyer so the case has an owner.
        </p>
      )}
    </Panel>
  )
}
