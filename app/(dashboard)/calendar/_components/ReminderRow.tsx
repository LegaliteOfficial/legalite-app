'use client'

import { Bell, ChevronDown, Users, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  REMINDER_OFFSETS,
  type Reminder,
  type ReminderChannel,
  type ReminderOffsetKey,
} from '../_constants'

/**
 * One row in the event-dialog Reminders section. Offset dropdown +
 * push/email segmented control + remove button; when channel is
 * 'email' a recipients input renders below.
 *
 * Parent owns the array; this component only edits its own reminder
 * via `onChange(patch)`.
 */
export function ReminderRow({
  reminder,
  onChange,
  onRemove,
}: {
  reminder: Reminder
  onChange: (patch: Partial<Reminder>) => void
  onRemove: () => void
}) {
  return (
    <div
      className="rounded-lg border p-2.5 space-y-2"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <OffsetSelect
          value={reminder.offset}
          onChange={(offset) => onChange({ offset })}
        />
        <ChannelSegmented
          value={reminder.channel}
          onChange={(channel) => onChange({ channel })}
        />
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          aria-label="Remove reminder"
        >
          <X size={13} strokeWidth={1.75} />
        </button>
      </div>

      {reminder.channel === 'email' && (
        <div>
          <Input
            value={reminder.emails}
            onChange={(e) => onChange({ emails: e.target.value })}
            placeholder="recipient@firm.com, partner@example.com"
            className="h-9 text-[13px]"
          />
          <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Comma-separated email addresses. We&rsquo;ll send the reminder to
            each one at the scheduled time.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Internals ─────────────────────────────────────────────────────────────

function OffsetSelect({
  value,
  onChange,
}: {
  value: ReminderOffsetKey
  onChange: (key: ReminderOffsetKey) => void
}) {
  return (
    <div className="relative" style={{ minWidth: 160 }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ReminderOffsetKey)}
        className="w-full h-9 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
          colorScheme: 'light',
        }}
      >
        {REMINDER_OFFSETS.map((o) => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        size={12}
        strokeWidth={1.75}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-muted)' }}
      />
    </div>
  )
}

function ChannelSegmented({
  value,
  onChange,
}: {
  value: ReminderChannel
  onChange: (next: ReminderChannel) => void
}) {
  return (
    <div
      className="inline-flex rounded-lg border overflow-hidden h-9"
      style={{ borderColor: 'var(--border-default)' }}
      role="radiogroup"
      aria-label="Reminder channel"
    >
      {(['push', 'email'] as const).map((channel) => {
        const active = value === channel
        return (
          <button
            key={channel}
            type="button"
            onClick={() => onChange(channel)}
            className="px-3 text-[12.5px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 capitalize"
            style={{
              background: active
                ? 'var(--accent-today-tint-strong)'
                : 'var(--surface-card)',
              color: active ? 'var(--gold-dark)' : 'var(--text-muted)',
            }}
            role="radio"
            aria-checked={active}
          >
            {channel === 'push' ? (
              <Bell size={11} strokeWidth={1.75} />
            ) : (
              <Users size={11} strokeWidth={1.75} />
            )}
            {channel}
          </button>
        )
      })}
    </div>
  )
}
