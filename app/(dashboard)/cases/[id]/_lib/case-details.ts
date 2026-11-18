/**
 * Read-side helpers for the case detail page.
 *
 * The case editor stores ~30 extended fields in the `details` JSON column
 * (see case-editor/_lib/serialize.ts). This parses them into one typed,
 * fully defaulted object so every panel can show every field, set or not,
 * instead of each panel guessing at shapes.
 */

export interface StatuteReminder { recipient?: string; amount?: string; unit?: string }
export interface RelatedContact { contact_id?: string; relationship?: string; bill_recipient?: boolean }
export interface BillingRate { user_or_group?: string; amount?: string }
export interface DocFolder { name?: string; category?: string }

export interface CaseDetails {
  responsible_staff: string
  client_reference: string
  location: string
  pending_date: string
  closed_date: string
  statute_of_limitations_date: string
  statute_of_limitations_satisfied: boolean
  statute_reminders: StatuteReminder[]
  tags: string[]
  permissions_mode: string
  permitted_users: string[]
  notification_subscribers: string[]
  blocked_users: string[]
  related_contacts: RelatedContact[]
  is_billable: boolean
  billing_method: string
  currency: string
  custom_billing_rates: BillingRate[]
  budget_enabled: boolean
  budget_amount: string
  split_invoice: boolean
  notify_low_client_funds: boolean
  task_lists: string[]
  task_lists_notify_assignees: boolean
  document_folders: DocFolder[]
  originating_allocation: string
  use_firm_settings_originating: boolean
  responsible_allocation: string
  use_firm_settings_responsible: boolean
  conflict_checks: string[]
}

export function parseDetailsObject(raw?: string | null): Record<string, unknown> {
  if (!raw) return {}
  try {
    const v = JSON.parse(raw)
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export function parseCaseDetails(raw?: string | null): CaseDetails {
  const d = parseDetailsObject(raw)
  const s = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : '')
  const flag = (k: string, dflt: boolean) => (typeof d[k] === 'boolean' ? (d[k] as boolean) : dflt)
  const list = <T,>(k: string): T[] => (Array.isArray(d[k]) ? (d[k] as T[]) : [])
  const strings = (k: string) => list<unknown>(k).filter((x): x is string => typeof x === 'string' && x.trim() !== '')
  return {
    responsible_staff: s('responsible_staff'),
    client_reference: s('client_reference'),
    location: s('location'),
    pending_date: s('pending_date'),
    closed_date: s('closed_date'),
    statute_of_limitations_date: s('statute_of_limitations_date'),
    statute_of_limitations_satisfied: flag('statute_of_limitations_satisfied', false),
    statute_reminders: list<StatuteReminder>('statute_reminders'),
    tags: strings('tags'),
    permissions_mode: s('permissions_mode') || 'everyone',
    permitted_users: strings('permitted_users'),
    notification_subscribers: strings('notification_subscribers'),
    blocked_users: strings('blocked_users'),
    related_contacts: list<RelatedContact>('related_contacts').filter((c) => c && c.contact_id),
    is_billable: flag('is_billable', true),
    billing_method: s('billing_method') || 'hourly',
    currency: s('currency') || 'GHS',
    custom_billing_rates: list<BillingRate>('custom_billing_rates').filter((r) => r && (r.user_or_group || r.amount)),
    budget_enabled: flag('budget_enabled', false),
    budget_amount: s('budget_amount'),
    split_invoice: flag('split_invoice', false),
    notify_low_client_funds: flag('notify_low_client_funds', false),
    task_lists: strings('task_lists'),
    task_lists_notify_assignees: flag('task_lists_notify_assignees', false),
    document_folders: list<DocFolder>('document_folders').filter((f) => f && f.name),
    originating_allocation: s('originating_allocation') || '0',
    use_firm_settings_originating: flag('use_firm_settings_originating', true),
    responsible_allocation: s('responsible_allocation') || '0',
    use_firm_settings_responsible: flag('use_firm_settings_responsible', true),
    conflict_checks: strings('conflict_checks'),
  }
}

/** Returns a new `details` string with `patch` merged over the stored keys. */
export function mergeDetails(raw: string | null | undefined, patch: Record<string, unknown>): string {
  return JSON.stringify({ ...parseDetailsObject(raw), ...patch })
}

// ── Dates ──────────────────────────────────────────────────────────────

const DAY = 86_400_000

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** Parses YYYY-MM-DD as a local date (not UTC midnight) and ISO stamps as-is. */
export function toDate(v?: string | null): Date | null {
  if (!v) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Whole days from today to `v` (negative when past). Null when unset. */
export function daysUntil(v?: string | null, now = new Date()): number | null {
  const d = toDate(v)
  if (!d) return null
  return Math.round((startOfDay(d) - startOfDay(now)) / DAY)
}

export function fmtDate(v?: string | null, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = toDate(v)
  return d ? d.toLocaleDateString('en-GB', opts) : ''
}

export function fmtDateTime(v?: string | null) {
  const d = toDate(v)
  if (!d) return ''
  return d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** "today", "tomorrow", "in 5 days", "3 days ago", "in 2 months". */
export function relativeDays(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  const abs = Math.abs(days)
  const unit = abs >= 60 ? `${Math.round(abs / 30)} months` : abs >= 14 ? `${Math.round(abs / 7)} weeks` : `${abs} days`
  return days > 0 ? `in ${unit}` : `${unit} ago`
}

/** "2 years 3 months", "5 months", "12 days" since `v`. */
export function ageSince(v?: string | null, now = new Date()): string {
  const d = toDate(v)
  if (!d) return ''
  const days = Math.max(0, Math.round((startOfDay(now) - startOfDay(d)) / DAY))
  if (days < 31) return `${days} day${days === 1 ? '' : 's'}`
  const months = Math.floor(days / 30.44)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return `${years} year${years === 1 ? '' : 's'}${rem ? ` ${rem} month${rem === 1 ? '' : 's'}` : ''}`
}

export type Urgency = 'overdue' | 'urgent' | 'soon' | 'later' | 'none'

/** Bucket for colouring a deadline: past, within 7 days, within 30, later. */
export function urgencyOf(days: number | null): Urgency {
  if (days === null) return 'none'
  if (days < 0) return 'overdue'
  if (days <= 7) return 'urgent'
  if (days <= 30) return 'soon'
  return 'later'
}

export const URGENCY_STYLE: Record<Urgency, { fg: string; bg: string }> = {
  overdue: { fg: '#B42318', bg: 'rgba(217,45,32,0.10)' },
  urgent: { fg: '#B54708', bg: 'rgba(247,144,9,0.14)' },
  soon: { fg: '#A07A1E', bg: 'rgba(201,151,43,0.13)' },
  later: { fg: '#0D1B2A', bg: 'rgba(13,27,42,0.06)' },
  none: { fg: '#8A8F99', bg: 'rgba(13,27,42,0.04)' },
}

export const titleCase = (s: string) =>
  s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : ''

export const BILLING_METHOD_LABEL: Record<string, string> = {
  hourly: 'Hourly',
  flat_fee: 'Flat fee',
  contingency: 'Contingency',
  pro_bono: 'Pro bono',
}

// ── Signals ────────────────────────────────────────────────────────────

export interface AttentionItem {
  id: string
  tone: 'danger' | 'warning'
  text: string
  /** Tab that resolves it. */
  tab?: CaseTab
}

export type CaseTab = 'overview' | 'documents' | 'tasks' | 'calendar' | 'details'

/**
 * Things a lawyer opening the case should not miss: missed or imminent
 * court dates, a statute about to run, overdue work, nobody responsible.
 */
export function attentionItems(input: {
  status: string
  nextCourtDate?: string | null
  statuteDate?: string
  statuteSatisfied: boolean
  overdueTasks: number
  responsible?: string | null
  teamSize: number
}): AttentionItem[] {
  if (input.status === 'Closed') return []
  const out: AttentionItem[] = []
  const court = daysUntil(input.nextCourtDate)
  if (court !== null && court < 0) {
    out.push({ id: 'court-past', tone: 'warning', text: `The recorded court date passed ${relativeDays(court)}. Record the next date.`, tab: 'details' })
  } else if (court !== null && court <= 7) {
    out.push({ id: 'court-soon', tone: court <= 2 ? 'danger' : 'warning', text: `Court appearance ${relativeDays(court)} (${fmtDate(input.nextCourtDate)}).`, tab: 'calendar' })
  }
  const sol = daysUntil(input.statuteDate)
  if (sol !== null && !input.statuteSatisfied) {
    if (sol < 0) out.push({ id: 'sol-past', tone: 'danger', text: `Statute of limitations expired ${relativeDays(sol)} and is not marked satisfied.`, tab: 'details' })
    else if (sol <= 60) out.push({ id: 'sol-soon', tone: sol <= 14 ? 'danger' : 'warning', text: `Statute of limitations runs ${relativeDays(sol)} (${fmtDate(input.statuteDate)}).`, tab: 'details' })
  }
  if (input.overdueTasks > 0) {
    out.push({ id: 'tasks', tone: 'warning', text: `${input.overdueTasks} overdue task${input.overdueTasks === 1 ? '' : 's'}.`, tab: 'tasks' })
  }
  if (!input.responsible && input.teamSize === 0) {
    out.push({ id: 'owner', tone: 'warning', text: 'No responsible lawyer is assigned.', tab: 'overview' })
  }
  return out
}
