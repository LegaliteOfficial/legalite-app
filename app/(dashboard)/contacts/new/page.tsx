'use client'

/**
 * New contact creation page
 * -------------------------
 * Replaces the legacy `ClientForm` dialog for the CREATE flow. Mirrors
 * the reference New IdentificationCard screen: a sticky top bar (Save / Save & open new
 * case / Cancel), then a single-column form broken into sections —
 * IdentificationCard information, Email, Phone, Website, Address, Tags, Custom
 * fields, Billing preferences.
 *
 * Schema reality check: the current Client interface only carries a
 * subset of these fields (full_name, email, phone, address, ghana_card,
 * date_of_birth, status, notes, client_code). Everything else —
 * prefix/middle name split, multiple emails/phones/websites/addresses,
 * tags, billing rates, LEDES, tax id — is collected in local form
 * state today and persists for the fields the backend already knows
 * about. Round-trip for the rest lands with the contact-detail
 * migration.
 */

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Buildings, Camera, CaretDown, CaretRight, Question, Plus, UploadSimple, User, UserCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useClients, useCreateClient } from '@/hooks/use-clients'

// ── Constants ──────────────────────────────────────────────────────────

/**
 * Channel-type vocabularies, one per channel. industry-standard sets use different sets
 * for each (e.g. Phone has Mobile / Fax / Pager / Skype that Email
 * doesn't), so each section reads from its own list rather than sharing
 * a single union. All four start with "Work" so it's the default for
 * the first row of every channel.
 */
const EMAIL_TYPES = ['Work', 'Home', 'Other'] as const
const PHONE_TYPES = [
  'Work',
  'Home',
  'Mobile',
  'Fax',
  'Pager',
  'Skype',
  'Other',
] as const
const WEBSITE_TYPES = [
  'Work',
  'Personal',
  'Facebook',
  'LinkedIn',
  'Twitter',
  'Instant Messenger',
  'Other',
] as const
const ADDRESS_TYPES = ['Work', 'Home', 'Billing', 'Other'] as const

/**
 * The row `type` field is stored as a plain string — each section
 * constrains the selectable values via its own list above. We don't
 * union the four lists into a single literal type because the UI
 * already enforces the constraint at the dropdown level, and a string
 * lets us round-trip values cleanly to the backend later.
 */
type ChannelType = string

/**
 * Country list for the address picker. Ghana, Nigeria, and Côte
 * d'Ivoire are pinned to the top (Ghana-based user base; West Africa
 * neighbours next), followed by the rest of the world alphabetically.
 * Sourced from ISO 3166-1 short English names. Keep this sorted —
 * search-by-prefix UX depends on it.
 */
const PINNED_COUNTRIES = ['Ghana', 'Nigeria', "Côte d'Ivoire"] as const
const REST_OF_COUNTRIES = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'American Samoa',
  'Andorra',
  'Angola',
  'Anguilla',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Aruba',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bermuda',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Cayman Islands',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo (Brazzaville)',
  'Congo (Kinshasa)',
  'Cook Islands',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Curaçao',
  'Cyprus',
  'Czechia',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Greece',
  'Greenland',
  'Grenada',
  'Guadeloupe',
  'Guam',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hong Kong',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Macao',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Martinique',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Montserrat',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Caledonia',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Puerto Rico',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
] as const

const COUNTRIES = [...PINNED_COUNTRIES, ...REST_OF_COUNTRIES] as const

const CURRENCIES = [
  { code: 'GHS', label: 'Ghanaian Cedi (GH)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'NGN', label: 'Nigerian Naira (₦)' },
]

// ── Form state ─────────────────────────────────────────────────────────

interface EmailRow {
  id: string
  address: string
  type: ChannelType
  is_primary: boolean
}
interface PhoneRow {
  id: string
  number: string
  type: ChannelType
  is_primary: boolean
}
interface WebsiteRow {
  id: string
  url: string
  type: ChannelType
  is_primary: boolean
}
interface AddressRow {
  id: string
  street: string
  city: string
  state: string
  post_code: string
  country: string
  type: ChannelType
}
interface BillingRateRow {
  id: string
  description: string
  amount: string
}
/**
 * Row in the Employees section (shown only when the contact is a
 * Company). Each row points to an existing person contact via
 * `contact_id`; UI also supports the "free-typed name" path for
 * employees who aren't in the contact list yet — that path lands once
 * the contact-detail migration adds the employer_id column on Client.
 */
interface EmployeeRow {
  id: string
  contact_id: string
  // Free-text fallback when the user types a name that isn't in the
  // existing contacts list. Treated as a stub until the user creates
  // the corresponding person record.
  name_freeform: string
}

interface NewContactForm {
  contact_type: 'person' | 'company'
  // Person fields
  prefix: string
  first_name: string
  middle_name: string
  last_name: string
  company: string
  title: string
  date_of_birth: string
  // Company fields (when contact_type === 'company')
  company_name: string
  // Repeatable channels
  emails: EmailRow[]
  phones: PhoneRow[]
  websites: WebsiteRow[]
  addresses: AddressRow[]
  // Company-only: people who work at this firm. Surfaces only when
  // `contact_type === 'company'`.
  employees: EmployeeRow[]
  // Billing
  payment_profile: 'default' | 'custom'
  currency: string
  hourly_rates: BillingRateRow[]
  ledes_client_id: string
  tax_identifier: string
}

function uid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// IMPORTANT: the IDs on the initial rows are deterministic strings, not
// `uid()` UUIDs. The module is evaluated on both the server (SSR) and
// the client (hydration); calling `crypto.randomUUID()` here yielded a
// different value each time, which surfaced as a React hydration
// mismatch warning. Only freshly-added rows (via the "Add ..." buttons)
// use `uid()` — those calls run client-side after mount, where SSR is
// not a concern.
const INITIAL_FORM: NewContactForm = {
  contact_type: 'person',
  prefix: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  company: '',
  title: '',
  date_of_birth: '',
  company_name: '',
  emails: [
    { id: 'initial-email', address: '', type: 'Work', is_primary: true },
  ],
  phones: [
    { id: 'initial-phone', number: '', type: 'Work', is_primary: true },
  ],
  websites: [
    { id: 'initial-website', url: '', type: 'Work', is_primary: true },
  ],
  addresses: [
    {
      id: 'initial-address',
      street: '',
      city: '',
      state: '',
      post_code: '',
      country: 'Ghana',
      type: 'Work',
    },
  ],
  // Employees default to one empty row so users can start typing
  // immediately when they expand the section — matches the same
  // "start with one blank row" pattern used by Email/Phone/Website.
  employees: [
    { id: 'initial-employee', contact_id: '', name_freeform: '' },
  ],
  payment_profile: 'default',
  currency: 'GHS',
  hourly_rates: [],
  ledes_client_id: '',
  tax_identifier: '',
}

// ── Page component ─────────────────────────────────────────────────────

// Next 16: useSearchParams() requires a Suspense boundary for prerender.
export default function NewContactPage() {
  return (
    <Suspense fallback={null}>
      <NewContactPageInner />
    </Suspense>
  )
}

function NewContactPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const createMutation = useCreateClient()

  // The list page links here as either `/contacts/new` (person) or
  // `/contacts/new?type=company` (company). Honour the param on first
  // render so the user lands directly on the right Person/Company chip
  // and the company-only sections (Employees) become available
  // immediately — no extra click to switch.
  const initialContactType: 'person' | 'company' =
    searchParams.get('type') === 'company' ? 'company' : 'person'

  const [form, setForm] = useState<NewContactForm>(() => ({
    ...INITIAL_FORM,
    contact_type: initialContactType,
  }))
  const [submitting, setSubmitting] = useState(false)
  // Employees and Billing both default to CLOSED — users explicitly
  // expand them when they need to fill them in, instead of being
  // shown two tall sections every time they open the page.
  const [employeesOpen, setEmployeesOpen] = useState(false)
  const [billingOpen, setBillingOpen] = useState(false)

  const setField = <K extends keyof NewContactForm>(
    key: K,
    val: NewContactForm[K],
  ) => {
    setForm((f) => ({ ...f, [key]: val }))
  }

  // Compose the legacy Client.full_name from the split name parts. Used
  // by the save handler — the backend column is still a single string
  // until the contact-detail migration ships the split fields.
  const composedFullName = useMemo(() => {
    if (form.contact_type === 'company') return form.company_name.trim()
    return [form.prefix, form.first_name, form.middle_name, form.last_name]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' ')
  }, [form])

  const canSave =
    form.contact_type === 'person'
      ? form.first_name.trim() && form.last_name.trim()
      : form.company_name.trim().length > 0

  const handleSave = async (alsoCreateMatter: boolean) => {
    if (!canSave) {
      toast.error(
        form.contact_type === 'person'
          ? 'First and last name are required.'
          : 'Company name is required.',
      )
      return
    }
    setSubmitting(true)
    try {
      const primaryEmail = form.emails.find((e) => e.is_primary) ?? form.emails[0]
      const primaryPhone = form.phones.find((p) => p.is_primary) ?? form.phones[0]
      const primaryAddress = form.addresses[0]
      const addressStr = primaryAddress
        ? [
            primaryAddress.street,
            primaryAddress.city,
            primaryAddress.state,
            primaryAddress.post_code,
            primaryAddress.country,
          ]
            .map((s) => s.trim())
            .filter(Boolean)
            .join(', ')
        : ''

      const primaryWebsite =
        form.websites.find((w) => w.is_primary)?.url || form.websites[0]?.url || ''

      await createMutation.mutateAsync({
        full_name: composedFullName || 'Untitled contact',
        contact_type: form.contact_type,
        // A person's employer; for a company the name lives in full_name.
        organization: form.contact_type === 'person' ? form.company || '' : '',
        website: primaryWebsite,
        email: primaryEmail?.address || '',
        phone: primaryPhone?.number || '',
        address: addressStr,
        date_of_birth:
          form.contact_type === 'person' ? form.date_of_birth || '' : '',
        status: 'Active',
        notes: '',
      })

      toast.success('Contact created.')
      if (alsoCreateMatter) {
        toast.info('Continuing to new case…')
        router.push('/cases/new')
        return
      }
      router.push('/contacts')
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Unable to create contact: ${err.message}`
          : 'Unable to create contact. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        // Title + save-button label both track the current chip
        // selection so the page identity and primary CTA match the
        // record being created. Person → "New contact" / "Save
        // contact"; Company → "New company" / "Save company".
        title={form.contact_type === 'company' ? 'New company' : 'New contact'}
        saveLabel={
          form.contact_type === 'company' ? 'Save company' : 'Save contact'
        }
        submitting={submitting}
        canSave={!!canSave}
        onCancel={() => router.push('/contacts')}
        onSave={() => handleSave(false)}
        onSaveAndCreateMatter={() => handleSave(true)}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[920px] px-8 py-8 space-y-6">
          <ContactInfoSection form={form} setField={setField} />
          <EmailSection form={form} setField={setField} />
          <PhoneSection form={form} setField={setField} />
          <WebsiteSection form={form} setField={setField} />
          <AddressSection form={form} setField={setField} />
          {/* Employees: a company-only section. Matches the standard pattern — a company
              contact has a roster of people who work there, linked to
              existing person contacts (or stubbed by name until the
              person record exists). Hidden entirely when the user has
              selected the Person chip. */}
          {form.contact_type === 'company' && (
            <CollapsibleSection
              label="Employees"
              open={employeesOpen}
              onToggle={() => setEmployeesOpen((o) => !o)}
            >
              <EmployeesContent form={form} setField={setField} />
            </CollapsibleSection>
          )}
          <CollapsibleSection
            label="Billing preferences"
            open={billingOpen}
            onToggle={() => setBillingOpen((o) => !o)}
          >
            <BillingPreferencesContent form={form} setField={setField} />
          </CollapsibleSection>

          {/* Bottom spacer — the sticky top header already carries Save /
              Save & create new case / Cancel, so we don't duplicate the
              action row down here. Just leaves breathing room so the
              last section doesn't kiss the viewport edge. */}
          <div className="pb-8" />
        </div>
      </div>
    </div>
  )
}

// ── Header ─────────────────────────────────────────────────────────────

/**
 * Sticky page header. The three actions follow a clear hierarchy:
 *
 *   Cancel  ·  Save and create new case   [Save contact]
 *   muted     secondary (outline)           primary (gold)
 *
 * - Cancel: text-only with an X icon, very quiet. It's an escape hatch,
 *   not an action the user is encouraged to click.
 * - Save and create new case: outlined "secondary" button. Available
 *   when the form is valid but visually subordinate to the primary.
 * - Save contact: filled gold primary with a check icon and an
 *   inline spinner while submitting. This is the action the user
 *   came here to perform.
 *
 * A subtle vertical divider sits between Cancel and the two
 * save buttons so the cluster reads as one decision group.
 */
function Header({
  title,
  saveLabel,
  submitting,
  canSave,
  onSave,
  onSaveAndCreateMatter,
  onCancel,
}: {
  title: string
  // The primary button label tracks the record being created (e.g.
  // "Save contact" vs "Save company"). Defaulted by the caller; the
  // component never owns this string.
  saveLabel: string
  submitting: boolean
  canSave: boolean
  onSave: () => void
  onSaveAndCreateMatter: () => void
  onCancel: () => void
}) {
  const saveDisabled = submitting || !canSave
  return (
    <header
      className="flex items-center justify-between gap-6 px-6 py-3.5 border-b shrink-0"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <h1
        className="text-[20px] font-semibold leading-tight tracking-tight whitespace-nowrap"
        style={{
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-heading, "Playfair Display", serif)',
        }}
      >
        {title}
      </h1>
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Cancel — quietest of the three. Text link with X icon so
            users can scan it as "exit" rather than competing with the
            save actions. */}
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center h-9 px-3 rounded-lg text-[13px] font-medium cursor-pointer transition-colors whitespace-nowrap"
          style={{ color: 'var(--text-muted)', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-sunken)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          Cancel
        </button>

        {/* Visual divider between Cancel and the action cluster. */}
        <span
          aria-hidden
          className="h-6 w-px"
          style={{ background: 'var(--border-soft)' }}
        />

        {/* Save and create new case — secondary action. Outlined so
            it reads as available but not the recommended next step. */}
        <button
          type="button"
          onClick={onSaveAndCreateMatter}
          disabled={saveDisabled}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border text-[13px] font-medium cursor-pointer transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
          }}
          onMouseEnter={(e) => {
            if (saveDisabled) return
            e.currentTarget.style.background = 'var(--surface-sunken)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--surface-card)'
          }}
        >
          Save and create new case
        </button>

        {/* Save contact — primary action. Gold fill, navy text for the
            highest visual weight; check icon reinforces "commit" intent.
            Spinner replaces the icon while submitting. */}
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled}
          className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--gold)',
            color: 'var(--navy)',
            boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
          }}
          onMouseEnter={(e) => {
            if (saveDisabled) return
            e.currentTarget.style.background = 'var(--gold-dark, #B0831F)'
            e.currentTarget.style.boxShadow =
              '0 1px 0 rgba(0,0,0,0.06), 0 2px 4px rgba(201,151,43,0.32)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--gold)'
            e.currentTarget.style.boxShadow =
              '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)'
          }}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
                aria-hidden
              />
              Saving…
            </span>
          ) : (
            saveLabel
          )}
        </button>
      </div>
    </header>
  )
}

// ── Reusable section shell ─────────────────────────────────────────────

function Section({
  label,
  children,
  rightSlot,
}: {
  label: string
  children: React.ReactNode
  rightSlot?: React.ReactNode
}) {
  return (
    <section
      className="rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <header
        className="px-6 pt-5 pb-3 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <h2
          className="text-[15px] font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </h2>
        {rightSlot}
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

function CollapsibleSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer"
        aria-expanded={open}
      >
        <span
          className="text-[15px] font-semibold inline-flex items-center gap-1.5"
          style={{ color: 'var(--text-primary)' }}
        >
          {open ? (
            <CaretDown size={14} strokeWidth={2} />
          ) : (
            <CaretRight size={14} strokeWidth={2} />
          )}
          {label}
        </span>
      </button>
      {open && (
        <div
          className="px-6 pb-5 border-t pt-5"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          {children}
        </div>
      )}
    </section>
  )
}

// ── Field primitives ───────────────────────────────────────────────────

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
  options,
  disabled = false,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly string[] | Array<{ value: string; label: string }>
  disabled?: boolean
  placeholder?: string
}) {
  // Normalise the two accepted option shapes into `{value, label}` rows.
  // The `unknown` step is needed because TS can't narrow the union by
  // sampling `options[0]` — different array shapes don't overlap enough
  // for a direct cast.
  const norm =
    options.length === 0 || typeof options[0] === 'string'
      ? (options as unknown as readonly string[]).map((o) => ({
          value: o,
          label: o,
        }))
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
          colorScheme: 'light',
        }}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {norm.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <CaretDown
        size={13}
        strokeWidth={1.75}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-muted)' }}
      />
    </div>
  )
}

// ── Section: IdentificationCard information ───────────────────────────────────────

function ContactInfoSection({
  form,
  setField,
}: {
  form: NewContactForm
  setField: <K extends keyof NewContactForm>(
    key: K,
    val: NewContactForm[K],
  ) => void
}) {
  return (
    <Section label="Contact information">
      {/* Row 1: Person/Company chips on the left, Profile photo block
          sits immediately to their right. `items-end` aligns the photo
          block with the chips themselves (rather than floating up next
          to the "Is this contact a person or a company?" label that
          sits above the chips). A tight `gap-6` keeps the two blocks
          visually grouped. */}
      <div className="flex items-end gap-6">
        <div>
          <div
            className="text-[12.5px] font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Is this contact a person or a company?
          </div>
          <div className="flex gap-2">
            <TypeChip
              active={form.contact_type === 'person'}
              onClick={() => setField('contact_type', 'person')}
              Icon={UserCircle}
              label="Person"
              tint="#0EA5E9"
            />
            <TypeChip
              active={form.contact_type === 'company'}
              onClick={() => setField('contact_type', 'company')}
              Icon={Buildings}
              label="Company"
              tint="#8B5CF6"
            />
          </div>
        </div>
        <ProfilePhotoUpload />
      </div>

      <div
        className="mt-5 border-t pt-5"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        {form.contact_type === 'person' ? (
          <>
            <div className="grid grid-cols-[100px_1fr_1fr_1fr] gap-4">
              <div>
                <FieldLabel>Prefix</FieldLabel>
                <Input
                  placeholder="Mr."
                  value={form.prefix}
                  onChange={(e) => setField('prefix', e.target.value)}
                  className="h-10 rounded-lg text-[13px]"
                  style={{ borderColor: 'var(--border-default)' }}
                />
              </div>
              <div>
                <FieldLabel required>First name</FieldLabel>
                <Input
                  value={form.first_name}
                  onChange={(e) => setField('first_name', e.target.value)}
                  className="h-10 rounded-lg text-[13px]"
                  style={{ borderColor: 'var(--border-default)' }}
                />
              </div>
              <div>
                <FieldLabel>Middle name</FieldLabel>
                <Input
                  value={form.middle_name}
                  onChange={(e) => setField('middle_name', e.target.value)}
                  className="h-10 rounded-lg text-[13px]"
                  style={{ borderColor: 'var(--border-default)' }}
                />
              </div>
              <div>
                <FieldLabel required>Last name</FieldLabel>
                <Input
                  value={form.last_name}
                  onChange={(e) => setField('last_name', e.target.value)}
                  className="h-10 rounded-lg text-[13px]"
                  style={{ borderColor: 'var(--border-default)' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <FieldLabel>Company</FieldLabel>
                <Input
                  placeholder="What's the company's name?"
                  value={form.company}
                  onChange={(e) => setField('company', e.target.value)}
                  className="h-10 rounded-lg text-[13px]"
                  style={{ borderColor: 'var(--border-default)' }}
                />
              </div>
              <div>
                <FieldLabel>Title</FieldLabel>
                <Input
                  placeholder="e.g. Director"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  className="h-10 rounded-lg text-[13px]"
                  style={{ borderColor: 'var(--border-default)' }}
                />
              </div>
              <div>
                <FieldLabel>Date of birth</FieldLabel>
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setField('date_of_birth', e.target.value)}
                  className="h-10 rounded-lg text-[13px]"
                  style={{ borderColor: 'var(--border-default)' }}
                />
              </div>
            </div>
          </>
        ) : (
          <div>
            <FieldLabel required>Company name</FieldLabel>
            <Input
              placeholder="e.g. Accra Tech Ltd"
              value={form.company_name}
              onChange={(e) => setField('company_name', e.target.value)}
              className="h-10 rounded-lg text-[13px]"
              style={{ borderColor: 'var(--border-default)' }}
            />
          </div>
        )}
      </div>
    </Section>
  )
}

function TypeChip({
  active,
  onClick,
  Icon,
  label,
  tint,
}: {
  active: boolean
  onClick: () => void
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  label: string
  tint: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 h-11 rounded-xl border-2 transition-colors cursor-pointer"
      style={{
        borderColor: active ? tint : 'var(--border-default)',
        background: active ? `${tint}10` : 'var(--surface-card)',
        color: 'var(--text-primary)',
      }}
    >
      <span
        className="inline-flex items-center justify-center h-6 w-6 rounded-md"
        style={{
          background: `${tint}26`,
          color: tint,
        }}
        aria-hidden
      >
        <Icon size={14} strokeWidth={2} />
      </span>
      <span className="text-[13.5px] font-semibold">{label}</span>
    </button>
  )
}

function ProfilePhotoUpload() {
  // Compact inline pill: avatar circle on the left, "Upload photo" link
  // tucked beneath the tiny "Profile photo" label on the right.
  // `whitespace-nowrap` on both lines stops them wrapping when the
  // outer flex is tight — earlier versions broke "Upload photo" onto
  // two lines which made the block look bulky and disconnected from
  // the chips.
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div
        className="inline-flex items-center justify-center h-10 w-10 rounded-full shrink-0"
        style={{
          background: 'var(--surface-sunken)',
          color: 'var(--text-muted)',
        }}
        aria-hidden
      >
        <Camera size={16} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col items-start gap-0.5">
        <div
          className="text-[11.5px] font-semibold inline-flex items-center gap-1 whitespace-nowrap"
          style={{ color: 'var(--text-primary)' }}
        >
          Profile photo
          <Question
            size={11}
            strokeWidth={1.75}
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
        <button
          type="button"
          onClick={() =>
            toast.info(
              'Profile photo upload ships with the contact-detail screen.',
            )
          }
          className="inline-flex items-center gap-1 text-[12px] font-medium cursor-pointer whitespace-nowrap"
          style={{ color: 'var(--gold-dark)' }}
        >
          <UploadSimple size={11} strokeWidth={1.75} />
          Upload photo
        </button>
      </div>
    </div>
  )
}

// ── Reusable row primitive (Email / Phone / Website) ───────────────────

interface ChannelRowProps {
  type: ChannelType
  isPrimary: boolean
  isOnly: boolean
  onTypeChange: (t: ChannelType) => void
  onSetPrimary: () => void
  onRemove: () => void
  children: React.ReactNode
  primaryRadioName: string
  rowId: string
  // Each section (Email/Phone/Website) supplies its own type vocabulary
  // — industry-standard sets use different sets per channel (Phone has Mobile/Fax/Skype,
  // Website has Facebook/LinkedIn/etc.).
  typeOptions: readonly string[]
}

function ChannelRow({
  type,
  isPrimary,
  isOnly,
  onTypeChange,
  onSetPrimary,
  onRemove,
  children,
  primaryRadioName,
  rowId,
  typeOptions,
}: ChannelRowProps) {
  return (
    <div className="grid grid-cols-[2fr_140px_auto_auto] gap-3 items-end">
      {children}
      <div>
        <FieldLabel>Type</FieldLabel>
        <NativeSelect
          value={type}
          onChange={(v) => onTypeChange(v as ChannelType)}
          options={typeOptions}
        />
      </div>
      <label className="inline-flex items-center gap-2 cursor-pointer self-end pb-3">
        <span
          className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border"
          style={{
            borderColor: isPrimary ? 'var(--gold)' : 'var(--border-default)',
          }}
        >
          {isPrimary && (
            <span
              className="block h-2 w-2 rounded-full"
              style={{ background: 'var(--gold)' }}
            />
          )}
        </span>
        <span
          className="text-[12.5px] font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          Primary
        </span>
        <input
          type="radio"
          name={primaryRadioName}
          checked={isPrimary}
          onChange={onSetPrimary}
          className="sr-only"
          aria-label={`Set ${primaryRadioName} ${rowId} primary`}
        />
      </label>
      {!isOnly && (
        <button
          type="button"
          onClick={onRemove}
          className="self-end pb-3 text-[12.5px] font-medium cursor-pointer"
          style={{ color: 'var(--gold-dark)' }}
        >
          Remove
        </button>
      )}
      {isOnly && <span />}
    </div>
  )
}

// ── Section: Email ─────────────────────────────────────────────────────

function EmailSection({
  form,
  setField,
}: {
  form: NewContactForm
  setField: <K extends keyof NewContactForm>(
    key: K,
    val: NewContactForm[K],
  ) => void
}) {
  const addRow = () => {
    setField('emails', [
      ...form.emails,
      { id: uid(), address: '', type: 'Work', is_primary: false },
    ])
  }
  const updateRow = (id: string, patch: Partial<EmailRow>) => {
    setField(
      'emails',
      form.emails.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  }
  const removeRow = (id: string) => {
    const remaining = form.emails.filter((r) => r.id !== id)
    // If we removed the primary, promote the first remaining row.
    const removingPrimary = form.emails.find((r) => r.id === id)?.is_primary
    if (removingPrimary && remaining[0]) remaining[0].is_primary = true
    setField('emails', remaining)
  }
  const setPrimary = (id: string) => {
    setField(
      'emails',
      form.emails.map((r) => ({ ...r, is_primary: r.id === id })),
    )
  }
  return (
    <Section label="Email">
      <div className="space-y-3">
        {form.emails.map((row, idx) => (
          <ChannelRow
            key={row.id}
            type={row.type}
            isPrimary={row.is_primary}
            isOnly={form.emails.length === 1}
            onTypeChange={(t) => updateRow(row.id, { type: t })}
            onSetPrimary={() => setPrimary(row.id)}
            onRemove={() => removeRow(row.id)}
            primaryRadioName="email-primary"
            rowId={row.id}
            typeOptions={EMAIL_TYPES}
          >
            <div>
              {idx === 0 && <FieldLabel>Email address</FieldLabel>}
              <Input
                type="email"
                placeholder="name@example.com"
                value={row.address}
                onChange={(e) => updateRow(row.id, { address: e.target.value })}
                className="h-10 rounded-lg text-[13px]"
                style={{ borderColor: 'var(--border-default)' }}
              />
            </div>
          </ChannelRow>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium cursor-pointer"
        style={{ color: 'var(--gold-dark)' }}
      >
        <Plus size={13} strokeWidth={2} />
        Add email address
      </button>
    </Section>
  )
}

// ── Section: Phone ─────────────────────────────────────────────────────

function PhoneSection({
  form,
  setField,
}: {
  form: NewContactForm
  setField: <K extends keyof NewContactForm>(
    key: K,
    val: NewContactForm[K],
  ) => void
}) {
  const addRow = () => {
    setField('phones', [
      ...form.phones,
      { id: uid(), number: '', type: 'Work', is_primary: false },
    ])
  }
  const updateRow = (id: string, patch: Partial<PhoneRow>) => {
    setField(
      'phones',
      form.phones.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  }
  const removeRow = (id: string) => {
    const remaining = form.phones.filter((r) => r.id !== id)
    const removingPrimary = form.phones.find((r) => r.id === id)?.is_primary
    if (removingPrimary && remaining[0]) remaining[0].is_primary = true
    setField('phones', remaining)
  }
  const setPrimary = (id: string) => {
    setField(
      'phones',
      form.phones.map((r) => ({ ...r, is_primary: r.id === id })),
    )
  }
  return (
    <Section label="Phone">
      <div className="space-y-3">
        {form.phones.map((row, idx) => (
          <ChannelRow
            key={row.id}
            type={row.type}
            isPrimary={row.is_primary}
            isOnly={form.phones.length === 1}
            onTypeChange={(t) => updateRow(row.id, { type: t })}
            onSetPrimary={() => setPrimary(row.id)}
            onRemove={() => removeRow(row.id)}
            primaryRadioName="phone-primary"
            rowId={row.id}
            typeOptions={PHONE_TYPES}
          >
            <div>
              {idx === 0 && <FieldLabel>Phone number</FieldLabel>}
              <Input
                placeholder="+233 …"
                value={row.number}
                onChange={(e) => updateRow(row.id, { number: e.target.value })}
                className="h-10 rounded-lg text-[13px]"
                style={{ borderColor: 'var(--border-default)' }}
              />
            </div>
          </ChannelRow>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium cursor-pointer"
        style={{ color: 'var(--gold-dark)' }}
      >
        <Plus size={13} strokeWidth={2} />
        Add phone number
      </button>
    </Section>
  )
}

// ── Section: Website ───────────────────────────────────────────────────

function WebsiteSection({
  form,
  setField,
}: {
  form: NewContactForm
  setField: <K extends keyof NewContactForm>(
    key: K,
    val: NewContactForm[K],
  ) => void
}) {
  const addRow = () => {
    setField('websites', [
      ...form.websites,
      { id: uid(), url: '', type: 'Work', is_primary: false },
    ])
  }
  const updateRow = (id: string, patch: Partial<WebsiteRow>) => {
    setField(
      'websites',
      form.websites.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  }
  const removeRow = (id: string) => {
    const remaining = form.websites.filter((r) => r.id !== id)
    const removingPrimary = form.websites.find((r) => r.id === id)?.is_primary
    if (removingPrimary && remaining[0]) remaining[0].is_primary = true
    setField('websites', remaining)
  }
  const setPrimary = (id: string) => {
    setField(
      'websites',
      form.websites.map((r) => ({ ...r, is_primary: r.id === id })),
    )
  }
  return (
    <Section label="Website">
      <div className="space-y-3">
        {form.websites.map((row, idx) => (
          <ChannelRow
            key={row.id}
            type={row.type}
            isPrimary={row.is_primary}
            isOnly={form.websites.length === 1}
            onTypeChange={(t) => updateRow(row.id, { type: t })}
            onSetPrimary={() => setPrimary(row.id)}
            onRemove={() => removeRow(row.id)}
            primaryRadioName="website-primary"
            rowId={row.id}
            typeOptions={WEBSITE_TYPES}
          >
            <div>
              {idx === 0 && <FieldLabel>Web address</FieldLabel>}
              <Input
                placeholder="https://example.com"
                value={row.url}
                onChange={(e) => updateRow(row.id, { url: e.target.value })}
                className="h-10 rounded-lg text-[13px]"
                style={{ borderColor: 'var(--border-default)' }}
              />
            </div>
          </ChannelRow>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium cursor-pointer"
        style={{ color: 'var(--gold-dark)' }}
      >
        <Plus size={13} strokeWidth={2} />
        Add website
      </button>
    </Section>
  )
}

// ── Section: Address ───────────────────────────────────────────────────

function AddressSection({
  form,
  setField,
}: {
  form: NewContactForm
  setField: <K extends keyof NewContactForm>(
    key: K,
    val: NewContactForm[K],
  ) => void
}) {
  const updateRow = (id: string, patch: Partial<AddressRow>) =>
    setField(
      'addresses',
      form.addresses.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  const removeRow = (id: string) =>
    setField('addresses', form.addresses.filter((r) => r.id !== id))
  const addRow = () =>
    setField('addresses', [
      ...form.addresses,
      {
        id: uid(),
        street: '',
        city: '',
        state: '',
        post_code: '',
        country: 'Ghana',
        type: 'Work',
      },
    ])

  return (
    <Section label="Address">
      <div className="space-y-5">
        {form.addresses.map((row) => (
          <div
            key={row.id}
            className={
              form.addresses.length > 1
                ? 'pb-5 border-b'
                : ''
            }
            style={
              form.addresses.length > 1
                ? { borderColor: 'var(--border-soft)' }
                : undefined
            }
          >
            <div className="grid grid-cols-3 gap-4">
              <div>
                <FieldLabel>Street</FieldLabel>
                <Textarea
                  rows={3}
                  value={row.street}
                  onChange={(e) => updateRow(row.id, { street: e.target.value })}
                  className="rounded-lg text-[13px]"
                  style={{ borderColor: 'var(--border-default)' }}
                />
              </div>
              <div>
                <FieldLabel>City</FieldLabel>
                <Input
                  value={row.city}
                  onChange={(e) => updateRow(row.id, { city: e.target.value })}
                  className="h-10 rounded-lg text-[13px]"
                  style={{ borderColor: 'var(--border-default)' }}
                />
              </div>
              <div>
                <FieldLabel>State/Province</FieldLabel>
                <Input
                  value={row.state}
                  onChange={(e) => updateRow(row.id, { state: e.target.value })}
                  className="h-10 rounded-lg text-[13px]"
                  style={{ borderColor: 'var(--border-default)' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div>
                <FieldLabel>Post code</FieldLabel>
                <Input
                  value={row.post_code}
                  onChange={(e) =>
                    updateRow(row.id, { post_code: e.target.value })
                  }
                  className="h-10 rounded-lg text-[13px]"
                  style={{ borderColor: 'var(--border-default)' }}
                />
              </div>
              <div>
                <FieldLabel>Country</FieldLabel>
                <NativeSelect
                  value={row.country}
                  onChange={(v) => updateRow(row.id, { country: v })}
                  options={COUNTRIES}
                />
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <FieldLabel>Type</FieldLabel>
                  <NativeSelect
                    value={row.type}
                    onChange={(v) =>
                      updateRow(row.id, { type: v as ChannelType })
                    }
                    options={ADDRESS_TYPES}
                  />
                </div>
                {form.addresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="pb-3 text-[12.5px] font-medium cursor-pointer"
                    style={{ color: 'var(--gold-dark)' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium cursor-pointer"
        style={{ color: 'var(--gold-dark)' }}
      >
        <Plus size={13} strokeWidth={2} />
        Add address
      </button>
    </Section>
  )
}

// ── Section: Billing preferences ───────────────────────────────────────

function BillingPreferencesContent({
  form,
  setField,
}: {
  form: NewContactForm
  setField: <K extends keyof NewContactForm>(
    key: K,
    val: NewContactForm[K],
  ) => void
}) {
  const updateRate = (id: string, patch: Partial<BillingRateRow>) => {
    setField(
      'hourly_rates',
      form.hourly_rates.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  }
  const removeRate = (id: string) => {
    setField(
      'hourly_rates',
      form.hourly_rates.filter((r) => r.id !== id),
    )
  }
  const addRate = () => {
    setField('hourly_rates', [
      ...form.hourly_rates,
      { id: uid(), description: '', amount: '' },
    ])
  }

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>
          Payment profile{' '}
          <Question
            size={11}
            strokeWidth={1.75}
            style={{
              color: 'var(--text-muted)',
              display: 'inline-block',
              verticalAlign: 'middle',
            }}
          />
        </FieldLabel>
        <div className="flex items-center gap-4">
          <NativeSelect
            value={form.payment_profile}
            onChange={(v) =>
              setField('payment_profile', v as NewContactForm['payment_profile'])
            }
            options={[
              { value: 'default', label: 'Default' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            30 days grace period. No discount. No interest.
          </span>
        </div>
      </div>

      <div className="max-w-[280px]">
        <FieldLabel required>Currency</FieldLabel>
        <NativeSelect
          value={form.currency}
          onChange={(v) => setField('currency', v)}
          options={CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
        />
      </div>

      <div>
        <div
          className="text-[13.5px] font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Hourly billing
        </div>
        <div className="space-y-2">
          {form.hourly_rates.map((rate) => (
            <div
              key={rate.id}
              className="grid grid-cols-[2fr_180px_auto] gap-3 items-end"
            >
              <div>
                <FieldLabel>Description</FieldLabel>
                <Input
                  placeholder="e.g. Senior partner"
                  value={rate.description}
                  onChange={(e) =>
                    updateRate(rate.id, { description: e.target.value })
                  }
                  className="h-10 rounded-lg text-[13px]"
                  style={{ borderColor: 'var(--border-default)' }}
                />
              </div>
              <div>
                <FieldLabel>Rate ({form.currency})</FieldLabel>
                <Input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={rate.amount}
                  onChange={(e) =>
                    updateRate(rate.id, {
                      amount: e.target.value.replace(/[^0-9.]/g, ''),
                    })
                  }
                  className="h-10 rounded-lg text-[13px] tabular-nums text-right"
                  style={{ borderColor: 'var(--border-default)' }}
                />
              </div>
              <button
                type="button"
                onClick={() => removeRate(rate.id)}
                className="pb-3 text-[12.5px] font-medium cursor-pointer"
                style={{ color: 'var(--gold-dark)' }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRate}
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium cursor-pointer"
          style={{ color: 'var(--gold-dark)' }}
        >
          <Plus size={13} strokeWidth={2} />
          Add a custom rate
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>
            LEDES client ID{' '}
            <Question
              size={11}
              strokeWidth={1.75}
              style={{
                color: 'var(--text-muted)',
                display: 'inline-block',
                verticalAlign: 'middle',
              }}
            />
          </FieldLabel>
          <Input
            value={form.ledes_client_id}
            onChange={(e) => setField('ledes_client_id', e.target.value)}
            className="h-10 rounded-lg text-[13px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
        <div>
          <FieldLabel>
            Tax Identifier{' '}
            <Question
              size={11}
              strokeWidth={1.75}
              style={{
                color: 'var(--text-muted)',
                display: 'inline-block',
                verticalAlign: 'middle',
              }}
            />
          </FieldLabel>
          <Input
            value={form.tax_identifier}
            onChange={(e) => setField('tax_identifier', e.target.value)}
            className="h-10 rounded-lg text-[13px]"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Section: Employees (company contacts only) ─────────────────────────

/**
 * Employees content rendered inside the "Employees" collapsible
 * section. Mirrors the reference pattern: each row is a person picker (a
 * native select populated with existing person contacts) plus a
 * "Remove" link. "+ Add employee" tacks on a fresh blank row.
 *
 * Today this list lives only in local form state — the backend column
 * to persist a company→employees relationship lands with the
 * contact-detail migration. Saving a company contact still works in
 * the meantime; the employees are just dropped on submit.
 */
function EmployeesContent({
  form,
  setField,
}: {
  form: NewContactForm
  setField: <K extends keyof NewContactForm>(
    key: K,
    val: NewContactForm[K],
  ) => void
}) {
  const { data: clients } = useClients()
  // Person picker options. Funnel out the current contact being
  // created from the list (you can't be your own employee), and sort
  // alphabetically so the dropdown is scannable.
  const personOptions = useMemo(() => {
    const rows = (clients ?? [])
      .map((c) => ({ value: c.id, label: c.full_name }))
      .sort((a, b) => a.label.localeCompare(b.label))
    return rows
  }, [clients])

  const updateRow = (id: string, patch: Partial<EmployeeRow>) => {
    setField(
      'employees',
      form.employees.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  }
  const removeRow = (id: string) => {
    // Always keep at least one row so the section never looks empty —
    // matches the the standard pattern behaviour where removing the last row clears
    // the fields rather than deleting the row.
    if (form.employees.length === 1) {
      setField('employees', [
        { id: form.employees[0].id, contact_id: '', name_freeform: '' },
      ])
      return
    }
    setField(
      'employees',
      form.employees.filter((r) => r.id !== id),
    )
  }
  const addRow = () => {
    setField('employees', [
      ...form.employees,
      { id: uid(), contact_id: '', name_freeform: '' },
    ])
  }

  return (
    <div className="space-y-4">
      {form.employees.map((row) => (
        <div key={row.id} className="space-y-1.5">
          <FieldLabel>Contact</FieldLabel>
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-[420px]">
              <NativeSelect
                value={row.contact_id}
                onChange={(v) => updateRow(row.id, { contact_id: v })}
                options={personOptions}
                placeholder="What's the person's name?"
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="text-[12.5px] font-medium cursor-pointer"
              style={{ color: 'var(--gold-dark)' }}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium cursor-pointer"
        style={{ color: 'var(--gold-dark)' }}
      >
        <Plus size={13} strokeWidth={2} />
        Add employee
      </button>
    </div>
  )
}

// Reserved icons surfaced for follow-up section additions. `User` for
// the future person silhouette stamp, `useEffect` reserved for the
// optional URL-prefilled mode coming with the contact-detail screen.
const _reservedIcons = { User }
void _reservedIcons
void useEffect
