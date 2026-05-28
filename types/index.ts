// ── Core domain types matching the ACTUAL DB schema (snake_case) ─────────

export interface User {
  id: string
  email: string
  name: string
  firm?: string | null
  role: 'lawyer' | 'senior_partner' | 'associate' | 'paralegal' | 'admin'
  gba_number?: string | null
  avatar_url?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  client_code?: string | null
  full_name: string
  email?: string | null
  phone?: string | null
  ghana_card?: string | null
  address?: string | null
  // ISO yyyy-mm-dd. Optional today — backend column lands with the
  // contact-detail screen migration. Surfaced in the contacts list
  // Date of Birth column.
  date_of_birth?: string | null
  status: 'Active' | 'Inactive'
  notes?: string | null
  created_at: string
  updated_at: string
}

// Case status mirrors Clio's terminology: a case is Open until it pauses
// (Pending) or wraps up (Closed). Renamed from 'Active' on 2026-05-23 — see
// migration 0003_case_clio_fields.sql.
export type CaseStatus = 'Open' | 'Pending' | 'Closed'

export interface Case {
  id: string
  user_id: string
  client_id: string
  case_code?: string | null
  title: string
  court?: string | null
  suit_number?: string | null
  opposing_party?: string | null
  next_court_date?: string | null
  status: CaseStatus
  // Renamed from matter_type on 2026-05-23. The DB column is also case_type
  // — see migration 0003. "Practice area" in the UI.
  case_type?: string | null
  // Workflow stage within the case lifecycle (e.g. "Discovery", "Trial prep").
  // Separate from `status`: a case can be Open + in "Trial prep" stage.
  case_stage?: string | null
  assigned_lawyer?: string | null
  // Lawyer who brought the case in. Used for origination credit / reporting.
  originating_lawyer?: string | null
  date_opened?: string | null
  // Timestamp when status transitioned to Closed / Pending. Null while Open.
  closed_at?: string | null
  pending_at?: string | null
  // Count of unread notifications/updates on the case. Driven by triggers
  // on related tables (deadlines, tasks, messages) — surfaced as a bell
  // count in the cases list.
  notification_count?: number
  notes?: string | null
  description?: string | null
  created_at: string
  updated_at: string
  // Joined fields (optional, from queries with joins)
  client_name?: string
}

export interface Task {
  id: string
  user_id: string
  client_id?: string | null
  case_id?: string | null
  title: string
  notes?: string | null
  status: 'Pending' | 'In Progress' | 'Done'
  priority: 'High' | 'Medium' | 'Low'
  due_date?: string | null
  assigned_to?: string | null
  created_at: string
  updated_at: string
  // Joined fields
  client_name?: string
  case_title?: string
}

export interface Document {
  id: string
  user_id: string
  case_id?: string | null
  client_id?: string | null
  title: string
  template_type?: string | null
  court?: string | null
  suit_number?: string | null
  parties?: string | null
  judge?: string | null
  content?: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  user_id: string
  client_id: string
  amount_ghs: number
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue'
  due_date?: string | null
  description?: string | null
  created_at: string
  updated_at: string
  // Joined fields
  client_name?: string
}

export interface Message {
  id: string
  user_id: string
  client_id?: string | null
  from_role: 'lawyer' | 'client' | 'system'
  content: string
  sent_at: string
}

export interface Deadline {
  id: string
  user_id: string
  case_id?: string | null
  label: string
  start_date: string
  deadline_date: string
  days_count?: number | null
  rule_used?: string | null
  created_at: string
}

// ── Dashboard stats ──────────────────────────────────────────────────────

export interface DashboardStats {
  // Firm-wide totals (everything the firm owns).
  total_clients: number
  active_cases: number
  pending_tasks: number
  total_invoices_due: number

  // The logged-in user's slice of those totals.
  // INVARIANT: each personal_* field must be <= the corresponding firm field.
  // Enforced server-side at the query layer; mirrored in mock data here.
  personal_total_clients: number
  personal_active_cases: number
  personal_pending_tasks: number
  personal_invoices_due: number

  upcoming_dates: Array<{
    id: string
    title: string
    court: string | null
    next_court_date: string
    client_name: string
  }>
  recent_activity: Array<{
    type: 'client' | 'case' | 'task' | 'invoice' | 'document'
    title: string
    created_at: string
  }>
}

// ── API response envelope ───────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    total: number
    page: number
    limit: number
  }
}

export interface AuthResponse {
  user: User
  token: string
}
