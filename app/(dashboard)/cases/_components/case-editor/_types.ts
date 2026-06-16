/**
 * Case-editor shape types.
 *
 * `NewCaseForm` is the rich form draft both `/cases/new` (create) and
 * `/cases/[id]/edit` (edit) collect. Only some keys round-trip to
 * first-class case columns today (see `CORE_KEYS` in `_constants.ts`);
 * the rest serialize through the case `details` JSON blob.
 */

import type { ComponentType } from 'react'

// ── Section registry ───────────────────────────────────────────────────────

export interface SectionDef {
  id: string
  label: string
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>
}

// ── Form sub-shapes ────────────────────────────────────────────────────────

export interface RelatedContactDraft {
  /** local id for list management; not persisted */
  id: string
  contact_id: string
  relationship: string
  bill_recipient: boolean
}

export type ReminderUnit = 'Days' | 'Weeks' | 'Months'

/**
 * Statute-of-limitations reminder. Multiple per case allowed (one to
 * "Me via email" 14 days out, another to a partner 7 days out, etc.).
 */
export interface ReminderDraft {
  id: string
  recipient: string
  /** string so the input can be cleared without coercion */
  amount: string
  unit: ReminderUnit
}

/**
 * One row of the custom-billing-rates table. `amount` stays a string so
 * the input doesn't fight `parseFloat('') === NaN` edge cases.
 */
export interface BillingRateDraft {
  id: string
  user_or_group: string
  amount: string
}

/**
 * Document folder pre-created when the case opens (folder name + the
 * firm-defined category it belongs to).
 */
export interface DocFolderDraft {
  id: string
  name: string
  category: string
}

// ── Picker option shapes ───────────────────────────────────────────────────

export interface ContactOption {
  id: string
  label: string
  email?: string
}

export interface SelectOptionGroup {
  label: string
  options: Array<{ value: string; label: string }> | readonly string[]
}

// ── Top-level form shape ───────────────────────────────────────────────────

export interface NewCaseForm {
  // Clients
  client_ids: string[]
  // Case details
  description: string
  /**
   * Firm members assigned to the case (real member ids). Notified by
   * email when the case is created. Distinct from the free-text lawyer
   * names below.
   */
  assigned_member_ids: string[]
  responsible_lawyer: string
  originating_lawyer: string
  responsible_staff: string
  client_reference: string
  location: string
  court: string
  suit_number: string
  opposing_party: string
  next_court_date: string
  practice_area: string
  case_stage: string
  status: 'Open' | 'Pending' | 'Closed'
  open_date: string
  closed_date: string
  pending_date: string
  statute_of_limitations_date: string
  statute_of_limitations_satisfied: boolean
  /** Reminders that fire ahead of the statute-of-limitations date. */
  statute_reminders: ReminderDraft[]
  tags: string[]
  // Permissions
  permissions_mode: 'everyone' | 'specific'
  permitted_users: string[]
  // Notifications
  notification_subscribers: string[]
  // Block users
  blocked_users: string[]
  // Related contacts
  related_contacts: RelatedContactDraft[]
  // Billing
  is_billable: boolean
  billing_method: 'hourly' | 'flat_fee' | 'contingency' | 'pro_bono'
  currency: string
  custom_billing_rates: BillingRateDraft[]
  budget_enabled: boolean
  budget_amount: string
  split_invoice: boolean
  notify_low_client_funds: boolean
  /** Task lists pre-attached to the case (e.g. "Intake", "Pre-trial"). */
  task_lists_notify_assignees: boolean
  task_lists: string[]
  /** Folder structure that gets auto-created on case open. */
  document_folders: DocFolderDraft[]
  // Reports / allocation percentages.
  originating_allocation: string
  use_firm_settings_originating: boolean
  responsible_allocation: string
  use_firm_settings_responsible: boolean
  // Conflict checks linked to the case.
  conflict_checks: string[]
}

/**
 * Generic setter — every section receives this so it can update one key
 * at a time without re-deriving the whole form shape.
 */
export type SetField = <K extends keyof NewCaseForm>(
  key: K,
  val: NewCaseForm[K],
) => void
