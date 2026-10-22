/**
 * Sample calendar events for local development.
 *
 * `useCalendarEvents` returned an empty array under DEV_BYPASS, so the
 * calendar was permanently blank without a backend: nothing to click, and
 * no way to check the event popover, the actions menu or delete.
 *
 * Dates are built relative to today rather than hard coded, so the week
 * you land on always has something in it. The fixed sample deadlines in
 * `dev-data` sit in June 2026 and stopped being visible the moment the
 * real date moved past them.
 */

import type { CalendarEvent } from '@/hooks/use-calendar'

/** Start of the ISO week (Monday) containing `d`. */
function startOfWeek(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  c.setDate(c.getDate() - ((c.getDay() + 6) % 7))
  return c
}

/** `dayOffset` from Monday, at the given hour, as an ISO string. */
function at(weekStart: Date, dayOffset: number, hour: number, minute = 0): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

interface Seed {
  id: string
  title: string
  description: string | null
  location: string | null
  event_type: string
  day: number
  startHour: number
  endHour: number
  case_title: string | null
  client_name: string | null
}

const SEEDS: Seed[] = [
  {
    id: 'dev-event-1',
    title: 'Mensah v. GRA — case management conference',
    description: 'Directions hearing before the commercial division.',
    location: 'High Court (Commercial Division), Accra',
    event_type: 'hearing',
    day: 1,
    startHour: 9,
    endHour: 10,
    case_title: 'Mensah v. Ghana Revenue Authority',
    client_name: 'Mensah Holdings Ltd',
  },
  {
    id: 'dev-event-2',
    title: 'Client call — AccraTech licensing',
    description: 'Walk through the draft licensing terms.',
    location: 'Phone',
    event_type: 'call',
    day: 2,
    startHour: 14,
    endHour: 15,
    case_title: null,
    client_name: 'AccraTech Ltd',
  },
  {
    id: 'dev-event-3',
    title: 'File discovery responses',
    description: null,
    location: null,
    event_type: 'deadline',
    day: 3,
    startHour: 16,
    endHour: 17,
    case_title: 'Mensah v. Ghana Revenue Authority',
    client_name: 'Mensah Holdings Ltd',
  },
  {
    id: 'dev-event-4',
    title: 'Partners meeting',
    description: 'Weekly matter review.',
    location: 'Boardroom',
    event_type: 'appointment',
    day: 4,
    startHour: 11,
    endHour: 12,
    case_title: null,
    client_name: null,
  },
]

export function devCalendarEvents(now: Date = new Date()): CalendarEvent[] {
  const weekStart = startOfWeek(now)
  const stamp = now.toISOString()

  return SEEDS.map((s) => ({
    id: s.id,
    firm_id: 'dev-firm',
    created_by: 'dev',
    case_id: s.case_title ? 'dev-1' : null,
    client_id: s.client_name ? 'dev-client-1' : null,
    title: s.title,
    description: s.description,
    location: s.location,
    event_type: s.event_type,
    status: 'confirmed',
    start_time: at(weekStart, s.day, s.startHour),
    end_time: at(weekStart, s.day, s.endHour),
    all_day: false,
    case_title: s.case_title,
    client_name: s.client_name,
    outcome_status: null,
    outcome_notes: null,
    outcome_recorded_by: null,
    outcome_recorded_at: null,
    cancellation_reason: null,
    original_start_time: null,
    created_at: stamp,
    updated_at: stamp,
    attendees: [],
    reminders: [],
  })) as CalendarEvent[]
}
