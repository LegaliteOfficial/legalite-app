/**
 * Static configuration the case editor reads off but never mutates.
 * Co-located with the editor since none of these are reused elsewhere
 * in the app today — graduate them to a shared module once a second
 * caller appears.
 */

import {
  Bell,
  Briefcase,
  Buildings,
  ClipboardText,
  Coin,
  FileText,
  GearSix,
  GitFork,
  ListChecks,
  ShieldCheck,
  ShieldSlash,
  TreeStructure,
  Users,
} from '@phosphor-icons/react'
import type { NewCaseForm, ReminderUnit, SectionDef } from './_types'

// ── Left-nav / anchor registry ─────────────────────────────────────────────
// Single source of truth for the left-nav and the in-page anchors. Adding
// a new section is a one-line change here plus a matching <Section>
// component in `EditorShell.tsx`.

export const SECTIONS: SectionDef[] = [
  { id: 'template', label: 'Template information', Icon: ClipboardText },
  { id: 'clients', label: 'Clients', Icon: Users },
  { id: 'case-details', label: 'Case details', Icon: Briefcase },
  { id: 'permissions', label: 'Case permissions', Icon: ShieldCheck },
  { id: 'notifications', label: 'Case notifications', Icon: Bell },
  { id: 'block-users', label: 'Block users', Icon: ShieldSlash },
  { id: 'related-contacts', label: 'Related contacts', Icon: GitFork },
  { id: 'custom-fields', label: 'Custom fields', Icon: GearSix },
  { id: 'billing', label: 'Billing preference', Icon: Coin },
  { id: 'tasks', label: 'Task lists', Icon: ListChecks },
  { id: 'documents', label: 'Document folders', Icon: TreeStructure },
  { id: 'reports', label: 'Reports', Icon: FileText },
  { id: 'conflicts', label: 'Conflict checks', Icon: Buildings },
]

// ── Initial form ───────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)

export const INITIAL_FORM: NewCaseForm = {
  client_ids: [''],
  description: '',
  assigned_member_ids: [],
  responsible_lawyer: '',
  originating_lawyer: '',
  responsible_staff: '',
  client_reference: '',
  location: '',
  court: '',
  suit_number: '',
  opposing_party: '',
  next_court_date: '',
  practice_area: '',
  case_stage: '',
  status: 'Open',
  open_date: TODAY,
  closed_date: '',
  pending_date: '',
  statute_of_limitations_date: '',
  statute_of_limitations_satisfied: false,
  statute_reminders: [],
  tags: [],
  permissions_mode: 'everyone',
  permitted_users: [],
  notification_subscribers: [],
  blocked_users: [],
  related_contacts: [],
  is_billable: true,
  billing_method: 'hourly',
  currency: 'GHS',
  custom_billing_rates: [],
  budget_enabled: false,
  budget_amount: '',
  split_invoice: false,
  notify_low_client_funds: false,
  task_lists_notify_assignees: false,
  task_lists: [],
  document_folders: [],
  originating_allocation: '0',
  use_firm_settings_originating: true,
  responsible_allocation: '0',
  use_firm_settings_responsible: true,
  conflict_checks: [],
}

/**
 * Fields persisted as first-class case columns. Everything else in the
 * form is "extended" and round-trips through the `details` JSON blob so
 * the whole new-case form is captured, not just the core columns.
 */
export const CORE_KEYS: ReadonlySet<keyof NewCaseForm> = new Set([
  'client_ids',
  'description',
  'assigned_member_ids',
  'responsible_lawyer',
  'originating_lawyer',
  'court',
  'suit_number',
  'opposing_party',
  'next_court_date',
  'practice_area',
  'case_stage',
  'status',
  'open_date',
])

export const EXTENDED_KEYS = (
  Object.keys(INITIAL_FORM) as (keyof NewCaseForm)[]
).filter((k) => !CORE_KEYS.has(k))

// ── Section-specific lookups ───────────────────────────────────────────────

/**
 * Document folder categories — the reference defaults. Editable per firm
 * in settings later; hard-coded here until that admin screen ships.
 */
export const DOC_CATEGORIES = [
  'Agreements',
  'Answers',
  'Briefs',
  'Closings',
  'Communications',
  'Correspondence',
  'Discovery',
  'Drafts',
  'Exhibits',
  'Filings',
  'Forms',
  'Invoices',
  'Memos',
  'Motions',
  'Notes',
  'Pleadings',
  'Receipts',
  'Research',
  'Subpoenas',
] as const

export const REMINDER_UNITS: ReminderUnit[] = ['Days', 'Weeks', 'Months']

/**
 * Built-in reminder recipients. Real firm-user names are appended by
 * the picker via the `firmUserOptions` prop.
 */
export const REMINDER_BUILTIN_RECIPIENTS = [
  'Me (via email)',
  'Me (via popup)',
] as const

export const BILLING_METHODS: Array<{
  value: NewCaseForm['billing_method']
  label: string
}> = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'flat_fee', label: 'Flat fee' },
  { value: 'contingency', label: 'Contingency' },
  { value: 'pro_bono', label: 'Pro bono' },
]

/**
 * Reasonable currency starter set for Ghana-based firms — expandable
 * later when the currency admin screen ships.
 */
export const CURRENCIES = [
  { code: 'GHS', label: 'Ghanaian Cedi (GH₵)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'NGN', label: 'Nigerian Naira (₦)' },
]
