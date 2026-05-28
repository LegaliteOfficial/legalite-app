// All GraphQL operations live here. Codegen reads this file via the glob in
// codegen.ts and emits typed DocumentNodes + variable/return types into
// lib/graphql/generated/. The `graphql()` template tag in each call is the
// codegen-generated, type-aware version once codegen has run at least once.

import { graphql } from './generated'

// ───────────────────────── Auth ─────────────────────────

// Every auth mutation returns the same AuthPayload shape (user +
// active_membership + memberships). The selection set is duplicated below
// rather than extracted into a fragment, because GraphQL fragments inside a
// `graphql()` template literal aren't picked up by codegen without explicit
// fragment definitions — keeping selections inline is the simpler path.

export const LoginMutationDoc = graphql(/* GraphQL */ `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
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
      active_membership {
        firm_id
        firm_name
        firm_slug
        firm_role
        professional_title
        status
      }
      memberships {
        firm_id
        firm_name
        firm_slug
        firm_role
        professional_title
        status
      }
    }
  }
`)

// Replaces the old RegisterMutation. Creates a firm + owner membership in
// one round-trip.
export const RegisterOwnerMutationDoc = graphql(/* GraphQL */ `
  mutation RegisterOwner($input: RegisterOwnerInput!) {
    registerOwner(input: $input) {
      token
      user {
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
      active_membership {
        firm_id
        firm_name
        firm_slug
        firm_role
        professional_title
        status
      }
      memberships {
        firm_id
        firm_name
        firm_slug
        firm_role
        professional_title
        status
      }
    }
  }
`)

// Re-exported under the legacy name so existing imports compile until pages
// switch to RegisterOwnerMutationDoc.
export const RegisterMutationDoc = RegisterOwnerMutationDoc

export const AcceptInviteMutationDoc = graphql(/* GraphQL */ `
  mutation AcceptInvite($input: AcceptInviteInput!) {
    acceptInvite(input: $input) {
      token
      user {
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
      active_membership {
        firm_id
        firm_name
        firm_slug
        firm_role
        professional_title
        status
      }
      memberships {
        firm_id
        firm_name
        firm_slug
        firm_role
        professional_title
        status
      }
    }
  }
`)

export const GoogleAuthMutationDoc = graphql(/* GraphQL */ `
  mutation GoogleAuth($input: GoogleAuthInput!) {
    googleAuth(input: $input) {
      token
      user {
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
      active_membership {
        firm_id
        firm_name
        firm_slug
        firm_role
        professional_title
        status
      }
      memberships {
        firm_id
        firm_name
        firm_slug
        firm_role
        professional_title
        status
      }
    }
  }
`)

export const SwitchFirmMutationDoc = graphql(/* GraphQL */ `
  mutation SwitchFirm($input: SwitchFirmInput!) {
    switchFirm(input: $input) {
      token
      user {
        id
        email
        name
        role
        verification_status
        created_at
      }
      active_membership {
        firm_id
        firm_name
        firm_slug
        firm_role
        professional_title
        status
      }
      memberships {
        firm_id
        firm_name
        firm_slug
        firm_role
        professional_title
        status
      }
    }
  }
`)

export const MeQueryDoc = graphql(/* GraphQL */ `
  query Me {
    me {
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
  }
`)

// ─────────────────────── Firms / Members / Invites ──────────────────────

export const CurrentFirmQueryDoc = graphql(/* GraphQL */ `
  query CurrentFirm {
    currentFirm {
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
  }
`)

export const UpdateFirmMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateFirm($input: UpdateFirmInput!) {
    updateFirm(input: $input) {
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
  }
`)

export const FirmMembersQueryDoc = graphql(/* GraphQL */ `
  query FirmMembers {
    firmMembers {
      id
      firm_id
      profile_id
      firm_role
      professional_title
      employment_type
      status
      name
      email
      gba_number
      verification_status
      joined_at
      left_at
    }
  }
`)

export const ChangeMemberRoleMutationDoc = graphql(/* GraphQL */ `
  mutation ChangeMemberRole($input: ChangeMemberRoleInput!) {
    changeMemberRole(input: $input) {
      id
      firm_role
      professional_title
      status
      name
      email
    }
  }
`)

export const ChangeProfessionalTitleMutationDoc = graphql(/* GraphQL */ `
  mutation ChangeProfessionalTitle($input: ChangeProfessionalTitleInput!) {
    changeProfessionalTitle(input: $input) {
      id
      firm_role
      professional_title
    }
  }
`)

export const DeactivateMemberMutationDoc = graphql(/* GraphQL */ `
  mutation DeactivateMember($member_id: ID!) {
    deactivateMember(member_id: $member_id) {
      id
      status
    }
  }
`)

export const ReactivateMemberMutationDoc = graphql(/* GraphQL */ `
  mutation ReactivateMember($member_id: ID!) {
    reactivateMember(member_id: $member_id) {
      id
      status
    }
  }
`)

export const LeaveFirmMutationDoc = graphql(/* GraphQL */ `
  mutation LeaveFirm {
    leaveFirm
  }
`)

export const TransferOwnershipMutationDoc = graphql(/* GraphQL */ `
  mutation TransferOwnership($input: TransferOwnershipInput!) {
    transferOwnership(input: $input) {
      id
      firm_role
      name
    }
  }
`)

export const PendingInvitationsQueryDoc = graphql(/* GraphQL */ `
  query PendingInvitations {
    pendingInvitations {
      id
      firm_id
      email
      firm_role
      professional_title
      invited_by
      expires_at
      created_at
    }
  }
`)

export const InviteMemberMutationDoc = graphql(/* GraphQL */ `
  mutation InviteMember($input: InviteMemberInput!) {
    inviteMember(input: $input) {
      invitation {
        id
        firm_id
        email
        firm_role
        professional_title
        expires_at
        created_at
      }
      token
      accept_url
    }
  }
`)

export const ResendInvitationMutationDoc = graphql(/* GraphQL */ `
  mutation ResendInvitation($input: InvitationIdInput!) {
    resendInvitation(input: $input) {
      invitation {
        id
        expires_at
      }
      token
      accept_url
    }
  }
`)

export const RevokeInvitationMutationDoc = graphql(/* GraphQL */ `
  mutation RevokeInvitation($input: InvitationIdInput!) {
    revokeInvitation(input: $input) {
      id
      revoked_at
    }
  }
`)

export const InvitationLookupQueryDoc = graphql(/* GraphQL */ `
  query InvitationLookup($input: LookupInvitationInput!) {
    invitationLookup(input: $input) {
      email
      firm_name
      firm_role
      professional_title
      expires_at
    }
  }
`)

// ─────────────────────── Practice Areas ──────────────────────────────────

export const PracticeAreasQueryDoc = graphql(/* GraphQL */ `
  query PracticeAreas {
    practiceAreas {
      id
      slug
      name
      description
    }
  }
`)

export const MyPracticeAreasQueryDoc = graphql(/* GraphQL */ `
  query MyPracticeAreas {
    myPracticeAreas {
      practice_area_id
      slug
      name
      is_primary
    }
  }
`)

export const SetMyPracticeAreasMutationDoc = graphql(/* GraphQL */ `
  mutation SetMyPracticeAreas($input: SetProfilePracticeAreasInput!) {
    setMyPracticeAreas(input: $input) {
      practice_area_id
      slug
      name
      is_primary
    }
  }
`)

// ─────────────────────── Verifications ───────────────────────────────────

export const MyVerificationDocumentsQueryDoc = graphql(/* GraphQL */ `
  query MyVerificationDocuments {
    myVerificationDocuments {
      id
      document_type
      file_url
      file_name
      file_type
      file_size
      status
      rejection_reason
      created_at
    }
  }
`)

export const UploadVerificationDocumentMutationDoc = graphql(/* GraphQL */ `
  mutation UploadVerificationDocument(
    $input: UploadVerificationDocumentInput!
  ) {
    uploadVerificationDocument(input: $input) {
      id
      document_type
      file_url
      file_name
      status
      created_at
    }
  }
`)


// ──────────────────────── Clients ────────────────────────

export const ClientsQueryDoc = graphql(/* GraphQL */ `
  query Clients {
    clients {
      id
      user_id
      full_name
      email
      phone
      ghana_card
      address
      status
      notes
      created_at
      updated_at
    }
  }
`)

export const ClientQueryDoc = graphql(/* GraphQL */ `
  query Client($id: ID!) {
    client(id: $id) {
      id
      user_id
      full_name
      email
      phone
      ghana_card
      address
      status
      notes
      created_at
      updated_at
    }
  }
`)

export const CreateClientMutationDoc = graphql(/* GraphQL */ `
  mutation CreateClient($input: CreateClientInput!) {
    createClient(input: $input) {
      id
      user_id
      full_name
      email
      phone
      ghana_card
      address
      status
      notes
      created_at
      updated_at
    }
  }
`)

export const UpdateClientMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {
    updateClient(id: $id, input: $input) {
      id
      user_id
      full_name
      email
      phone
      ghana_card
      address
      status
      notes
      created_at
      updated_at
    }
  }
`)

export const DeleteClientMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteClient($id: ID!) {
    deleteClient(id: $id)
  }
`)

// ───────────────────────── Cases ─────────────────────────

export const CasesQueryDoc = graphql(/* GraphQL */ `
  query Cases {
    cases {
      id
      user_id
      client_id
      title
      court
      suit_number
      opposing_party
      matter_type
      assigned_lawyer
      status
      next_court_date
      notes
      client_name
      created_at
      updated_at
    }
  }
`)

export const CaseQueryDoc = graphql(/* GraphQL */ `
  query Case($id: ID!) {
    case(id: $id) {
      id
      user_id
      client_id
      title
      court
      suit_number
      opposing_party
      matter_type
      assigned_lawyer
      status
      next_court_date
      notes
      client_name
      created_at
      updated_at
    }
  }
`)

export const CreateCaseMutationDoc = graphql(/* GraphQL */ `
  mutation CreateCase($input: CreateCaseInput!) {
    createCase(input: $input) {
      id
      user_id
      client_id
      title
      court
      suit_number
      opposing_party
      matter_type
      assigned_lawyer
      status
      next_court_date
      notes
      client_name
      created_at
      updated_at
    }
  }
`)

export const UpdateCaseMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateCase($id: ID!, $input: UpdateCaseInput!) {
    updateCase(id: $id, input: $input) {
      id
      user_id
      client_id
      title
      court
      suit_number
      opposing_party
      matter_type
      assigned_lawyer
      status
      next_court_date
      notes
      client_name
      created_at
      updated_at
    }
  }
`)

export const DeleteCaseMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteCase($id: ID!) {
    deleteCase(id: $id)
  }
`)

// ───────────────────────── Tasks ─────────────────────────

export const TasksQueryDoc = graphql(/* GraphQL */ `
  query Tasks {
    tasks {
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
  }
`)

export const TaskQueryDoc = graphql(/* GraphQL */ `
  query Task($id: ID!) {
    task(id: $id) {
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
  }
`)

export const CreateTaskMutationDoc = graphql(/* GraphQL */ `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
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
  }
`)

export const UpdateTaskMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
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
  }
`)

export const DeleteTaskMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`)

// ──────────────────────── Documents ──────────────────────

export const DocumentsQueryDoc = graphql(/* GraphQL */ `
  query Documents {
    documents {
      id
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
      created_at
      updated_at
    }
  }
`)

export const DocumentQueryDoc = graphql(/* GraphQL */ `
  query Document($id: ID!) {
    document(id: $id) {
      id
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
      created_at
      updated_at
    }
  }
`)

export const CreateDocumentMutationDoc = graphql(/* GraphQL */ `
  mutation CreateDocument($input: CreateDocumentInput!) {
    createDocument(input: $input) {
      id
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
      created_at
      updated_at
    }
  }
`)

export const UpdateDocumentMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {
    updateDocument(id: $id, input: $input) {
      id
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
      created_at
      updated_at
    }
  }
`)

export const DeleteDocumentMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
`)

// ──────────────────────── Invoices ───────────────────────

export const InvoicesQueryDoc = graphql(/* GraphQL */ `
  query Invoices {
    invoices {
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
  }
`)

export const InvoiceQueryDoc = graphql(/* GraphQL */ `
  query Invoice($id: ID!) {
    invoice(id: $id) {
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
  }
`)

export const CreateInvoiceMutationDoc = graphql(/* GraphQL */ `
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
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
  }
`)

export const UpdateInvoiceMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateInvoice($id: ID!, $input: UpdateInvoiceInput!) {
    updateInvoice(id: $id, input: $input) {
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
  }
`)

export const DeleteInvoiceMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteInvoice($id: ID!) {
    deleteInvoice(id: $id)
  }
`)

// ─────────────────────── Dashboard ───────────────────────

export const DashboardStatsQueryDoc = graphql(/* GraphQL */ `
  query DashboardStats {
    dashboardStats {
      total_clients
      active_cases
      pending_tasks
      total_invoices_due
      upcoming_dates {
        id
        title
        court
        next_court_date
        client_name
      }
      recent_activity {
        type
        title
        created_at
      }
    }
  }
`)

// ──────────────────────── Library ────────────────────────

export const LibraryItemsQueryDoc = graphql(/* GraphQL */ `
  query LibraryItems($category: String) {
    libraryItems(category: $category) {
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
  }
`)

export const LibraryDownloadUrlQueryDoc = graphql(/* GraphQL */ `
  query LibraryDownloadUrl($id: ID!) {
    libraryDownloadUrl(id: $id) {
      url
    }
  }
`)

export const CreateLibraryItemMutationDoc = graphql(/* GraphQL */ `
  mutation CreateLibraryItem($input: CreateLibraryItemInput!) {
    createLibraryItem(input: $input) {
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
  }
`)

export const UpdateLibraryItemMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateLibraryItem($id: ID!, $input: UpdateLibraryItemInput!) {
    updateLibraryItem(id: $id, input: $input) {
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
  }
`)

export const ToggleLibraryItemFavoriteMutationDoc = graphql(/* GraphQL */ `
  mutation ToggleLibraryItemFavorite($id: ID!) {
    toggleLibraryItemFavorite(id: $id) {
      id
      is_favorite
    }
  }
`)

export const DeleteLibraryItemMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteLibraryItem($id: ID!) {
    deleteLibraryItem(id: $id)
  }
`)

// ─────────────────────── Deadlines ───────────────────────

export const DeadlinesQueryDoc = graphql(/* GraphQL */ `
  query Deadlines($status: String, $upcoming: Boolean) {
    deadlines(status: $status, upcoming: $upcoming) {
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
  }
`)

export const DeadlineStatsQueryDoc = graphql(/* GraphQL */ `
  query DeadlineStats {
    deadlineStats {
      overdue_count
      upcoming_this_week {
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
    }
  }
`)

export const CreateDeadlineMutationDoc = graphql(/* GraphQL */ `
  mutation CreateDeadline($input: CreateDeadlineInput!) {
    createDeadline(input: $input) {
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
  }
`)

export const UpdateDeadlineMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateDeadline($id: ID!, $input: UpdateDeadlineInput!) {
    updateDeadline(id: $id, input: $input) {
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
  }
`)

export const DeleteDeadlineMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteDeadline($id: ID!) {
    deleteDeadline(id: $id)
  }
`)

// ───────────────────────── Comms ─────────────────────────

export const MessagesQueryDoc = graphql(/* GraphQL */ `
  query Messages($clientId: ID, $channel: String) {
    messages(clientId: $clientId, channel: $channel) {
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
  }
`)

export const CreateMessageMutationDoc = graphql(/* GraphQL */ `
  mutation CreateMessage($input: CreateMessageInput!) {
    createMessage(input: $input) {
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
  }
`)

export const DeleteMessageMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteMessage($id: ID!) {
    deleteMessage(id: $id)
  }
`)

// ──────────────────────── Settings ───────────────────────

export const ProfileQueryDoc = graphql(/* GraphQL */ `
  query Profile {
    profile {
      id
      email
      name
      role
      first_name
      middle_name
      last_name
      date_of_birth
      gender
      gba_number
      supreme_court_enrollment_no
      year_called_to_bar
      practising_license_no
      practising_license_year
      ghana_card_no
      passport_no
      bio
      practice_type
      office_address
      digital_address
      city
      region
      work_email
      work_phone
      phone
      avatar_url
      verification_status
      verified_at
      created_at
      updated_at
    }
  }
`)

export const UpdateProfileMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      email
      name
      role
      first_name
      middle_name
      last_name
      gba_number
      supreme_court_enrollment_no
      year_called_to_bar
      practising_license_no
      digital_address
      city
      region
      phone
      avatar_url
      verification_status
      updated_at
    }
  }
`)

export const ChangePasswordMutationDoc = graphql(/* GraphQL */ `
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`)

// ──────────────────────── AI ─────────────────────────────

export const AiConversationsQueryDoc = graphql(/* GraphQL */ `
  query AiConversations {
    aiConversations {
      id
      title
      created_at
      updated_at
    }
  }
`)

export const AiConversationQueryDoc = graphql(/* GraphQL */ `
  query AiConversation($id: ID!) {
    aiConversation(id: $id) {
      id
      title
      created_at
      updated_at
      messages {
        id
        role
        content
        sources
        created_at
      }
    }
  }
`)

export const AiChatMutationDoc = graphql(/* GraphQL */ `
  mutation AiChat($input: AiChatInput!) {
    aiChat(input: $input) {
      response
      conversation_id
      sources {
        id
        title
        content
        similarity
      }
    }
  }
`)

export const DeleteAiConversationMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteAiConversation($id: ID!) {
    deleteAiConversation(id: $id)
  }
`)
