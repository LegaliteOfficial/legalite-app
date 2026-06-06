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
