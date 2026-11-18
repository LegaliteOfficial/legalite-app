'use client'

/**
 * The case at a glance. Main column: what the case is about, what is
 * coming up, recent work. Right rail: who is on it, the client, the dates
 * that matter and how it is billed.
 */

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  CalendarBlank,
  CurrencyCircleDollar,
  Envelope,
  FileText,
  Hourglass,
  ListChecks,
  Phone,
  Tag,
  TextAlignLeft,
  User,
} from '@phosphor-icons/react'
import type { CalendarEvent } from '@/hooks/use-calendar'
import type { Task } from '@/hooks/use-tasks'
import type { Case, Client, Document } from '@/types'
import { StatusBadge, relativeTime } from '../../../../documents/_components/StatusBadge'
import {
  ageSince,
  BILLING_METHOD_LABEL,
  fmtDate,
  titleCase,
  type CaseDetails,
  type CaseTab,
} from '../../_lib/case-details'
import { EventCard, splitEvents } from './CalendarTab'
import type { Patch } from './DetailsTab'
import { Avatar, Chips, DueBadge, EditableText, NotSet, Panel, YesNo } from './primitives'
import { TaskList, splitTasks } from './TasksTab'
import { TeamPanel } from './TeamPanel'

const LONG_TEXT = 420

export function OverviewTab({
  kase,
  details,
  client,
  tasks,
  events,
  documents,
  patch,
  goTo,
}: {
  kase: Case
  details: CaseDetails
  client: Client | null
  tasks: Task[]
  events: CalendarEvent[]
  documents: Document[]
  patch: Patch
  goTo: (tab: CaseTab) => void
}) {
  const d = details
  const { upcoming } = splitEvents(events)
  const t = splitTasks(tasks)
  const nextTasks = [...t.overdue, ...t.upcoming, ...t.undated].slice(0, 5)
  const recentDocs = [...documents].sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? '')).slice(0, 5)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <Panel title="Summary" icon={<TextAlignLeft size={15} weight="duotone" />}>
          <div className="space-y-5">
            <div>
              <p className="mb-1.5 text-[11.5px] font-medium uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>Description</p>
              <LongText
                value={kase.description ?? ''}
                placeholder="Add the factual background, claims and procedural history."
                onSave={(v) => patch({ description: v }, 'Description updated.')}
              />
            </div>
            <div className="rounded-xl border-l-[3px] px-4 py-3" style={{ borderColor: 'var(--gold)', background: 'rgba(201,151,43,0.06)' }}>
              <p className="mb-1 text-[11.5px] font-medium uppercase tracking-[0.06em]" style={{ color: 'var(--gold-dark)' }}>Preferred outcome</p>
              <LongText
                value={kase.notes ?? ''}
                placeholder="What does success look like for the client?"
                onSave={(v) => patch({ notes: v }, 'Preferred outcome updated.')}
              />
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
          <Panel
            title="Upcoming events"
            icon={<CalendarBlank size={15} weight="duotone" />}
            count={upcoming.length}
            action={<ViewAll onClick={() => goTo('calendar')} />}
          >
            {upcoming.length === 0 ? (
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Nothing scheduled.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.slice(0, 3).map((e) => <EventCard key={e.id} event={e} compact />)}
              </ul>
            )}
          </Panel>

          <Panel
            title="Open tasks"
            icon={<ListChecks size={15} weight="duotone" />}
            count={tasks.length - t.done.length}
            action={<ViewAll onClick={() => goTo('tasks')} />}
          >
            {nextTasks.length === 0 ? (
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{tasks.length ? 'All tasks are done.' : 'No tasks yet.'}</p>
            ) : (
              <TaskList tasks={nextTasks} compact />
            )}
          </Panel>
        </div>

        <Panel
          title="Recent documents"
          icon={<FileText size={15} weight="duotone" />}
          count={documents.length}
          action={<ViewAll onClick={() => goTo('documents')} />}
        >
          {recentDocs.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>No documents linked to this case yet.</p>
          ) : (
            <ul className="-mx-2">
              {recentDocs.map((doc) => (
                <li key={doc.id}>
                  <Link href={`/documents/${doc.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-black/[0.03]">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(13,27,42,0.05)', color: 'var(--navy)' }}>
                      <FileText size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px]" style={{ color: 'var(--text-primary)' }}>{doc.title || 'Untitled document'}</span>
                      <span className="block text-[12px]" style={{ color: 'var(--text-muted)' }}>Edited {relativeTime(doc.updated_at)}</span>
                    </span>
                    <StatusBadge status={(doc as { status?: string }).status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <aside className="min-w-0 space-y-4">
        <TeamPanel caseId={kase.id} assignedLawyer={kase.assigned_lawyer} originatingLawyer={kase.originating_lawyer} />

        <Panel title="Client" icon={<User size={15} weight="duotone" />}>
          {client ? (
            <div>
              <Link href={`/clients/${client.id}`} className="group flex items-center gap-3">
                <Avatar name={client.full_name} size={36} />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium group-hover:underline" style={{ color: 'var(--text-primary)' }}>{client.full_name}</span>
                  <span className="block truncate text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    {[client.contact_type === 'company' ? 'Company' : 'Person', client.organization, client.client_code].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </Link>
              <ul className="mt-3 space-y-1.5 text-[13px]">
                <li className="flex items-center gap-2" style={{ color: client.email ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  <Envelope size={14} style={{ color: 'var(--text-muted)' }} />
                  {client.email ? <a href={`mailto:${client.email}`} className="truncate hover:underline">{client.email}</a> : <NotSet>No email</NotSet>}
                </li>
                <li className="flex items-center gap-2" style={{ color: client.phone ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                  {client.phone ? <a href={`tel:${client.phone}`} className="hover:underline">{client.phone}</a> : <NotSet>No phone</NotSet>}
                </li>
              </ul>
              {d.client_reference && (
                <p className="mt-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  Client reference <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{d.client_reference}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-[13px]" style={{ color: kase.client_name ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {kase.client_name || 'No client linked.'}
            </p>
          )}
        </Panel>

        <Panel title="Key dates" icon={<Hourglass size={15} weight="duotone" />} action={<ViewAll label="All" onClick={() => goTo('details')} />}>
          <ul className="space-y-2.5 text-[13px]">
            <DateRow label="Opened" value={kase.date_opened ?? kase.created_at} extra={ageSince(kase.date_opened ?? kase.created_at)} />
            <DateRow label="Next court date" value={kase.next_court_date} countdown={kase.status !== 'Closed'} />
            <DateRow
              label="Limitation date"
              value={d.statute_of_limitations_date}
              countdown={!d.statute_of_limitations_satisfied && kase.status !== 'Closed'}
              extra={d.statute_of_limitations_date && d.statute_of_limitations_satisfied ? 'Satisfied' : undefined}
            />
            {(d.closed_date || kase.status !== 'Closed') && <DateRow label="Planned close" value={d.closed_date} countdown={kase.status !== 'Closed'} />}
            {kase.pending_at && <DateRow label="Pending since" value={kase.pending_at} />}
            {kase.closed_at && <DateRow label="Closed on" value={kase.closed_at} />}
          </ul>
        </Panel>

        <Panel title="Billing" icon={<CurrencyCircleDollar size={15} weight="duotone" />}>
          <ul className="space-y-2 text-[13px]">
            <KV label="Billable"><YesNo value={d.is_billable} /></KV>
            <KV label="Method">{BILLING_METHOD_LABEL[d.billing_method] ?? titleCase(d.billing_method)}</KV>
            <KV label="Currency">{d.currency}</KV>
            <KV label="Budget">
              {d.budget_enabled ? (d.budget_amount ? `${d.currency} ${Number(d.budget_amount).toLocaleString('en-GB')}` : 'Enabled') : <NotSet>None</NotSet>}
            </KV>
          </ul>
        </Panel>

        <Panel title="Tags" icon={<Tag size={15} weight="duotone" />}>
          <Chips items={d.tags} empty="No tags" />
        </Panel>
      </aside>
    </div>
  )
}

function LongText({ value, placeholder, onSave }: { value: string; placeholder: string; onSave: (v: string) => Promise<boolean> }) {
  const [expanded, setExpanded] = useState(false)
  const long = value.length > LONG_TEXT
  return (
    <div>
      <EditableText
        value={value}
        placeholder={placeholder}
        onSave={onSave}
        multiline
        displayClassName={`text-[13.5px] leading-relaxed ${long && !expanded ? 'line-clamp-6' : ''}`}
      />
      {long && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-[12.5px] font-medium" style={{ color: 'var(--gold-dark)' }}>
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

function ViewAll({ onClick, label = 'View all' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[12.5px] font-medium transition-colors hover:bg-black/5"
      style={{ color: 'var(--gold-dark)' }}
    >
      {label} <ArrowRight size={12} />
    </button>
  )
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-right font-medium" style={{ color: 'var(--text-primary)' }}>{children}</span>
    </li>
  )
}

function DateRow({ label, value, countdown, extra }: { label: string; value?: string | null; countdown?: boolean; extra?: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="flex items-center gap-2 text-right">
        {value ? <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{fmtDate(value)}</span> : <NotSet />}
        {countdown && value && <DueBadge date={value} />}
        {extra && <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{extra}</span>}
      </span>
    </li>
  )
}
