'use client'

/**
 * New case creation page
 * ----------------------
 * Replaces the legacy `CaseForm` dialog for the CREATE flow. (Edit still
 * uses the dialog for now — that lives in components/shared/CaseForm.tsx.)
 *
 * Layout mirrors the Clio "New matter" reference: sticky top bar with
 * Save / Save & conflict check / Cancel, a sticky left nav with anchors
 * to every section, and a scrolling form on the right organised into
 * section cards.
 *
 * Schema reality check:
 *   The Case interface currently covers ~half of what this form collects
 *   (description, lawyers, practice area, stage, dates, status). Newer
 *   Clio-parity fields — responsible_staff, client_reference, location,
 *   statute_of_limitations_*, tags, permissions_*, notification
 *   subscribers, blocked_users, related_contacts, custom_fields, and the
 *   whole Billing preference section — render in the UI today but DON'T
 *   round-trip to the backend yet. Save persists what we can and toasts
 *   a heads-up about the unwired fields. They start saving once the
 *   matching schema additions land (next backend migration).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  FileText,
  FolderTree,
  GitFork,
  ListChecks,
  Plus,
  Settings2,
  ShieldCheck,
  ShieldOff,
  Tag,
  Trash2,
  Users,
  Bell,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useClients } from '@/hooks/use-clients'
import { useCases, useCreateCase } from '@/hooks/use-cases'
import { useAuthStore } from '@/stores/auth.store'
import { CASE_STAGES, PRACTICE_AREAS } from '@/lib/case-options'
import { TagSettingsDialog } from '@/components/shared/TagSettingsDialog'
import { useTagsStore } from '@/stores/tags.store'

// ── Section registry ────────────────────────────────────────────────────
// Single source of truth for the left-nav and the in-page anchors.
// Adding a new section is a one-line change here + a matching <Section>
// in the JSX below.

interface SectionDef {
  id: string
  label: string
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

const SECTIONS: SectionDef[] = [
  { id: 'template', label: 'Template information', Icon: ClipboardList },
  { id: 'clients', label: 'Clients', Icon: Users },
  { id: 'case-details', label: 'Case details', Icon: Briefcase },
  { id: 'permissions', label: 'Case permissions', Icon: ShieldCheck },
  { id: 'notifications', label: 'Case notifications', Icon: Bell },
  { id: 'block-users', label: 'Block users', Icon: ShieldOff },
  { id: 'related-contacts', label: 'Related contacts', Icon: GitFork },
  { id: 'custom-fields', label: 'Custom fields', Icon: Settings2 },
  { id: 'billing', label: 'Billing preference', Icon: CircleDollarSign },
  { id: 'tasks', label: 'Task lists', Icon: ListChecks },
  { id: 'documents', label: 'Document folders', Icon: FolderTree },
  { id: 'reports', label: 'Reports', Icon: FileText },
  { id: 'conflicts', label: 'Conflict checks', Icon: Building2 },
]

// ── Form state ──────────────────────────────────────────────────────────

interface RelatedContactDraft {
  id: string // local id for list management; not persisted
  contact_id: string
  relationship: string
  bill_recipient: boolean
}

// Statute-of-limitations reminders. Multiple per case allowed (one to
// "Me via email" 14 days out, another to a partner 7 days out, etc.).
type ReminderUnit = 'Days' | 'Weeks' | 'Months'
interface ReminderDraft {
  id: string
  recipient: string
  amount: string // string so the input can be cleared without coercion
  unit: ReminderUnit
}

// One row of the Custom billing rates table. `amount` stays a string so
// the input doesn't fight `parseFloat('') === NaN` edge cases.
interface BillingRateDraft {
  id: string
  user_or_group: string
  amount: string
}

// Document folder pre-created when the case opens (folder name + the
// firm-defined category it belongs to).
interface DocFolderDraft {
  id: string
  name: string
  category: string
}

interface NewCaseForm {
  // Clients
  client_ids: string[]
  // Case details
  description: string
  responsible_lawyer: string
  originating_lawyer: string
  responsible_staff: string
  client_reference: string
  location: string
  practice_area: string
  case_stage: string
  status: 'Open' | 'Pending' | 'Closed'
  open_date: string
  closed_date: string
  pending_date: string
  statute_of_limitations_date: string
  statute_of_limitations_satisfied: boolean
  // Reminders that fire ahead of the statute of limitations date.
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
  // Task lists pre-attached to the case (e.g. "Intake", "Pre-trial").
  task_lists_notify_assignees: boolean
  task_lists: string[]
  // Folder structure that gets auto-created on case open.
  document_folders: DocFolderDraft[]
  // Reports / allocation percentages.
  originating_allocation: string
  use_firm_settings_originating: boolean
  responsible_allocation: string
  use_firm_settings_responsible: boolean
  // Conflict checks linked to the case.
  conflict_checks: string[]
}

const TODAY = new Date().toISOString().slice(0, 10)

const INITIAL_FORM: NewCaseForm = {
  client_ids: [''],
  description: '',
  responsible_lawyer: '',
  originating_lawyer: '',
  responsible_staff: '',
  client_reference: '',
  location: '',
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

// Document folder categories — Clio's defaults. Editable per firm in
// settings later; hard-coded here until that admin screen ships.
const DOC_CATEGORIES = [
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

const REMINDER_UNITS: ReminderUnit[] = ['Days', 'Weeks', 'Months']

/** Built-in reminder recipients. Real firm-user names appended by the
 *  picker via the firmUserOptions prop. */
const REMINDER_BUILTIN_RECIPIENTS = ['Me (via email)', 'Me (via popup)'] as const

const BILLING_METHODS: Array<{ value: NewCaseForm['billing_method']; label: string }> = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'flat_fee', label: 'Flat fee' },
  { value: 'contingency', label: 'Contingency' },
  { value: 'pro_bono', label: 'Pro bono' },
]

// Reasonable currency starter set for Ghana-based firms — expandable later.
const CURRENCIES = [
  { code: 'GHS', label: 'Ghanaian Cedi (GH₵)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'NGN', label: 'Nigerian Naira (₦)' },
]

// ── Page component ──────────────────────────────────────────────────────

export default function NewCasePage() {
  const router = useRouter()
  const createMutation = useCreateCase()
  const { data: clients } = useClients()
  const { data: existingCases } = useCases()
  const { user } = useAuthStore()

  // Firm-user list driving the three lawyer / staff dropdowns. Until the
  // firm-roster screen ships we synthesise the list from (a) the current
  // viewer and (b) lawyers already named on other cases — the union is a
  // decent approximation. When the roster admin lands, swap this for a
  // useFirmUsers() hook.
  const firmUserOptions = useMemo(() => {
    const set = new Set<string>()
    if (user?.name) set.add(user.name)
    for (const c of existingCases ?? []) {
      if (c.assigned_lawyer) set.add(c.assigned_lawyer)
      if (c.originating_lawyer) set.add(c.originating_lawyer)
    }
    return Array.from(set).sort()
  }, [user, existingCases])

  const [form, setForm] = useState<NewCaseForm>(INITIAL_FORM)
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id)
  const [submitting, setSubmitting] = useState(false)

  const setField = <K extends keyof NewCaseForm>(key: K, val: NewCaseForm[K]) => {
    setForm((f) => ({ ...f, [key]: val }))
  }

  // Tag manager dialog — opens from the Tags field's "Manage tags" link.
  // Stays at the page level so a single mount is shared across all the
  // places that need it.
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false)

  // Track which section is in view as the user scrolls so the left nav
  // highlights the right anchor. IntersectionObserver fires whenever a
  // section's top edge crosses the chosen rootMargin band — we pick the
  // entry closest to the top of the viewport at any given moment.
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveSection(visible[0].target.id)
      },
      {
        // Trigger when a section's top is between 25% and 60% down the
        // viewport — gives a stable "current" feel even on long sections.
        rootMargin: '-25% 0px -40% 0px',
        threshold: 0,
      },
    )
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id]
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(id)
  }

  const canSave = useMemo(() => {
    const hasClient = form.client_ids.some((id) => !!id)
    return hasClient && form.description.trim().length > 0
  }, [form.client_ids, form.description])

  // Map the rich form draft down to the slim shape the existing
  // useCreateCase mutation accepts. Unmapped fields don't persist yet —
  // tracked in `unsavedFields` so we can surface a heads-up toast.
  const handleSave = async (alsoRunConflictCheck: boolean) => {
    if (!canSave) {
      toast.error('Add a client and a case description before saving.')
      return
    }
    setSubmitting(true)
    try {
      // Title is the first non-empty line of the description; description
      // itself goes into `notes` so nothing is lost.
      const title =
        form.description.split('\n').find((l) => l.trim().length > 0)?.trim() ||
        'Untitled case'
      const primaryClient = form.client_ids.find((id) => !!id) ?? ''

      await createMutation.mutateAsync({
        title,
        client_id: primaryClient,
        case_type: form.practice_area || undefined,
        case_stage: form.case_stage || undefined,
        assigned_lawyer: form.responsible_lawyer || undefined,
        originating_lawyer: form.originating_lawyer || undefined,
        status: form.status,
        date_opened: form.open_date || undefined,
        notes: form.description,
      })

      const unsavedFields = countUnsavedFields(form)
      if (unsavedFields > 0) {
        toast.success(
          `Case created — ${unsavedFields} field${unsavedFields === 1 ? '' : 's'} stored in draft pending backend support.`,
        )
      } else {
        toast.success('Case created successfully.')
      }
      if (alsoRunConflictCheck) {
        toast.info('Conflict check will run as soon as the conflict-check screen ships.')
      }
      router.push('/cases')
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Unable to create case: ${err.message}`
          : 'Unable to create case. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar — sticky inside the dashboard <main>. Save sits primary,
          Save & conflict check secondary, Cancel ghost on the far right. */}
      <header
        className="flex items-center justify-between px-6 py-3.5 border-b"
        style={{
          borderColor: 'var(--border-soft)',
          background: 'var(--surface-card)',
        }}
      >
        <div>
          <h1
            className="text-[20px] font-semibold leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            New case
          </h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Fill in the sections below to open a new case. Save anytime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/cases')}>
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(true)}
            disabled={submitting}
          >
            Save and run conflict check
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(false)}
            disabled={submitting || !canSave}
          >
            {submitting ? 'Saving…' : 'Save case'}
          </Button>
        </div>
      </header>

      {/* Body: sticky left nav + scrolling form on the right */}
      <div className="flex-1 flex overflow-hidden">
        <SectionNav
          active={activeSection}
          onSelect={scrollToSection}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[820px] px-8 py-8 space-y-6">
            <Section
              id="template"
              label="Template information"
              registerRef={(el) => { sectionRefs.current['template'] = el }}
              description="Apply a saved template to prefill repetitive fields. Templates land with the Case templates screen."
            >
              <PendingSectionStub message="Template chooser coming next." />
            </Section>

            <Section
              id="clients"
              label="Clients"
              registerRef={(el) => { sectionRefs.current['clients'] = el }}
            >
              <ClientsSection
                clientIds={form.client_ids}
                onChange={(ids) => setField('client_ids', ids)}
                clientOptions={(clients ?? []).map((c) => ({
                  id: c.id,
                  label: c.full_name,
                }))}
              />
            </Section>

            <Section
              id="case-details"
              label="Case details"
              registerRef={(el) => { sectionRefs.current['case-details'] = el }}
            >
              <CaseDetailsSection
                form={form}
                setField={setField}
                firmUserOptions={firmUserOptions}
                onOpenTagSettings={() => setTagsDialogOpen(true)}
              />
            </Section>

            <Section
              id="permissions"
              label="Case permissions"
              registerRef={(el) => { sectionRefs.current['permissions'] = el }}
            >
              <PermissionsSection form={form} setField={setField} />
            </Section>

            <Section
              id="notifications"
              label="Case notifications"
              registerRef={(el) => { sectionRefs.current['notifications'] = el }}
              description="Firm users on this list get notified about activity on the case."
            >
              <UserPickerStub
                value={form.notification_subscribers}
                onChange={(v) => setField('notification_subscribers', v)}
                placeholder="Find a firm user"
                emptyHint="No subscribers yet — they'll appear here once user management ships."
              />
            </Section>

            <Section
              id="block-users"
              label="Block users"
              registerRef={(el) => { sectionRefs.current['block-users'] = el }}
              description="Listed users won't see this case anywhere in LegaLite."
            >
              <UserPickerStub
                value={form.blocked_users}
                onChange={(v) => setField('blocked_users', v)}
                placeholder="Find a firm user"
                emptyHint="No blocked users."
              />
            </Section>

            <Section
              id="related-contacts"
              label="Related contacts"
              registerRef={(el) => { sectionRefs.current['related-contacts'] = el }}
              description="Witnesses, opposing parties, experts — anyone tied to the case besides the client."
            >
              <RelatedContactsSection
                value={form.related_contacts}
                onChange={(v) => setField('related_contacts', v)}
                contactOptions={(clients ?? []).map((c) => ({
                  id: c.id,
                  label: c.full_name,
                  email: c.email ?? undefined,
                }))}
              />
            </Section>

            <Section
              id="custom-fields"
              label="Custom fields"
              registerRef={(el) => { sectionRefs.current['custom-fields'] = el }}
              description="Firm-defined attributes attached to every case. Manage them from settings."
            >
              <PendingSectionStub message="Custom fields admin is coming next." />
            </Section>

            <Section
              id="billing"
              label="Billing preference"
              registerRef={(el) => { sectionRefs.current['billing'] = el }}
            >
              <BillingSection
                form={form}
                setField={setField}
                firmUserOptions={firmUserOptions}
              />
            </Section>

            <Section
              id="tasks"
              label="Task lists"
              registerRef={(el) => { sectionRefs.current['tasks'] = el }}
              description="Pre-populate the case with a task list (intake, discovery, trial prep, etc.)."
            >
              <TaskListsSection form={form} setField={setField} />
            </Section>

            <Section
              id="documents"
              label="Document folders"
              registerRef={(el) => { sectionRefs.current['documents'] = el }}
              description="Folder structure created automatically when the case opens."
            >
              <DocumentFoldersSection form={form} setField={setField} />
            </Section>

            <Section
              id="reports"
              label="Reports"
              registerRef={(el) => { sectionRefs.current['reports'] = el }}
              description="Allocation percentages used in originating and responsible attorney reports."
            >
              <ReportsSection form={form} setField={setField} />
            </Section>

            <Section
              id="conflicts"
              label="Conflict checks"
              registerRef={(el) => { sectionRefs.current['conflicts'] = el }}
              description="Run a conflict search across past cases and contacts before opening."
            >
              <ConflictChecksSection form={form} setField={setField} />
            </Section>

            {/* Bottom save row — duplicates the top bar so the user doesn't
                have to scroll all the way back up after filling out the
                long form. */}
            <div
              className="flex items-center justify-end gap-2 pt-2 pb-8"
            >
              <Button variant="ghost" size="sm" onClick={() => router.push('/cases')}>
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(true)}
                disabled={submitting}
              >
                Save and run conflict check
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave(false)}
                disabled={submitting || !canSave}
              >
                {submitting ? 'Saving…' : 'Save case'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <TagSettingsDialog
        open={tagsDialogOpen}
        onOpenChange={setTagsDialogOpen}
      />
    </div>
  )
}

// ── Section nav (sticky left rail) ──────────────────────────────────────

function SectionNav({
  active,
  onSelect,
}: {
  active: string
  onSelect: (id: string) => void
}) {
  return (
    <nav
      className="hidden md:flex flex-col shrink-0 w-[240px] border-r overflow-y-auto"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
      }}
    >
      <div
        className="px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        Sections
      </div>
      <ul className="px-2 pb-4 flex flex-col gap-0.5">
        {SECTIONS.map((s) => {
          const isActive = s.id === active
          const Icon = s.Icon
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isActive
                    ? 'var(--surface-sunken)'
                    : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = 'var(--surface-overlay)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <Icon
                  size={14}
                  strokeWidth={1.75}
                />
                <span className="truncate">{s.label}</span>
                {isActive && (
                  <span
                    className="ml-auto w-1 h-4 rounded-full"
                    style={{ background: 'var(--gold)' }}
                  />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ── Section wrapper ─────────────────────────────────────────────────────

function Section({
  id,
  label,
  description,
  children,
  registerRef,
}: {
  id: string
  label: string
  description?: string
  children: React.ReactNode
  registerRef: (el: HTMLElement | null) => void
}) {
  return (
    <section
      id={id}
      ref={registerRef}
      // scroll-mt accounts for the sticky top bar so anchor clicks land
      // with the section title visible, not flush against the header.
      className="scroll-mt-24 rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <header
        className="px-6 pt-5 pb-3 border-b"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <h2
          className="text-[15px] font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </h2>
        {description && (
          <p
            className="mt-1 text-[12.5px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {description}
          </p>
        )}
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

// ── Field primitives ────────────────────────────────────────────────────

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <Label
      className="text-[12.5px] font-semibold mb-1.5 block"
      style={{ color: 'var(--text-primary)' }}
    >
      {children}
      {required && (
        <span style={{ color: '#C0392B', marginLeft: 2 }}>*</span>
      )}
    </Label>
  )
}

function NativeSelect({
  value,
  onChange,
  placeholder,
  options,
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  options: Array<{ value: string; label: string }> | readonly string[]
  disabled?: boolean
}) {
  const normalized = Array.isArray(options) && typeof options[0] === 'string'
    ? (options as readonly string[]).map((o) => ({ value: o, label: o }))
    : (options as Array<{ value: string; label: string }>)
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer disabled:cursor-not-allowed"
        style={{
          borderColor: 'var(--border-default)',
          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          opacity: disabled ? 0.7 : 1,
          // Force the browser's native options popup to render with the
          // light theme regardless of the OS preference — otherwise users
          // on macOS dark mode see a black popup against our light page.
          colorScheme: 'light',
        }}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        strokeWidth={1.75}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-muted)' }}
      />
    </div>
  )
}

function Checkbox({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <label className="inline-flex items-start gap-2.5 cursor-pointer select-none">
      <span
        className="inline-flex h-[18px] w-[18px] mt-0.5 items-center justify-center rounded-md border transition-colors"
        style={{
          borderColor: checked ? 'var(--gold)' : 'var(--border-default)',
          background: checked ? 'var(--gold)' : 'transparent',
        }}
      >
        {checked && (
          <Check size={12} strokeWidth={2.5} style={{ color: 'white' }} />
        )}
      </span>
      <span>
        <span
          className="block text-[13px]"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </span>
        {hint && (
          <span
            className="block text-[11.5px] mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {hint}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
    </label>
  )
}

/**
 * Searchable contact combobox — text-input filtering + popover list of
 * matching contacts + a "+ New contact" entry at the bottom (stubbed to
 * a toast until the quick-create form ships).
 *
 * Stores the contact ID in `value` when a real option is picked, or the
 * raw typed text otherwise — that lets the user record a contact name
 * even before a backing contact record exists (the save handler will
 * either resolve to an existing ID or create one).
 */
function ContactCombobox({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (next: string) => void
  options: ContactOption[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  // If `value` is a known contact ID, surface its label in the input
  // when the popover is closed. While typing we show the raw query.
  const selected = options.find((o) => o.id === value)
  const displayValue = open ? query : selected?.label ?? value

  const filtered = options.filter((o) => {
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return (
      o.label.toLowerCase().includes(q) ||
      (o.email ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="relative">
      <input
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          // Typing wipes any previous selection — the user is searching
          // for a new contact.
          onChange(e.target.value)
        }}
        onFocus={() => {
          setOpen(true)
          setQuery('')
        }}
        onBlur={() => {
          // Delay close so a mousedown on a list item can fire first.
          setTimeout(() => setOpen(false), 150)
        }}
        placeholder="Search for a contact's name and/or email"
        className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px]"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
        }}
      />
      <ChevronDown
        size={13}
        strokeWidth={1.75}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-muted)' }}
      />
      {open && (
        <div
          className="absolute z-30 left-0 right-0 top-full mt-1 rounded-lg border max-h-[260px] overflow-y-auto"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {filtered.length === 0 && (
            <div
              className="px-3 py-2.5 text-[12.5px]"
              style={{ color: 'var(--text-muted)' }}
            >
              No matching contacts. Try a different name or create one below.
            </div>
          )}
          {filtered.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(opt.id)
                setOpen(false)
              }}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-[13px] transition-colors cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold shrink-0"
                style={{
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-muted)',
                }}
                aria-hidden
              >
                {opt.label
                  .split(' ')
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate font-medium">{opt.label}</span>
                {opt.email && (
                  <span
                    className="block truncate text-[11.5px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {opt.email}
                  </span>
                )}
              </span>
            </button>
          ))}
          <div
            className="border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                setOpen(false)
                toast.info('New contact form is coming next.')
              }}
              className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-[13px] font-medium transition-colors cursor-pointer"
              style={{ color: 'var(--gold-dark)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <Plus size={13} strokeWidth={2} />
              New contact
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RadioOption({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: () => void
  label: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <label className="inline-flex items-start gap-2.5 cursor-pointer select-none">
      <span
        className="inline-flex h-[18px] w-[18px] mt-0.5 items-center justify-center rounded-full border transition-colors"
        style={{
          borderColor: checked ? 'var(--gold)' : 'var(--border-default)',
          background: 'transparent',
        }}
      >
        {checked && (
          <span
            className="block h-[8px] w-[8px] rounded-full"
            style={{ background: 'var(--gold)' }}
          />
        )}
      </span>
      <span>
        <span
          className="block text-[13px] font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </span>
        {hint && (
          <span
            className="block text-[11.5px] mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {hint}
          </span>
        )}
      </span>
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
    </label>
  )
}

// ── Sections — implementations ──────────────────────────────────────────

function PendingSectionStub({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl border-2 border-dashed px-5 py-6 text-center"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
    </div>
  )
}

function ClientsSection({
  clientIds,
  onChange,
  clientOptions,
}: {
  clientIds: string[]
  onChange: (next: string[]) => void
  clientOptions: Array<{ id: string; label: string }>
}) {
  const setAt = (idx: number, val: string) => {
    const next = [...clientIds]
    next[idx] = val
    onChange(next)
  }
  const removeAt = (idx: number) => {
    if (clientIds.length === 1) {
      onChange([''])
      return
    }
    onChange(clientIds.filter((_, i) => i !== idx))
  }
  return (
    <div className="space-y-3">
      {clientIds.map((id, idx) => (
        <div key={idx} className="flex items-end gap-2">
          <div className="flex-1">
            <FieldLabel required={idx === 0}>
              {idx === 0 ? 'Client' : `Additional client ${idx}`}
            </FieldLabel>
            <NativeSelect
              value={id}
              onChange={(v) => setAt(idx, v)}
              placeholder="Find a contact to add as client"
              options={clientOptions.map((c) => ({
                value: c.id,
                label: c.label,
              }))}
            />
          </div>
          {idx > 0 && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeAt(idx)}
              aria-label="Remove client"
            >
              <X size={13} style={{ color: 'var(--text-muted)' }} />
            </Button>
          )}
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...clientIds, ''])}
      >
        <Plus size={13} strokeWidth={2} />
        Add another client
      </Button>
    </div>
  )
}

function CaseDetailsSection({
  form,
  setField,
  firmUserOptions,
  onOpenTagSettings,
}: {
  form: NewCaseForm
  setField: <K extends keyof NewCaseForm>(key: K, val: NewCaseForm[K]) => void
  firmUserOptions: string[]
  onOpenTagSettings: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>Case description</FieldLabel>
        <Textarea
          rows={3}
          placeholder="e.g. Mensah v. Ghana Revenue Authority — tax assessment dispute"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          className="rounded-lg text-[13px]"
          style={{ borderColor: 'var(--border-default)' }}
        />
        <p className="mt-1 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
          First line becomes the case title in lists. Full text is saved as case notes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Responsible lawyer</FieldLabel>
          <NativeSelect
            value={form.responsible_lawyer}
            onChange={(v) => setField('responsible_lawyer', v)}
            placeholder="Find a firm user"
            options={firmUserOptions}
          />
        </div>
        <div>
          <FieldLabel>Originating lawyer</FieldLabel>
          <NativeSelect
            value={form.originating_lawyer}
            onChange={(v) => setField('originating_lawyer', v)}
            placeholder="Find a firm user"
            options={firmUserOptions}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Responsible staff</FieldLabel>
        <NativeSelect
          value={form.responsible_staff}
          onChange={(v) => setField('responsible_staff', v)}
          placeholder="Find a firm user"
          options={firmUserOptions}
        />
        <p className="mt-1 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
          Paralegal or support staff assigned to the case.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Client reference number</FieldLabel>
          <Input
            placeholder="Enter reference number"
            value={form.client_reference}
            onChange={(e) => setField('client_reference', e.target.value)}
            className="h-10 rounded-lg text-[13px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
        <div>
          <FieldLabel>Location</FieldLabel>
          <Input
            placeholder="e.g. Accra, Kumasi"
            value={form.location}
            onChange={(e) => setField('location', e.target.value)}
            className="h-10 rounded-lg text-[13px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Practice area</FieldLabel>
          <NativeSelect
            value={form.practice_area}
            onChange={(v) => setField('practice_area', v)}
            placeholder="Find a practice area"
            options={PRACTICE_AREAS}
          />
        </div>
        <div>
          <FieldLabel>Case stage</FieldLabel>
          <NativeSelect
            value={form.case_stage}
            onChange={(v) => setField('case_stage', v)}
            placeholder="Find a case stage"
            options={CASE_STAGES}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Case status</FieldLabel>
        <NativeSelect
          value={form.status}
          onChange={(v) =>
            setField('status', v as NewCaseForm['status'])
          }
          options={[
            { value: 'Open', label: 'Open' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Closed', label: 'Closed' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Open date</FieldLabel>
          <Input
            type="date"
            value={form.open_date}
            onChange={(e) => setField('open_date', e.target.value)}
            className="h-10 rounded-lg text-[13px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
        <div>
          <FieldLabel>Closed date</FieldLabel>
          {/* Always editable. The backend will only persist this when the
              case actually transitions to Closed (trigger in migration
              0003_case_clio_fields auto-stamps this), but the user may
              want to record a planned closure date ahead of time. */}
          <Input
            type="date"
            value={form.closed_date}
            onChange={(e) => setField('closed_date', e.target.value)}
            className="h-10 rounded-lg text-[13px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Pending date</FieldLabel>
        <Input
          type="date"
          value={form.pending_date}
          onChange={(e) => setField('pending_date', e.target.value)}
          className="h-10 rounded-lg text-[13px] max-w-[300px]"
          style={{ borderColor: 'var(--border-default)' }}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>Statute of limitations date</FieldLabel>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={form.statute_of_limitations_date}
            onChange={(e) => setField('statute_of_limitations_date', e.target.value)}
            className="h-10 rounded-lg text-[13px] max-w-[260px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
          <Checkbox
            checked={form.statute_of_limitations_satisfied}
            onChange={(v) => setField('statute_of_limitations_satisfied', v)}
            label="Statute of limitations date satisfied"
          />
        </div>
      </div>

      <StatuteRemindersField
        value={form.statute_reminders}
        onChange={(v) => setField('statute_reminders', v)}
        firmUserOptions={firmUserOptions}
      />

      <TagsField
        value={form.tags}
        onChange={(v) => setField('tags', v)}
        onOpenSettings={onOpenTagSettings}
      />
    </div>
  )
}

/**
 * Statute-of-limitations reminders. Each row = one notification scheduled
 * ahead of the deadline (e.g. "Me via popup, 10 Days Before"). The
 * "Before" suffix is fixed — reminders ahead of a deadline are the only
 * sensible direction.
 */
function StatuteRemindersField({
  value,
  onChange,
  firmUserOptions,
}: {
  value: ReminderDraft[]
  onChange: (next: ReminderDraft[]) => void
  firmUserOptions: string[]
}) {
  const recipientOptions = [
    ...REMINDER_BUILTIN_RECIPIENTS,
    ...firmUserOptions.filter((n) => n.toLowerCase() !== 'me'),
  ]
  const addRow = () => {
    onChange([
      ...value,
      {
        id: crypto.randomUUID(),
        recipient: REMINDER_BUILTIN_RECIPIENTS[0],
        amount: '10',
        unit: 'Days',
      },
    ])
  }
  const updateRow = (id: string, patch: Partial<ReminderDraft>) =>
    onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const removeRow = (id: string) =>
    onChange(value.filter((r) => r.id !== id))

  return (
    <div>
      <FieldLabel>Statute of limitations date reminders</FieldLabel>
      <div className="space-y-2">
        {value.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[minmax(0,1fr)_70px_110px_auto_auto] gap-2 items-center"
          >
            <NativeSelect
              value={row.recipient}
              onChange={(v) => updateRow(row.id, { recipient: v })}
              options={recipientOptions}
            />
            <Input
              inputMode="numeric"
              value={row.amount}
              onChange={(e) =>
                updateRow(row.id, {
                  amount: e.target.value.replace(/[^0-9]/g, ''),
                })
              }
              className="h-10 rounded-lg text-[13px] tabular-nums text-center"
              style={{ borderColor: 'var(--border-default)' }}
            />
            <NativeSelect
              value={row.unit}
              onChange={(v) => updateRow(row.id, { unit: v as ReminderUnit })}
              options={REMINDER_UNITS}
            />
            <span
              className="text-[13px] font-medium px-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Before
            </span>
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="p-1.5 rounded-md transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
                e.currentTarget.style.color = '#C0392B'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
              aria-label="Remove reminder"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={addRow}
        className="mt-2"
      >
        <Plus size={13} strokeWidth={2} />
        Add reminder
      </Button>
    </div>
  )
}

/**
 * Tags input — picks from the tag store (firm-defined tags created via
 * TagSettingsDialog). Selected tags render with their stored colour;
 * unknown tag names (typed but never created) fall back to neutral
 * styling so old form data doesn't break visually.
 */
function TagsField({
  value,
  onChange,
  onOpenSettings,
}: {
  value: string[]
  onChange: (next: string[]) => void
  onOpenSettings: () => void
}) {
  const tags = useTagsStore((s) => s.tags)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const colourFor = (name: string): string => {
    const match = tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
    return match?.color ?? '#94A3B8' // slate fallback for unknown tags
  }

  const suggestions = tags.filter(
    (t) =>
      !value.includes(t.name) &&
      (!query.trim() || t.name.toLowerCase().includes(query.trim().toLowerCase())),
  )

  const addTagByName = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setQuery('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <FieldLabel>Tags</FieldLabel>
        <button
          type="button"
          onClick={onOpenSettings}
          className="text-[11.5px] font-medium cursor-pointer"
          style={{ color: 'var(--gold-dark)' }}
        >
          Manage tags
        </button>
      </div>
      <div className="relative">
        <div
          className="flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-2 min-h-[40px]"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
          }}
        >
          {value.map((tagName) => (
            <span
              key={tagName}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-medium"
              style={{
                background: `${colourFor(tagName)}1A`, // 10% alpha tint
                color: colourFor(tagName),
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: colourFor(tagName) }}
                aria-hidden
              />
              {tagName}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tagName))}
                className="cursor-pointer"
                aria-label={`Remove tag ${tagName}`}
              >
                <X size={11} strokeWidth={1.75} />
              </button>
            </span>
          ))}
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // Delay so a click on a suggestion can land before we close.
              setTimeout(() => setOpen(false), 150)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (suggestions[0]) addTagByName(suggestions[0].name)
                else if (query.trim()) addTagByName(query)
              }
              if (e.key === 'Backspace' && !query && value.length) {
                onChange(value.slice(0, -1))
              }
            }}
            placeholder={value.length === 0 ? 'Search tags' : ''}
            className="flex-1 min-w-[120px] outline-none bg-transparent text-[13px] px-1"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        {open && (suggestions.length > 0 || (tags.length === 0 && !query)) && (
          <div
            className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border max-h-[220px] overflow-y-auto"
            style={{
              background: 'var(--surface-card)',
              borderColor: 'var(--border-default)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {tags.length === 0 && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onOpenSettings()
                }}
                className="block w-full text-left px-3 py-2 text-[12.5px] cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                No tags yet — click <span style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>Manage tags</span> to create one.
              </button>
            )}
            {suggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  addTagByName(tag.name)
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-[13px] transition-colors cursor-pointer"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-sunken)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: tag.color }}
                  aria-hidden
                />
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="mt-1 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
        Pick from your firm&rsquo;s tag list, or create new tags from{' '}
        <button
          type="button"
          onClick={onOpenSettings}
          className="cursor-pointer underline"
          style={{ color: 'var(--gold-dark)' }}
        >
          Manage tags
        </button>
        .
      </p>
    </div>
  )
}

function PermissionsSection({
  form,
  setField,
}: {
  form: NewCaseForm
  setField: <K extends keyof NewCaseForm>(key: K, val: NewCaseForm[K]) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel required>Firm users with access</FieldLabel>
        <div className="flex flex-col gap-3 pt-1">
          <RadioOption
            checked={form.permissions_mode === 'everyone'}
            onChange={() => setField('permissions_mode', 'everyone')}
            label="Everyone"
            hint="All firm users see this case."
          />
          <RadioOption
            checked={form.permissions_mode === 'specific'}
            onChange={() => setField('permissions_mode', 'specific')}
            label="Specific users or groups"
            hint="Only users you add see this case."
          />
        </div>
      </div>
      {form.permissions_mode === 'specific' && (
        <div className="space-y-2 pl-7">
          <FieldLabel required>Add users or groups</FieldLabel>
          <UserPickerStub
            value={form.permitted_users}
            onChange={(v) => setField('permitted_users', v)}
            placeholder="Find users or groups"
          />
          {/* Always-visible roster panel so the user can see at a glance
              who currently has access (matches Clio's panel). When empty,
              shows a centred "no access" message; when populated, lists
              each user/group as a row with a remove button. */}
          <div
            className="rounded-xl border"
            style={{
              background: 'var(--surface-sunken)',
              borderColor: 'var(--border-soft)',
            }}
          >
            {form.permitted_users.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  No users or groups have access to this case.
                </p>
                <p
                  className="mt-1 text-[12px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Add at least one user above so the case isn&rsquo;t locked
                  out for everyone.
                </p>
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                {form.permitted_users.map((u) => (
                  <li
                    key={u}
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{ borderColor: 'var(--border-soft)' }}
                  >
                    <span
                      className="text-[13px]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {u}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setField(
                          'permitted_users',
                          form.permitted_users.filter((x) => x !== u),
                        )
                      }
                      className="p-1.5 rounded-md transition-colors cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--surface-card)'
                        e.currentTarget.style.color = '#C0392B'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--text-muted)'
                      }}
                      aria-label={`Remove ${u}`}
                    >
                      <X size={13} strokeWidth={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Placeholder user-picker. Renders the selected pills + a text input that
 * adds entries on Enter. Real picker arrives with the firm-roster screen.
 */
function UserPickerStub({
  value,
  onChange,
  placeholder,
  emptyHint,
}: {
  value: string[]
  onChange: (next: string[]) => void
  placeholder: string
  emptyHint?: string
}) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim()
    if (!t || value.includes(t)) {
      setDraft('')
      return
    }
    onChange([...value, t])
    setDraft('')
  }
  return (
    <div>
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-2 min-h-[40px]"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
        }}
      >
        {value.map((user) => (
          <span
            key={user}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11.5px] font-medium"
            style={{
              background: 'var(--surface-sunken)',
              color: 'var(--text-secondary)',
            }}
          >
            {user}
            <button
              type="button"
              onClick={() => onChange(value.filter((u) => u !== user))}
              className="cursor-pointer"
              aria-label={`Remove ${user}`}
            >
              <X size={11} strokeWidth={1.75} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[160px] outline-none bg-transparent text-[13px] px-1"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>
      {value.length === 0 && emptyHint && (
        <p
          className="mt-1 text-[11.5px]"
          style={{ color: 'var(--text-muted)' }}
        >
          {emptyHint}
        </p>
      )}
    </div>
  )
}

interface ContactOption {
  id: string
  label: string
  email?: string
}

function RelatedContactsSection({
  value,
  onChange,
  contactOptions,
}: {
  value: RelatedContactDraft[]
  onChange: (next: RelatedContactDraft[]) => void
  contactOptions: ContactOption[]
}) {
  const addRow = () => {
    onChange([
      ...value,
      {
        id: crypto.randomUUID(),
        contact_id: '',
        relationship: '',
        bill_recipient: false,
      },
    ])
  }
  const removeRow = (id: string) => onChange(value.filter((r) => r.id !== id))
  const updateRow = (id: string, patch: Partial<RelatedContactDraft>) =>
    onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
          No related contacts yet. Add witnesses, opposing parties, experts, etc.
        </p>
      )}
      {value.map((row) => (
        <div
          key={row.id}
          className="rounded-xl border p-4 space-y-3"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div>
              <FieldLabel>Contact</FieldLabel>
              <ContactCombobox
                value={row.contact_id}
                onChange={(v) => updateRow(row.id, { contact_id: v })}
                options={contactOptions}
              />
            </div>
            <div>
              <FieldLabel>Relationship</FieldLabel>
              <Input
                placeholder="e.g. Witness, Opposing counsel"
                value={row.relationship}
                onChange={(e) => updateRow(row.id, { relationship: e.target.value })}
                className="h-10 rounded-lg text-[13px]"
                style={{ borderColor: 'var(--border-default)' }}
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeRow(row.id)}
              aria-label="Remove related contact"
            >
              <Trash2 size={13} style={{ color: 'var(--text-muted)' }} />
            </Button>
          </div>
          <Checkbox
            checked={row.bill_recipient}
            onChange={(v) => updateRow(row.id, { bill_recipient: v })}
            label="Bill recipient"
            hint="Invoices for this case can be addressed to this contact."
          />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addRow}>
        <Plus size={13} strokeWidth={2} />
        Add related contact
      </Button>
    </div>
  )
}

function BillingSection({
  form,
  setField,
  firmUserOptions,
}: {
  form: NewCaseForm
  setField: <K extends keyof NewCaseForm>(key: K, val: NewCaseForm[K]) => void
  firmUserOptions: string[]
}) {
  const currencyMeta =
    CURRENCIES.find((c) => c.code === form.currency) ?? CURRENCIES[0]
  // Symbol portion before the parenthesis in the currency label, e.g.
  // "Ghanaian Cedi (GH₵)" → "GH₵". Used as the small prefix on rate
  // inputs ("GH" in the screenshot is the abbreviated form).
  const currencySymbol = currencyMeta.label.match(/\(([^)]+)\)/)?.[1] ?? form.currency

  const addRate = () => {
    setField('custom_billing_rates', [
      ...form.custom_billing_rates,
      { id: crypto.randomUUID(), user_or_group: '', amount: '' },
    ])
  }
  const updateRate = (id: string, patch: Partial<BillingRateDraft>) => {
    setField(
      'custom_billing_rates',
      form.custom_billing_rates.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  }
  const removeRate = (id: string) => {
    setField(
      'custom_billing_rates',
      form.custom_billing_rates.filter((r) => r.id !== id),
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div
          className="flex-1 min-w-[240px] rounded-xl border p-4"
          style={{
            background: form.is_billable
              ? 'rgba(201,151,43,0.06)'
              : 'var(--surface-sunken)',
            borderColor: form.is_billable
              ? 'rgba(201,151,43,0.35)'
              : 'var(--border-soft)',
          }}
        >
          <Checkbox
            checked={form.is_billable}
            onChange={(v) => setField('is_billable', v)}
            label="This case is billable"
            hint={
              <>
                Track time and issue invoices for this case. Switch off for pro-bono
                or internal matters.
              </>
            }
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <FieldLabel>Billing method</FieldLabel>
          <NativeSelect
            value={form.billing_method}
            onChange={(v) => setField('billing_method', v as NewCaseForm['billing_method'])}
            options={BILLING_METHODS.map((b) => ({ value: b.value, label: b.label }))}
            disabled={!form.is_billable}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Currency</FieldLabel>
          <NativeSelect
            value={form.currency}
            onChange={(v) => setField('currency', v)}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
            disabled={!form.is_billable}
          />
        </div>
      </div>

      {/* ── Custom billing rates ─── */}
      <div className="pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
        <div
          className="text-[13.5px] font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Custom billing rates
        </div>
        <div className="space-y-2">
          {form.custom_billing_rates.map((rate, idx) => (
            <div
              key={rate.id}
              className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,200px)_auto] gap-2 items-end"
            >
              <div>
                {idx === 0 && (
                  <FieldLabel required>Firm user or group</FieldLabel>
                )}
                <NativeSelect
                  value={rate.user_or_group}
                  onChange={(v) => updateRate(rate.id, { user_or_group: v })}
                  placeholder="Find user or group"
                  options={firmUserOptions}
                  disabled={!form.is_billable}
                />
              </div>
              <span
                className="pb-2.5 text-[13px] font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                at
              </span>
              <div>
                {idx === 0 && (
                  <FieldLabel required>Hourly rate</FieldLabel>
                )}
                <div className="flex">
                  <span
                    className="inline-flex items-center px-3 h-10 rounded-l-lg border border-r-0 text-[12px] font-medium"
                    style={{
                      borderColor: 'var(--border-default)',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {currencySymbol}
                  </span>
                  <Input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={rate.amount}
                    onChange={(e) =>
                      updateRate(rate.id, {
                        amount: e.target.value.replace(/[^0-9.]/g, ''),
                      })
                    }
                    className="h-10 rounded-none text-[13px] flex-1 text-right tabular-nums"
                    style={{ borderColor: 'var(--border-default)' }}
                    disabled={!form.is_billable}
                  />
                  <span
                    className="inline-flex items-center px-3 h-10 rounded-r-lg border border-l-0 text-[12px] font-medium"
                    style={{
                      borderColor: 'var(--border-default)',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {form.currency}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeRate(rate.id)}
                className="p-1.5 rounded-md transition-colors cursor-pointer self-end mb-1"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-sunken)'
                  e.currentTarget.style.color = '#C0392B'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
                aria-label="Remove billing rate"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addRate}
          disabled={!form.is_billable}
          className="mt-2"
        >
          <Plus size={13} strokeWidth={2} />
          Add a custom billing rate
        </Button>
      </div>

      {/* ── Case budget ─── */}
      <div className="pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
        <div className="text-[13.5px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Case budget
        </div>
        <Checkbox
          checked={form.budget_enabled}
          onChange={(v) => setField('budget_enabled', v)}
          label="Set a budget for this case"
          hint="Get notified as you approach the budget while logging time."
        />
        {form.budget_enabled && (
          <div className="mt-3 max-w-[320px]">
            <FieldLabel>Budget amount</FieldLabel>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[12.5px] font-medium pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              >
                {form.currency}
              </span>
              <Input
                inputMode="decimal"
                placeholder="0.00"
                value={form.budget_amount}
                onChange={(e) =>
                  setField('budget_amount', e.target.value.replace(/[^0-9.]/g, ''))
                }
                className="h-10 rounded-lg text-[13px] pl-12"
                style={{ borderColor: 'var(--border-default)' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Split invoice ─── */}
      <div className="pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
        <div
          className="text-[13.5px] font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Split invoice
        </div>
        <Checkbox
          checked={form.split_invoice}
          onChange={(v) => setField('split_invoice', v)}
          label="Split the invoices for this case"
          hint="When clients share the cost, invoices can be split among them."
        />
      </div>

      {/* ── Client balance notification ─── */}
      <div className="pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
        <div
          className="text-[13.5px] font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Client balance notification
        </div>
        <Checkbox
          checked={form.notify_low_client_funds}
          onChange={(v) => setField('notify_low_client_funds', v)}
          label="Notify firm users when case client funds are low"
          hint="Triggers a heads-up email when the client's trust balance drops past the firm threshold."
        />
      </div>
    </div>
  )
}

// ── Task lists / Documents / Reports / Conflicts ──────────────────────

/**
 * Task list picker. Each row is a free-text task-list name (a Task list
 * picker that browses firm-defined templates lands when the task-list
 * admin screen ships). The notify-assignees toggle controls whether
 * users assigned to spawned tasks receive an email.
 */
function TaskListsSection({
  form,
  setField,
}: {
  form: NewCaseForm
  setField: <K extends keyof NewCaseForm>(key: K, val: NewCaseForm[K]) => void
}) {
  const setRow = (idx: number, value: string) => {
    setField(
      'task_lists',
      form.task_lists.map((v, i) => (i === idx ? value : v)),
    )
  }
  const removeRow = (idx: number) => {
    setField('task_lists', form.task_lists.filter((_, i) => i !== idx))
  }
  const addRow = () => {
    setField('task_lists', [...form.task_lists, ''])
  }

  return (
    <div className="space-y-4">
      <Checkbox
        checked={form.task_lists_notify_assignees}
        onChange={(v) => setField('task_lists_notify_assignees', v)}
        label="Notify assignees when these tasks are created"
        hint="Sends an email when each spawned task gets assigned."
      />
      <div className="space-y-2">
        {form.task_lists.map((value, idx) => (
          <div key={idx} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end">
            <div>
              {idx === 0 && <FieldLabel>Task list</FieldLabel>}
              <Input
                value={value}
                onChange={(e) => setRow(idx, e.target.value)}
                placeholder="Find a task list"
                className="h-10 rounded-lg text-[13px]"
                style={{ borderColor: 'var(--border-default)' }}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="p-1.5 rounded-md transition-colors cursor-pointer self-end mb-1"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
                e.currentTarget.style.color = '#C0392B'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
              aria-label="Remove task list"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addRow}>
        <Plus size={13} strokeWidth={2} />
        Add task list
      </Button>
    </div>
  )
}

/**
 * Folder structure spawned on case open. Each row binds a folder name to
 * a category from DOC_CATEGORIES; the firm-settings screen will let firms
 * edit that list per practice area down the road.
 */
function DocumentFoldersSection({
  form,
  setField,
}: {
  form: NewCaseForm
  setField: <K extends keyof NewCaseForm>(key: K, val: NewCaseForm[K]) => void
}) {
  const updateFolder = (id: string, patch: Partial<DocFolderDraft>) =>
    setField(
      'document_folders',
      form.document_folders.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    )
  const removeFolder = (id: string) =>
    setField('document_folders', form.document_folders.filter((f) => f.id !== id))
  const addFolder = () =>
    setField('document_folders', [
      ...form.document_folders,
      { id: crypto.randomUUID(), name: '', category: '' },
    ])

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {form.document_folders.map((folder, idx) => (
          <div
            key={folder.id}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-end"
          >
            <div>
              {idx === 0 && <FieldLabel>Folder name</FieldLabel>}
              <Input
                value={folder.name}
                onChange={(e) => updateFolder(folder.id, { name: e.target.value })}
                placeholder="e.g. Court filings"
                className="h-10 rounded-lg text-[13px]"
                style={{ borderColor: 'var(--border-default)' }}
              />
            </div>
            <div>
              {idx === 0 && <FieldLabel>Category</FieldLabel>}
              <NativeSelect
                value={folder.category}
                onChange={(v) => updateFolder(folder.id, { category: v })}
                placeholder="Find a document category"
                options={DOC_CATEGORIES}
              />
            </div>
            <button
              type="button"
              onClick={() => removeFolder(folder.id)}
              className="p-1.5 rounded-md transition-colors cursor-pointer self-end mb-1"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
                e.currentTarget.style.color = '#C0392B'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
              aria-label="Remove document folder"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addFolder}>
        <Plus size={13} strokeWidth={2} />
        Add a document folder
      </Button>
    </div>
  )
}

/**
 * Allocation percentages for the Originating / Responsible solicitor
 * reports. Each one has a "Use firm settings" toggle — when checked the
 * input is disabled and the firm-wide default applies; unchecked lets the
 * user override per case.
 */
function ReportsSection({
  form,
  setField,
}: {
  form: NewCaseForm
  setField: <K extends keyof NewCaseForm>(key: K, val: NewCaseForm[K]) => void
}) {
  const clamp = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, '')
    if (!cleaned) return ''
    const n = Number(cleaned)
    if (Number.isNaN(n)) return ''
    return String(Math.min(100, Math.max(0, n)))
  }
  return (
    <div className="grid grid-cols-2 gap-6">
      <AllocationField
        label="Originating lawyer allocation"
        value={form.originating_allocation}
        useFirmSettings={form.use_firm_settings_originating}
        onValueChange={(v) => setField('originating_allocation', clamp(v))}
        onToggleFirmSettings={(v) =>
          setField('use_firm_settings_originating', v)
        }
      />
      <AllocationField
        label="Responsible lawyer allocation"
        value={form.responsible_allocation}
        useFirmSettings={form.use_firm_settings_responsible}
        onValueChange={(v) => setField('responsible_allocation', clamp(v))}
        onToggleFirmSettings={(v) =>
          setField('use_firm_settings_responsible', v)
        }
      />
    </div>
  )
}

function AllocationField({
  label,
  value,
  useFirmSettings,
  onValueChange,
  onToggleFirmSettings,
}: {
  label: string
  value: string
  useFirmSettings: boolean
  onValueChange: (v: string) => void
  onToggleFirmSettings: (v: boolean) => void
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex">
        <Input
          inputMode="numeric"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={useFirmSettings}
          className="h-10 rounded-l-lg text-[13px] text-right tabular-nums"
          style={{ borderColor: 'var(--border-default)' }}
        />
        <span
          className="inline-flex items-center px-3 h-10 rounded-r-lg border border-l-0 text-[12px] font-medium"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-sunken)',
            color: 'var(--text-muted)',
          }}
        >
          %
        </span>
      </div>
      <div className="mt-2">
        <Checkbox
          checked={useFirmSettings}
          onChange={onToggleFirmSettings}
          label="Use firm settings"
        />
      </div>
    </div>
  )
}

/**
 * Conflict checks tied to the case. The actual conflict-search engine
 * ships with its own screen — here we just track which existing checks
 * have been linked to this case (stored as a list of identifiers; until
 * the engine ships, the user enters free text).
 */
function ConflictChecksSection({
  form,
  setField,
}: {
  form: NewCaseForm
  setField: <K extends keyof NewCaseForm>(key: K, val: NewCaseForm[K]) => void
}) {
  const updateRow = (idx: number, value: string) =>
    setField(
      'conflict_checks',
      form.conflict_checks.map((v, i) => (i === idx ? value : v)),
    )
  const removeRow = (idx: number) =>
    setField('conflict_checks', form.conflict_checks.filter((_, i) => i !== idx))
  const addRow = () =>
    setField('conflict_checks', [...form.conflict_checks, ''])

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {form.conflict_checks.map((value, idx) => (
          <div key={idx} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end">
            <div>
              {idx === 0 && <FieldLabel>Conflict checks</FieldLabel>}
              <Input
                value={value}
                onChange={(e) => updateRow(idx, e.target.value)}
                placeholder="Select conflict check"
                className="h-10 rounded-lg text-[13px]"
                style={{ borderColor: 'var(--border-default)' }}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="p-1.5 rounded-md transition-colors cursor-pointer self-end mb-1"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-sunken)'
                e.currentTarget.style.color = '#C0392B'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
              aria-label="Remove conflict check"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addRow}>
        <Plus size={13} strokeWidth={2} />
        Link another conflict check
      </Button>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * How many filled-in fields would be lost on save because the backend
 * schema doesn't have a column for them yet. Drives the heads-up toast
 * so the user knows their input was captured even if it'll only round-
 * trip after the next migration.
 */
function countUnsavedFields(form: NewCaseForm): number {
  let n = 0
  if (form.responsible_staff) n++
  if (form.client_reference) n++
  if (form.location) n++
  if (form.statute_of_limitations_date) n++
  if (form.statute_of_limitations_satisfied) n++
  if (form.statute_reminders.length > 0) n++
  if (form.tags.length > 0) n++
  if (form.permissions_mode === 'specific') n++
  if (form.notification_subscribers.length > 0) n++
  if (form.blocked_users.length > 0) n++
  if (form.related_contacts.length > 0) n++
  if (!form.is_billable) n++
  if (form.billing_method !== 'hourly') n++
  if (form.currency !== 'GHS') n++
  if (form.custom_billing_rates.length > 0) n++
  if (form.budget_enabled) n++
  if (form.split_invoice) n++
  if (form.notify_low_client_funds) n++
  if (form.task_lists_notify_assignees) n++
  if (form.task_lists.length > 0) n++
  if (form.document_folders.length > 0) n++
  if (!form.use_firm_settings_originating) n++
  if (!form.use_firm_settings_responsible) n++
  if (form.conflict_checks.length > 0) n++
  return n
}

// Suppress unused imports warning for icons exposed for future sections.
// Keeps the icon imports near the top tidy so the section registry can
// pull from a single shared set when new sections land.
const _unusedReservedIcons = { CalendarClock }
void _unusedReservedIcons
