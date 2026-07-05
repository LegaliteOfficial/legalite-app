/**
 * Firm calendar — shared events with attendees (firm members) and reminders.
 * Reminders are dispatched by a backend cron that emails attendees when due.
 */

import { graphql } from '@/types/generated'

export const CalendarEventsQueryDoc = graphql(/* GraphQL */ `
  query CalendarEvents($from: String, $to: String) {
    calendarEvents(from: $from, to: $to) {
      ...CalendarEventFields
    }
  }
`)

export const CalendarEventQueryDoc = graphql(/* GraphQL */ `
  query CalendarEvent($id: ID!) {
    calendarEvent(id: $id) {
      ...CalendarEventFields
    }
  }
`)

export const CreateCalendarEventMutationDoc = graphql(/* GraphQL */ `
  mutation CreateCalendarEvent($input: CreateCalendarEventInput!) {
    createCalendarEvent(input: $input) {
      ...CalendarEventFields
    }
  }
`)

export const UpdateCalendarEventMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateCalendarEvent($id: ID!, $input: UpdateCalendarEventInput!) {
    updateCalendarEvent(id: $id, input: $input) {
      ...CalendarEventFields
    }
  }
`)

export const DeleteCalendarEventMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteCalendarEvent($id: ID!) {
    deleteCalendarEvent(id: $id)
  }
`)

export const RespondToEventMutationDoc = graphql(/* GraphQL */ `
  mutation RespondToEvent($input: RespondToEventInput!) {
    respondToEvent(input: $input) {
      ...CalendarEventFields
    }
  }
`)

// ── Event Due Workflow ────────────────────────────────────────────────────

/**
 * Past-due events awaiting the CALLER's answer to "did this take place?".
 * Bounded server-side to a 30-day lookback and a small LIMIT — safe to
 * call from an app-open hook. Fire manually via `useLazyQuery` — never on
 * a timer.
 */
export const PendingDueEventsQueryDoc = graphql(/* GraphQL */ `
  query PendingDueEvents($limit: Int) {
    pendingDueEvents(limit: $limit) {
      ...CalendarEventFields
    }
  }
`)

/** Full audit trail for one event — opened on demand from a detail view. */
export const EventHistoryQueryDoc = graphql(/* GraphQL */ `
  query EventHistory($event_id: ID!) {
    eventHistory(event_id: $event_id) {
      ...EventHistoryEntryFields
    }
  }
`)

/**
 * The caller answers Yes / No / Dismiss — suppresses THIS user's prompt
 * without touching event-level state. Every attendee can call this
 * regardless of role.
 */
export const AcknowledgeEventDueMutationDoc = graphql(/* GraphQL */ `
  mutation AcknowledgeEventDue($input: AcknowledgeEventDueInput!) {
    acknowledgeEventDue(input: $input) {
      ...CalendarEventFields
    }
  }
`)

/** Yes → record the completed outcome (organiser / firm admin only). */
export const CompleteEventMutationDoc = graphql(/* GraphQL */ `
  mutation CompleteEvent($input: CompleteEventInput!) {
    completeEvent(input: $input) {
      ...CalendarEventFields
    }
  }
`)

/** No → move the event to a new date/time (organiser / firm admin only). */
export const RescheduleEventMutationDoc = graphql(/* GraphQL */ `
  mutation RescheduleEvent($input: RescheduleEventInput!) {
    rescheduleEvent(input: $input) {
      ...CalendarEventFields
    }
  }
`)

/**
 * No → cancel the event with a required reason. Distinct from the
 * up-front cancel path (`updateCalendarEvent` with status='cancelled').
 */
export const CancelEventOccurrenceMutationDoc = graphql(/* GraphQL */ `
  mutation CancelEventOccurrence($input: CancelEventOccurrenceInput!) {
    cancelEventOccurrence(input: $input) {
      ...CalendarEventFields
    }
  }
`)
