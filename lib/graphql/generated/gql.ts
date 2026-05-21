/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        id\n        email\n        name\n        role\n        firm\n        created_at\n      }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation Register($input: RegisterInput!) {\n    register(input: $input) {\n      token\n      user {\n        id\n        email\n        name\n        role\n        firm\n        created_at\n      }\n    }\n  }\n": typeof types.RegisterDocument,
    "\n  mutation GoogleAuth($input: GoogleAuthInput!) {\n    googleAuth(input: $input) {\n      token\n      user {\n        id\n        email\n        name\n        role\n        firm\n        created_at\n      }\n    }\n  }\n": typeof types.GoogleAuthDocument,
    "\n  query Me {\n    me {\n      id\n      email\n      name\n      role\n      firm\n      created_at\n    }\n  }\n": typeof types.MeDocument,
    "\n  query Clients {\n    clients {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n": typeof types.ClientsDocument,
    "\n  query Client($id: ID!) {\n    client(id: $id) {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n": typeof types.ClientDocument,
    "\n  mutation CreateClient($input: CreateClientInput!) {\n    createClient(input: $input) {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n": typeof types.CreateClientDocument,
    "\n  mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {\n    updateClient(id: $id, input: $input) {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n": typeof types.UpdateClientDocument,
    "\n  mutation DeleteClient($id: ID!) {\n    deleteClient(id: $id)\n  }\n": typeof types.DeleteClientDocument,
    "\n  query Cases {\n    cases {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": typeof types.CasesDocument,
    "\n  query Case($id: ID!) {\n    case(id: $id) {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": typeof types.CaseDocument,
    "\n  mutation CreateCase($input: CreateCaseInput!) {\n    createCase(input: $input) {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": typeof types.CreateCaseDocument,
    "\n  mutation UpdateCase($id: ID!, $input: UpdateCaseInput!) {\n    updateCase(id: $id, input: $input) {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": typeof types.UpdateCaseDocument,
    "\n  mutation DeleteCase($id: ID!) {\n    deleteCase(id: $id)\n  }\n": typeof types.DeleteCaseDocument,
    "\n  query Tasks {\n    tasks {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n": typeof types.TasksDocument,
    "\n  query Task($id: ID!) {\n    task(id: $id) {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n": typeof types.TaskDocument,
    "\n  mutation CreateTask($input: CreateTaskInput!) {\n    createTask(input: $input) {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n": typeof types.CreateTaskDocument,
    "\n  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {\n    updateTask(id: $id, input: $input) {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n": typeof types.UpdateTaskDocument,
    "\n  mutation DeleteTask($id: ID!) {\n    deleteTask(id: $id)\n  }\n": typeof types.DeleteTaskDocument,
    "\n  query Documents {\n    documents {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n": typeof types.DocumentsDocument,
    "\n  query Document($id: ID!) {\n    document(id: $id) {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n": typeof types.DocumentDocument,
    "\n  mutation CreateDocument($input: CreateDocumentInput!) {\n    createDocument(input: $input) {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n": typeof types.CreateDocumentDocument,
    "\n  mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {\n    updateDocument(id: $id, input: $input) {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n": typeof types.UpdateDocumentDocument,
    "\n  mutation DeleteDocument($id: ID!) {\n    deleteDocument(id: $id)\n  }\n": typeof types.DeleteDocumentDocument,
    "\n  query Invoices {\n    invoices {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": typeof types.InvoicesDocument,
    "\n  query Invoice($id: ID!) {\n    invoice(id: $id) {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": typeof types.InvoiceDocument,
    "\n  mutation CreateInvoice($input: CreateInvoiceInput!) {\n    createInvoice(input: $input) {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": typeof types.CreateInvoiceDocument,
    "\n  mutation UpdateInvoice($id: ID!, $input: UpdateInvoiceInput!) {\n    updateInvoice(id: $id, input: $input) {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": typeof types.UpdateInvoiceDocument,
    "\n  mutation DeleteInvoice($id: ID!) {\n    deleteInvoice(id: $id)\n  }\n": typeof types.DeleteInvoiceDocument,
    "\n  query DashboardStats {\n    dashboardStats {\n      total_clients\n      active_cases\n      pending_tasks\n      total_invoices_due\n      upcoming_dates {\n        id\n        title\n        court\n        next_court_date\n        client_name\n      }\n      recent_activity {\n        type\n        title\n        created_at\n      }\n    }\n  }\n": typeof types.DashboardStatsDocument,
    "\n  query LibraryItems($category: String) {\n    libraryItems(category: $category) {\n      id\n      user_id\n      category\n      title\n      author\n      description\n      tags\n      file_url\n      file_name\n      file_type\n      file_size\n      thumbnail_url\n      is_favorite\n      created_at\n      updated_at\n    }\n  }\n": typeof types.LibraryItemsDocument,
    "\n  query LibraryDownloadUrl($id: ID!) {\n    libraryDownloadUrl(id: $id) {\n      url\n    }\n  }\n": typeof types.LibraryDownloadUrlDocument,
    "\n  mutation CreateLibraryItem($input: CreateLibraryItemInput!) {\n    createLibraryItem(input: $input) {\n      id\n      user_id\n      category\n      title\n      author\n      description\n      tags\n      file_url\n      file_name\n      file_type\n      file_size\n      thumbnail_url\n      is_favorite\n      created_at\n      updated_at\n    }\n  }\n": typeof types.CreateLibraryItemDocument,
    "\n  mutation UpdateLibraryItem($id: ID!, $input: UpdateLibraryItemInput!) {\n    updateLibraryItem(id: $id, input: $input) {\n      id\n      user_id\n      category\n      title\n      author\n      description\n      tags\n      file_url\n      file_name\n      file_type\n      file_size\n      thumbnail_url\n      is_favorite\n      created_at\n      updated_at\n    }\n  }\n": typeof types.UpdateLibraryItemDocument,
    "\n  mutation ToggleLibraryItemFavorite($id: ID!) {\n    toggleLibraryItemFavorite(id: $id) {\n      id\n      is_favorite\n    }\n  }\n": typeof types.ToggleLibraryItemFavoriteDocument,
    "\n  mutation DeleteLibraryItem($id: ID!) {\n    deleteLibraryItem(id: $id)\n  }\n": typeof types.DeleteLibraryItemDocument,
    "\n  query Deadlines($status: String, $upcoming: Boolean) {\n    deadlines(status: $status, upcoming: $upcoming) {\n      id\n      user_id\n      case_id\n      title\n      description\n      due_date\n      priority\n      status\n      reminder_days\n      case_title\n      created_at\n      updated_at\n    }\n  }\n": typeof types.DeadlinesDocument,
    "\n  query DeadlineStats {\n    deadlineStats {\n      overdue_count\n      upcoming_this_week {\n        id\n        user_id\n        case_id\n        title\n        description\n        due_date\n        priority\n        status\n        reminder_days\n        case_title\n        created_at\n        updated_at\n      }\n    }\n  }\n": typeof types.DeadlineStatsDocument,
    "\n  mutation CreateDeadline($input: CreateDeadlineInput!) {\n    createDeadline(input: $input) {\n      id\n      user_id\n      case_id\n      title\n      description\n      due_date\n      priority\n      status\n      reminder_days\n      case_title\n      created_at\n      updated_at\n    }\n  }\n": typeof types.CreateDeadlineDocument,
    "\n  mutation UpdateDeadline($id: ID!, $input: UpdateDeadlineInput!) {\n    updateDeadline(id: $id, input: $input) {\n      id\n      user_id\n      case_id\n      title\n      description\n      due_date\n      priority\n      status\n      reminder_days\n      case_title\n      created_at\n      updated_at\n    }\n  }\n": typeof types.UpdateDeadlineDocument,
    "\n  mutation DeleteDeadline($id: ID!) {\n    deleteDeadline(id: $id)\n  }\n": typeof types.DeleteDeadlineDocument,
    "\n  query Messages($clientId: ID, $channel: String) {\n    messages(clientId: $clientId, channel: $channel) {\n      id\n      user_id\n      client_id\n      subject\n      body\n      channel\n      direction\n      status\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": typeof types.MessagesDocument,
    "\n  mutation CreateMessage($input: CreateMessageInput!) {\n    createMessage(input: $input) {\n      id\n      user_id\n      client_id\n      subject\n      body\n      channel\n      direction\n      status\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": typeof types.CreateMessageDocument,
    "\n  mutation DeleteMessage($id: ID!) {\n    deleteMessage(id: $id)\n  }\n": typeof types.DeleteMessageDocument,
    "\n  query Profile {\n    profile {\n      id\n      email\n      name\n      role\n      firm\n      gba_number\n      phone\n      avatar_url\n      created_at\n      updated_at\n    }\n  }\n": typeof types.ProfileDocument,
    "\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      id\n      email\n      name\n      role\n      firm\n      gba_number\n      phone\n      avatar_url\n      created_at\n      updated_at\n    }\n  }\n": typeof types.UpdateProfileDocument,
    "\n  mutation ChangePassword($input: ChangePasswordInput!) {\n    changePassword(input: $input)\n  }\n": typeof types.ChangePasswordDocument,
    "\n  query AiConversations {\n    aiConversations {\n      id\n      title\n      created_at\n      updated_at\n    }\n  }\n": typeof types.AiConversationsDocument,
    "\n  query AiConversation($id: ID!) {\n    aiConversation(id: $id) {\n      id\n      title\n      created_at\n      updated_at\n      messages {\n        id\n        role\n        content\n        sources\n        created_at\n      }\n    }\n  }\n": typeof types.AiConversationDocument,
    "\n  mutation AiChat($input: AiChatInput!) {\n    aiChat(input: $input) {\n      response\n      conversation_id\n      sources {\n        id\n        title\n        content\n        similarity\n      }\n    }\n  }\n": typeof types.AiChatDocument,
    "\n  mutation DeleteAiConversation($id: ID!) {\n    deleteAiConversation(id: $id)\n  }\n": typeof types.DeleteAiConversationDocument,
};
const documents: Documents = {
    "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        id\n        email\n        name\n        role\n        firm\n        created_at\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation Register($input: RegisterInput!) {\n    register(input: $input) {\n      token\n      user {\n        id\n        email\n        name\n        role\n        firm\n        created_at\n      }\n    }\n  }\n": types.RegisterDocument,
    "\n  mutation GoogleAuth($input: GoogleAuthInput!) {\n    googleAuth(input: $input) {\n      token\n      user {\n        id\n        email\n        name\n        role\n        firm\n        created_at\n      }\n    }\n  }\n": types.GoogleAuthDocument,
    "\n  query Me {\n    me {\n      id\n      email\n      name\n      role\n      firm\n      created_at\n    }\n  }\n": types.MeDocument,
    "\n  query Clients {\n    clients {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n": types.ClientsDocument,
    "\n  query Client($id: ID!) {\n    client(id: $id) {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n": types.ClientDocument,
    "\n  mutation CreateClient($input: CreateClientInput!) {\n    createClient(input: $input) {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n": types.CreateClientDocument,
    "\n  mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {\n    updateClient(id: $id, input: $input) {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n": types.UpdateClientDocument,
    "\n  mutation DeleteClient($id: ID!) {\n    deleteClient(id: $id)\n  }\n": types.DeleteClientDocument,
    "\n  query Cases {\n    cases {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": types.CasesDocument,
    "\n  query Case($id: ID!) {\n    case(id: $id) {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": types.CaseDocument,
    "\n  mutation CreateCase($input: CreateCaseInput!) {\n    createCase(input: $input) {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": types.CreateCaseDocument,
    "\n  mutation UpdateCase($id: ID!, $input: UpdateCaseInput!) {\n    updateCase(id: $id, input: $input) {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": types.UpdateCaseDocument,
    "\n  mutation DeleteCase($id: ID!) {\n    deleteCase(id: $id)\n  }\n": types.DeleteCaseDocument,
    "\n  query Tasks {\n    tasks {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n": types.TasksDocument,
    "\n  query Task($id: ID!) {\n    task(id: $id) {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n": types.TaskDocument,
    "\n  mutation CreateTask($input: CreateTaskInput!) {\n    createTask(input: $input) {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n": types.CreateTaskDocument,
    "\n  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {\n    updateTask(id: $id, input: $input) {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n": types.UpdateTaskDocument,
    "\n  mutation DeleteTask($id: ID!) {\n    deleteTask(id: $id)\n  }\n": types.DeleteTaskDocument,
    "\n  query Documents {\n    documents {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n": types.DocumentsDocument,
    "\n  query Document($id: ID!) {\n    document(id: $id) {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n": types.DocumentDocument,
    "\n  mutation CreateDocument($input: CreateDocumentInput!) {\n    createDocument(input: $input) {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n": types.CreateDocumentDocument,
    "\n  mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {\n    updateDocument(id: $id, input: $input) {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n": types.UpdateDocumentDocument,
    "\n  mutation DeleteDocument($id: ID!) {\n    deleteDocument(id: $id)\n  }\n": types.DeleteDocumentDocument,
    "\n  query Invoices {\n    invoices {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": types.InvoicesDocument,
    "\n  query Invoice($id: ID!) {\n    invoice(id: $id) {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": types.InvoiceDocument,
    "\n  mutation CreateInvoice($input: CreateInvoiceInput!) {\n    createInvoice(input: $input) {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": types.CreateInvoiceDocument,
    "\n  mutation UpdateInvoice($id: ID!, $input: UpdateInvoiceInput!) {\n    updateInvoice(id: $id, input: $input) {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": types.UpdateInvoiceDocument,
    "\n  mutation DeleteInvoice($id: ID!) {\n    deleteInvoice(id: $id)\n  }\n": types.DeleteInvoiceDocument,
    "\n  query DashboardStats {\n    dashboardStats {\n      total_clients\n      active_cases\n      pending_tasks\n      total_invoices_due\n      upcoming_dates {\n        id\n        title\n        court\n        next_court_date\n        client_name\n      }\n      recent_activity {\n        type\n        title\n        created_at\n      }\n    }\n  }\n": types.DashboardStatsDocument,
    "\n  query LibraryItems($category: String) {\n    libraryItems(category: $category) {\n      id\n      user_id\n      category\n      title\n      author\n      description\n      tags\n      file_url\n      file_name\n      file_type\n      file_size\n      thumbnail_url\n      is_favorite\n      created_at\n      updated_at\n    }\n  }\n": types.LibraryItemsDocument,
    "\n  query LibraryDownloadUrl($id: ID!) {\n    libraryDownloadUrl(id: $id) {\n      url\n    }\n  }\n": types.LibraryDownloadUrlDocument,
    "\n  mutation CreateLibraryItem($input: CreateLibraryItemInput!) {\n    createLibraryItem(input: $input) {\n      id\n      user_id\n      category\n      title\n      author\n      description\n      tags\n      file_url\n      file_name\n      file_type\n      file_size\n      thumbnail_url\n      is_favorite\n      created_at\n      updated_at\n    }\n  }\n": types.CreateLibraryItemDocument,
    "\n  mutation UpdateLibraryItem($id: ID!, $input: UpdateLibraryItemInput!) {\n    updateLibraryItem(id: $id, input: $input) {\n      id\n      user_id\n      category\n      title\n      author\n      description\n      tags\n      file_url\n      file_name\n      file_type\n      file_size\n      thumbnail_url\n      is_favorite\n      created_at\n      updated_at\n    }\n  }\n": types.UpdateLibraryItemDocument,
    "\n  mutation ToggleLibraryItemFavorite($id: ID!) {\n    toggleLibraryItemFavorite(id: $id) {\n      id\n      is_favorite\n    }\n  }\n": types.ToggleLibraryItemFavoriteDocument,
    "\n  mutation DeleteLibraryItem($id: ID!) {\n    deleteLibraryItem(id: $id)\n  }\n": types.DeleteLibraryItemDocument,
    "\n  query Deadlines($status: String, $upcoming: Boolean) {\n    deadlines(status: $status, upcoming: $upcoming) {\n      id\n      user_id\n      case_id\n      title\n      description\n      due_date\n      priority\n      status\n      reminder_days\n      case_title\n      created_at\n      updated_at\n    }\n  }\n": types.DeadlinesDocument,
    "\n  query DeadlineStats {\n    deadlineStats {\n      overdue_count\n      upcoming_this_week {\n        id\n        user_id\n        case_id\n        title\n        description\n        due_date\n        priority\n        status\n        reminder_days\n        case_title\n        created_at\n        updated_at\n      }\n    }\n  }\n": types.DeadlineStatsDocument,
    "\n  mutation CreateDeadline($input: CreateDeadlineInput!) {\n    createDeadline(input: $input) {\n      id\n      user_id\n      case_id\n      title\n      description\n      due_date\n      priority\n      status\n      reminder_days\n      case_title\n      created_at\n      updated_at\n    }\n  }\n": types.CreateDeadlineDocument,
    "\n  mutation UpdateDeadline($id: ID!, $input: UpdateDeadlineInput!) {\n    updateDeadline(id: $id, input: $input) {\n      id\n      user_id\n      case_id\n      title\n      description\n      due_date\n      priority\n      status\n      reminder_days\n      case_title\n      created_at\n      updated_at\n    }\n  }\n": types.UpdateDeadlineDocument,
    "\n  mutation DeleteDeadline($id: ID!) {\n    deleteDeadline(id: $id)\n  }\n": types.DeleteDeadlineDocument,
    "\n  query Messages($clientId: ID, $channel: String) {\n    messages(clientId: $clientId, channel: $channel) {\n      id\n      user_id\n      client_id\n      subject\n      body\n      channel\n      direction\n      status\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": types.MessagesDocument,
    "\n  mutation CreateMessage($input: CreateMessageInput!) {\n    createMessage(input: $input) {\n      id\n      user_id\n      client_id\n      subject\n      body\n      channel\n      direction\n      status\n      client_name\n      created_at\n      updated_at\n    }\n  }\n": types.CreateMessageDocument,
    "\n  mutation DeleteMessage($id: ID!) {\n    deleteMessage(id: $id)\n  }\n": types.DeleteMessageDocument,
    "\n  query Profile {\n    profile {\n      id\n      email\n      name\n      role\n      firm\n      gba_number\n      phone\n      avatar_url\n      created_at\n      updated_at\n    }\n  }\n": types.ProfileDocument,
    "\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      id\n      email\n      name\n      role\n      firm\n      gba_number\n      phone\n      avatar_url\n      created_at\n      updated_at\n    }\n  }\n": types.UpdateProfileDocument,
    "\n  mutation ChangePassword($input: ChangePasswordInput!) {\n    changePassword(input: $input)\n  }\n": types.ChangePasswordDocument,
    "\n  query AiConversations {\n    aiConversations {\n      id\n      title\n      created_at\n      updated_at\n    }\n  }\n": types.AiConversationsDocument,
    "\n  query AiConversation($id: ID!) {\n    aiConversation(id: $id) {\n      id\n      title\n      created_at\n      updated_at\n      messages {\n        id\n        role\n        content\n        sources\n        created_at\n      }\n    }\n  }\n": types.AiConversationDocument,
    "\n  mutation AiChat($input: AiChatInput!) {\n    aiChat(input: $input) {\n      response\n      conversation_id\n      sources {\n        id\n        title\n        content\n        similarity\n      }\n    }\n  }\n": types.AiChatDocument,
    "\n  mutation DeleteAiConversation($id: ID!) {\n    deleteAiConversation(id: $id)\n  }\n": types.DeleteAiConversationDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        id\n        email\n        name\n        role\n        firm\n        created_at\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        id\n        email\n        name\n        role\n        firm\n        created_at\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Register($input: RegisterInput!) {\n    register(input: $input) {\n      token\n      user {\n        id\n        email\n        name\n        role\n        firm\n        created_at\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Register($input: RegisterInput!) {\n    register(input: $input) {\n      token\n      user {\n        id\n        email\n        name\n        role\n        firm\n        created_at\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GoogleAuth($input: GoogleAuthInput!) {\n    googleAuth(input: $input) {\n      token\n      user {\n        id\n        email\n        name\n        role\n        firm\n        created_at\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation GoogleAuth($input: GoogleAuthInput!) {\n    googleAuth(input: $input) {\n      token\n      user {\n        id\n        email\n        name\n        role\n        firm\n        created_at\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      id\n      email\n      name\n      role\n      firm\n      created_at\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      id\n      email\n      name\n      role\n      firm\n      created_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Clients {\n    clients {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query Clients {\n    clients {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Client($id: ID!) {\n    client(id: $id) {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query Client($id: ID!) {\n    client(id: $id) {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateClient($input: CreateClientInput!) {\n    createClient(input: $input) {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation CreateClient($input: CreateClientInput!) {\n    createClient(input: $input) {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {\n    updateClient(id: $id, input: $input) {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {\n    updateClient(id: $id, input: $input) {\n      id\n      user_id\n      full_name\n      email\n      phone\n      ghana_card\n      address\n      status\n      notes\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteClient($id: ID!) {\n    deleteClient(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteClient($id: ID!) {\n    deleteClient(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Cases {\n    cases {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query Cases {\n    cases {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Case($id: ID!) {\n    case(id: $id) {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query Case($id: ID!) {\n    case(id: $id) {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateCase($input: CreateCaseInput!) {\n    createCase(input: $input) {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation CreateCase($input: CreateCaseInput!) {\n    createCase(input: $input) {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateCase($id: ID!, $input: UpdateCaseInput!) {\n    updateCase(id: $id, input: $input) {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateCase($id: ID!, $input: UpdateCaseInput!) {\n    updateCase(id: $id, input: $input) {\n      id\n      user_id\n      client_id\n      title\n      court\n      suit_number\n      opposing_party\n      matter_type\n      assigned_lawyer\n      status\n      next_court_date\n      notes\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteCase($id: ID!) {\n    deleteCase(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteCase($id: ID!) {\n    deleteCase(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Tasks {\n    tasks {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query Tasks {\n    tasks {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Task($id: ID!) {\n    task(id: $id) {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query Task($id: ID!) {\n    task(id: $id) {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTask($input: CreateTaskInput!) {\n    createTask(input: $input) {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTask($input: CreateTaskInput!) {\n    createTask(input: $input) {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {\n    updateTask(id: $id, input: $input) {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {\n    updateTask(id: $id, input: $input) {\n      id\n      user_id\n      client_id\n      case_id\n      title\n      priority\n      status\n      due_date\n      assigned_to\n      notes\n      client_name\n      case_title\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTask($id: ID!) {\n    deleteTask(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteTask($id: ID!) {\n    deleteTask(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Documents {\n    documents {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query Documents {\n    documents {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Document($id: ID!) {\n    document(id: $id) {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query Document($id: ID!) {\n    document(id: $id) {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateDocument($input: CreateDocumentInput!) {\n    createDocument(input: $input) {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation CreateDocument($input: CreateDocumentInput!) {\n    createDocument(input: $input) {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {\n    updateDocument(id: $id, input: $input) {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {\n    updateDocument(id: $id, input: $input) {\n      id\n      user_id\n      case_id\n      client_id\n      title\n      template_type\n      court\n      suit_number\n      parties\n      judge\n      content\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteDocument($id: ID!) {\n    deleteDocument(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteDocument($id: ID!) {\n    deleteDocument(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Invoices {\n    invoices {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query Invoices {\n    invoices {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Invoice($id: ID!) {\n    invoice(id: $id) {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query Invoice($id: ID!) {\n    invoice(id: $id) {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateInvoice($input: CreateInvoiceInput!) {\n    createInvoice(input: $input) {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation CreateInvoice($input: CreateInvoiceInput!) {\n    createInvoice(input: $input) {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateInvoice($id: ID!, $input: UpdateInvoiceInput!) {\n    updateInvoice(id: $id, input: $input) {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateInvoice($id: ID!, $input: UpdateInvoiceInput!) {\n    updateInvoice(id: $id, input: $input) {\n      id\n      user_id\n      client_id\n      amount_ghs\n      status\n      due_date\n      description\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteInvoice($id: ID!) {\n    deleteInvoice(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteInvoice($id: ID!) {\n    deleteInvoice(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DashboardStats {\n    dashboardStats {\n      total_clients\n      active_cases\n      pending_tasks\n      total_invoices_due\n      upcoming_dates {\n        id\n        title\n        court\n        next_court_date\n        client_name\n      }\n      recent_activity {\n        type\n        title\n        created_at\n      }\n    }\n  }\n"): (typeof documents)["\n  query DashboardStats {\n    dashboardStats {\n      total_clients\n      active_cases\n      pending_tasks\n      total_invoices_due\n      upcoming_dates {\n        id\n        title\n        court\n        next_court_date\n        client_name\n      }\n      recent_activity {\n        type\n        title\n        created_at\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LibraryItems($category: String) {\n    libraryItems(category: $category) {\n      id\n      user_id\n      category\n      title\n      author\n      description\n      tags\n      file_url\n      file_name\n      file_type\n      file_size\n      thumbnail_url\n      is_favorite\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query LibraryItems($category: String) {\n    libraryItems(category: $category) {\n      id\n      user_id\n      category\n      title\n      author\n      description\n      tags\n      file_url\n      file_name\n      file_type\n      file_size\n      thumbnail_url\n      is_favorite\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LibraryDownloadUrl($id: ID!) {\n    libraryDownloadUrl(id: $id) {\n      url\n    }\n  }\n"): (typeof documents)["\n  query LibraryDownloadUrl($id: ID!) {\n    libraryDownloadUrl(id: $id) {\n      url\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateLibraryItem($input: CreateLibraryItemInput!) {\n    createLibraryItem(input: $input) {\n      id\n      user_id\n      category\n      title\n      author\n      description\n      tags\n      file_url\n      file_name\n      file_type\n      file_size\n      thumbnail_url\n      is_favorite\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation CreateLibraryItem($input: CreateLibraryItemInput!) {\n    createLibraryItem(input: $input) {\n      id\n      user_id\n      category\n      title\n      author\n      description\n      tags\n      file_url\n      file_name\n      file_type\n      file_size\n      thumbnail_url\n      is_favorite\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateLibraryItem($id: ID!, $input: UpdateLibraryItemInput!) {\n    updateLibraryItem(id: $id, input: $input) {\n      id\n      user_id\n      category\n      title\n      author\n      description\n      tags\n      file_url\n      file_name\n      file_type\n      file_size\n      thumbnail_url\n      is_favorite\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateLibraryItem($id: ID!, $input: UpdateLibraryItemInput!) {\n    updateLibraryItem(id: $id, input: $input) {\n      id\n      user_id\n      category\n      title\n      author\n      description\n      tags\n      file_url\n      file_name\n      file_type\n      file_size\n      thumbnail_url\n      is_favorite\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ToggleLibraryItemFavorite($id: ID!) {\n    toggleLibraryItemFavorite(id: $id) {\n      id\n      is_favorite\n    }\n  }\n"): (typeof documents)["\n  mutation ToggleLibraryItemFavorite($id: ID!) {\n    toggleLibraryItemFavorite(id: $id) {\n      id\n      is_favorite\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteLibraryItem($id: ID!) {\n    deleteLibraryItem(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteLibraryItem($id: ID!) {\n    deleteLibraryItem(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Deadlines($status: String, $upcoming: Boolean) {\n    deadlines(status: $status, upcoming: $upcoming) {\n      id\n      user_id\n      case_id\n      title\n      description\n      due_date\n      priority\n      status\n      reminder_days\n      case_title\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query Deadlines($status: String, $upcoming: Boolean) {\n    deadlines(status: $status, upcoming: $upcoming) {\n      id\n      user_id\n      case_id\n      title\n      description\n      due_date\n      priority\n      status\n      reminder_days\n      case_title\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DeadlineStats {\n    deadlineStats {\n      overdue_count\n      upcoming_this_week {\n        id\n        user_id\n        case_id\n        title\n        description\n        due_date\n        priority\n        status\n        reminder_days\n        case_title\n        created_at\n        updated_at\n      }\n    }\n  }\n"): (typeof documents)["\n  query DeadlineStats {\n    deadlineStats {\n      overdue_count\n      upcoming_this_week {\n        id\n        user_id\n        case_id\n        title\n        description\n        due_date\n        priority\n        status\n        reminder_days\n        case_title\n        created_at\n        updated_at\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateDeadline($input: CreateDeadlineInput!) {\n    createDeadline(input: $input) {\n      id\n      user_id\n      case_id\n      title\n      description\n      due_date\n      priority\n      status\n      reminder_days\n      case_title\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation CreateDeadline($input: CreateDeadlineInput!) {\n    createDeadline(input: $input) {\n      id\n      user_id\n      case_id\n      title\n      description\n      due_date\n      priority\n      status\n      reminder_days\n      case_title\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateDeadline($id: ID!, $input: UpdateDeadlineInput!) {\n    updateDeadline(id: $id, input: $input) {\n      id\n      user_id\n      case_id\n      title\n      description\n      due_date\n      priority\n      status\n      reminder_days\n      case_title\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateDeadline($id: ID!, $input: UpdateDeadlineInput!) {\n    updateDeadline(id: $id, input: $input) {\n      id\n      user_id\n      case_id\n      title\n      description\n      due_date\n      priority\n      status\n      reminder_days\n      case_title\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteDeadline($id: ID!) {\n    deleteDeadline(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteDeadline($id: ID!) {\n    deleteDeadline(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Messages($clientId: ID, $channel: String) {\n    messages(clientId: $clientId, channel: $channel) {\n      id\n      user_id\n      client_id\n      subject\n      body\n      channel\n      direction\n      status\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query Messages($clientId: ID, $channel: String) {\n    messages(clientId: $clientId, channel: $channel) {\n      id\n      user_id\n      client_id\n      subject\n      body\n      channel\n      direction\n      status\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateMessage($input: CreateMessageInput!) {\n    createMessage(input: $input) {\n      id\n      user_id\n      client_id\n      subject\n      body\n      channel\n      direction\n      status\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation CreateMessage($input: CreateMessageInput!) {\n    createMessage(input: $input) {\n      id\n      user_id\n      client_id\n      subject\n      body\n      channel\n      direction\n      status\n      client_name\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteMessage($id: ID!) {\n    deleteMessage(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteMessage($id: ID!) {\n    deleteMessage(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Profile {\n    profile {\n      id\n      email\n      name\n      role\n      firm\n      gba_number\n      phone\n      avatar_url\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query Profile {\n    profile {\n      id\n      email\n      name\n      role\n      firm\n      gba_number\n      phone\n      avatar_url\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      id\n      email\n      name\n      role\n      firm\n      gba_number\n      phone\n      avatar_url\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      id\n      email\n      name\n      role\n      firm\n      gba_number\n      phone\n      avatar_url\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ChangePassword($input: ChangePasswordInput!) {\n    changePassword(input: $input)\n  }\n"): (typeof documents)["\n  mutation ChangePassword($input: ChangePasswordInput!) {\n    changePassword(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AiConversations {\n    aiConversations {\n      id\n      title\n      created_at\n      updated_at\n    }\n  }\n"): (typeof documents)["\n  query AiConversations {\n    aiConversations {\n      id\n      title\n      created_at\n      updated_at\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AiConversation($id: ID!) {\n    aiConversation(id: $id) {\n      id\n      title\n      created_at\n      updated_at\n      messages {\n        id\n        role\n        content\n        sources\n        created_at\n      }\n    }\n  }\n"): (typeof documents)["\n  query AiConversation($id: ID!) {\n    aiConversation(id: $id) {\n      id\n      title\n      created_at\n      updated_at\n      messages {\n        id\n        role\n        content\n        sources\n        created_at\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AiChat($input: AiChatInput!) {\n    aiChat(input: $input) {\n      response\n      conversation_id\n      sources {\n        id\n        title\n        content\n        similarity\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AiChat($input: AiChatInput!) {\n    aiChat(input: $input) {\n      response\n      conversation_id\n      sources {\n        id\n        title\n        content\n        similarity\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAiConversation($id: ID!) {\n    deleteAiConversation(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteAiConversation($id: ID!) {\n    deleteAiConversation(id: $id)\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;