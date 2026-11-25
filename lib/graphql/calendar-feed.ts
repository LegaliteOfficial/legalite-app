/** Private .ics subscribe link for the member's own deadlines. */

import { graphql } from '@/types/generated'

export const CalendarFeedStatusQueryDoc = graphql(/* GraphQL */ `
  query CalendarFeedStatus {
    calendarFeedStatus {
      active
      created_at
      last_used_at
    }
  }
`)

export const CreateCalendarFeedLinkMutationDoc = graphql(/* GraphQL */ `
  mutation CreateCalendarFeedLink {
    createCalendarFeedLink {
      url
    }
  }
`)

export const RevokeCalendarFeedLinkMutationDoc = graphql(/* GraphQL */ `
  mutation RevokeCalendarFeedLink {
    revokeCalendarFeedLink
  }
`)
