/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AcceptInviteInput = {
  name: string;
  password: string;
  token: string;
};

export type AiChatInput = {
  attachments?: Array<ChatAttachmentInput> | null | undefined;
  context?: string | null | undefined;
  conversation_id?: string | null | undefined;
  message: string;
};

export type AssignmentMemberInput = {
  assignment_role?: string | null | undefined;
  member_id: string | number;
};

export type ChangeMemberRoleInput = {
  firm_role: string;
  member_id: string | number;
};

export type ChangePasswordInput = {
  current_password: string;
  new_password: string;
};

export type ChangeProfessionalTitleInput = {
  member_id: string | number;
  professional_title: string;
};

export type ChatAttachmentInput = {
  data: string;
  mime_type: string;
  name: string;
};

export type CreateAttachmentInput = {
  entity_id: string | number;
  entity_type: string;
  file_name: string;
  file_size?: number | null | undefined;
  file_type?: string | null | undefined;
  storage_path: string;
};

export type CreateAttachmentUploadUrlInput = {
  entity_id: string | number;
  entity_type: string;
  file_name: string;
};

export type CreateCalendarEventInput = {
  all_day?: boolean | null | undefined;
  attendee_client_ids?: Array<string | number> | null | undefined;
  attendee_member_ids?: Array<string | number> | null | undefined;
  case_id?: string | number | null | undefined;
  client_id?: string | number | null | undefined;
  description?: string | null | undefined;
  end_time: string;
  event_type?: string | null | undefined;
  location?: string | null | undefined;
  reminders?: Array<EventReminderInput> | null | undefined;
  start_time: string;
  status?: string | null | undefined;
  title: string;
};

export type CreateCaseInput = {
  assigned_lawyer?: string | null | undefined;
  assignments?: Array<AssignmentMemberInput> | null | undefined;
  case_code?: string | null | undefined;
  case_stage?: string | null | undefined;
  case_type?: string | null | undefined;
  client_id: string | number;
  court?: string | null | undefined;
  date_opened?: string | null | undefined;
  description?: string | null | undefined;
  details?: string | null | undefined;
  next_court_date?: string | null | undefined;
  notes?: string | null | undefined;
  opposing_party?: string | null | undefined;
  originating_lawyer?: string | null | undefined;
  status?: string | null | undefined;
  suit_number?: string | null | undefined;
  title: string;
};

export type CreateClientInput = {
  address?: string | null | undefined;
  client_code?: string | null | undefined;
  date_of_birth?: string | null | undefined;
  email?: string | null | undefined;
  full_name: string;
  ghana_card?: string | null | undefined;
  notes?: string | null | undefined;
  phone?: string | null | undefined;
  status?: string | null | undefined;
};

export type CreateDeadlineInput = {
  case_id?: string | number | null | undefined;
  description?: string | null | undefined;
  due_date: string;
  priority?: string | null | undefined;
  reminder_days?: number | null | undefined;
  status?: string | null | undefined;
  title: string;
};

export type CreateDocumentInput = {
  case_id?: string | number | null | undefined;
  client_id?: string | number | null | undefined;
  content?: string | null | undefined;
  court?: string | null | undefined;
  judge?: string | null | undefined;
  parties?: string | null | undefined;
  suit_number?: string | null | undefined;
  template_type?: string | null | undefined;
  title: string;
};

export type CreateFirmRoleInput = {
  description?: string | null | undefined;
  name: string;
  permissions: Array<string>;
};

export type CreateInvoiceInput = {
  amount_ghs: number;
  client_id: string | number;
  description?: string | null | undefined;
  due_date?: string | null | undefined;
  status?: string | null | undefined;
};

export type CreateLibraryItemInput = {
  author?: string | null | undefined;
  category: string;
  description?: string | null | undefined;
  file_name?: string | null | undefined;
  file_size?: number | null | undefined;
  file_type?: string | null | undefined;
  file_url?: string | null | undefined;
  tags?: Array<string> | null | undefined;
  thumbnail_url?: string | null | undefined;
  title: string;
};

export type CreateMessageInput = {
  body: string;
  channel?: string | null | undefined;
  client_id: string | number;
  direction?: string | null | undefined;
  status?: string | null | undefined;
  subject: string;
};

export type CreateTaskInput = {
  assigned_to?: string | null | undefined;
  case_id?: string | number | null | undefined;
  client_id?: string | number | null | undefined;
  due_date?: string | null | undefined;
  notes?: string | null | undefined;
  priority?: string | null | undefined;
  status?: string | null | undefined;
  title: string;
};

export type EventReminderInput = {
  method?: string | null | undefined;
  minutes_before: number;
};

export type GoogleAuthInput = {
  accessToken: string;
};

export type InvitationIdInput = {
  id: string | number;
};

export type InviteMemberInput = {
  email: string;
  firm_role: string;
  professional_title: string;
  role_ids?: Array<string | number> | null | undefined;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type LookupInvitationInput = {
  token: string;
};

export type RegisterOwnerInput = {
  email: string;
  firm_name: string;
  firm_type?: string | null | undefined;
  name: string;
  password: string;
  professional_title?: string | null | undefined;
};

export type RespondToEventInput = {
  event_id: string | number;
  response: string;
};

export type RoleIdInput = {
  id: string | number;
};

export type SetCaseAssignmentsInput = {
  assignments: Array<AssignmentMemberInput>;
  case_id: string | number;
};

export type SetClientAssignmentsInput = {
  assignments: Array<AssignmentMemberInput>;
  client_id: string | number;
};

export type SetMemberRolesInput = {
  member_id: string | number;
  role_ids: Array<string | number>;
};

export type SetProfilePracticeAreasInput = {
  practice_area_ids: Array<string | number>;
  primary_practice_area_id?: string | number | null | undefined;
};

export type SwitchFirmInput = {
  firmId: string;
};

export type TransferOwnershipInput = {
  new_owner_profile_id: string | number;
  new_role_for_outgoing_owner: string;
  reason: string;
};

export type UpdateCalendarEventInput = {
  all_day?: boolean | null | undefined;
  attendee_client_ids?: Array<string | number> | null | undefined;
  attendee_member_ids?: Array<string | number> | null | undefined;
  case_id?: string | number | null | undefined;
  client_id?: string | number | null | undefined;
  description?: string | null | undefined;
  end_time?: string | null | undefined;
  event_type?: string | null | undefined;
  location?: string | null | undefined;
  reminders?: Array<EventReminderInput> | null | undefined;
  start_time?: string | null | undefined;
  status?: string | null | undefined;
  title?: string | null | undefined;
};

export type UpdateCaseInput = {
  assigned_lawyer?: string | null | undefined;
  case_code?: string | null | undefined;
  case_stage?: string | null | undefined;
  case_type?: string | null | undefined;
  client_id?: string | number | null | undefined;
  court?: string | null | undefined;
  date_opened?: string | null | undefined;
  description?: string | null | undefined;
  details?: string | null | undefined;
  next_court_date?: string | null | undefined;
  notes?: string | null | undefined;
  opposing_party?: string | null | undefined;
  originating_lawyer?: string | null | undefined;
  status?: string | null | undefined;
  suit_number?: string | null | undefined;
  title?: string | null | undefined;
};

export type UpdateClientInput = {
  address?: string | null | undefined;
  client_code?: string | null | undefined;
  date_of_birth?: string | null | undefined;
  email?: string | null | undefined;
  full_name?: string | null | undefined;
  ghana_card?: string | null | undefined;
  notes?: string | null | undefined;
  phone?: string | null | undefined;
  status?: string | null | undefined;
};

export type UpdateDeadlineInput = {
  case_id?: string | number | null | undefined;
  description?: string | null | undefined;
  due_date?: string | null | undefined;
  priority?: string | null | undefined;
  reminder_days?: number | null | undefined;
  status?: string | null | undefined;
  title?: string | null | undefined;
};

export type UpdateDocumentInput = {
  case_id?: string | number | null | undefined;
  client_id?: string | number | null | undefined;
  content?: string | null | undefined;
  court?: string | null | undefined;
  judge?: string | null | undefined;
  parties?: string | null | undefined;
  suit_number?: string | null | undefined;
  template_type?: string | null | undefined;
  title?: string | null | undefined;
};

export type UpdateFirmInput = {
  city?: string | null | undefined;
  description?: string | null | undefined;
  digital_address?: string | null | undefined;
  email?: string | null | undefined;
  firm_type?: string | null | undefined;
  logo_url?: string | null | undefined;
  name?: string | null | undefined;
  office_address?: string | null | undefined;
  phone?: string | null | undefined;
  region?: string | null | undefined;
  registration_number?: string | null | undefined;
  tin?: string | null | undefined;
  website?: string | null | undefined;
  year_established?: number | null | undefined;
};

export type UpdateFirmRoleInput = {
  description?: string | null | undefined;
  name?: string | null | undefined;
  permissions?: Array<string> | null | undefined;
  role_id: string | number;
};

export type UpdateInvoiceInput = {
  amount_ghs?: number | null | undefined;
  client_id?: string | number | null | undefined;
  description?: string | null | undefined;
  due_date?: string | null | undefined;
  status?: string | null | undefined;
};

export type UpdateLibraryItemInput = {
  author?: string | null | undefined;
  description?: string | null | undefined;
  is_favorite?: boolean | null | undefined;
  tags?: Array<string> | null | undefined;
  title?: string | null | undefined;
};

export type UpdateProfileInput = {
  avatar_url?: string | null | undefined;
  bio?: string | null | undefined;
  city?: string | null | undefined;
  date_of_birth?: string | null | undefined;
  digital_address?: string | null | undefined;
  first_name?: string | null | undefined;
  gba_number?: string | null | undefined;
  gender?: string | null | undefined;
  ghana_card_no?: string | null | undefined;
  last_name?: string | null | undefined;
  middle_name?: string | null | undefined;
  name?: string | null | undefined;
  office_address?: string | null | undefined;
  passport_no?: string | null | undefined;
  phone?: string | null | undefined;
  practice_type?: string | null | undefined;
  practising_license_no?: string | null | undefined;
  practising_license_year?: number | null | undefined;
  region?: string | null | undefined;
  supreme_court_enrollment_no?: string | null | undefined;
  work_email?: string | null | undefined;
  work_phone?: string | null | undefined;
  year_called_to_bar?: number | null | undefined;
};

export type UpdateTaskInput = {
  assigned_to?: string | null | undefined;
  case_id?: string | number | null | undefined;
  client_id?: string | number | null | undefined;
  due_date?: string | null | undefined;
  notes?: string | null | undefined;
  priority?: string | null | undefined;
  status?: string | null | undefined;
  title?: string | null | undefined;
};

export type UploadVerificationDocumentInput = {
  document_type: string;
  file_name: string;
  file_size?: number | null | undefined;
  file_type?: string | null | undefined;
  file_url: string;
};

export type AuthUserFieldsFragment = { id: string, email: string, name: string, role: string, first_name: string | null, last_name: string | null, gba_number: string | null, supreme_court_enrollment_no: string | null, practising_license_no: string | null, digital_address: string | null, verification_status: string | null, created_at: string };

export type FirmMembershipFieldsFragment = { firm_id: string, firm_name: string, firm_slug: string, firm_role: string, professional_title: string, status: string };

export type AuthPayloadFieldsFragment = { token: string, user: { id: string, email: string, name: string, role: string, first_name: string | null, last_name: string | null, gba_number: string | null, supreme_court_enrollment_no: string | null, practising_license_no: string | null, digital_address: string | null, verification_status: string | null, created_at: string }, active_membership: { firm_id: string, firm_name: string, firm_slug: string, firm_role: string, professional_title: string, status: string } | null, memberships: Array<{ firm_id: string, firm_name: string, firm_slug: string, firm_role: string, professional_title: string, status: string }> };

export type FirmFieldsFragment = { id: string, name: string, slug: string, firm_type: string, registration_number: string | null, tin: string | null, year_established: number | null, email: string | null, phone: string | null, website: string | null, office_address: string | null, digital_address: string | null, city: string | null, region: string | null, logo_url: string | null, description: string | null, plan: string, status: string, owner_profile_id: string, created_at: string, updated_at: string };

export type ClientFieldsFragment = { id: string, firm_id: string | null, user_id: string, client_code: string | null, full_name: string, email: string | null, phone: string | null, ghana_card: string | null, date_of_birth: string | null, address: string | null, status: string, notes: string | null, created_at: string, updated_at: string };

export type AttachmentFieldsFragment = { id: string, firm_id: string, entity_type: string, entity_id: string, file_name: string, file_type: string | null, file_size: number | null, uploaded_by: string | null, created_at: string, updated_at: string };

export type TaskFieldsFragment = { id: string, user_id: string, client_id: string | null, case_id: string | null, title: string, priority: string | null, status: string, due_date: string | null, assigned_to: string | null, notes: string | null, client_name: string | null, case_title: string | null, created_at: string, updated_at: string };

export type InvoiceFieldsFragment = { id: string, user_id: string, client_id: string, amount_ghs: number, status: string, due_date: string | null, description: string | null, client_name: string | null, created_at: string, updated_at: string };

export type LibraryItemFieldsFragment = { id: string, user_id: string, category: string, title: string, author: string | null, description: string | null, tags: Array<string> | null, file_url: string | null, file_name: string | null, file_type: string | null, file_size: number | null, thumbnail_url: string | null, is_favorite: boolean, created_at: string, updated_at: string };

export type DeadlineFieldsFragment = { id: string, user_id: string, case_id: string | null, title: string, description: string | null, due_date: string, priority: string, status: string, reminder_days: number | null, case_title: string | null, created_at: string, updated_at: string };

export type MessageFieldsFragment = { id: string, user_id: string, client_id: string, subject: string, body: string, channel: string, direction: string, status: string, client_name: string | null, created_at: string, updated_at: string };

export type DocumentFieldsFragment = { id: string, user_id: string, case_id: string | null, client_id: string | null, title: string, template_type: string | null, court: string | null, suit_number: string | null, parties: string | null, judge: string | null, content: string | null, created_at: string, updated_at: string };

export type CaseFieldsFragment = { id: string, firm_id: string | null, user_id: string, client_id: string, case_code: string | null, title: string, court: string | null, suit_number: string | null, opposing_party: string | null, case_type: string | null, case_stage: string | null, assigned_lawyer: string | null, originating_lawyer: string | null, status: string, date_opened: string | null, next_court_date: string | null, closed_at: string | null, pending_at: string | null, notification_count: number | null, description: string | null, details: string | null, notes: string | null, client_name: string | null, created_at: string, updated_at: string };

export type EventAttendeeFieldsFragment = { id: string, event_id: string, kind: string, member_id: string | null, client_id: string | null, response: string, name: string, professional_title: string | null, avatar_url: string | null };

export type EventReminderFieldsFragment = { id: string, event_id: string, minutes_before: number, method: string, remind_at: string, status: string, sent_at: string | null };

export type CalendarEventFieldsFragment = { id: string, firm_id: string, created_by: string | null, case_id: string | null, client_id: string | null, title: string, description: string | null, location: string | null, event_type: string, status: string, start_time: string, end_time: string, all_day: boolean, case_title: string | null, client_name: string | null, created_at: string, updated_at: string, attendees: Array<{ id: string, event_id: string, kind: string, member_id: string | null, client_id: string | null, response: string, name: string, professional_title: string | null, avatar_url: string | null }>, reminders: Array<{ id: string, event_id: string, minutes_before: number, method: string, remind_at: string, status: string, sent_at: string | null }> };

export type AiConversationsQueryVariables = Exact<{ [key: string]: never; }>;


export type AiConversationsQuery = { aiConversations: Array<{ id: string, title: string, created_at: string, updated_at: string }> };

export type AiConversationQueryVariables = Exact<{
  id: string | number;
}>;


export type AiConversationQuery = { aiConversation: { id: string, title: string, created_at: string, updated_at: string, messages: Array<{ id: string, role: string, content: string, sources: unknown, created_at: string }> } };

export type AiChatMutationVariables = Exact<{
  input: AiChatInput;
}>;


export type AiChatMutation = { aiChat: { response: string, conversation_id: string | null, sources: Array<{ id: string, title: string, content: string, similarity: number }> } };

export type DeleteAiConversationMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteAiConversationMutation = { deleteAiConversation: boolean };

export type ClientAssignmentsQueryVariables = Exact<{ [key: string]: never; }>;


export type ClientAssignmentsQuery = { clientAssignments: Array<{ id: string, client_id: string, member_id: string, assignment_role: string, name: string, professional_title: string | null, avatar_url: string | null }> };

export type SetClientAssignmentsMutationVariables = Exact<{
  input: SetClientAssignmentsInput;
}>;


export type SetClientAssignmentsMutation = { setClientAssignments: Array<{ id: string, client_id: string, member_id: string, assignment_role: string, name: string, professional_title: string | null, avatar_url: string | null }> };

export type CaseAssignmentsQueryVariables = Exact<{
  case_id: string | number;
}>;


export type CaseAssignmentsQuery = { caseAssignments: Array<{ id: string, case_id: string, member_id: string, assignment_role: string, name: string, professional_title: string | null, avatar_url: string | null }> };

export type SetCaseAssignmentsMutationVariables = Exact<{
  input: SetCaseAssignmentsInput;
}>;


export type SetCaseAssignmentsMutation = { setCaseAssignments: Array<{ id: string, case_id: string, member_id: string, assignment_role: string, name: string, professional_title: string | null, avatar_url: string | null }> };

export type AttachmentsQueryVariables = Exact<{
  entity_type: string;
  entity_id: string | number;
}>;


export type AttachmentsQuery = { attachments: Array<{ id: string, firm_id: string, entity_type: string, entity_id: string, file_name: string, file_type: string | null, file_size: number | null, uploaded_by: string | null, created_at: string, updated_at: string }> };

export type AttachmentDownloadUrlQueryVariables = Exact<{
  id: string | number;
}>;


export type AttachmentDownloadUrlQuery = { attachmentDownloadUrl: { url: string } };

export type CreateAttachmentUploadUrlMutationVariables = Exact<{
  input: CreateAttachmentUploadUrlInput;
}>;


export type CreateAttachmentUploadUrlMutation = { createAttachmentUploadUrl: { path: string, token: string, signed_url: string } };

export type CreateAttachmentMutationVariables = Exact<{
  input: CreateAttachmentInput;
}>;


export type CreateAttachmentMutation = { createAttachment: { id: string, firm_id: string, entity_type: string, entity_id: string, file_name: string, file_type: string | null, file_size: number | null, uploaded_by: string | null, created_at: string, updated_at: string } };

export type DeleteAttachmentMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteAttachmentMutation = { deleteAttachment: boolean };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { login: { token: string, user: { id: string, email: string, name: string, role: string, first_name: string | null, last_name: string | null, gba_number: string | null, supreme_court_enrollment_no: string | null, practising_license_no: string | null, digital_address: string | null, verification_status: string | null, created_at: string }, active_membership: { firm_id: string, firm_name: string, firm_slug: string, firm_role: string, professional_title: string, status: string } | null, memberships: Array<{ firm_id: string, firm_name: string, firm_slug: string, firm_role: string, professional_title: string, status: string }> } };

export type RegisterOwnerMutationVariables = Exact<{
  input: RegisterOwnerInput;
}>;


export type RegisterOwnerMutation = { registerOwner: { token: string, user: { id: string, email: string, name: string, role: string, first_name: string | null, last_name: string | null, gba_number: string | null, supreme_court_enrollment_no: string | null, practising_license_no: string | null, digital_address: string | null, verification_status: string | null, created_at: string }, active_membership: { firm_id: string, firm_name: string, firm_slug: string, firm_role: string, professional_title: string, status: string } | null, memberships: Array<{ firm_id: string, firm_name: string, firm_slug: string, firm_role: string, professional_title: string, status: string }> } };

export type AcceptInviteMutationVariables = Exact<{
  input: AcceptInviteInput;
}>;


export type AcceptInviteMutation = { acceptInvite: { token: string, user: { id: string, email: string, name: string, role: string, first_name: string | null, last_name: string | null, gba_number: string | null, supreme_court_enrollment_no: string | null, practising_license_no: string | null, digital_address: string | null, verification_status: string | null, created_at: string }, active_membership: { firm_id: string, firm_name: string, firm_slug: string, firm_role: string, professional_title: string, status: string } | null, memberships: Array<{ firm_id: string, firm_name: string, firm_slug: string, firm_role: string, professional_title: string, status: string }> } };

export type GoogleAuthMutationVariables = Exact<{
  input: GoogleAuthInput;
}>;


export type GoogleAuthMutation = { googleAuth: { token: string, user: { id: string, email: string, name: string, role: string, first_name: string | null, last_name: string | null, gba_number: string | null, supreme_court_enrollment_no: string | null, practising_license_no: string | null, digital_address: string | null, verification_status: string | null, created_at: string }, active_membership: { firm_id: string, firm_name: string, firm_slug: string, firm_role: string, professional_title: string, status: string } | null, memberships: Array<{ firm_id: string, firm_name: string, firm_slug: string, firm_role: string, professional_title: string, status: string }> } };

export type SwitchFirmMutationVariables = Exact<{
  input: SwitchFirmInput;
}>;


export type SwitchFirmMutation = { switchFirm: { token: string, user: { id: string, email: string, name: string, role: string, first_name: string | null, last_name: string | null, gba_number: string | null, supreme_court_enrollment_no: string | null, practising_license_no: string | null, digital_address: string | null, verification_status: string | null, created_at: string }, active_membership: { firm_id: string, firm_name: string, firm_slug: string, firm_role: string, professional_title: string, status: string } | null, memberships: Array<{ firm_id: string, firm_name: string, firm_slug: string, firm_role: string, professional_title: string, status: string }> } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { id: string, email: string, name: string, role: string, first_name: string | null, last_name: string | null, gba_number: string | null, supreme_court_enrollment_no: string | null, practising_license_no: string | null, digital_address: string | null, verification_status: string | null, created_at: string } };

export type CalendarEventsQueryVariables = Exact<{
  from?: string | null | undefined;
  to?: string | null | undefined;
}>;


export type CalendarEventsQuery = { calendarEvents: Array<{ id: string, firm_id: string, created_by: string | null, case_id: string | null, client_id: string | null, title: string, description: string | null, location: string | null, event_type: string, status: string, start_time: string, end_time: string, all_day: boolean, case_title: string | null, client_name: string | null, created_at: string, updated_at: string, attendees: Array<{ id: string, event_id: string, kind: string, member_id: string | null, client_id: string | null, response: string, name: string, professional_title: string | null, avatar_url: string | null }>, reminders: Array<{ id: string, event_id: string, minutes_before: number, method: string, remind_at: string, status: string, sent_at: string | null }> }> };

export type CalendarEventQueryVariables = Exact<{
  id: string | number;
}>;


export type CalendarEventQuery = { calendarEvent: { id: string, firm_id: string, created_by: string | null, case_id: string | null, client_id: string | null, title: string, description: string | null, location: string | null, event_type: string, status: string, start_time: string, end_time: string, all_day: boolean, case_title: string | null, client_name: string | null, created_at: string, updated_at: string, attendees: Array<{ id: string, event_id: string, kind: string, member_id: string | null, client_id: string | null, response: string, name: string, professional_title: string | null, avatar_url: string | null }>, reminders: Array<{ id: string, event_id: string, minutes_before: number, method: string, remind_at: string, status: string, sent_at: string | null }> } };

export type CreateCalendarEventMutationVariables = Exact<{
  input: CreateCalendarEventInput;
}>;


export type CreateCalendarEventMutation = { createCalendarEvent: { id: string, firm_id: string, created_by: string | null, case_id: string | null, client_id: string | null, title: string, description: string | null, location: string | null, event_type: string, status: string, start_time: string, end_time: string, all_day: boolean, case_title: string | null, client_name: string | null, created_at: string, updated_at: string, attendees: Array<{ id: string, event_id: string, kind: string, member_id: string | null, client_id: string | null, response: string, name: string, professional_title: string | null, avatar_url: string | null }>, reminders: Array<{ id: string, event_id: string, minutes_before: number, method: string, remind_at: string, status: string, sent_at: string | null }> } };

export type UpdateCalendarEventMutationVariables = Exact<{
  id: string | number;
  input: UpdateCalendarEventInput;
}>;


export type UpdateCalendarEventMutation = { updateCalendarEvent: { id: string, firm_id: string, created_by: string | null, case_id: string | null, client_id: string | null, title: string, description: string | null, location: string | null, event_type: string, status: string, start_time: string, end_time: string, all_day: boolean, case_title: string | null, client_name: string | null, created_at: string, updated_at: string, attendees: Array<{ id: string, event_id: string, kind: string, member_id: string | null, client_id: string | null, response: string, name: string, professional_title: string | null, avatar_url: string | null }>, reminders: Array<{ id: string, event_id: string, minutes_before: number, method: string, remind_at: string, status: string, sent_at: string | null }> } };

export type DeleteCalendarEventMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteCalendarEventMutation = { deleteCalendarEvent: boolean };

export type RespondToEventMutationVariables = Exact<{
  input: RespondToEventInput;
}>;


export type RespondToEventMutation = { respondToEvent: { id: string, firm_id: string, created_by: string | null, case_id: string | null, client_id: string | null, title: string, description: string | null, location: string | null, event_type: string, status: string, start_time: string, end_time: string, all_day: boolean, case_title: string | null, client_name: string | null, created_at: string, updated_at: string, attendees: Array<{ id: string, event_id: string, kind: string, member_id: string | null, client_id: string | null, response: string, name: string, professional_title: string | null, avatar_url: string | null }>, reminders: Array<{ id: string, event_id: string, minutes_before: number, method: string, remind_at: string, status: string, sent_at: string | null }> } };

export type CasesQueryVariables = Exact<{ [key: string]: never; }>;


export type CasesQuery = { cases: Array<{ id: string, firm_id: string | null, user_id: string, client_id: string, case_code: string | null, title: string, court: string | null, suit_number: string | null, opposing_party: string | null, case_type: string | null, case_stage: string | null, assigned_lawyer: string | null, originating_lawyer: string | null, status: string, date_opened: string | null, next_court_date: string | null, closed_at: string | null, pending_at: string | null, notification_count: number | null, description: string | null, details: string | null, notes: string | null, client_name: string | null, created_at: string, updated_at: string }> };

export type CaseQueryVariables = Exact<{
  id: string | number;
}>;


export type CaseQuery = { case: { id: string, firm_id: string | null, user_id: string, client_id: string, case_code: string | null, title: string, court: string | null, suit_number: string | null, opposing_party: string | null, case_type: string | null, case_stage: string | null, assigned_lawyer: string | null, originating_lawyer: string | null, status: string, date_opened: string | null, next_court_date: string | null, closed_at: string | null, pending_at: string | null, notification_count: number | null, description: string | null, details: string | null, notes: string | null, client_name: string | null, created_at: string, updated_at: string } };

export type CreateCaseMutationVariables = Exact<{
  input: CreateCaseInput;
}>;


export type CreateCaseMutation = { createCase: { id: string, firm_id: string | null, user_id: string, client_id: string, case_code: string | null, title: string, court: string | null, suit_number: string | null, opposing_party: string | null, case_type: string | null, case_stage: string | null, assigned_lawyer: string | null, originating_lawyer: string | null, status: string, date_opened: string | null, next_court_date: string | null, closed_at: string | null, pending_at: string | null, notification_count: number | null, description: string | null, details: string | null, notes: string | null, client_name: string | null, created_at: string, updated_at: string } };

export type UpdateCaseMutationVariables = Exact<{
  id: string | number;
  input: UpdateCaseInput;
}>;


export type UpdateCaseMutation = { updateCase: { id: string, firm_id: string | null, user_id: string, client_id: string, case_code: string | null, title: string, court: string | null, suit_number: string | null, opposing_party: string | null, case_type: string | null, case_stage: string | null, assigned_lawyer: string | null, originating_lawyer: string | null, status: string, date_opened: string | null, next_court_date: string | null, closed_at: string | null, pending_at: string | null, notification_count: number | null, description: string | null, details: string | null, notes: string | null, client_name: string | null, created_at: string, updated_at: string } };

export type DeleteCaseMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteCaseMutation = { deleteCase: boolean };

export type ClientsQueryVariables = Exact<{ [key: string]: never; }>;


export type ClientsQuery = { clients: Array<{ id: string, firm_id: string | null, user_id: string, client_code: string | null, full_name: string, email: string | null, phone: string | null, ghana_card: string | null, date_of_birth: string | null, address: string | null, status: string, notes: string | null, created_at: string, updated_at: string }> };

export type ClientQueryVariables = Exact<{
  id: string | number;
}>;


export type ClientQuery = { client: { id: string, firm_id: string | null, user_id: string, client_code: string | null, full_name: string, email: string | null, phone: string | null, ghana_card: string | null, date_of_birth: string | null, address: string | null, status: string, notes: string | null, created_at: string, updated_at: string } };

export type CreateClientMutationVariables = Exact<{
  input: CreateClientInput;
}>;


export type CreateClientMutation = { createClient: { id: string, firm_id: string | null, user_id: string, client_code: string | null, full_name: string, email: string | null, phone: string | null, ghana_card: string | null, date_of_birth: string | null, address: string | null, status: string, notes: string | null, created_at: string, updated_at: string } };

export type UpdateClientMutationVariables = Exact<{
  id: string | number;
  input: UpdateClientInput;
}>;


export type UpdateClientMutation = { updateClient: { id: string, firm_id: string | null, user_id: string, client_code: string | null, full_name: string, email: string | null, phone: string | null, ghana_card: string | null, date_of_birth: string | null, address: string | null, status: string, notes: string | null, created_at: string, updated_at: string } };

export type DeleteClientMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteClientMutation = { deleteClient: boolean };

export type MessagesQueryVariables = Exact<{
  clientId?: string | number | null | undefined;
  channel?: string | null | undefined;
}>;


export type MessagesQuery = { messages: Array<{ id: string, user_id: string, client_id: string, subject: string, body: string, channel: string, direction: string, status: string, client_name: string | null, created_at: string, updated_at: string }> };

export type CreateMessageMutationVariables = Exact<{
  input: CreateMessageInput;
}>;


export type CreateMessageMutation = { createMessage: { id: string, user_id: string, client_id: string, subject: string, body: string, channel: string, direction: string, status: string, client_name: string | null, created_at: string, updated_at: string } };

export type DeleteMessageMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteMessageMutation = { deleteMessage: boolean };

export type DashboardStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardStatsQuery = { dashboardStats: { total_clients: number, active_cases: number, pending_tasks: number, total_invoices_due: number, upcoming_dates: Array<{ id: string, title: string, court: string | null, next_court_date: string, client_name: string }>, recent_activity: Array<{ type: string, title: string, created_at: string }> } };

export type DeadlinesQueryVariables = Exact<{
  status?: string | null | undefined;
  upcoming?: boolean | null | undefined;
}>;


export type DeadlinesQuery = { deadlines: Array<{ id: string, user_id: string, case_id: string | null, title: string, description: string | null, due_date: string, priority: string, status: string, reminder_days: number | null, case_title: string | null, created_at: string, updated_at: string }> };

export type DeadlineStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type DeadlineStatsQuery = { deadlineStats: { overdue_count: number, upcoming_this_week: Array<{ id: string, user_id: string, case_id: string | null, title: string, description: string | null, due_date: string, priority: string, status: string, reminder_days: number | null, case_title: string | null, created_at: string, updated_at: string }> } };

export type CreateDeadlineMutationVariables = Exact<{
  input: CreateDeadlineInput;
}>;


export type CreateDeadlineMutation = { createDeadline: { id: string, user_id: string, case_id: string | null, title: string, description: string | null, due_date: string, priority: string, status: string, reminder_days: number | null, case_title: string | null, created_at: string, updated_at: string } };

export type UpdateDeadlineMutationVariables = Exact<{
  id: string | number;
  input: UpdateDeadlineInput;
}>;


export type UpdateDeadlineMutation = { updateDeadline: { id: string, user_id: string, case_id: string | null, title: string, description: string | null, due_date: string, priority: string, status: string, reminder_days: number | null, case_title: string | null, created_at: string, updated_at: string } };

export type DeleteDeadlineMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteDeadlineMutation = { deleteDeadline: boolean };

export type DocumentsQueryVariables = Exact<{ [key: string]: never; }>;


export type DocumentsQuery = { documents: Array<{ id: string, user_id: string, case_id: string | null, client_id: string | null, title: string, template_type: string | null, court: string | null, suit_number: string | null, parties: string | null, judge: string | null, content: string | null, created_at: string, updated_at: string }> };

export type DocumentQueryVariables = Exact<{
  id: string | number;
}>;


export type DocumentQuery = { document: { id: string, user_id: string, case_id: string | null, client_id: string | null, title: string, template_type: string | null, court: string | null, suit_number: string | null, parties: string | null, judge: string | null, content: string | null, created_at: string, updated_at: string } };

export type CreateDocumentMutationVariables = Exact<{
  input: CreateDocumentInput;
}>;


export type CreateDocumentMutation = { createDocument: { id: string, user_id: string, case_id: string | null, client_id: string | null, title: string, template_type: string | null, court: string | null, suit_number: string | null, parties: string | null, judge: string | null, content: string | null, created_at: string, updated_at: string } };

export type UpdateDocumentMutationVariables = Exact<{
  id: string | number;
  input: UpdateDocumentInput;
}>;


export type UpdateDocumentMutation = { updateDocument: { id: string, user_id: string, case_id: string | null, client_id: string | null, title: string, template_type: string | null, court: string | null, suit_number: string | null, parties: string | null, judge: string | null, content: string | null, created_at: string, updated_at: string } };

export type DeleteDocumentMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteDocumentMutation = { deleteDocument: boolean };

export type CurrentFirmQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentFirmQuery = { currentFirm: { id: string, name: string, slug: string, firm_type: string, registration_number: string | null, tin: string | null, year_established: number | null, email: string | null, phone: string | null, website: string | null, office_address: string | null, digital_address: string | null, city: string | null, region: string | null, logo_url: string | null, description: string | null, plan: string, status: string, owner_profile_id: string, created_at: string, updated_at: string } | null };

export type UpdateFirmMutationVariables = Exact<{
  input: UpdateFirmInput;
}>;


export type UpdateFirmMutation = { updateFirm: { id: string, name: string, slug: string, firm_type: string, registration_number: string | null, tin: string | null, year_established: number | null, email: string | null, phone: string | null, website: string | null, office_address: string | null, digital_address: string | null, city: string | null, region: string | null, logo_url: string | null, description: string | null, plan: string, status: string, owner_profile_id: string, created_at: string, updated_at: string } };

export type PendingInvitationsQueryVariables = Exact<{ [key: string]: never; }>;


export type PendingInvitationsQuery = { pendingInvitations: Array<{ id: string, firm_id: string, email: string, firm_role: string, professional_title: string, invited_by: string, expires_at: string, created_at: string }> };

export type InviteMemberMutationVariables = Exact<{
  input: InviteMemberInput;
}>;


export type InviteMemberMutation = { inviteMember: { token: string, accept_url: string, invitation: { id: string, firm_id: string, email: string, firm_role: string, professional_title: string, expires_at: string, created_at: string } } };

export type ResendInvitationMutationVariables = Exact<{
  input: InvitationIdInput;
}>;


export type ResendInvitationMutation = { resendInvitation: { token: string, accept_url: string, invitation: { id: string, expires_at: string } } };

export type RevokeInvitationMutationVariables = Exact<{
  input: InvitationIdInput;
}>;


export type RevokeInvitationMutation = { revokeInvitation: { id: string, revoked_at: string | null } };

export type InvitationLookupQueryVariables = Exact<{
  input: LookupInvitationInput;
}>;


export type InvitationLookupQuery = { invitationLookup: { email: string, firm_name: string, firm_role: string, professional_title: string, expires_at: string } };

export type InvoicesQueryVariables = Exact<{ [key: string]: never; }>;


export type InvoicesQuery = { invoices: Array<{ id: string, user_id: string, client_id: string, amount_ghs: number, status: string, due_date: string | null, description: string | null, client_name: string | null, created_at: string, updated_at: string }> };

export type InvoiceQueryVariables = Exact<{
  id: string | number;
}>;


export type InvoiceQuery = { invoice: { id: string, user_id: string, client_id: string, amount_ghs: number, status: string, due_date: string | null, description: string | null, client_name: string | null, created_at: string, updated_at: string } };

export type CreateInvoiceMutationVariables = Exact<{
  input: CreateInvoiceInput;
}>;


export type CreateInvoiceMutation = { createInvoice: { id: string, user_id: string, client_id: string, amount_ghs: number, status: string, due_date: string | null, description: string | null, client_name: string | null, created_at: string, updated_at: string } };

export type UpdateInvoiceMutationVariables = Exact<{
  id: string | number;
  input: UpdateInvoiceInput;
}>;


export type UpdateInvoiceMutation = { updateInvoice: { id: string, user_id: string, client_id: string, amount_ghs: number, status: string, due_date: string | null, description: string | null, client_name: string | null, created_at: string, updated_at: string } };

export type DeleteInvoiceMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteInvoiceMutation = { deleteInvoice: boolean };

export type LibraryItemsQueryVariables = Exact<{
  category?: string | null | undefined;
}>;


export type LibraryItemsQuery = { libraryItems: Array<{ id: string, user_id: string, category: string, title: string, author: string | null, description: string | null, tags: Array<string> | null, file_url: string | null, file_name: string | null, file_type: string | null, file_size: number | null, thumbnail_url: string | null, is_favorite: boolean, created_at: string, updated_at: string }> };

export type LibraryDownloadUrlQueryVariables = Exact<{
  id: string | number;
}>;


export type LibraryDownloadUrlQuery = { libraryDownloadUrl: { url: string } };

export type CreateLibraryItemMutationVariables = Exact<{
  input: CreateLibraryItemInput;
}>;


export type CreateLibraryItemMutation = { createLibraryItem: { id: string, user_id: string, category: string, title: string, author: string | null, description: string | null, tags: Array<string> | null, file_url: string | null, file_name: string | null, file_type: string | null, file_size: number | null, thumbnail_url: string | null, is_favorite: boolean, created_at: string, updated_at: string } };

export type UpdateLibraryItemMutationVariables = Exact<{
  id: string | number;
  input: UpdateLibraryItemInput;
}>;


export type UpdateLibraryItemMutation = { updateLibraryItem: { id: string, user_id: string, category: string, title: string, author: string | null, description: string | null, tags: Array<string> | null, file_url: string | null, file_name: string | null, file_type: string | null, file_size: number | null, thumbnail_url: string | null, is_favorite: boolean, created_at: string, updated_at: string } };

export type ToggleLibraryItemFavoriteMutationVariables = Exact<{
  id: string | number;
}>;


export type ToggleLibraryItemFavoriteMutation = { toggleLibraryItemFavorite: { id: string, is_favorite: boolean } };

export type DeleteLibraryItemMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteLibraryItemMutation = { deleteLibraryItem: boolean };

export type FirmMembersQueryVariables = Exact<{ [key: string]: never; }>;


export type FirmMembersQuery = { firmMembers: Array<{ id: string, firm_id: string, profile_id: string, firm_role: string, professional_title: string, employment_type: string, status: string, name: string, email: string, gba_number: string | null, verification_status: string | null, joined_at: string, left_at: string | null }> };

export type ChangeMemberRoleMutationVariables = Exact<{
  input: ChangeMemberRoleInput;
}>;


export type ChangeMemberRoleMutation = { changeMemberRole: { id: string, firm_role: string, professional_title: string, status: string, name: string, email: string } };

export type ChangeProfessionalTitleMutationVariables = Exact<{
  input: ChangeProfessionalTitleInput;
}>;


export type ChangeProfessionalTitleMutation = { changeProfessionalTitle: { id: string, firm_role: string, professional_title: string } };

export type DeactivateMemberMutationVariables = Exact<{
  member_id: string | number;
}>;


export type DeactivateMemberMutation = { deactivateMember: { id: string, status: string } };

export type ReactivateMemberMutationVariables = Exact<{
  member_id: string | number;
}>;


export type ReactivateMemberMutation = { reactivateMember: { id: string, status: string } };

export type LeaveFirmMutationVariables = Exact<{ [key: string]: never; }>;


export type LeaveFirmMutation = { leaveFirm: boolean };

export type TransferOwnershipMutationVariables = Exact<{
  input: TransferOwnershipInput;
}>;


export type TransferOwnershipMutation = { transferOwnership: { id: string, firm_role: string, name: string } };

export type PracticeAreasQueryVariables = Exact<{ [key: string]: never; }>;


export type PracticeAreasQuery = { practiceAreas: Array<{ id: string, slug: string, name: string, description: string | null }> };

export type MyPracticeAreasQueryVariables = Exact<{ [key: string]: never; }>;


export type MyPracticeAreasQuery = { myPracticeAreas: Array<{ practice_area_id: string, slug: string, name: string, is_primary: boolean }> };

export type SetMyPracticeAreasMutationVariables = Exact<{
  input: SetProfilePracticeAreasInput;
}>;


export type SetMyPracticeAreasMutation = { setMyPracticeAreas: Array<{ practice_area_id: string, slug: string, name: string, is_primary: boolean }> };

export type PermissionCatalogQueryVariables = Exact<{ [key: string]: never; }>;


export type PermissionCatalogQuery = { permissionCatalog: Array<{ key: string, label: string, description: string, groups: Array<{ key: string, label: string, permissions: Array<{ slug: string, label: string }> }> }> };

export type FirmRolesQueryVariables = Exact<{ [key: string]: never; }>;


export type FirmRolesQuery = { firmRoles: Array<{ id: string, firm_id: string, name: string, slug: string, description: string, permissions: Array<string>, is_system: boolean, status: string, member_count: number, created_at: string, updated_at: string }> };

export type FirmRoleQueryVariables = Exact<{
  id: string | number;
}>;


export type FirmRoleQuery = { firmRole: { id: string, firm_id: string, name: string, slug: string, description: string, permissions: Array<string>, is_system: boolean, status: string, member_count: number, created_at: string, updated_at: string } };

export type CreateFirmRoleMutationVariables = Exact<{
  input: CreateFirmRoleInput;
}>;


export type CreateFirmRoleMutation = { createFirmRole: { id: string, name: string, slug: string, description: string, permissions: Array<string>, is_system: boolean, status: string, member_count: number, created_at: string, updated_at: string } };

export type UpdateFirmRoleMutationVariables = Exact<{
  input: UpdateFirmRoleInput;
}>;


export type UpdateFirmRoleMutation = { updateFirmRole: { id: string, name: string, slug: string, description: string, permissions: Array<string>, is_system: boolean, status: string, member_count: number, updated_at: string } };

export type ArchiveFirmRoleMutationVariables = Exact<{
  input: RoleIdInput;
}>;


export type ArchiveFirmRoleMutation = { archiveFirmRole: { id: string, status: string } };

export type SetMemberRolesMutationVariables = Exact<{
  input: SetMemberRolesInput;
}>;


export type SetMemberRolesMutation = { setMemberRoles: Array<{ id: string, name: string, slug: string, is_system: boolean }> };

export type ProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type ProfileQuery = { profile: { id: string, email: string, name: string, role: string, first_name: string | null, middle_name: string | null, last_name: string | null, date_of_birth: string | null, gender: string | null, gba_number: string | null, supreme_court_enrollment_no: string | null, year_called_to_bar: number | null, practising_license_no: string | null, practising_license_year: number | null, ghana_card_no: string | null, passport_no: string | null, bio: string | null, practice_type: string | null, office_address: string | null, digital_address: string | null, city: string | null, region: string | null, work_email: string | null, work_phone: string | null, phone: string | null, avatar_url: string | null, verification_status: string, verified_at: string | null, created_at: string, updated_at: string } };

export type UpdateProfileMutationVariables = Exact<{
  input: UpdateProfileInput;
}>;


export type UpdateProfileMutation = { updateProfile: { id: string, email: string, name: string, role: string, first_name: string | null, middle_name: string | null, last_name: string | null, gba_number: string | null, supreme_court_enrollment_no: string | null, year_called_to_bar: number | null, practising_license_no: string | null, digital_address: string | null, city: string | null, region: string | null, phone: string | null, avatar_url: string | null, verification_status: string, updated_at: string } };

export type ChangePasswordMutationVariables = Exact<{
  input: ChangePasswordInput;
}>;


export type ChangePasswordMutation = { changePassword: boolean };

export type TasksQueryVariables = Exact<{ [key: string]: never; }>;


export type TasksQuery = { tasks: Array<{ id: string, user_id: string, client_id: string | null, case_id: string | null, title: string, priority: string | null, status: string, due_date: string | null, assigned_to: string | null, notes: string | null, client_name: string | null, case_title: string | null, created_at: string, updated_at: string }> };

export type TaskQueryVariables = Exact<{
  id: string | number;
}>;


export type TaskQuery = { task: { id: string, user_id: string, client_id: string | null, case_id: string | null, title: string, priority: string | null, status: string, due_date: string | null, assigned_to: string | null, notes: string | null, client_name: string | null, case_title: string | null, created_at: string, updated_at: string } };

export type CreateTaskMutationVariables = Exact<{
  input: CreateTaskInput;
}>;


export type CreateTaskMutation = { createTask: { id: string, user_id: string, client_id: string | null, case_id: string | null, title: string, priority: string | null, status: string, due_date: string | null, assigned_to: string | null, notes: string | null, client_name: string | null, case_title: string | null, created_at: string, updated_at: string } };

export type UpdateTaskMutationVariables = Exact<{
  id: string | number;
  input: UpdateTaskInput;
}>;


export type UpdateTaskMutation = { updateTask: { id: string, user_id: string, client_id: string | null, case_id: string | null, title: string, priority: string | null, status: string, due_date: string | null, assigned_to: string | null, notes: string | null, client_name: string | null, case_title: string | null, created_at: string, updated_at: string } };

export type DeleteTaskMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteTaskMutation = { deleteTask: boolean };

export type MyVerificationDocumentsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyVerificationDocumentsQuery = { myVerificationDocuments: Array<{ id: string, document_type: string, file_url: string, file_name: string, file_type: string | null, file_size: number | null, status: string, rejection_reason: string | null, created_at: string }> };

export type UploadVerificationDocumentMutationVariables = Exact<{
  input: UploadVerificationDocumentInput;
}>;


export type UploadVerificationDocumentMutation = { uploadVerificationDocument: { id: string, document_type: string, file_url: string, file_name: string, status: string, created_at: string } };

export const AuthUserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"gba_number"}},{"kind":"Field","name":{"kind":"Name","value":"supreme_court_enrollment_no"}},{"kind":"Field","name":{"kind":"Name","value":"practising_license_no"}},{"kind":"Field","name":{"kind":"Name","value":"digital_address"}},{"kind":"Field","name":{"kind":"Name","value":"verification_status"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]} as unknown as DocumentNode<AuthUserFieldsFragment, unknown>;
export const FirmMembershipFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FirmMembershipFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FirmMembership"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_name"}},{"kind":"Field","name":{"kind":"Name","value":"firm_slug"}},{"kind":"Field","name":{"kind":"Name","value":"firm_role"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]} as unknown as DocumentNode<FirmMembershipFieldsFragment, unknown>;
export const AuthPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"active_membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FirmMembershipFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"memberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FirmMembershipFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"gba_number"}},{"kind":"Field","name":{"kind":"Name","value":"supreme_court_enrollment_no"}},{"kind":"Field","name":{"kind":"Name","value":"practising_license_no"}},{"kind":"Field","name":{"kind":"Name","value":"digital_address"}},{"kind":"Field","name":{"kind":"Name","value":"verification_status"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FirmMembershipFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FirmMembership"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_name"}},{"kind":"Field","name":{"kind":"Name","value":"firm_slug"}},{"kind":"Field","name":{"kind":"Name","value":"firm_role"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]} as unknown as DocumentNode<AuthPayloadFieldsFragment, unknown>;
export const FirmFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FirmFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Firm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"firm_type"}},{"kind":"Field","name":{"kind":"Name","value":"registration_number"}},{"kind":"Field","name":{"kind":"Name","value":"tin"}},{"kind":"Field","name":{"kind":"Name","value":"year_established"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"office_address"}},{"kind":"Field","name":{"kind":"Name","value":"digital_address"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"logo_url"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"plan"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"owner_profile_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<FirmFieldsFragment, unknown>;
export const ClientFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Client"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_code"}},{"kind":"Field","name":{"kind":"Name","value":"full_name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"ghana_card"}},{"kind":"Field","name":{"kind":"Name","value":"date_of_birth"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<ClientFieldsFragment, unknown>;
export const AttachmentFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AttachmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Attachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"entity_type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_id"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"file_type"}},{"kind":"Field","name":{"kind":"Name","value":"file_size"}},{"kind":"Field","name":{"kind":"Name","value":"uploaded_by"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<AttachmentFieldsFragment, unknown>;
export const TaskFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"assigned_to"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<TaskFieldsFragment, unknown>;
export const InvoiceFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"InvoiceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Invoice"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"amount_ghs"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<InvoiceFieldsFragment, unknown>;
export const LibraryItemFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LibraryItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LibraryItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"file_url"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"file_type"}},{"kind":"Field","name":{"kind":"Name","value":"file_size"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnail_url"}},{"kind":"Field","name":{"kind":"Name","value":"is_favorite"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<LibraryItemFieldsFragment, unknown>;
export const DeadlineFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeadlineFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Deadline"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reminder_days"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<DeadlineFieldsFragment, unknown>;
export const MessageFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<MessageFieldsFragment, unknown>;
export const DocumentFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Document"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"template_type"}},{"kind":"Field","name":{"kind":"Name","value":"court"}},{"kind":"Field","name":{"kind":"Name","value":"suit_number"}},{"kind":"Field","name":{"kind":"Name","value":"parties"}},{"kind":"Field","name":{"kind":"Name","value":"judge"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<DocumentFieldsFragment, unknown>;
export const CaseFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Case"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_code"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"court"}},{"kind":"Field","name":{"kind":"Name","value":"suit_number"}},{"kind":"Field","name":{"kind":"Name","value":"opposing_party"}},{"kind":"Field","name":{"kind":"Name","value":"case_type"}},{"kind":"Field","name":{"kind":"Name","value":"case_stage"}},{"kind":"Field","name":{"kind":"Name","value":"assigned_lawyer"}},{"kind":"Field","name":{"kind":"Name","value":"originating_lawyer"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"date_opened"}},{"kind":"Field","name":{"kind":"Name","value":"next_court_date"}},{"kind":"Field","name":{"kind":"Name","value":"closed_at"}},{"kind":"Field","name":{"kind":"Name","value":"pending_at"}},{"kind":"Field","name":{"kind":"Name","value":"notification_count"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CaseFieldsFragment, unknown>;
export const EventAttendeeFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventAttendeeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventAttendee"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"member_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"response"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"avatar_url"}}]}}]} as unknown as DocumentNode<EventAttendeeFieldsFragment, unknown>;
export const EventReminderFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventReminderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventReminder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"minutes_before"}},{"kind":"Field","name":{"kind":"Name","value":"method"}},{"kind":"Field","name":{"kind":"Name","value":"remind_at"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"sent_at"}}]}}]} as unknown as DocumentNode<EventReminderFieldsFragment, unknown>;
export const CalendarEventFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CalendarEventFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CalendarEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_by"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"event_type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"start_time"}},{"kind":"Field","name":{"kind":"Name","value":"end_time"}},{"kind":"Field","name":{"kind":"Name","value":"all_day"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventAttendeeFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reminders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventReminderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventAttendeeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventAttendee"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"member_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"response"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"avatar_url"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventReminderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventReminder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"minutes_before"}},{"kind":"Field","name":{"kind":"Name","value":"method"}},{"kind":"Field","name":{"kind":"Name","value":"remind_at"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"sent_at"}}]}}]} as unknown as DocumentNode<CalendarEventFieldsFragment, unknown>;
export const AiConversationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AiConversations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aiConversations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<AiConversationsQuery, AiConversationsQueryVariables>;
export const AiConversationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AiConversation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aiConversation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"messages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"sources"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]}}]}}]} as unknown as DocumentNode<AiConversationQuery, AiConversationQueryVariables>;
export const AiChatDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AiChat"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AiChatInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aiChat"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"response"}},{"kind":"Field","name":{"kind":"Name","value":"conversation_id"}},{"kind":"Field","name":{"kind":"Name","value":"sources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"similarity"}}]}}]}}]}}]} as unknown as DocumentNode<AiChatMutation, AiChatMutationVariables>;
export const DeleteAiConversationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAiConversation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAiConversation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAiConversationMutation, DeleteAiConversationMutationVariables>;
export const ClientAssignmentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ClientAssignments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clientAssignments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"member_id"}},{"kind":"Field","name":{"kind":"Name","value":"assignment_role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"avatar_url"}}]}}]}}]} as unknown as DocumentNode<ClientAssignmentsQuery, ClientAssignmentsQueryVariables>;
export const SetClientAssignmentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetClientAssignments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetClientAssignmentsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setClientAssignments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"member_id"}},{"kind":"Field","name":{"kind":"Name","value":"assignment_role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"avatar_url"}}]}}]}}]} as unknown as DocumentNode<SetClientAssignmentsMutation, SetClientAssignmentsMutationVariables>;
export const CaseAssignmentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CaseAssignments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"case_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"caseAssignments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"case_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"case_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"member_id"}},{"kind":"Field","name":{"kind":"Name","value":"assignment_role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"avatar_url"}}]}}]}}]} as unknown as DocumentNode<CaseAssignmentsQuery, CaseAssignmentsQueryVariables>;
export const SetCaseAssignmentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetCaseAssignments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetCaseAssignmentsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setCaseAssignments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"member_id"}},{"kind":"Field","name":{"kind":"Name","value":"assignment_role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"avatar_url"}}]}}]}}]} as unknown as DocumentNode<SetCaseAssignmentsMutation, SetCaseAssignmentsMutationVariables>;
export const AttachmentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Attachments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"entity_type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"entity_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"entity_type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"entity_type"}}},{"kind":"Argument","name":{"kind":"Name","value":"entity_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"entity_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AttachmentFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AttachmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Attachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"entity_type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_id"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"file_type"}},{"kind":"Field","name":{"kind":"Name","value":"file_size"}},{"kind":"Field","name":{"kind":"Name","value":"uploaded_by"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<AttachmentsQuery, AttachmentsQueryVariables>;
export const AttachmentDownloadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AttachmentDownloadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachmentDownloadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<AttachmentDownloadUrlQuery, AttachmentDownloadUrlQueryVariables>;
export const CreateAttachmentUploadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAttachmentUploadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAttachmentUploadUrlInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAttachmentUploadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"signed_url"}}]}}]}}]} as unknown as DocumentNode<CreateAttachmentUploadUrlMutation, CreateAttachmentUploadUrlMutationVariables>;
export const CreateAttachmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAttachment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAttachmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAttachment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AttachmentFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AttachmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Attachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"entity_type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_id"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"file_type"}},{"kind":"Field","name":{"kind":"Name","value":"file_size"}},{"kind":"Field","name":{"kind":"Name","value":"uploaded_by"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CreateAttachmentMutation, CreateAttachmentMutationVariables>;
export const DeleteAttachmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAttachment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAttachment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAttachmentMutation, DeleteAttachmentMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"gba_number"}},{"kind":"Field","name":{"kind":"Name","value":"supreme_court_enrollment_no"}},{"kind":"Field","name":{"kind":"Name","value":"practising_license_no"}},{"kind":"Field","name":{"kind":"Name","value":"digital_address"}},{"kind":"Field","name":{"kind":"Name","value":"verification_status"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FirmMembershipFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FirmMembership"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_name"}},{"kind":"Field","name":{"kind":"Name","value":"firm_slug"}},{"kind":"Field","name":{"kind":"Name","value":"firm_role"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"active_membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FirmMembershipFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"memberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FirmMembershipFields"}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const RegisterOwnerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterOwner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RegisterOwnerInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerOwner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"gba_number"}},{"kind":"Field","name":{"kind":"Name","value":"supreme_court_enrollment_no"}},{"kind":"Field","name":{"kind":"Name","value":"practising_license_no"}},{"kind":"Field","name":{"kind":"Name","value":"digital_address"}},{"kind":"Field","name":{"kind":"Name","value":"verification_status"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FirmMembershipFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FirmMembership"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_name"}},{"kind":"Field","name":{"kind":"Name","value":"firm_slug"}},{"kind":"Field","name":{"kind":"Name","value":"firm_role"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"active_membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FirmMembershipFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"memberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FirmMembershipFields"}}]}}]}}]} as unknown as DocumentNode<RegisterOwnerMutation, RegisterOwnerMutationVariables>;
export const AcceptInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcceptInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AcceptInviteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acceptInvite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"gba_number"}},{"kind":"Field","name":{"kind":"Name","value":"supreme_court_enrollment_no"}},{"kind":"Field","name":{"kind":"Name","value":"practising_license_no"}},{"kind":"Field","name":{"kind":"Name","value":"digital_address"}},{"kind":"Field","name":{"kind":"Name","value":"verification_status"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FirmMembershipFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FirmMembership"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_name"}},{"kind":"Field","name":{"kind":"Name","value":"firm_slug"}},{"kind":"Field","name":{"kind":"Name","value":"firm_role"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"active_membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FirmMembershipFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"memberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FirmMembershipFields"}}]}}]}}]} as unknown as DocumentNode<AcceptInviteMutation, AcceptInviteMutationVariables>;
export const GoogleAuthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GoogleAuth"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GoogleAuthInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"googleAuth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"gba_number"}},{"kind":"Field","name":{"kind":"Name","value":"supreme_court_enrollment_no"}},{"kind":"Field","name":{"kind":"Name","value":"practising_license_no"}},{"kind":"Field","name":{"kind":"Name","value":"digital_address"}},{"kind":"Field","name":{"kind":"Name","value":"verification_status"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FirmMembershipFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FirmMembership"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_name"}},{"kind":"Field","name":{"kind":"Name","value":"firm_slug"}},{"kind":"Field","name":{"kind":"Name","value":"firm_role"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"active_membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FirmMembershipFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"memberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FirmMembershipFields"}}]}}]}}]} as unknown as DocumentNode<GoogleAuthMutation, GoogleAuthMutationVariables>;
export const SwitchFirmDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SwitchFirm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchFirmInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"switchFirm"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"gba_number"}},{"kind":"Field","name":{"kind":"Name","value":"supreme_court_enrollment_no"}},{"kind":"Field","name":{"kind":"Name","value":"practising_license_no"}},{"kind":"Field","name":{"kind":"Name","value":"digital_address"}},{"kind":"Field","name":{"kind":"Name","value":"verification_status"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FirmMembershipFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FirmMembership"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_name"}},{"kind":"Field","name":{"kind":"Name","value":"firm_slug"}},{"kind":"Field","name":{"kind":"Name","value":"firm_role"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"active_membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FirmMembershipFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"memberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FirmMembershipFields"}}]}}]}}]} as unknown as DocumentNode<SwitchFirmMutation, SwitchFirmMutationVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthUserFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"gba_number"}},{"kind":"Field","name":{"kind":"Name","value":"supreme_court_enrollment_no"}},{"kind":"Field","name":{"kind":"Name","value":"practising_license_no"}},{"kind":"Field","name":{"kind":"Name","value":"digital_address"}},{"kind":"Field","name":{"kind":"Name","value":"verification_status"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const CalendarEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalendarEvents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"to"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calendarEvents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CalendarEventFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventAttendeeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventAttendee"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"member_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"response"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"avatar_url"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventReminderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventReminder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"minutes_before"}},{"kind":"Field","name":{"kind":"Name","value":"method"}},{"kind":"Field","name":{"kind":"Name","value":"remind_at"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"sent_at"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CalendarEventFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CalendarEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_by"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"event_type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"start_time"}},{"kind":"Field","name":{"kind":"Name","value":"end_time"}},{"kind":"Field","name":{"kind":"Name","value":"all_day"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventAttendeeFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reminders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventReminderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CalendarEventsQuery, CalendarEventsQueryVariables>;
export const CalendarEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalendarEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calendarEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CalendarEventFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventAttendeeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventAttendee"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"member_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"response"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"avatar_url"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventReminderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventReminder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"minutes_before"}},{"kind":"Field","name":{"kind":"Name","value":"method"}},{"kind":"Field","name":{"kind":"Name","value":"remind_at"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"sent_at"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CalendarEventFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CalendarEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_by"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"event_type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"start_time"}},{"kind":"Field","name":{"kind":"Name","value":"end_time"}},{"kind":"Field","name":{"kind":"Name","value":"all_day"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventAttendeeFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reminders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventReminderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CalendarEventQuery, CalendarEventQueryVariables>;
export const CreateCalendarEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCalendarEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCalendarEventInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCalendarEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CalendarEventFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventAttendeeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventAttendee"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"member_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"response"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"avatar_url"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventReminderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventReminder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"minutes_before"}},{"kind":"Field","name":{"kind":"Name","value":"method"}},{"kind":"Field","name":{"kind":"Name","value":"remind_at"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"sent_at"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CalendarEventFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CalendarEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_by"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"event_type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"start_time"}},{"kind":"Field","name":{"kind":"Name","value":"end_time"}},{"kind":"Field","name":{"kind":"Name","value":"all_day"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventAttendeeFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reminders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventReminderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CreateCalendarEventMutation, CreateCalendarEventMutationVariables>;
export const UpdateCalendarEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCalendarEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCalendarEventInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCalendarEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CalendarEventFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventAttendeeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventAttendee"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"member_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"response"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"avatar_url"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventReminderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventReminder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"minutes_before"}},{"kind":"Field","name":{"kind":"Name","value":"method"}},{"kind":"Field","name":{"kind":"Name","value":"remind_at"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"sent_at"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CalendarEventFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CalendarEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_by"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"event_type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"start_time"}},{"kind":"Field","name":{"kind":"Name","value":"end_time"}},{"kind":"Field","name":{"kind":"Name","value":"all_day"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventAttendeeFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reminders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventReminderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<UpdateCalendarEventMutation, UpdateCalendarEventMutationVariables>;
export const DeleteCalendarEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCalendarEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCalendarEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteCalendarEventMutation, DeleteCalendarEventMutationVariables>;
export const RespondToEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RespondToEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RespondToEventInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"respondToEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CalendarEventFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventAttendeeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventAttendee"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"member_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"response"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"avatar_url"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventReminderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventReminder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"minutes_before"}},{"kind":"Field","name":{"kind":"Name","value":"method"}},{"kind":"Field","name":{"kind":"Name","value":"remind_at"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"sent_at"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CalendarEventFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CalendarEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_by"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"event_type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"start_time"}},{"kind":"Field","name":{"kind":"Name","value":"end_time"}},{"kind":"Field","name":{"kind":"Name","value":"all_day"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventAttendeeFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reminders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventReminderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<RespondToEventMutation, RespondToEventMutationVariables>;
export const CasesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Cases"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cases"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CaseFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Case"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_code"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"court"}},{"kind":"Field","name":{"kind":"Name","value":"suit_number"}},{"kind":"Field","name":{"kind":"Name","value":"opposing_party"}},{"kind":"Field","name":{"kind":"Name","value":"case_type"}},{"kind":"Field","name":{"kind":"Name","value":"case_stage"}},{"kind":"Field","name":{"kind":"Name","value":"assigned_lawyer"}},{"kind":"Field","name":{"kind":"Name","value":"originating_lawyer"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"date_opened"}},{"kind":"Field","name":{"kind":"Name","value":"next_court_date"}},{"kind":"Field","name":{"kind":"Name","value":"closed_at"}},{"kind":"Field","name":{"kind":"Name","value":"pending_at"}},{"kind":"Field","name":{"kind":"Name","value":"notification_count"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CasesQuery, CasesQueryVariables>;
export const CaseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Case"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"case"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CaseFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Case"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_code"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"court"}},{"kind":"Field","name":{"kind":"Name","value":"suit_number"}},{"kind":"Field","name":{"kind":"Name","value":"opposing_party"}},{"kind":"Field","name":{"kind":"Name","value":"case_type"}},{"kind":"Field","name":{"kind":"Name","value":"case_stage"}},{"kind":"Field","name":{"kind":"Name","value":"assigned_lawyer"}},{"kind":"Field","name":{"kind":"Name","value":"originating_lawyer"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"date_opened"}},{"kind":"Field","name":{"kind":"Name","value":"next_court_date"}},{"kind":"Field","name":{"kind":"Name","value":"closed_at"}},{"kind":"Field","name":{"kind":"Name","value":"pending_at"}},{"kind":"Field","name":{"kind":"Name","value":"notification_count"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CaseQuery, CaseQueryVariables>;
export const CreateCaseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCase"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCaseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCase"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CaseFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Case"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_code"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"court"}},{"kind":"Field","name":{"kind":"Name","value":"suit_number"}},{"kind":"Field","name":{"kind":"Name","value":"opposing_party"}},{"kind":"Field","name":{"kind":"Name","value":"case_type"}},{"kind":"Field","name":{"kind":"Name","value":"case_stage"}},{"kind":"Field","name":{"kind":"Name","value":"assigned_lawyer"}},{"kind":"Field","name":{"kind":"Name","value":"originating_lawyer"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"date_opened"}},{"kind":"Field","name":{"kind":"Name","value":"next_court_date"}},{"kind":"Field","name":{"kind":"Name","value":"closed_at"}},{"kind":"Field","name":{"kind":"Name","value":"pending_at"}},{"kind":"Field","name":{"kind":"Name","value":"notification_count"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CreateCaseMutation, CreateCaseMutationVariables>;
export const UpdateCaseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCase"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCaseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCase"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CaseFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Case"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_code"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"court"}},{"kind":"Field","name":{"kind":"Name","value":"suit_number"}},{"kind":"Field","name":{"kind":"Name","value":"opposing_party"}},{"kind":"Field","name":{"kind":"Name","value":"case_type"}},{"kind":"Field","name":{"kind":"Name","value":"case_stage"}},{"kind":"Field","name":{"kind":"Name","value":"assigned_lawyer"}},{"kind":"Field","name":{"kind":"Name","value":"originating_lawyer"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"date_opened"}},{"kind":"Field","name":{"kind":"Name","value":"next_court_date"}},{"kind":"Field","name":{"kind":"Name","value":"closed_at"}},{"kind":"Field","name":{"kind":"Name","value":"pending_at"}},{"kind":"Field","name":{"kind":"Name","value":"notification_count"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<UpdateCaseMutation, UpdateCaseMutationVariables>;
export const DeleteCaseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCase"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCase"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteCaseMutation, DeleteCaseMutationVariables>;
export const ClientsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Clients"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clients"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Client"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_code"}},{"kind":"Field","name":{"kind":"Name","value":"full_name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"ghana_card"}},{"kind":"Field","name":{"kind":"Name","value":"date_of_birth"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<ClientsQuery, ClientsQueryVariables>;
export const ClientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Client"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"client"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Client"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_code"}},{"kind":"Field","name":{"kind":"Name","value":"full_name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"ghana_card"}},{"kind":"Field","name":{"kind":"Name","value":"date_of_birth"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<ClientQuery, ClientQueryVariables>;
export const CreateClientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateClient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateClientInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createClient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Client"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_code"}},{"kind":"Field","name":{"kind":"Name","value":"full_name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"ghana_card"}},{"kind":"Field","name":{"kind":"Name","value":"date_of_birth"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CreateClientMutation, CreateClientMutationVariables>;
export const UpdateClientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateClient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateClientInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateClient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClientFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClientFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Client"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_code"}},{"kind":"Field","name":{"kind":"Name","value":"full_name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"ghana_card"}},{"kind":"Field","name":{"kind":"Name","value":"date_of_birth"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<UpdateClientMutation, UpdateClientMutationVariables>;
export const DeleteClientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteClient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteClient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteClientMutation, DeleteClientMutationVariables>;
export const MessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Messages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"channel"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"clientId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}}},{"kind":"Argument","name":{"kind":"Name","value":"channel"},"value":{"kind":"Variable","name":{"kind":"Name","value":"channel"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<MessagesQuery, MessagesQueryVariables>;
export const CreateMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CreateMessageMutation, CreateMessageMutationVariables>;
export const DeleteMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteMessageMutation, DeleteMessageMutationVariables>;
export const DashboardStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dashboardStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total_clients"}},{"kind":"Field","name":{"kind":"Name","value":"active_cases"}},{"kind":"Field","name":{"kind":"Name","value":"pending_tasks"}},{"kind":"Field","name":{"kind":"Name","value":"total_invoices_due"}},{"kind":"Field","name":{"kind":"Name","value":"upcoming_dates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"court"}},{"kind":"Field","name":{"kind":"Name","value":"next_court_date"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"recent_activity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]}}]}}]} as unknown as DocumentNode<DashboardStatsQuery, DashboardStatsQueryVariables>;
export const DeadlinesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Deadlines"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"upcoming"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deadlines"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"upcoming"},"value":{"kind":"Variable","name":{"kind":"Name","value":"upcoming"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeadlineFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeadlineFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Deadline"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reminder_days"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<DeadlinesQuery, DeadlinesQueryVariables>;
export const DeadlineStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeadlineStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deadlineStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"overdue_count"}},{"kind":"Field","name":{"kind":"Name","value":"upcoming_this_week"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeadlineFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeadlineFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Deadline"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reminder_days"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<DeadlineStatsQuery, DeadlineStatsQueryVariables>;
export const CreateDeadlineDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDeadline"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateDeadlineInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDeadline"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeadlineFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeadlineFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Deadline"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reminder_days"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CreateDeadlineMutation, CreateDeadlineMutationVariables>;
export const UpdateDeadlineDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDeadline"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDeadlineInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDeadline"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeadlineFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeadlineFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Deadline"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reminder_days"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<UpdateDeadlineMutation, UpdateDeadlineMutationVariables>;
export const DeleteDeadlineDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteDeadline"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteDeadline"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteDeadlineMutation, DeleteDeadlineMutationVariables>;
export const DocumentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Documents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DocumentFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Document"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"template_type"}},{"kind":"Field","name":{"kind":"Name","value":"court"}},{"kind":"Field","name":{"kind":"Name","value":"suit_number"}},{"kind":"Field","name":{"kind":"Name","value":"parties"}},{"kind":"Field","name":{"kind":"Name","value":"judge"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<DocumentsQuery, DocumentsQueryVariables>;
export const DocumentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Document"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"document"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DocumentFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Document"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"template_type"}},{"kind":"Field","name":{"kind":"Name","value":"court"}},{"kind":"Field","name":{"kind":"Name","value":"suit_number"}},{"kind":"Field","name":{"kind":"Name","value":"parties"}},{"kind":"Field","name":{"kind":"Name","value":"judge"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<DocumentQuery, DocumentQueryVariables>;
export const CreateDocumentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDocument"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateDocumentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDocument"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DocumentFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Document"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"template_type"}},{"kind":"Field","name":{"kind":"Name","value":"court"}},{"kind":"Field","name":{"kind":"Name","value":"suit_number"}},{"kind":"Field","name":{"kind":"Name","value":"parties"}},{"kind":"Field","name":{"kind":"Name","value":"judge"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CreateDocumentMutation, CreateDocumentMutationVariables>;
export const UpdateDocumentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDocument"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDocumentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDocument"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DocumentFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Document"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"template_type"}},{"kind":"Field","name":{"kind":"Name","value":"court"}},{"kind":"Field","name":{"kind":"Name","value":"suit_number"}},{"kind":"Field","name":{"kind":"Name","value":"parties"}},{"kind":"Field","name":{"kind":"Name","value":"judge"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<UpdateDocumentMutation, UpdateDocumentMutationVariables>;
export const DeleteDocumentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteDocument"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteDocument"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteDocumentMutation, DeleteDocumentMutationVariables>;
export const CurrentFirmDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CurrentFirm"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentFirm"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FirmFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FirmFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Firm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"firm_type"}},{"kind":"Field","name":{"kind":"Name","value":"registration_number"}},{"kind":"Field","name":{"kind":"Name","value":"tin"}},{"kind":"Field","name":{"kind":"Name","value":"year_established"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"office_address"}},{"kind":"Field","name":{"kind":"Name","value":"digital_address"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"logo_url"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"plan"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"owner_profile_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CurrentFirmQuery, CurrentFirmQueryVariables>;
export const UpdateFirmDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateFirm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateFirmInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFirm"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FirmFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FirmFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Firm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"firm_type"}},{"kind":"Field","name":{"kind":"Name","value":"registration_number"}},{"kind":"Field","name":{"kind":"Name","value":"tin"}},{"kind":"Field","name":{"kind":"Name","value":"year_established"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"office_address"}},{"kind":"Field","name":{"kind":"Name","value":"digital_address"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"logo_url"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"plan"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"owner_profile_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<UpdateFirmMutation, UpdateFirmMutationVariables>;
export const PendingInvitationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PendingInvitations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingInvitations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firm_role"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"invited_by"}},{"kind":"Field","name":{"kind":"Name","value":"expires_at"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]}}]} as unknown as DocumentNode<PendingInvitationsQuery, PendingInvitationsQueryVariables>;
export const InviteMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InviteMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invitation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firm_role"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"expires_at"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"accept_url"}}]}}]}}]} as unknown as DocumentNode<InviteMemberMutation, InviteMemberMutationVariables>;
export const ResendInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResendInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InvitationIdInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resendInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invitation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"expires_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"accept_url"}}]}}]}}]} as unknown as DocumentNode<ResendInvitationMutation, ResendInvitationMutationVariables>;
export const RevokeInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InvitationIdInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokeInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"revoked_at"}}]}}]}}]} as unknown as DocumentNode<RevokeInvitationMutation, RevokeInvitationMutationVariables>;
export const InvitationLookupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"InvitationLookup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LookupInvitationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invitationLookup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firm_name"}},{"kind":"Field","name":{"kind":"Name","value":"firm_role"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"expires_at"}}]}}]}}]} as unknown as DocumentNode<InvitationLookupQuery, InvitationLookupQueryVariables>;
export const InvoicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Invoices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invoices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"InvoiceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"InvoiceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Invoice"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"amount_ghs"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<InvoicesQuery, InvoicesQueryVariables>;
export const InvoiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Invoice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invoice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"InvoiceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"InvoiceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Invoice"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"amount_ghs"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<InvoiceQuery, InvoiceQueryVariables>;
export const CreateInvoiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateInvoice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateInvoiceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createInvoice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"InvoiceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"InvoiceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Invoice"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"amount_ghs"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CreateInvoiceMutation, CreateInvoiceMutationVariables>;
export const UpdateInvoiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateInvoice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateInvoiceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateInvoice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"InvoiceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"InvoiceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Invoice"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"amount_ghs"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<UpdateInvoiceMutation, UpdateInvoiceMutationVariables>;
export const DeleteInvoiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteInvoice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteInvoice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteInvoiceMutation, DeleteInvoiceMutationVariables>;
export const LibraryItemsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LibraryItems"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"category"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"libraryItems"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"category"},"value":{"kind":"Variable","name":{"kind":"Name","value":"category"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LibraryItemFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LibraryItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LibraryItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"file_url"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"file_type"}},{"kind":"Field","name":{"kind":"Name","value":"file_size"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnail_url"}},{"kind":"Field","name":{"kind":"Name","value":"is_favorite"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<LibraryItemsQuery, LibraryItemsQueryVariables>;
export const LibraryDownloadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LibraryDownloadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"libraryDownloadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<LibraryDownloadUrlQuery, LibraryDownloadUrlQueryVariables>;
export const CreateLibraryItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateLibraryItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateLibraryItemInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createLibraryItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LibraryItemFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LibraryItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LibraryItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"file_url"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"file_type"}},{"kind":"Field","name":{"kind":"Name","value":"file_size"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnail_url"}},{"kind":"Field","name":{"kind":"Name","value":"is_favorite"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CreateLibraryItemMutation, CreateLibraryItemMutationVariables>;
export const UpdateLibraryItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateLibraryItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateLibraryItemInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateLibraryItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LibraryItemFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LibraryItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LibraryItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"file_url"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"file_type"}},{"kind":"Field","name":{"kind":"Name","value":"file_size"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnail_url"}},{"kind":"Field","name":{"kind":"Name","value":"is_favorite"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<UpdateLibraryItemMutation, UpdateLibraryItemMutationVariables>;
export const ToggleLibraryItemFavoriteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleLibraryItemFavorite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleLibraryItemFavorite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_favorite"}}]}}]}}]} as unknown as DocumentNode<ToggleLibraryItemFavoriteMutation, ToggleLibraryItemFavoriteMutationVariables>;
export const DeleteLibraryItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteLibraryItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteLibraryItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteLibraryItemMutation, DeleteLibraryItemMutationVariables>;
export const FirmMembersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FirmMembers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firmMembers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"profile_id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_role"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"employment_type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gba_number"}},{"kind":"Field","name":{"kind":"Name","value":"verification_status"}},{"kind":"Field","name":{"kind":"Name","value":"joined_at"}},{"kind":"Field","name":{"kind":"Name","value":"left_at"}}]}}]}}]} as unknown as DocumentNode<FirmMembersQuery, FirmMembersQueryVariables>;
export const ChangeMemberRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangeMemberRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangeMemberRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changeMemberRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_role"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<ChangeMemberRoleMutation, ChangeMemberRoleMutationVariables>;
export const ChangeProfessionalTitleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangeProfessionalTitle"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangeProfessionalTitleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changeProfessionalTitle"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_role"}},{"kind":"Field","name":{"kind":"Name","value":"professional_title"}}]}}]}}]} as unknown as DocumentNode<ChangeProfessionalTitleMutation, ChangeProfessionalTitleMutationVariables>;
export const DeactivateMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeactivateMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"member_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deactivateMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"member_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"member_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<DeactivateMemberMutation, DeactivateMemberMutationVariables>;
export const ReactivateMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReactivateMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"member_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reactivateMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"member_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"member_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ReactivateMemberMutation, ReactivateMemberMutationVariables>;
export const LeaveFirmDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LeaveFirm"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"leaveFirm"}}]}}]} as unknown as DocumentNode<LeaveFirmMutation, LeaveFirmMutationVariables>;
export const TransferOwnershipDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TransferOwnership"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TransferOwnershipInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transferOwnership"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<TransferOwnershipMutation, TransferOwnershipMutationVariables>;
export const PracticeAreasDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PracticeAreas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"practiceAreas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<PracticeAreasQuery, PracticeAreasQueryVariables>;
export const MyPracticeAreasDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyPracticeAreas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myPracticeAreas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"practice_area_id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"is_primary"}}]}}]}}]} as unknown as DocumentNode<MyPracticeAreasQuery, MyPracticeAreasQueryVariables>;
export const SetMyPracticeAreasDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetMyPracticeAreas"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetProfilePracticeAreasInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setMyPracticeAreas"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"practice_area_id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"is_primary"}}]}}]}}]} as unknown as DocumentNode<SetMyPracticeAreasMutation, SetMyPracticeAreasMutationVariables>;
export const PermissionCatalogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PermissionCatalog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissionCatalog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}}]}}]} as unknown as DocumentNode<PermissionCatalogQuery, PermissionCatalogQueryVariables>;
export const FirmRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FirmRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firmRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"member_count"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<FirmRolesQuery, FirmRolesQueryVariables>;
export const FirmRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FirmRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firmRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firm_id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"member_count"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<FirmRoleQuery, FirmRoleQueryVariables>;
export const CreateFirmRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFirmRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateFirmRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFirmRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"member_count"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<CreateFirmRoleMutation, CreateFirmRoleMutationVariables>;
export const UpdateFirmRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateFirmRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateFirmRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFirmRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"member_count"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<UpdateFirmRoleMutation, UpdateFirmRoleMutationVariables>;
export const ArchiveFirmRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveFirmRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RoleIdInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveFirmRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ArchiveFirmRoleMutation, ArchiveFirmRoleMutationVariables>;
export const SetMemberRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetMemberRoles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetMemberRolesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setMemberRoles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}}]}}]}}]} as unknown as DocumentNode<SetMemberRolesMutation, SetMemberRolesMutationVariables>;
export const ProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Profile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"profile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"middle_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"date_of_birth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"gba_number"}},{"kind":"Field","name":{"kind":"Name","value":"supreme_court_enrollment_no"}},{"kind":"Field","name":{"kind":"Name","value":"year_called_to_bar"}},{"kind":"Field","name":{"kind":"Name","value":"practising_license_no"}},{"kind":"Field","name":{"kind":"Name","value":"practising_license_year"}},{"kind":"Field","name":{"kind":"Name","value":"ghana_card_no"}},{"kind":"Field","name":{"kind":"Name","value":"passport_no"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"practice_type"}},{"kind":"Field","name":{"kind":"Name","value":"office_address"}},{"kind":"Field","name":{"kind":"Name","value":"digital_address"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"work_email"}},{"kind":"Field","name":{"kind":"Name","value":"work_phone"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"avatar_url"}},{"kind":"Field","name":{"kind":"Name","value":"verification_status"}},{"kind":"Field","name":{"kind":"Name","value":"verified_at"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<ProfileQuery, ProfileQueryVariables>;
export const UpdateProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"middle_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"gba_number"}},{"kind":"Field","name":{"kind":"Name","value":"supreme_court_enrollment_no"}},{"kind":"Field","name":{"kind":"Name","value":"year_called_to_bar"}},{"kind":"Field","name":{"kind":"Name","value":"practising_license_no"}},{"kind":"Field","name":{"kind":"Name","value":"digital_address"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"avatar_url"}},{"kind":"Field","name":{"kind":"Name","value":"verification_status"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const ChangePasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangePassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangePasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changePassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ChangePasswordMutation, ChangePasswordMutationVariables>;
export const TasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Tasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"assigned_to"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<TasksQuery, TasksQueryVariables>;
export const TaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Task"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"task"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"assigned_to"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<TaskQuery, TaskQueryVariables>;
export const CreateTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTaskInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"assigned_to"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CreateTaskMutation, CreateTaskMutationVariables>;
export const UpdateTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTaskInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"client_id"}},{"kind":"Field","name":{"kind":"Name","value":"case_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"assigned_to"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"client_name"}},{"kind":"Field","name":{"kind":"Name","value":"case_title"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<UpdateTaskMutation, UpdateTaskMutationVariables>;
export const DeleteTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTaskMutation, DeleteTaskMutationVariables>;
export const MyVerificationDocumentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyVerificationDocuments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myVerificationDocuments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"document_type"}},{"kind":"Field","name":{"kind":"Name","value":"file_url"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"file_type"}},{"kind":"Field","name":{"kind":"Name","value":"file_size"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejection_reason"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]}}]} as unknown as DocumentNode<MyVerificationDocumentsQuery, MyVerificationDocumentsQueryVariables>;
export const UploadVerificationDocumentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UploadVerificationDocument"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UploadVerificationDocumentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadVerificationDocument"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"document_type"}},{"kind":"Field","name":{"kind":"Name","value":"file_url"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]}}]} as unknown as DocumentNode<UploadVerificationDocumentMutation, UploadVerificationDocumentMutationVariables>;