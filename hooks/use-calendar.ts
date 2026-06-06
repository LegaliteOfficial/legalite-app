import { useMutation, useQuery } from '@apollo/client/react'
import {
  CalendarEventsQueryDoc,
  CalendarEventQueryDoc,
  CreateCalendarEventMutationDoc,
  UpdateCalendarEventMutationDoc,
  DeleteCalendarEventMutationDoc,
  RespondToEventMutationDoc,
} from '@/lib/graphql/calendar'
import type {
  CalendarEventsQuery,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '@/types/generated/graphql'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export type CalendarEvent = CalendarEventsQuery['calendarEvents'][number]
export type EventAttendee = CalendarEvent['attendees'][number]
export type EventReminder = CalendarEvent['reminders'][number]

/** Friendly labels for the reminder lead times the UI offers. */
export const REMINDER_PRESETS: { minutes: number; label: string }[] = [
  { minutes: 0, label: 'At start time' },
  { minutes: 5, label: '5 minutes before' },
  { minutes: 10, label: '10 minutes before' },
  { minutes: 15, label: '15 minutes before' },
  { minutes: 30, label: '30 minutes before' },
  { minutes: 60, label: '1 hour before' },
  { minutes: 120, label: '2 hours before' },
  { minutes: 1440, label: '1 day before' },
  { minutes: 2880, label: '2 days before' },
  { minutes: 10080, label: '1 week before' },
]

export const EVENT_TYPES: { value: string; label: string }[] = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'hearing', label: 'Court hearing' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'call', label: 'Call' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'task', label: 'Task' },
  { value: 'other', label: 'Other' },
]

/** Events whose span overlaps [from, to] (ISO strings). Both optional. */
export function useCalendarEvents(from?: string, to?: string) {
  const { data, loading, error, refetch } = useQuery(CalendarEventsQueryDoc, {
    variables: { from, to },
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  return {
    data: (DEV_BYPASS ? [] : (data?.calendarEvents as CalendarEvent[] | undefined)),
    isLoading: DEV_BYPASS ? false : loading,
    error: DEV_BYPASS ? undefined : error,
    refetch,
  }
}

export function useCalendarEvent(id?: string) {
  const { data, loading, error } = useQuery(CalendarEventQueryDoc, {
    variables: { id: id ?? '' },
    skip: !id || DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  return {
    data: data?.calendarEvent as CalendarEvent | undefined,
    isLoading: loading,
    error,
  }
}

export function useCreateCalendarEvent() {
  const [mutate, state] = useMutation(CreateCalendarEventMutationDoc, {
    refetchQueries: [CalendarEventsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (input: CreateCalendarEventInput) => {
      const res = await mutate({ variables: { input } })
      return res.data?.createCalendarEvent
    },
  }
}

export function useUpdateCalendarEvent() {
  const [mutate, state] = useMutation(UpdateCalendarEventMutationDoc, {
    refetchQueries: [CalendarEventsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (id: string, input: UpdateCalendarEventInput) => {
      const res = await mutate({ variables: { id, input } })
      return res.data?.updateCalendarEvent
    },
  }
}

export function useDeleteCalendarEvent() {
  const [mutate, state] = useMutation(DeleteCalendarEventMutationDoc, {
    refetchQueries: [CalendarEventsQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (id: string) => {
      await mutate({ variables: { id } })
    },
  }
}

/** RSVP to an event you've been invited to. */
export function useRespondToEvent() {
  const [mutate, state] = useMutation(RespondToEventMutationDoc, {
    refetchQueries: [CalendarEventsQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (
      event_id: string,
      response: 'accepted' | 'declined' | 'tentative' | 'pending',
    ) => {
      const res = await mutate({ variables: { input: { event_id, response } } })
      return res.data?.respondToEvent
    },
  }
}
