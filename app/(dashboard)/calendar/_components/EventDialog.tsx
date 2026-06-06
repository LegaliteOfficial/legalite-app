'use client'

import { Bell, Briefcase, ChevronDown, Plus, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Deadline } from '@/hooks/use-deadlines'
import { useCases } from '@/hooks/use-cases'
import type { SlotPrefill } from '../_constants'
import { useEventDialogForm } from '../_hooks/use-event-dialog-form'
import { ParticipantsPicker } from './ParticipantsPicker'
import { ReminderRow } from './ReminderRow'

/**
 * Combined create-and-edit dialog for calendar events. Form state +
 * persistence live in `useEventDialogForm`; this component is the JSX
 * shell that wires those into inputs.
 *
 *   - `editing != null`  → loads that Deadline's values, swaps the
 *     header, surfaces a Delete button.
 *   - `editing == null && prefill != null` → fresh event from a slot
 *     click, prefilled date + times.
 *   - both null → defaults to today + next round hour.
 */
export function EventDialog({
  open,
  onOpenChange,
  prefill,
  editing,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  prefill: SlotPrefill | null
  editing: Deadline | null
}) {
  const { data: cases } = useCases()
  const { mode, fields, state, actions } = useEventDialogForm({
    open,
    prefill,
    editing,
    onClose: () => onOpenChange(false),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[640px] p-0 overflow-hidden rounded-2xl"
        style={{ background: 'var(--surface-card)', borderColor: 'var(--border)' }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {mode === 'edit' ? 'Edit event' : 'New event'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 max-h-[70vh] overflow-y-auto space-y-4">
          <TitleField value={fields.title} onChange={fields.setTitle} />
          <DateTimeRow
            date={fields.date}
            startTime={fields.startTime}
            endTime={fields.endTime}
            onDateChange={fields.setDate}
            onStartChange={fields.setStartTime}
            onEndChange={fields.setEndTime}
          />
          <LinkedCaseField
            value={fields.caseId}
            onChange={fields.setCaseId}
            cases={cases ?? []}
          />
          <FieldWrap label="Participants" icon={<Users size={11} strokeWidth={1.75} />}>
            <ParticipantsPicker value={fields.participants} onChange={fields.setParticipants} />
          </FieldWrap>
          <DescriptionField value={fields.description} onChange={fields.setDescription} />
          <RemindersSection
            reminders={fields.reminders}
            onAdd={actions.addReminder}
            onChange={actions.updateReminder}
            onRemove={actions.removeReminder}
          />
        </div>

        <EventDialogFooter
          mode={mode}
          state={state}
          onCancel={() => onOpenChange(false)}
          onSave={actions.handleSave}
          onDelete={actions.handleDelete}
        />
      </DialogContent>
    </Dialog>
  )
}

// ── Field sections ────────────────────────────────────────────────────────

function FieldWrap({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <Label
        className="text-[12px] font-semibold mb-1.5 block inline-flex items-center gap-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        {icon}
        {label}
      </Label>
      {children}
    </div>
  )
}

function TitleField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label
        htmlFor="event-title"
        className="text-[12px] font-semibold mb-1.5 block"
        style={{ color: 'var(--text-primary)' }}
      >
        Title *
      </Label>
      <Input
        id="event-title"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What is this event about?"
        autoFocus
        className="h-10 text-[13px]"
      />
    </div>
  )
}

function DateTimeRow({
  date,
  startTime,
  endTime,
  onDateChange,
  onStartChange,
  onEndChange,
}: {
  date: string
  startTime: string
  endTime: string
  onDateChange: (v: string) => void
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <NativeInput type="date" label="Date" value={date} onChange={onDateChange} />
      <NativeInput type="time" label="Start" value={startTime} onChange={onStartChange} />
      <NativeInput type="time" label="End" value={endTime} onChange={onEndChange} />
    </div>
  )
}

function NativeInput({
  type,
  label,
  value,
  onChange,
}: {
  type: 'date' | 'time'
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
        {label}
      </Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-10 rounded-lg border px-3 text-[13px] ${type === 'time' ? 'tabular-nums' : ''}`}
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
          colorScheme: 'light',
        }}
      />
    </div>
  )
}

function LinkedCaseField({
  value,
  onChange,
  cases,
}: {
  value: string
  onChange: (v: string) => void
  cases: Array<{ id: string; title: string; client_name?: string | null }>
}) {
  return (
    <FieldWrap label="Linked case" icon={<Briefcase size={11} strokeWidth={1.75} />}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: value ? 'var(--text-primary)' : 'var(--text-muted)',
            colorScheme: 'light',
          }}
        >
          <option value="">No linked case</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
              {c.client_name ? ` — ${c.client_name}` : ''}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          strokeWidth={1.75}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
      </div>
    </FieldWrap>
  )
}

function DescriptionField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label
        htmlFor="event-description"
        className="text-[12px] font-semibold mb-1.5 block"
        style={{ color: 'var(--text-primary)' }}
      >
        Description
      </Label>
      <Textarea
        id="event-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Agenda, notes, dial-in info…"
        className="text-[13px]"
      />
    </div>
  )
}

function RemindersSection({
  reminders,
  onAdd,
  onChange,
  onRemove,
}: {
  reminders: import('../_constants').Reminder[]
  onAdd: () => void
  onChange: (id: string, patch: Partial<import('../_constants').Reminder>) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="border-t pt-4" style={{ borderColor: 'var(--border-soft)' }}>
      <Label
        className="text-[12px] font-semibold mb-1.5 block inline-flex items-center gap-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        <Bell size={11} strokeWidth={1.75} />
        Reminders
      </Label>
      <div className="space-y-2.5">
        {reminders.map((r) => (
          <ReminderRow
            key={r.id}
            reminder={r}
            onChange={(patch) => onChange(r.id, patch)}
            onRemove={() => onRemove(r.id)}
          />
        ))}
        {reminders.length === 0 && (
          <p className="text-[12px] py-1" style={{ color: 'var(--text-muted)' }}>
            No reminders set. Add one to be notified before this event.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium cursor-pointer"
        style={{ color: 'var(--gold-dark)' }}
      >
        <Plus size={13} strokeWidth={2} />
        Add reminder
      </button>
    </div>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────

function EventDialogFooter({
  mode,
  state,
  onCancel,
  onSave,
  onDelete,
}: {
  mode: 'create' | 'edit'
  state: { submitting: boolean; deleting: boolean; canSave: boolean }
  onCancel: () => void
  onSave: () => void
  onDelete: () => void
}) {
  return (
    <DialogFooter
      className="px-6 py-4 border-t flex sm:flex-row sm:justify-between gap-2 items-center"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'rgba(13,27,42,0.015)',
      }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={!state.canSave}
          className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--gold)',
            color: 'var(--navy)',
            boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
          }}
          onMouseEnter={(e) => {
            if (!state.canSave) return
            e.currentTarget.style.background = 'var(--gold-dark)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--gold)'
          }}
        >
          {state.submitting
            ? 'Saving…'
            : mode === 'edit'
              ? 'Save changes'
              : 'Save event'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={state.submitting || state.deleting}
          className="inline-flex items-center h-9 px-3 rounded-lg text-[13px] font-medium cursor-pointer transition-colors disabled:opacity-50"
          style={{ color: 'var(--text-muted)', background: 'transparent' }}
        >
          Cancel
        </button>
      </div>
      {mode === 'edit' && (
        <button
          type="button"
          onClick={onDelete}
          disabled={state.submitting || state.deleting}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12.5px] font-medium cursor-pointer transition-colors disabled:opacity-50"
          style={{ color: '#C0392B', background: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(192,57,43,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          {state.deleting ? 'Deleting…' : 'Delete event'}
        </button>
      )}
    </DialogFooter>
  )
}
