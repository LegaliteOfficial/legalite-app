import { gql } from "@apollo/client"

export const AcceptInviteMutationDoc = gql(/* gql */ `
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

export const GoogleAuthMutationDoc = gql(/* gql */ `
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

export const SwitchFirmMutationDoc = gql(/* gql */ `
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

export const MeQueryDoc = gql(/* gql */ `
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

export const CurrentFirmQueryDoc = gql(/* gql */ `
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

export const UpdateFirmMutationDoc = gql(/* gql */ `
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

export const FirmMembersQueryDoc = gql(/* gql */ `
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

export const ChangeMemberRoleMutationDoc = gql(/* gql */ `
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

export const ChangeProfessionalTitleMutationDoc = gql(/* gql */ `
  mutation ChangeProfessionalTitle($input: ChangeProfessionalTitleInput!) {
    changeProfessionalTitle(input: $input) {
      id
      firm_role
      professional_title
    }
  }
`)

export const DeactivateMemberMutationDoc = gql(/* gql */ `
  mutation DeactivateMember($member_id: ID!) {
    deactivateMember(member_id: $member_id) {
      id
      status
    }
  }
`)

export const ReactivateMemberMutationDoc = gql(/* gql */ `
  mutation ReactivateMember($member_id: ID!) {
    reactivateMember(member_id: $member_id) {
      id
      status
    }
  }
`)

export const LeaveFirmMutationDoc = gql(/* gql */ `
  mutation LeaveFirm {
    leaveFirm
  }
`)

export const TransferOwnershipMutationDoc = gql(/* gql */ `
  mutation TransferOwnership($input: TransferOwnershipInput!) {
    transferOwnership(input: $input) {
      id
      firm_role
      name
    }
  }
`)

export const PendingInvitationsQueryDoc = gql(/* gql */ `
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

export const InviteMemberMutationDoc = gql(/* gql */ `
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

export const ResendInvitationMutationDoc = gql(/* gql */ `
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

export const RevokeInvitationMutationDoc = gql(/* gql */ `
  mutation RevokeInvitation($input: InvitationIdInput!) {
    revokeInvitation(input: $input) {
      id
      revoked_at
    }
  }
`)

export const InvitationLookupQueryDoc = gql(/* gql */ `
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

export const PracticeAreasQueryDoc = gql(/* gql */ `
  query PracticeAreas {
    practiceAreas {
      id
      slug
      name
      description
    }
  }
`)

export const MyPracticeAreasQueryDoc = gql(/* gql */ `
  query MyPracticeAreas {
    myPracticeAreas {
      practice_area_id
      slug
      name
      is_primary
    }
  }
`)

export const SetMyPracticeAreasMutationDoc = gql(/* gql */ `
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

export const MyVerificationDocumentsQueryDoc = gql(/* gql */ `
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

export const UploadVerificationDocumentMutationDoc = gql(/* gql */ `
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

export const ClientsQueryDoc = gql(/* gql */ `
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

export const ClientQueryDoc = gql(/* gql */ `
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

export const CreateClientMutationDoc = gql(/* gql */ `
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

export const UpdateClientMutationDoc = gql(/* gql */ `
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

export const DeleteClientMutationDoc = gql(/* gql */ `
  mutation DeleteClient($id: ID!) {
    deleteClient(id: $id)
  }
`)

// ───────────────────────── Cases ─────────────────────────

export const CasesQueryDoc = gql(/* gql */ `
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

export const CaseQueryDoc = gql(/* gql */ `
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

export const CreateCaseMutationDoc = gql(/* gql */ `
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

export const UpdateCaseMutationDoc = gql(/* gql */ `
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

export const DeleteCaseMutationDoc = gql(/* gql */ `
  mutation DeleteCase($id: ID!) {
    deleteCase(id: $id)
  }
`)

// ───────────────────────── Tasks ─────────────────────────

export const TasksQueryDoc = gql(/* gql */ `
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

export const TaskQueryDoc = gql(/* gql */ `
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

export const CreateTaskMutationDoc = gql(/* gql */ `
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

export const UpdateTaskMutationDoc = gql(/* gql */ `
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

export const DeleteTaskMutationDoc = gql(/* gql */ `
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`)

// ──────────────────────── Documents ──────────────────────

export const DocumentsQueryDoc = gql(/* gql */ `
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

export const DocumentQueryDoc = gql(/* gql */ `
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

export const CreateDocumentMutationDoc = gql(/* gql */ `
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

export const UpdateDocumentMutationDoc = gql(/* gql */ `
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

export const DeleteDocumentMutationDoc = gql(/* gql */ `
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
`)

// ──────────────────────── Invoices ───────────────────────

export const InvoicesQueryDoc = gql(/* gql */ `
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

export const InvoiceQueryDoc = gql(/* gql */ `
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

export const CreateInvoiceMutationDoc = gql(/* gql */ `
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

export const UpdateInvoiceMutationDoc = gql(/* gql */ `
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

export const DeleteInvoiceMutationDoc = gql(/* gql */ `
  mutation DeleteInvoice($id: ID!) {
    deleteInvoice(id: $id)
  }
`)

// ─────────────────────── Dashboard ───────────────────────

export const DashboardStatsQueryDoc = gql(/* gql */ `
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

export const LibraryItemsQueryDoc = gql(/* gql */ `
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

export const LibraryDownloadUrlQueryDoc = gql(/* gql */ `
  query LibraryDownloadUrl($id: ID!) {
    libraryDownloadUrl(id: $id) {
      url
    }
  }
`)

export const CreateLibraryItemMutationDoc = gql(/* gql */ `
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

export const UpdateLibraryItemMutationDoc = gql(/* gql */ `
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

export const ToggleLibraryItemFavoriteMutationDoc = gql(/* gql */ `
  mutation ToggleLibraryItemFavorite($id: ID!) {
    toggleLibraryItemFavorite(id: $id) {
      id
      is_favorite
    }
  }
`)

export const DeleteLibraryItemMutationDoc = gql(/* gql */ `
  mutation DeleteLibraryItem($id: ID!) {
    deleteLibraryItem(id: $id)
  }
`)

// ─────────────────────── Deadlines ───────────────────────

export const DeadlinesQueryDoc = gql(/* gql */ `
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

export const DeadlineStatsQueryDoc = gql(/* gql */ `
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

export const CreateDeadlineMutationDoc = gql(/* gql */ `
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

export const UpdateDeadlineMutationDoc = gql(/* gql */ `
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

export const DeleteDeadlineMutationDoc = gql(/* gql */ `
  mutation DeleteDeadline($id: ID!) {
    deleteDeadline(id: $id)
  }
`)

// ───────────────────────── Comms ─────────────────────────

export const MessagesQueryDoc = gql(/* gql */ `
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

export const CreateMessageMutationDoc = gql(/* gql */ `
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

export const DeleteMessageMutationDoc = gql(/* gql */ `
  mutation DeleteMessage($id: ID!) {
    deleteMessage(id: $id)
  }
`)

// ──────────────────────── Settings ───────────────────────

export const ProfileQueryDoc = gql(/* gql */ `
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

export const UpdateProfileMutationDoc = gql(/* gql */ `
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

export const ChangePasswordMutationDoc = gql(/* gql */ `
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`)

// ──────────────────────── AI ─────────────────────────────

export const AiConversationsQueryDoc = gql(/* gql */ `
  query AiConversations {
    aiConversations {
      id
      title
      created_at
      updated_at
    }
  }
`)

export const AiConversationQueryDoc = gql(/* gql */ `
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

export const AiChatMutationDoc = gql(/* gql */ `
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

export const DeleteAiConversationMutationDoc = gql(/* gql */ `
  mutation DeleteAiConversation($id: ID!) {
    deleteAiConversation(id: $id)
  }
`)
