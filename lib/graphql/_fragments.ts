/**
 * Shared GraphQL fragments.
 *
 * Underscore prefix keeps the file out of feature folders alphabetically;
 * import from `@/lib/graphql/_fragments` everywhere.
 *
 * Note: `fragmentMasking` is OFF in codegen.ts, so these are pure
 * compile-time field unions — Apollo `useQuery`/`useMutation` returns the
 * same flat shape whether you use a fragment or inline the fields.
 */

import { graphql } from '@/types/generated'

/**
 * Full AuthUser projection — the profile we render on settings + the
 * auth header. Used by all auth mutations and the Me query.
 */
export const AuthUserFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment AuthUserFields on AuthUser {
    id
    email
    name
    role
    first_name
    last_name
    gba_number
    supreme_court_enrollment_no
    practising_license_no
    digital_address
    verification_status
    created_at
  }
`)

/**
 * Firm membership summary — every field the sidebar / firm switcher
 * needs. Used by `AuthPayload.active_membership` and `.memberships`.
 */
export const FirmMembershipFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment FirmMembershipFields on FirmMembership {
    firm_id
    firm_name
    firm_slug
    firm_role
    professional_title
    status
  }
`)

/**
 * The full auth payload returned by every login-shaped mutation
 * (login / register / acceptInvite / googleAuth / switchFirm). Lets each
 * mutation collapse its return projection to a single fragment spread.
 */
export const AuthPayloadFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment AuthPayloadFields on AuthPayload {
    token
    user {
      ...AuthUserFields
    }
    active_membership {
      ...FirmMembershipFields
    }
    memberships {
      ...FirmMembershipFields
    }
  }
`)

/**
 * Full firm record — used by CurrentFirm query and UpdateFirm mutation.
 * Settings UI reads every field, so we don't trim.
 */
export const FirmFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment FirmFields on Firm {
    id
    name
    slug
    firm_type
    registration_number
    tin
    year_established
    email
    phone
    website
    office_address
    digital_address
    city
    region
    logo_url
    description
    plan
    status
    owner_profile_id
    created_at
    updated_at
  }
`)

/**
 * Client row — list + detail + create + update all return the same
 * projection. Delete returns ID! so it doesn't need this.
 */
export const ClientFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment ClientFields on Client {
    id
    firm_id
    user_id
    client_code
    full_name
    email
    phone
    ghana_card
    date_of_birth
    address
    status
    notes
    created_at
    updated_at
  }
`)

/**
 * Attachment row — used by list query + create mutation (download URL
 * query and delete mutation use thinner projections).
 */
export const AttachmentFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment AttachmentFields on Attachment {
    id
    firm_id
    entity_type
    entity_id
    file_name
    file_type
    file_size
    uploaded_by
    created_at
    updated_at
  }
`)

/**
 * Task row — same shape for list + detail + create + update.
 */
export const TaskFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment TaskFields on Task {
    id
    user_id
    client_id
    case_id
    title
    priority
    status
    due_date
    assigned_to
    notes
    client_name
    case_title
    created_at
    updated_at
  }
`)

/**
 * Invoice row — list + detail + create + update share the projection.
 */
export const InvoiceFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment InvoiceFields on Invoice {
    id
    user_id
    client_id
    amount_ghs
    status
    due_date
    description
    client_name
    created_at
    updated_at
  }
`)

/**
 * Library item — list + create + update share 15 fields. Download URL
 * query and favorite/delete mutations use thinner projections.
 */
export const LibraryItemFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment LibraryItemFields on LibraryItem {
    id
    user_id
    category
    title
    author
    description
    tags
    file_url
    file_name
    file_type
    file_size
    thumbnail_url
    is_favorite
    created_at
    updated_at
  }
`)

/**
 * Deadline row — list + create + update + the stats payload's
 * `upcoming_this_week` field all share this shape.
 */
export const DeadlineFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment DeadlineFields on Deadline {
    id
    user_id
    case_id
    title
    description
    due_date
    priority
    status
    reminder_days
    case_title
    created_at
    updated_at
  }
`)

/**
 * Comms message — same shape across list + create. Delete returns ID.
 */
export const MessageFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment MessageFields on Message {
    id
    user_id
    client_id
    subject
    body
    channel
    direction
    status
    client_name
    created_at
    updated_at
  }
`)

/**
 * Document row — list + detail + create + update share the projection.
 */
export const DocumentFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment DocumentFields on Document {
    id
    firm_id
    user_id
    case_id
    client_id
    title
    template_type
    court
    suit_number
    parties
    judge
    content
    case_title
    client_name
    created_at
    updated_at
  }
`)

/**
 * Case row — used by list + detail + create + update. The 24 fields are
 * the same across all four; deduping them saves ~80 LOC.
 */
export const CaseFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment CaseFields on Case {
    id
    firm_id
    user_id
    client_id
    case_code
    title
    court
    suit_number
    opposing_party
    case_type
    case_stage
    assigned_lawyer
    originating_lawyer
    status
    date_opened
    next_court_date
    closed_at
    pending_at
    notification_count
    description
    details
    notes
    client_name
    created_at
    updated_at
  }
`)


/** Calendar event attendee (flattened member display fields + RSVP). */
export const EventAttendeeFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment EventAttendeeFields on EventAttendee {
    id
    event_id
    kind
    member_id
    client_id
    response
    name
    professional_title
    avatar_url
  }
`)

/** A reminder scheduled against an event. */
export const EventReminderFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment EventReminderFields on EventReminder {
    id
    event_id
    minutes_before
    method
    remind_at
    status
    sent_at
  }
`)

/** Calendar event with its attendees + reminders + context labels. */
export const CalendarEventFieldsFragmentDoc = graphql(/* GraphQL */ `
  fragment CalendarEventFields on CalendarEvent {
    id
    firm_id
    created_by
    case_id
    client_id
    title
    description
    location
    event_type
    status
    start_time
    end_time
    all_day
    case_title
    client_name
    attendees {
      ...EventAttendeeFields
    }
    reminders {
      ...EventReminderFields
    }
    created_at
    updated_at
  }
`)
