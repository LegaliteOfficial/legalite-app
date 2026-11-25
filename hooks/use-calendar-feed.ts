import { useMutation, useQuery } from '@apollo/client/react'
import {
  CalendarFeedStatusQueryDoc,
  CreateCalendarFeedLinkMutationDoc,
  RevokeCalendarFeedLinkMutationDoc,
} from '@/lib/graphql/calendar-feed'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

/** Whether the member has a live subscribe link, and ways to change it. */
export function useCalendarFeed() {
  const { data, loading, error } = useQuery(CalendarFeedStatusQueryDoc, {
    skip: DEV_BYPASS,
    fetchPolicy: 'cache-and-network',
  })
  const [create, createState] = useMutation(CreateCalendarFeedLinkMutationDoc, {
    refetchQueries: [CalendarFeedStatusQueryDoc],
  })
  const [revoke, revokeState] = useMutation(RevokeCalendarFeedLinkMutationDoc, {
    refetchQueries: [CalendarFeedStatusQueryDoc],
  })
  return {
    status: data?.calendarFeedStatus ?? null,
    isLoading: loading && !data,
    error,
    /** Returns the new link. It is shown once and cannot be fetched again. */
    createLink: async (): Promise<string> => {
      const res = await create()
      const url = res.data?.createCalendarFeedLink.url
      if (!url) throw new Error('The link could not be created.')
      return url
    },
    revokeLink: async () => {
      await revoke()
    },
    isWorking: createState.loading || revokeState.loading,
  }
}
