'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import {
  Briefcase,
  CheckCircle,
  CheckSquare,
  CalendarPlus,
  PencilSimple,
  FileText,
  Timer,
  UserPlus,
  CaretDown,
  ArrowRight,
  FolderSimplePlus,
  UserGear,
} from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/shared/Spinner'
import {
  executeProposedAction,
  getActionState,
  setActionState,
  type ActionState,
} from '@/lib/ai/actions'
import type { ProposedAction } from '@/lib/ai/types'

const TYPE_META: Record<ProposedAction['type'], { label: string; Icon: typeof Briefcase; verb: string }> = {
  create_case: { label: 'New case', Icon: Briefcase, verb: 'Create case' },
  create_client: { label: 'New client', Icon: UserPlus, verb: 'Add client' },
  create_deadline: { label: 'New deadline', Icon: Timer, verb: 'Add deadline' },
  create_task: { label: 'New task', Icon: CheckSquare, verb: 'Add task' },
  create_document: { label: 'Save document', Icon: FileText, verb: 'Save document' },
  create_event: { label: 'New calendar event', Icon: CalendarPlus, verb: 'Add to calendar' },
  update_task: { label: 'Update task', Icon: PencilSimple, verb: 'Apply update' },
  update_deadline: { label: 'Update deadline', Icon: PencilSimple, verb: 'Apply update' },
  update_case: { label: 'Edit case', Icon: Briefcase, verb: 'Apply changes' },
  update_client: { label: 'Edit client', Icon: UserGear, verb: 'Apply changes' },
  link_documents: { label: 'File documents', Icon: FolderSimplePlus, verb: 'File documents' },
}

// Payload keys shown on the card, in order, with friendly labels.
const FIELD_LABELS: [string, string][] = [
  ['title', 'Title'],
  ['status', 'Status'],
  ['location', 'Location'],
  ['event_type', 'Kind'],
  ['full_name', 'Name'],
  ['due_date', 'Due'],
  ['priority', 'Priority'],
  ['case_type', 'Type'],
  ['template_type', 'Type'],
  ['court', 'Court'],
  ['suit_number', 'Suit no.'],
  ['opposing_party', 'Opposing party'],
  ['next_court_date', 'Next court date'],
  ['contact_type', 'Contact type'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['organization', 'Organisation'],
  ['reminder_days', 'Remind (days before)'],
  ['description', 'Description'],
  ['notes', 'Notes'],
]

interface Props {
  action: ProposedAction
}

/**
 * Confirmation card for a record the assistant proposed. Nothing is
 * created or changed until the user clicks the primary button; then the
 * matching GraphQL mutation runs with the user's own session. Edits show
 * a before/after list of exactly what will change.
 */
export function ProposedActionCard({ action }: Props) {
  const meta = TYPE_META[action.type]
  const [state, setState] = useState<ActionState | null>(null)
  const [busy, setBusy] = useState(false)
  // Drafts are the point of a document card, so show them open.
  const [showContent, setShowContent] = useState(true)

  // Read persisted outcome after mount (localStorage is client-only).
  useEffect(() => {
    setState(getActionState(action.id))
  }, [action.id])

  if (!meta) return null

  const confirm = async () => {
    setBusy(true)
    try {
      const result = await executeProposedAction(action)
      const next: ActionState = { status: 'confirmed', result }
      setActionState(action.id, next)
      setState(next)
      toast.success(`${meta.verb}: done.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not complete that action.')
    } finally {
      setBusy(false)
    }
  }

  const dismiss = () => {
    const next: ActionState = { status: 'dismissed' }
    setActionState(action.id, next)
    setState(next)
  }

  // Update proposals carry the changes under `input`.
  const values =
    action.payload.input && typeof action.payload.input === 'object'
      ? (action.payload.input as Record<string, unknown>)
      : action.payload
  const changes = action.changes ?? []
  const fields = (changes.length > 0 ? [] : FIELD_LABELS).flatMap(([key, label]) => {
    const v = values[key]
    if (v === undefined || v === null || v === '') return []
    return [[label, String(v)] as const]
  })
  const content = typeof action.payload.content === 'string' ? action.payload.content : null

  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{ background: 'var(--surface-sunken)', borderColor: 'var(--border-soft)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <meta.Icon size={15} style={{ color: 'var(--gold)' }} />
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {meta.label}
        </span>
        {state?.status === 'confirmed' && (
          <span className="ml-auto inline-flex items-center gap-1 text-[12px]" style={{ color: '#2E7D4F' }}>
            <CheckCircle size={14} weight="fill" /> Done
          </span>
        )}
        {state?.status === 'dismissed' && (
          <span className="ml-auto text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Dismissed
          </span>
        )}
      </div>

      {changes.length > 0 && (
        <p className="mb-2 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
          {action.summary}
        </p>
      )}
      {changes.length > 0 && (
        <ul
          className="mb-2 divide-y overflow-hidden rounded-lg border text-[13px]"
          style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-card)' }}
          aria-label="Changes"
        >
          {changes.map((c) => (
            <li key={c.field} className="grid gap-1 px-3 py-2 sm:grid-cols-[9rem_1fr]" style={{ borderColor: 'var(--border-soft)' }}>
              <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{c.label}</span>
              <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span
                  className="max-w-full break-words rounded px-1.5 py-0.5 line-through decoration-1"
                  style={{ background: 'rgba(217,45,32,0.06)', color: 'var(--text-secondary)' }}
                >
                  {c.from}
                </span>
                <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} aria-hidden />
                <span
                  className="max-w-full break-words rounded px-1.5 py-0.5 font-medium"
                  style={{ background: 'rgba(18,183,106,0.1)', color: 'var(--text-primary)' }}
                >
                  {c.to}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-[13px]">
        {fields.map(([label, value]) => (
          <div key={label} className="contents">
            <dt style={{ color: 'var(--text-muted)' }}>{label}</dt>
            <dd className="break-words" style={{ color: 'var(--text-primary)' }}>{value}</dd>
          </div>
        ))}
        {Object.entries(action.display).map(([key, value]) => (
          <div key={key} className="contents">
            <dt className="capitalize" style={{ color: 'var(--text-muted)' }}>{key}</dt>
            <dd style={{ color: 'var(--text-primary)' }}>{value}</dd>
          </div>
        ))}
      </dl>

      {content && (
        <button
          type="button"
          onClick={() => setShowContent((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-[12px]"
          style={{ color: 'var(--text-muted)' }}
        >
          <CaretDown size={12} style={{ transform: showContent ? 'rotate(180deg)' : undefined }} />
          {showContent ? 'Hide' : 'Preview'} content ({content.length.toLocaleString()} characters)
        </button>
      )}
      {content && showContent && (
        <div
          className="mt-2 max-h-96 overflow-auto rounded-md p-4 text-[13px] leading-relaxed ai-markdown"
          style={{ background: 'var(--surface-card)', color: 'var(--text-primary)' }}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {state?.status === 'confirmed' ? (
          <Link href={state.result.href} className="text-[13px] font-medium underline" style={{ color: 'var(--gold)' }}>
            {state.result.label}
          </Link>
        ) : state?.status === 'dismissed' ? null : (
          <>
            <Button size="sm" onClick={confirm} disabled={busy}>
              {busy && <Spinner size={12} />}
              {busy ? 'Working…' : meta.verb}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss} disabled={busy}>
              Dismiss
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
