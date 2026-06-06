/**
 * Magic numbers and static lists for the calendar route. Re-exports
 * the type-bearing constants from _types so consumers can grab them
 * from one place.
 */

export { VIEW_MODES, EVENT_TYPE_OPTIONS, REMINDER_OFFSETS } from './_types'
export type {
  ViewMode,
  EventTypeKey,
  ReminderOffsetKey,
  ReminderChannel,
  Reminder,
  SlotPrefill,
} from './_types'

/** Pixels per hour for the time-grid. Picked to fit multi-line labels. */
export const HOUR_HEIGHT = 56

/** Hours rendered in the day column (0–23). */
export const HOURS = Array.from({ length: 24 }, (_, i) => i)

/** Snap clicks in the time grid to this minute interval. */
export const SLOT_SNAP_MINUTES = 15

/** Default event duration when opening the dialog from a slot click. */
export const DEFAULT_EVENT_MINUTES = 60

/**
 * Stub firm-user roster for the participants picker. Replace with
 * `useFirmUsers()` once the matching hook ships — the picker UI
 * consumes a `string[]`, so no signature change required.
 */
export const STUB_FIRM_USERS = [
  'Akosua Boateng',
  'Kwame Asante',
  'Yaw Mensah',
  'Ama Owusu',
  'Esi Annan',
  'Adwoa Hayford',
  'Kojo Bediako',
  'Fafali Mensah',
] as const
