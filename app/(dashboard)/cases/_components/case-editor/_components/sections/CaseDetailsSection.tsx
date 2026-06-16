'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CASE_STAGES, PRACTICE_AREAS } from '@/lib/case-options'
import { Checkbox } from '../primitives/Checkbox'
import { FieldLabel } from '../primitives/FieldLabel'
import { NativeSelect } from '../primitives/NativeSelect'
import { MemberMultiPicker } from '../pickers/MemberMultiPicker'
import type { NewCaseForm, SetField } from '../../_types'
import { StatuteRemindersField } from './StatuteRemindersField'
import { TagsField } from './TagsField'

/**
 * The biggest section in the editor — collects the description, lawyer
 * assignments, court / suit / next-court-date, practice area + stage,
 * lifecycle dates, statute of limitations + its reminders, and tags.
 */
export function CaseDetailsSection({
  form,
  setField,
  firmUserOptions,
  memberOptions,
  onOpenTagSettings,
}: {
  form: NewCaseForm
  setField: SetField
  firmUserOptions: string[]
  memberOptions: { id: string; name: string }[]
  onOpenTagSettings: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>Case description</FieldLabel>
        <Textarea
          rows={3}
          placeholder="e.g. Mensah v. Ghana Revenue Authority — tax assessment dispute"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          className="rounded-lg text-[13px]"
          style={{ borderColor: 'var(--border-default)' }}
        />
        <p className="mt-1 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
          First line becomes the case title in lists. Full text is saved as
          case notes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Responsible lawyer</FieldLabel>
          <NativeSelect
            value={form.responsible_lawyer}
            onChange={(v) => setField('responsible_lawyer', v)}
            placeholder="Find a firm user"
            options={firmUserOptions}
          />
        </div>
        <div>
          <FieldLabel>Originating lawyer</FieldLabel>
          <NativeSelect
            value={form.originating_lawyer}
            onChange={(v) => setField('originating_lawyer', v)}
            placeholder="Find a firm user"
            options={firmUserOptions}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Assign team members</FieldLabel>
        <MemberMultiPicker
          value={form.assigned_member_ids}
          onChange={(v) => setField('assigned_member_ids', v)}
          members={memberOptions}
        />
        <p className="mt-1 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
          Selected members are added to the case team and emailed when the
          case is created.
        </p>
      </div>

      <div>
        <FieldLabel>Responsible staff</FieldLabel>
        <NativeSelect
          value={form.responsible_staff}
          onChange={(v) => setField('responsible_staff', v)}
          placeholder="Find a firm user"
          options={firmUserOptions}
        />
        <p className="mt-1 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
          Paralegal or support staff assigned to the case.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Client reference number</FieldLabel>
          <Input
            placeholder="Enter reference number"
            value={form.client_reference}
            onChange={(e) => setField('client_reference', e.target.value)}
            className="h-10 rounded-lg text-[13px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
        <div>
          <FieldLabel>Location</FieldLabel>
          <Input
            placeholder="e.g. Accra, Kumasi"
            value={form.location}
            onChange={(e) => setField('location', e.target.value)}
            className="h-10 rounded-lg text-[13px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Court</FieldLabel>
          <Input
            placeholder="e.g. High Court (Commercial Division)"
            value={form.court}
            onChange={(e) => setField('court', e.target.value)}
            className="h-10 rounded-lg text-[13px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
        <div>
          <FieldLabel>Suit number</FieldLabel>
          <Input
            placeholder="e.g. HC/COM/2026/0114"
            value={form.suit_number}
            onChange={(e) => setField('suit_number', e.target.value)}
            className="h-10 rounded-lg text-[13px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Opposing party</FieldLabel>
          <Input
            placeholder="e.g. Ghana Revenue Authority"
            value={form.opposing_party}
            onChange={(e) => setField('opposing_party', e.target.value)}
            className="h-10 rounded-lg text-[13px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
        <div>
          <FieldLabel>Next court date</FieldLabel>
          <Input
            type="date"
            value={form.next_court_date}
            onChange={(e) => setField('next_court_date', e.target.value)}
            className="h-10 rounded-lg text-[13px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Practice area</FieldLabel>
          <NativeSelect
            value={form.practice_area}
            onChange={(v) => setField('practice_area', v)}
            placeholder="Find a practice area"
            options={PRACTICE_AREAS}
          />
        </div>
        <div>
          <FieldLabel>Case stage</FieldLabel>
          <NativeSelect
            value={form.case_stage}
            onChange={(v) => setField('case_stage', v)}
            placeholder="Find a case stage"
            options={CASE_STAGES}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Case status</FieldLabel>
        <NativeSelect
          value={form.status}
          onChange={(v) => setField('status', v as NewCaseForm['status'])}
          options={[
            { value: 'Open', label: 'Open' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Closed', label: 'Closed' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Open date</FieldLabel>
          <Input
            type="date"
            value={form.open_date}
            onChange={(e) => setField('open_date', e.target.value)}
            className="h-10 rounded-lg text-[13px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
        <div>
          <FieldLabel>Closed date</FieldLabel>
          {/* Always editable. The backend will only persist this when the
              case actually transitions to Closed (trigger in migration
              20260523_case_workflow_fields auto-stamps this), but the user
              may want to record a planned closure date ahead of time. */}
          <Input
            type="date"
            value={form.closed_date}
            onChange={(e) => setField('closed_date', e.target.value)}
            className="h-10 rounded-lg text-[13px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Pending date</FieldLabel>
        <Input
          type="date"
          value={form.pending_date}
          onChange={(e) => setField('pending_date', e.target.value)}
          className="h-10 rounded-lg text-[13px] max-w-[300px]"
          style={{ borderColor: 'var(--border-default)' }}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>Statute of limitations date</FieldLabel>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={form.statute_of_limitations_date}
            onChange={(e) =>
              setField('statute_of_limitations_date', e.target.value)
            }
            className="h-10 rounded-lg text-[13px] max-w-[260px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
          <Checkbox
            checked={form.statute_of_limitations_satisfied}
            onChange={(v) =>
              setField('statute_of_limitations_satisfied', v)
            }
            label="Statute of limitations date satisfied"
          />
        </div>
      </div>

      <StatuteRemindersField
        value={form.statute_reminders}
        onChange={(v) => setField('statute_reminders', v)}
        firmUserOptions={firmUserOptions}
      />

      <TagsField
        value={form.tags}
        onChange={(v) => setField('tags', v)}
        onOpenSettings={onOpenTagSettings}
      />
    </div>
  )
}
