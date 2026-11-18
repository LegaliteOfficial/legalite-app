'use client'

/**
 * Workspace access: whether Legalite AI may read the user's cases,
 * clients, deadlines, tasks, documents and invoices, and whether it asks
 * first. Saved on the server immediately (it is not part of the local
 * draft below), so it applies on every device. Also lists the recent
 * permission decisions, which form the audit trail.
 */

import { useState } from 'react'
import { Prohibit, ShieldCheck, ChatCircleDots, ClockCounterClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'

import { Spinner } from '@/components/shared/Spinner'
import { confirmAction } from '@/stores/confirm.store'
import {
  WORKSPACE_ACCESS_LABEL,
  useAiConsentEvents,
  useAiWorkspaceAccess,
  useSetAiWorkspaceAccess,
} from '@/hooks/use-ai-workspace-access'
import type { WorkspaceAccessMode } from '@/lib/ai/types'

const OPTIONS: { value: WorkspaceAccessMode; hint: string; Icon: typeof ShieldCheck }[] = [
  {
    value: 'ask',
    hint: 'The assistant asks before it looks at your records, every time a question needs them.',
    Icon: ChatCircleDots,
  },
  {
    value: 'always',
    hint: 'The assistant uses your records whenever a question needs them, without asking.',
    Icon: ShieldCheck,
  },
  {
    value: 'never',
    hint: 'The assistant never looks at your records. It answers from the law library and general knowledge only.',
    Icon: Prohibit,
  },
]

const DECISION_LABEL: Record<string, string> = {
  allow_once: 'Allowed once',
  deny: 'Declined',
  ask: 'Set to ask every time',
  always: 'Set to always allow',
  never: 'Set to never allow',
}

export function WorkspaceAccessSection() {
  const { mode, isLoading, error } = useAiWorkspaceAccess()
  const setAccess = useSetAiWorkspaceAccess()
  const { data: events, isLoading: eventsLoading } = useAiConsentEvents(10)
  const [pending, setPending] = useState<WorkspaceAccessMode | null>(null)

  const choose = async (next: WorkspaceAccessMode) => {
    if (next === mode || pending) return
    if (next === 'always') {
      const ok = await confirmAction({
        title: 'Always allow workspace access?',
        description:
          'Legalite AI will read your cases, clients, deadlines, tasks, documents and invoices whenever a question needs them, without asking. It still cannot change anything unless you confirm the change.',
        confirmLabel: 'Always allow',
        tone: 'warning',
      })
      if (!ok) return
    }
    setPending(next)
    try {
      await setAccess.mutateAsync(next, { source: 'settings' })
      toast.success(`Workspace access: ${WORKSPACE_ACCESS_LABEL[next].toLowerCase()}.`)
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Could not save workspace access.')
    } finally {
      setPending(null)
    }
  }

  return (
    <section
      id="workspace-access"
      className="mb-6 scroll-mt-6 overflow-hidden rounded-2xl border"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.05)' }}
    >
      <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
        <h2 className="font-heading text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          Workspace access
        </h2>
        <p className="mt-0.5 text-[13px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
          Whether Legalite AI may read your cases, clients, deadlines, tasks, documents and invoices to answer you. It only
          ever sees what you can see, and never changes a record without your confirmation. Saved instantly.
        </p>
      </div>

      <div className="px-5 py-4">
        {error && !isLoading && (
          <p className="mb-3 text-[12.5px]" style={{ color: '#B54708' }}>
            Your current setting could not be loaded, so the assistant will ask every time.
          </p>
        )}
        <div role="radiogroup" aria-label="Workspace access" className="grid gap-2.5 sm:grid-cols-3">
          {OPTIONS.map(({ value, hint, Icon }) => {
            const active = mode === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={isLoading || pending !== null}
                onClick={() => void choose(value)}
                className="rounded-xl border px-4 py-3 text-left transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                style={{
                  borderColor: active ? 'var(--gold)' : 'var(--border)',
                  background: active ? 'var(--gold-muted)' : 'var(--surface-card)',
                  boxShadow: active ? '0 0 0 1px var(--gold)' : 'none',
                }}
              >
                <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {pending === value ? <Spinner size={13} /> : <Icon size={15} weight="duotone" style={{ color: 'var(--gold)' }} />}
                  {WORKSPACE_ACCESS_LABEL[value]}
                </span>
                <span className="mt-1 block text-[12.5px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                  {hint}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-5">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <ClockCounterClockwise size={13} /> Recent decisions
          </h3>
          {eventsLoading ? (
            <div className="mt-2 space-y-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg" style={{ background: 'var(--surface-sunken)' }} />
              ))}
            </div>
          ) : !events || events.length === 0 ? (
            <p className="mt-2 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
              No decisions yet. When the assistant asks for access, your answers appear here.
            </p>
          ) : (
            <ul className="mt-2 divide-y rounded-lg border text-[12.5px]" style={{ borderColor: 'var(--border)' }}>
              {events.map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {DECISION_LABEL[e.decision] ?? e.decision}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {e.source === 'prompt' ? 'from a chat prompt' : 'in Settings'}
                  </span>
                  <time className="ml-auto tabular-nums" dateTime={e.created_at} style={{ color: 'var(--text-muted)' }}>
                    {new Date(e.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                  {e.scopes.length > 0 && (
                    <span className="w-full truncate" style={{ color: 'var(--text-secondary)' }} title={e.scopes.join('; ')}>
                      {e.scopes.join(' · ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
