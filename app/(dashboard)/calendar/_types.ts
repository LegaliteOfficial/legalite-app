/**
 * Shared types for the calendar route.
 */

export const VIEW_MODES = ['Day', 'Work week', 'Week', 'Month'] as const
export type ViewMode = (typeof VIEW_MODES)[number]

export const EVENT_TYPE_OPTIONS = [
  { key: 'High', label: 'High priority', dotVar: '--accent-danger' },
  { key: 'Medium', label: 'Medium priority', dotVar: '--accent-today' },
  { key: 'Low', label: 'Low priority', dotVar: '--text-muted' },
] as const
export type EventTypeKey = (typeof EVENT_TYPE_OPTIONS)[number]['key']

export const REMINDER_OFFSETS = [
  { key: '5m' as const, label: '5 minutes before', minutes: 5 },
  { key: '15m' as const, label: '15 minutes before', minutes: 15 },
  { key: '30m' as const, label: '30 minutes before', minutes: 30 },
  { key: '1h' as const, label: '1 hour before', minutes: 60 },
  { key: '2h' as const, label: '2 hours before', minutes: 120 },
  { key: '1d' as const, label: '1 day before', minutes: 24 * 60 },
  { key: '2d' as const, label: '2 days before', minutes: 48 * 60 },
  { key: '1w' as const, label: '1 week before', minutes: 7 * 24 * 60 },
] as const
export type ReminderOffsetKey = (typeof REMINDER_OFFSETS)[number]['key']

export type ReminderChannel = 'push' | 'email'

/**
 * One row in the event-dialog Reminders section. Today the schema only
 * persists ONE numeric offset (`Deadline.reminder_days`); the rest of
 * the structure (channel + recipients) lives in form state until the
 * one-to-many reminders table ships.
 */
export interface Reminder {
  id: string
  offset: ReminderOffsetKey
  channel: ReminderChannel
  /** Comma-separated email list. Only meaningful when channel === 'email'. */
  emails: string
}

export interface SlotPrefill {
  date: Date
  startMinutes: number
  endMinutes: number
}
