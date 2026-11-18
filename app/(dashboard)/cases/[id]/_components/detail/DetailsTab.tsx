'use client'

/**
 * Every field on the case, grouped the way a lawyer looks for them. Each
 * field is always listed, set or not, so a gap is visible instead of the
 * row silently disappearing. Core columns edit in place; the extended
 * settings (billing, permissions, folders...) open the full case form.
 */

import Link from 'next/link'
import {
  Bank,
  CalendarCheck,
  ChartPieSlice,
  CurrencyCircleDollar,
  Folders,
  Hourglass,
  IdentificationCard,
  LockKey,
  PencilSimple,
  Scales,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { Spinner } from '@/components/shared/Spinner'
import { displayCaseCode } from '@/lib/reference-code'
import type { Case, Client } from '@/types'
import {
  BILLING_METHOD_LABEL,
  fmtDate,
  mergeDetails,
  titleCase,
  type CaseDetails,
} from '../../_lib/case-details'
import { Chips, DueBadge, EditableDate, EditableText, Field, FieldGrid, NotSet, Panel, YesNo } from './primitives'

export type Patch = (data: Record<string, unknown>, message?: string) => Promise<boolean>

export function DetailsTab({
  kase,
  details,
  clients,
  patch,
}: {
  kase: Case
  details: CaseDetails
  clients: Client[]
  patch: Patch
}) {
  const d = details
  const editHref = `/cases/${kase.id}/edit`
  const clientName = (id?: string) => (id && clients.find((c) => c.id === id)?.full_name) || 'Unknown contact'
  const text = (key: string, label: string, value?: string | null, placeholder = `Add ${label.toLowerCase()}`) => (
    <Field label={label}>
      <EditableText value={value ?? ''} placeholder={placeholder} label={`Edit ${label.toLowerCase()}`} onSave={(v) => patch({ [key]: v }, `${label} updated.`)} />
    </Field>
  )
  const editAll = (
    <Link href={editHref} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
      <PencilSimple size={13} /> Edit
    </Link>
  )

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Panel title="Matter" icon={<Scales size={15} weight="duotone" />}>
        <FieldGrid>
          {text('case_type', 'Practice area', kase.case_type)}
          {text('case_stage', 'Case stage', kase.case_stage)}
          <Field label="Case ID" empty={!kase.case_code}>
            <span className="font-mono tracking-wide">{displayCaseCode(kase.case_code)}</span>
          </Field>
          <Field label="Status">{kase.status}</Field>
          {text('opposing_party', 'Opposing party', kase.opposing_party)}
          <Field label="Client reference" empty={!d.client_reference}>{d.client_reference}</Field>
          <Field label="Location" empty={!d.location} wide>{d.location}</Field>
        </FieldGrid>
      </Panel>

      <Panel title="Court" icon={<Bank size={15} weight="duotone" />}>
        <FieldGrid>
          {text('court', 'Court', kase.court)}
          {text('suit_number', 'Suit number', kase.suit_number)}
          <Field label="Next court date" wide>
            <EditableDate value={kase.next_court_date} countdown onSave={(v) => patch({ next_court_date: v }, 'Next court date updated.')} />
          </Field>
        </FieldGrid>
      </Panel>

      <Panel title="People" icon={<IdentificationCard size={15} weight="duotone" />}>
        <FieldGrid>
          {text('assigned_lawyer', 'Responsible lawyer', kase.assigned_lawyer)}
          {text('originating_lawyer', 'Originating lawyer', kase.originating_lawyer)}
          <Field label="Responsible staff" empty={!d.responsible_staff}>{d.responsible_staff}</Field>
          <Field label="Client">{kase.client_name || clientName(kase.client_id)}</Field>
          <Field label="Related contacts" wide>
            {d.related_contacts.length === 0 ? (
              <NotSet>None</NotSet>
            ) : (
              <ul className="space-y-1">
                {d.related_contacts.map((c, i) => (
                  <li key={`${c.contact_id}-${i}`} className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{clientName(c.contact_id)}</span>
                    <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{titleCase(c.relationship || 'Contact')}</span>
                    {c.bill_recipient && (
                      <span className="rounded-full px-1.5 py-px text-[10.5px] font-semibold" style={{ background: 'var(--gold-muted)', color: 'var(--gold-dark)' }}>
                        Bill recipient
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Field>
        </FieldGrid>
      </Panel>

      <Panel title="Dates and lifecycle" icon={<CalendarCheck size={15} weight="duotone" />}>
        <FieldGrid>
          <Field label="Date opened">
            <EditableDate value={kase.date_opened ?? kase.created_at} onSave={(v) => patch({ date_opened: v }, 'Open date updated.')} />
          </Field>
          <Field label="Pending since" empty={!kase.pending_at}>{fmtDate(kase.pending_at)}</Field>
          <Field label="Planned pending date" empty={!d.pending_date}>{fmtDate(d.pending_date)}</Field>
          <Field label="Closed on" empty={!kase.closed_at}>{fmtDate(kase.closed_at)}</Field>
          <Field label="Planned close date" empty={!d.closed_date}>
            <span className="inline-flex flex-wrap items-center gap-2">{fmtDate(d.closed_date)} {kase.status !== 'Closed' && <DueBadge date={d.closed_date} />}</span>
          </Field>
          <Field label="Last updated">{fmtDate(kase.updated_at)}</Field>
        </FieldGrid>
      </Panel>

      <StatutePanel kase={kase} details={d} patch={patch} />

      <Panel title="Billing" icon={<CurrencyCircleDollar size={15} weight="duotone" />} action={editAll}>
        <FieldGrid>
          <Field label="Billable"><YesNo value={d.is_billable} /></Field>
          <Field label="Billing method">{BILLING_METHOD_LABEL[d.billing_method] ?? titleCase(d.billing_method)}</Field>
          <Field label="Currency">{d.currency}</Field>
          <Field label="Budget" empty={!d.budget_enabled}>
            {d.budget_amount ? `${d.currency} ${Number(d.budget_amount).toLocaleString('en-GB')}` : 'Enabled, no amount'}
          </Field>
          <Field label="Split invoice"><YesNo value={d.split_invoice} /></Field>
          <Field label="Notify on low client funds"><YesNo value={d.notify_low_client_funds} /></Field>
          <Field label="Custom rates" wide>
            {d.custom_billing_rates.length === 0 ? (
              <NotSet>Firm default rates</NotSet>
            ) : (
              <table className="w-full text-[13px]">
                <tbody>
                  {d.custom_billing_rates.map((r, i) => (
                    <tr key={i} className="border-t first:border-t-0" style={{ borderColor: 'var(--border-soft)' }}>
                      <td className="py-1.5 pr-3">{r.user_or_group || 'Unnamed'}</td>
                      <td className="py-1.5 text-right font-medium tabular-nums">{r.amount ? `${d.currency} ${r.amount}/h` : 'Not set'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Field>
        </FieldGrid>
      </Panel>

      <Panel title="Access and notifications" icon={<LockKey size={15} weight="duotone" />} action={editAll}>
        <FieldGrid>
          <Field label="Who can see this case" wide>
            {d.permissions_mode === 'specific' ? 'Only the people listed below' : 'Everyone in the firm'}
          </Field>
          {d.permissions_mode === 'specific' && (
            <Field label="Permitted users" wide><Chips items={d.permitted_users} /></Field>
          )}
          <Field label="Notification subscribers" wide><Chips items={d.notification_subscribers} /></Field>
          <Field label="Blocked users" wide><Chips items={d.blocked_users} /></Field>
        </FieldGrid>
      </Panel>

      <Panel title="Organisation" icon={<Folders size={15} weight="duotone" />} action={editAll}>
        <FieldGrid>
          <Field label="Tags" wide><Chips items={d.tags} /></Field>
          <Field label="Task lists" wide hint={d.task_lists.length > 0 ? (d.task_lists_notify_assignees ? 'Assignees are notified' : 'Assignees are not notified') : undefined}>
            <Chips items={d.task_lists} />
          </Field>
          <Field label="Document folders" wide>
            <Chips items={d.document_folders.map((f) => (f.category ? `${f.name} (${f.category})` : f.name ?? ''))} />
          </Field>
          <Field label="Conflict checks" wide><Chips items={d.conflict_checks} empty="None recorded" /></Field>
        </FieldGrid>
      </Panel>

      <Panel title="Reporting allocations" icon={<ChartPieSlice size={15} weight="duotone" />} action={editAll}>
        <FieldGrid>
          <Field label="Originating credit">
            {d.use_firm_settings_originating ? 'Firm settings' : `${d.originating_allocation}%`}
          </Field>
          <Field label="Responsible credit">
            {d.use_firm_settings_responsible ? 'Firm settings' : `${d.responsible_allocation}%`}
          </Field>
        </FieldGrid>
      </Panel>
    </div>
  )
}

export function StatutePanel({ kase, details, patch }: { kase: Case; details: CaseDetails; patch: Patch }) {
  const [saving, setSaving] = useState(false)
  const d = details
  const toggle = async () => {
    setSaving(true)
    await patch(
      { details: mergeDetails(kase.details, { statute_of_limitations_satisfied: !d.statute_of_limitations_satisfied }) },
      d.statute_of_limitations_satisfied ? 'Statute marked as not satisfied.' : 'Statute marked as satisfied.',
    )
    setSaving(false)
  }
  return (
    <Panel
      title="Statute of limitations"
      icon={<Hourglass size={15} weight="duotone" />}
      action={
        d.statute_of_limitations_date ? (
          <button
            type="button"
            onClick={() => void toggle()}
            disabled={saving}
            className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-[12.5px] font-medium transition-colors hover:bg-black/5 disabled:opacity-50"
            style={{ color: 'var(--gold-dark)' }}
          >
            {saving && <Spinner size={12} />}
            {d.statute_of_limitations_satisfied ? 'Mark not satisfied' : 'Mark satisfied'}
          </button>
        ) : undefined
      }
    >
      <FieldGrid>
        <Field label="Limitation date">
          <EditableDate
            value={d.statute_of_limitations_date}
            countdown={!d.statute_of_limitations_satisfied}
            onSave={(v) => patch({ details: mergeDetails(kase.details, { statute_of_limitations_date: v }) }, 'Limitation date updated.')}
          />
        </Field>
        <Field label="Satisfied">
          <YesNo value={d.statute_of_limitations_satisfied} />
        </Field>
        <Field label="Reminders" wide>
          {d.statute_reminders.length === 0 ? (
            <NotSet>No reminders</NotSet>
          ) : (
            <ul className="space-y-1">
              {d.statute_reminders.map((r, i) => (
                <li key={i}>
                  {r.amount || '0'} {(r.unit || 'Days').toLowerCase()} before, to {r.recipient || 'the responsible lawyer'}
                </li>
              ))}
            </ul>
          )}
        </Field>
      </FieldGrid>
    </Panel>
  )
}
