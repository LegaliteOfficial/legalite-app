/**
 * Adapts the firm calendar's CalendarEvent into the legacy Deadline shape the
 * grid + page-state hook already render. Lets the calendar run on the real
 * events backend without rewriting the 3,000-line view layer.
 */

import type { CalendarEvent } from '@/hooks/use-calendar'
import type { Deadline } from '@/hooks/use-deadlines'

export function eventToDeadline(e: CalendarEvent): Deadline {
  const firstReminder = e.reminders[0]
  return {
    id: e.id,
    user_id: e.created_by ?? '',
    case_id: e.case_id ?? null,
    title: e.title,
    description: e.description ?? null,
    // The grid positions blocks by due_date; an event starts at start_time.
    due_date: e.start_time,
    priority: 'Medium',
    status: 'Pending',
    reminder_days:
      firstReminder != null
        ? Math.max(0, Math.round(firstReminder.minutes_before / 1440))
        : null,
    case_title: e.case_title ?? null,
    created_at: e.created_at,
    updated_at: e.updated_at,
  }
}
