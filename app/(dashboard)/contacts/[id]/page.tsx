'use client'

/**
 * IdentificationCard detail page (industry-standard)
 * ----------------------------------
 * Full-screen detail view for a single contact. Top bar carries the
 * contact avatar, full name, and three header actions (Quick bill,
 * New client funds request, Edit contact). Below the tabs sits a
 * two-column dashboard:
 *
 *   Left column   →  IdentificationCard information · Custom fields · Billing information
 *   Right column  →  Client's cases · Associated cases
 *
 * Each card is a `<CollapsibleCard>` that opens by default; the chevron
 * in the header collapses/expands. Tabs other than Dashboard are stubs
 * that toast a "coming next" message until those screens ship.
 *
 * Data sources:
 *   - `useClient(id)` for the contact record
 *   - `useCases()` filtered by `client_id` for the cases panel
 *
 * Edit IdentificationCard today routes to /contacts/new with the contact id; once
 * the contact-detail form lands as an in-place edit modal we'll swap
 * to that.
 */

import { use, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, TextB, Buildings, CaretDown, CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight, Columns, Copy, DownloadSimple, Funnel, FolderOpen, HighlighterCircle, TextItalic, Link as LinkIcon, List, ListNumbers, Envelope, Pause, Phone, Play, Plus, ArrowUUpRight, MagnifyingGlass, TextUnderline, ArrowUUpLeft, UserCircle, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapUnderline from '@tiptap/extension-underline'
import TiptapHighlight from '@tiptap/extension-highlight'
import TiptapLink from '@tiptap/extension-link'
import TiptapPlaceholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth.store'
import { useClient } from '@/hooks/use-clients'
import { useCases } from '@/hooks/use-cases'
import { useCreateDocument, useDocuments } from '@/hooks/use-documents'
import { useInvoices } from '@/hooks/use-invoices'
import { useUIStore } from '@/stores/ui.store'
import type { Case, Document, Invoice } from '@/types'

// ── Constants ──────────────────────────────────────────────────────────

/**
 * Tabs shown above the dashboard panels. Mirrors the reference set minus
 * an external portal — that's a vendor-specific portal we won't ship.
 */
const TABS = [
  'Dashboard',
  'Documents',
  'Bills',
  'Transactions',
  'Communications',
  'Notes',
] as const
type Tab = (typeof TABS)[number]

/**
 * Same palette as the contacts list type-filter pills — sky-blue for
 * people, violet for companies. Keep these in sync with the list
 * page so a contact's avatar tint is identical across screens.
 */
const TYPE_BADGE_PEOPLE = '#0EA5E9'
const TYPE_BADGE_COMPANIES = '#8B5CF6'

// ── Page component ─────────────────────────────────────────────────────

export default function ContactDetailPage({
  params,
}: {
  // Next 16's App Router exposes route params as a Promise. We unwrap
  // it with React's `use()` so this client component reads `id` as a
  // plain string, matching the prior synchronous-params ergonomics.
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { openModal } = useUIStore()

  const { data: contact, isLoading, error } = useClient(id)
  const { data: cases } = useCases()

  const [tab, setTab] = useState<Tab>('Dashboard')

  // ── Derived data ─────────────────────────────────────────────────
  // The current schema treats every Client as a person; once a
  // `contact_type` column ships the tint flips for companies.
  const isCompany = false
  const tint = isCompany ? TYPE_BADGE_COMPANIES : TYPE_BADGE_PEOPLE

  const initials = useMemo(() => {
    if (!contact?.full_name) return '?'
    return (
      contact.full_name
        .split(/\s+/)
        .filter(Boolean)
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?'
    )
  }, [contact?.full_name])

  // Cases linked to this contact. Funnel all-cases by client_id so the
  // panel doesn't need a dedicated GraphQL query yet.
  const clientCases = useMemo(() => {
    if (!cases || !contact) return [] as Case[]
    return cases.filter((c) => c.client_id === contact.id)
  }, [cases, contact])

  if (isLoading) return <PageSkeleton />
  if (error || !contact) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-12">
          <div
            className="mx-auto max-w-md rounded-2xl border px-8 py-10 text-center"
            style={{
              background: 'var(--surface-card)',
              borderColor: 'var(--border-soft)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <p
              className="text-[14px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {error ? 'Unable to load contact' : 'Contact not found'}
            </p>
            <p
              className="mt-1.5 text-[12.5px]"
              style={{ color: 'var(--text-muted)' }}
            >
              The contact may have been deleted or you may not have access.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/contacts')}
              className="mt-5"
            >
              Back to contacts
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ─── Sticky page header ─────────────────────────────────────── */}
      <header
        className="flex items-center justify-between gap-6 px-6 py-3.5 border-b shrink-0"
        style={{
          borderColor: 'var(--border-soft)',
          background: 'var(--surface-card)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {/* Avatar + name. Tint matches the contacts list pills/avatars. */}
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="inline-flex items-center justify-center h-9 w-9 rounded-full text-[12px] font-semibold shrink-0"
            style={{ background: `${tint}26`, color: tint }}
            aria-hidden
          >
            {isCompany ? (
              <Buildings size={16} strokeWidth={2} />
            ) : (
              initials
            )}
          </span>
          <h1
            className="text-[20px] font-semibold leading-tight tracking-tight truncate"
            style={{
              color: 'var(--text-primary)',
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            {contact.full_name || 'Untitled contact'}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <HeaderBtn
            onClick={() =>
              toast.info(
                `Bill for ${contact.full_name} — opens once the billing screen ships.`,
              )
            }
          >
            Bill
          </HeaderBtn>
          <HeaderBtn
            onClick={() =>
              toast.info('Client funds requests ship with the trust module.')
            }
          >
            New client funds request
          </HeaderBtn>
          {/* Primary action — gold pill, matches the New IdentificationCard page
              Save button so the design language is consistent. */}
          <button
            type="button"
            onClick={() => openModal({ type: 'editClient', id: contact.id })}
            className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap"
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
              boxShadow:
                '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                'var(--gold-dark, #B0831F)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--gold)'
            }}
          >
            Edit contact
          </button>
        </div>
      </header>

      {/* ─── Scrolling body: tabs + two-column dashboard ─────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1180px] px-6 py-6">
          {/* Tabs strip. Dashboard + Documents are wired today; others
              stub a toast until those screens ship. */}
          <div
            className="flex items-end gap-1 border-b mb-6"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            {TABS.map((t) => (
              <TabButton
                key={t}
                active={tab === t}
                onClick={() => {
                  if (
                    t === 'Dashboard' ||
                    t === 'Documents' ||
                    t === 'Bills' ||
                    t === 'Transactions' ||
                    t === 'Communications' ||
                    t === 'Notes'
                  ) {
                    setTab(t)
                    return
                  }
                  toast.info(`${t} is coming next.`)
                }}
              >
                {t}
              </TabButton>
            ))}
          </div>

          {tab === 'Documents' ? (
            <DocumentsTab contactId={contact.id} />
          ) : tab === 'Bills' ? (
            <BillsTab contactId={contact.id} />
          ) : tab === 'Transactions' ? (
            <TransactionsTab contactId={contact.id} />
          ) : tab === 'Communications' ? (
            <CommunicationsTab contactId={contact.id} />
          ) : tab === 'Notes' ? (
            <NotesTab contact={contact} />
          ) : (
            // Body. Two-column grid on lg+, single-column on small.
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
            <div className="space-y-5">
              <ContactInformationCard contact={contact} />
              <BillingInformationCard />
            </div>
            <div className="space-y-5">
              <CasesCard
                title="Client's cases"
                cases={clientCases}
                emptyText="This contact has no cases yet."
                primaryActionLabel="New case"
                onPrimaryAction={() =>
                  router.push(`/cases/new?client=${contact.id}`)
                }
              />
              <AssociatedCasesCard contactId={contact.id} />
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────

function HeaderBtn({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  // Outline-style secondary action — outline matches the "Save and
  // create new case" treatment on /contacts/new so the design system
  // is consistent.
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center h-9 px-3.5 rounded-lg border text-[13px] font-medium cursor-pointer transition-colors whitespace-nowrap"
      style={{
        borderColor: 'var(--border-default)',
        background: 'var(--surface-card)',
        color: 'var(--text-primary)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-sunken)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--surface-card)'
      }}
    >
      {children}
    </button>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative px-4 py-2.5 text-[13.5px] font-medium transition-colors cursor-pointer"
      style={{
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      }}
    >
      {children}
      {active && (
        <span
          className="absolute left-3 right-3 -bottom-px h-[2px] rounded-t"
          style={{ background: 'var(--gold)' }}
        />
      )}
    </button>
  )
}

/**
 * Reusable collapsible card used by every dashboard panel. Mirrors
 * the reference chevron-on-the-left, label-bold, optional right-slot layout.
 */
function CollapsibleCard({
  label,
  defaultOpen = true,
  rightSlot,
  children,
}: {
  label: string
  defaultOpen?: boolean
  rightSlot?: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section
      className="rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <header className="flex items-center justify-between px-5 py-3.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold cursor-pointer"
          style={{ color: 'var(--text-primary)' }}
          aria-expanded={open}
        >
          {open ? (
            <CaretDown size={14} strokeWidth={2} />
          ) : (
            <CaretRight size={14} strokeWidth={2} />
          )}
          {label}
        </button>
        {rightSlot}
      </header>
      {open && (
        <div
          className="px-5 pb-5 border-t pt-4"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          {children}
        </div>
      )}
    </section>
  )
}

/**
 * Detail card showing the contact's structured info. Composes a
 * single-line address from the legacy `address` string column (the
 * contact-detail migration will swap this for structured address
 * sub-fields).
 */
function ContactInformationCard({
  contact,
}: {
  contact: NonNullable<ReturnType<typeof useClient>['data']>
}) {
  const copy = (value: string, label: string) => {
    void navigator.clipboard.writeText(value)
    toast.success(`${label} copied to clipboard.`)
  }
  return (
    <CollapsibleCard
      label="Contact information"
      rightSlot={
        <button
          type="button"
          onClick={() =>
            copy(
              [
                contact.full_name,
                contact.email,
                contact.phone,
                contact.address,
              ]
                .filter(Boolean)
                .join('\n'),
              'Contact info',
            )
          }
          className="inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-sunken)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          aria-label="Copy contact information"
        >
          <Copy size={13} strokeWidth={1.75} />
        </button>
      }
    >
      <dl className="space-y-3 text-[13px]">
        <Row label="Client ID" value={contact.client_code ?? null} />
        <Row label="Phone" value={contact.phone ?? null} suffix="Work" />
        <Row
          label="Email"
          value={contact.email ?? null}
          suffix="Work"
          href={contact.email ? `mailto:${contact.email}` : undefined}
        />
        <Row label="Ghana card" value={contact.ghana_card ?? null} />
        <Row
          label="Address"
          value={contact.address ?? null}
          suffix="Work"
          multiline
        />
        <Row
          label="Date of birth"
          value={
            contact.date_of_birth
              ? new Date(contact.date_of_birth).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : null
          }
        />
      </dl>
    </CollapsibleCard>
  )
}

/**
 * Two-column label/value row. Falls back to an em-dash when the value
 * is missing so the column alignment stays clean.
 */
function Row({
  label,
  value,
  suffix,
  href,
  multiline,
}: {
  label: string
  value: string | null
  suffix?: string
  href?: string
  multiline?: boolean
}) {
  const dash = (
    <span style={{ color: 'var(--text-subtle)' }}>—</span>
  )
  const body = value ? (
    href ? (
      <a
        href={href}
        className="underline decoration-transparent hover:decoration-current"
        style={{ color: 'var(--gold-dark)' }}
      >
        {value}
      </a>
    ) : (
      <span
        style={{
          color: 'var(--text-primary)',
          whiteSpace: multiline ? 'pre-line' : undefined,
        }}
      >
        {value}
      </span>
    )
  ) : (
    dash
  )
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-3">
      <dt
        className="text-[12.5px] font-medium leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </dt>
      <dd className="text-[13px] leading-relaxed">
        {body}
        {suffix && value && (
          <span
            className="ml-1.5 text-[12px]"
            style={{ color: 'var(--text-subtle)' }}
          >
            ({suffix})
          </span>
        )}
      </dd>
    </div>
  )
}

function BillingInformationCard() {
  // Stub values until the contact-detail migration lands billing
  // columns on Client. Today we surface the structure with em-dashes
  // so users can see the shape of what's coming.
  return (
    <CollapsibleCard
      label="Billing information"
      rightSlot={
        <Button
          size="sm"
          onClick={() =>
            toast.info('Billing settings ship with the billing screen.')
          }
        >
          Manage
        </Button>
      }
    >
      <dl className="space-y-3 text-[13px]">
        <Row label="LEDES client ID" value={null} />
        <Row label="Tax identifier" value={null} />
        <Row label="Payment profile" value="Default (30 days)" />
        <Row label="Rates" value={null} />
        <Row label="Currency" value="GHS" />
        <Row label="Payment method" value={null} />
      </dl>
    </CollapsibleCard>
  )
}

/**
 * Cases panel — one row per case linked to the contact via
 * `client_id`. Renders an inline empty state with a "New case" CTA
 * when the contact has no cases yet.
 */
function CasesCard({
  title,
  cases,
  emptyText,
  primaryActionLabel,
  onPrimaryAction,
}: {
  title: string
  cases: Case[]
  emptyText: string
  primaryActionLabel: string
  onPrimaryAction: () => void
}) {
  return (
    <CollapsibleCard label={title}>
      {cases.length === 0 ? (
        <div className="py-2 text-center">
          <p
            className="text-[12.5px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {emptyText}
          </p>
          <Button size="sm" className="mt-4" onClick={onPrimaryAction}>
            <Plus size={13} strokeWidth={2} />
            {primaryActionLabel}
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {cases.map((c) => (
            <li key={c.id}>
              <a
                href={`/cases/${c.id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                style={{
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'var(--surface-overlay)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    'var(--surface-sunken)'
                }}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-flex items-center justify-center h-6 w-6 rounded-md shrink-0"
                    style={{
                      background: 'rgba(201,151,43,0.12)',
                      color: 'var(--gold-dark)',
                    }}
                    aria-hidden
                  >
                    <UserCircle size={12} strokeWidth={1.75} />
                  </span>
                  <span className="text-[13px] font-medium truncate">
                    {c.title}
                  </span>
                </span>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium shrink-0"
                  style={{
                    background:
                      c.status === 'Open'
                        ? 'rgba(34,197,94,0.12)'
                        : c.status === 'Closed'
                          ? 'var(--surface-sunken)'
                          : 'rgba(201,151,43,0.16)',
                    color:
                      c.status === 'Open'
                        ? '#16A34A'
                        : c.status === 'Closed'
                          ? 'var(--text-muted)'
                          : 'var(--gold-dark)',
                  }}
                >
                  {c.status}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </CollapsibleCard>
  )
}

/**
 * "Associated cases" panel — the reference variant of the cases card where
 * the contact appears in a related-contacts list rather than as the
 * primary client. We surface a toggle (All / Open) + Link case CTA,
 * following the standard pattern. Today the panel just shows an empty state because
 * we don't have a many-to-many `case_contacts` join table yet.
 */
function AssociatedCasesCard({ contactId }: { contactId: string }) {
  // Reserved for future use — the contactId will be wired through to
  // the case_contacts query once that table ships. Suppresses the
  // unused-arg lint until then.
  void contactId
  const [scope, setScope] = useState<'all' | 'open'>('all')
  return (
    <CollapsibleCard
      label="Associated cases"
      rightSlot={
        <div className="flex items-center gap-2">
          <div
            className="inline-flex rounded-md border overflow-hidden text-[12px] font-medium"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <ScopeBtn
              active={scope === 'all'}
              onClick={() => setScope('all')}
            >
              All
            </ScopeBtn>
            <ScopeBtn
              active={scope === 'open'}
              onClick={() => setScope('open')}
            >
              Open
            </ScopeBtn>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info(
                'Linking existing cases ships with the case-contacts table.',
              )
            }
          >
            Link case
          </Button>
        </div>
      }
    >
      <p
        className="text-[12.5px] py-2 text-center"
        style={{ color: 'var(--text-muted)' }}
      >
        This contact isn&rsquo;t associated with any cases.
      </p>
    </CollapsibleCard>
  )
}

function ScopeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 cursor-pointer transition-colors"
      style={{
        background: active ? 'var(--surface-sunken)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      }}
    >
      {children}
    </button>
  )
}

// ── Documents tab ──────────────────────────────────────────────────────

/**
 * Document column registry — the set of columns the picker can toggle.
 * Some fields (Size / Author / Uploaded by / Comments) aren't in our
 * Document schema yet, so they render em-dashes today. Keeping them in
 * the registry means the picker UI matches the standard pattern one-to-one and lights
 * up automatically the day the columns ship.
 */
type DocColumnId =
  | 'recorded_time'
  | 'name'
  | 'case'
  | 'category'
  | 'size'
  | 'last_edit'
  | 'received_at'
  | 'comments'
  | 'contact'
  | 'author'
  | 'uploaded_by'
  | 'uploaded_date'
  | 'id'

interface DocColumn {
  id: DocColumnId
  label: string
  defaultVisible: boolean
}

const DOC_COLUMNS: DocColumn[] = [
  { id: 'recorded_time', label: 'Recorded time', defaultVisible: false },
  { id: 'name', label: 'Name', defaultVisible: true },
  { id: 'case', label: 'Case', defaultVisible: false },
  { id: 'category', label: 'Category', defaultVisible: true },
  { id: 'size', label: 'Size', defaultVisible: false },
  { id: 'last_edit', label: 'Last edit at', defaultVisible: true },
  { id: 'received_at', label: 'Received at', defaultVisible: false },
  { id: 'comments', label: 'Comments', defaultVisible: false },
  { id: 'contact', label: 'Contact', defaultVisible: false },
  { id: 'author', label: 'Author', defaultVisible: false },
  { id: 'uploaded_by', label: 'Uploaded by', defaultVisible: false },
  // Uploaded date — surfaces the `created_at` timestamp (when the
  // record first entered the system). Distinct from Last edit at
  // (which tracks `updated_at`) and Received at (the day the firm
  // physically received the file, which lands with the file-storage
  // backend).
  { id: 'uploaded_date', label: 'Uploaded date', defaultVisible: false },
  // ID — the document's primary key. Off by default; firms with a
  // file-numbering convention switch it on for audit / cross-reference.
  { id: 'id', label: 'ID', defaultVisible: false },
]

const DOC_PAGE_SIZES = [25, 50, 100] as const

/**
 * Documents tab body. Mirrors the reference contact-scoped documents view:
 * toolbar (Funnel by keyword · Priority · Columns · Filters · New) plus
 * either an empty-state illustration or a table of files.
 *
 * Today every dev contact has zero documents (the Document schema
 * doesn't carry any sample rows), so the user sees the empty state
 * with the "Drag and drop files here or use the New button" prompt.
 * The toolbar still renders so users can explore the controls.
 */
function DocumentsTab({ contactId }: { contactId: string }) {
  const { data: allDocs } = useDocuments()
  const { data: allCases } = useCases()
  const docs = useMemo(
    () => (allDocs ?? []).filter((d) => d.client_id === contactId),
    [allDocs, contactId],
  )
  // Cases owned by this contact — used by the UploadSimple dialog's
  // Matter picker so users can attach the new file to one of the
  // contact's open cases without leaving the page.
  const contactCases = useMemo(
    () => (allCases ?? []).filter((c) => c.client_id === contactId),
    [allCases, contactId],
  )

  // One state flag per dialog. Keeping them separate (vs a single
  // discriminated union) lets each dialog manage its own lifecycle
  // and reset state on open without the others noticing.
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFolderOpen, setUploadFolderOpen] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [createFromTemplateOpen, setCreateFromTemplateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showFoldersFirst, setShowFoldersFirst] = useState(true)
  const [visibleCols, setVisibleCols] = useState<Set<DocColumnId>>(
    () =>
      new Set(DOC_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )
  const [caseFilter, setCaseFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [showBin, setShowBin] = useState(false)
  const [pageSize, setPageSize] = useState<(typeof DOC_PAGE_SIZES)[number]>(
    25,
  )
  const [page, setPage] = useState(0)
  const [expandRows, setExpandRows] = useState(false)

  // ── Funnel pipeline ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return docs.filter((d) => {
      if (q && !d.title.toLowerCase().includes(q)) return false
      if (caseFilter && d.case_id !== caseFilter) return false
      if (categoryFilter && d.template_type !== categoryFilter) return false
      return true
    })
  }, [docs, search, caseFilter, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * pageSize
  const end = Math.min(start + pageSize, filtered.length)
  const pageRows = filtered.slice(start, end)

  const orderedCols = useMemo(
    () => DOC_COLUMNS.filter((c) => visibleCols.has(c.id)),
    [visibleCols],
  )

  // Reset paging + selection when filters change.
  useEffect(() => {
    setPage(0)
  }, [search, caseFilter, categoryFilter, pageSize])

  // `showBin` is reserved for the future trash view (the reference "Show
  // Items in Bin" toggle). The state is read by the Apply handler in
  // the filter popover; suppress the unused-var lint until the bin
  // surface lands.
  void showBin

  return (
    <section
      className="rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Card-internal tab label — matches the reference "Documents" sub-
          heading inside the panel. */}
      <div
        className="px-6 pt-5 pb-4 border-b"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <h2
          className="text-[15px] font-semibold inline-flex items-center"
          style={{ color: 'var(--text-primary)' }}
        >
          Documents
          <span
            className="ml-3 inline-block h-[2px] w-16 rounded-full"
            style={{ background: 'var(--gold)' }}
            aria-hidden
          />
        </h2>
      </div>

      {/* Toolbar */}
      <div
        className="px-6 py-4 flex items-center justify-end gap-2 flex-wrap"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="relative w-64">
          <MagnifyingGlass
            size={13}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-subtle)' }}
          />
          <Input
            placeholder="Filter by keyword"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-[13px] rounded-lg"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
            }}
          />
        </div>

        <SortPopover
          showFoldersFirst={showFoldersFirst}
          onToggle={setShowFoldersFirst}
        />

        <ColumnsPopover
          visible={visibleCols}
          onChange={setVisibleCols}
        />

        <FiltersPopover
          caseFilter={caseFilter}
          categoryFilter={categoryFilter}
          showBin={showBin}
          onApply={(c, k, b) => {
            setCaseFilter(c)
            setCategoryFilter(k)
            setShowBin(b)
          }}
          onClear={() => {
            setCaseFilter('')
            setCategoryFilter('')
            setShowBin(false)
          }}
        />

        <NewDropdown
          onUploadFiles={() => setUploadOpen(true)}
          onUploadFolder={() => setUploadFolderOpen(true)}
          onCreateFolder={() => setCreateFolderOpen(true)}
          onCreateFromTemplate={() => setCreateFromTemplateOpen(true)}
        />
      </div>

      {/* Body — empty state or table */}
      {filtered.length === 0 ? (
        <DocumentsEmptyState />
      ) : (
        <div className="overflow-auto">
          <table className="w-full" style={{ tableLayout: 'auto' }}>
            <thead
              style={{ background: 'var(--surface-sunken)' }}
            >
              <tr>
                <th
                  className="px-3 py-2.5 text-left text-[11.5px] font-semibold"
                  style={{ color: 'var(--text-muted)', width: 80 }}
                >
                  Action
                </th>
                {orderedCols.map((c) => (
                  <th
                    key={c.id}
                    className="px-3 py-2.5 text-left text-[11.5px] font-semibold whitespace-nowrap"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <DocumentRow
                  key={row.id}
                  doc={row}
                  columns={orderedCols}
                  expanded={expandRows}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer / pagination */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-t"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-1">
          <PagerBtn
            onClick={() => setPage(0)}
            disabled={safePage === 0}
            aria-label="First page"
          >
            <CaretDoubleLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            aria-label="Previous page"
          >
            <CaretLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn
            onClick={() =>
              setPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={safePage >= totalPages - 1}
            aria-label="Next page"
          >
            <CaretRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn
            onClick={() => setPage(totalPages - 1)}
            disabled={safePage >= totalPages - 1}
            aria-label="Last page"
          >
            <CaretDoubleRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <span
            className="ml-2 text-[12px] tabular-nums"
            style={{ color: 'var(--text-muted)' }}
          >
            {filtered.length === 0
              ? 'No results found'
              : `${start + 1}–${end} of ${filtered.length}`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-medium border cursor-pointer"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {pageSize} <CaretDown size={11} strokeWidth={1.75} />
                </button>
              }
            />
            <DropdownMenuContent align="end">
              {DOC_PAGE_SIZES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => setPageSize(s)}
                  className="text-[12.5px]"
                >
                  {s} per page
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <label
            className="inline-flex items-center gap-2 text-[12px] cursor-pointer select-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span
              role="switch"
              aria-checked={expandRows}
              tabIndex={0}
              onClick={() => setExpandRows((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  setExpandRows((v) => !v)
                }
              }}
              className="relative inline-flex h-[18px] w-[32px] rounded-full transition-colors"
              style={{
                background: expandRows
                  ? 'var(--gold)'
                  : 'var(--border-default)',
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 h-[14px] w-[14px] rounded-full bg-white transition-transform"
                style={{
                  transform: expandRows
                    ? 'translateX(14px)'
                    : 'translateX(0)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
                }}
              />
            </span>
            Expand rows
          </label>
        </div>
      </div>

      {/* Four New-menu dialogs. Each keeps its own state + reset
          behaviour; opening one doesn't touch the others. */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        contactId={contactId}
        contactCases={contactCases}
      />
      <UploadFolderDialog
        open={uploadFolderOpen}
        onOpenChange={setUploadFolderOpen}
        contactId={contactId}
        contactCases={contactCases}
      />
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
      />
      <CreateFromTemplateDialog
        open={createFromTemplateOpen}
        onOpenChange={setCreateFromTemplateOpen}
        contactId={contactId}
        contactCases={contactCases}
      />
    </section>
  )
}

// ── Bills tab ──────────────────────────────────────────────────────────

/**
 * Status sub-tabs surfaced above the bills table. Order follows the standard pattern.
 * Each one maps to a predicate over `Invoice.status`; the rest of the
 * pipeline filters by the chosen status, then layers search /
 * advanced filters on top.
 *
 * Notes on the the standard pattern→LegaLite status mapping:
 *   - **Draft** matches `'Draft'` directly.
 *   - **Pending approval** has no analogue in our schema yet — the
 *     workflow ships with the firm-approval module, so this sub-tab
 *     renders the empty state for now.
 *   - **Unpaid** rolls up both `'Sent'` (awaiting payment) and
 *     `'Overdue'` (past due date) — these are the actionable bills.
 *   - **Paid** matches `'Paid'`.
 *   - **All** ignores status entirely.
 *   - **Archive** is a future flag on Invoice; today it renders empty.
 */
const BILL_TABS = [
  'Draft',
  'Pending approval',
  'Unpaid',
  'Paid',
  'All',
  'Archive',
] as const
type BillTab = (typeof BILL_TABS)[number]

type BillColumnId =
  | 'last_sent'
  | 'id'
  | 'status'
  | 'due'
  | 'clients'
  | 'matters'
  | 'issue_date'
  | 'pending_payment'
  | 'balance'
  | 'paid_on'
  | 'paid'
  | 'type'
  | 'total'
  | 'net_total'
  | 'total_tax'

interface BillColumn {
  id: BillColumnId
  label: string
  defaultVisible: boolean
}

/**
 * Bill column registry — matches the reference checklist exactly, default
 * visibility per the screenshot. Columns whose data isn't on Invoice
 * yet (last_sent, pending_payment, paid_on, type, total/net_total/tax
 * — those come with the line-item ledger) render em-dashes today.
 */
const BILL_COLUMNS: BillColumn[] = [
  { id: 'last_sent', label: 'Last sent', defaultVisible: true },
  { id: 'id', label: 'Id', defaultVisible: true },
  { id: 'status', label: 'Status', defaultVisible: true },
  { id: 'due', label: 'Due', defaultVisible: true },
  { id: 'clients', label: 'Clients', defaultVisible: true },
  { id: 'matters', label: 'Matters', defaultVisible: true },
  { id: 'issue_date', label: 'Issue date', defaultVisible: true },
  { id: 'pending_payment', label: 'Pending payment', defaultVisible: false },
  { id: 'balance', label: 'Balance', defaultVisible: true },
  { id: 'paid_on', label: 'Paid on', defaultVisible: false },
  { id: 'paid', label: 'Paid', defaultVisible: false },
  { id: 'type', label: 'Type', defaultVisible: false },
  { id: 'total', label: 'Total', defaultVisible: false },
  { id: 'net_total', label: 'Net Total', defaultVisible: false },
  { id: 'total_tax', label: 'Total Tax', defaultVisible: false },
]

const BILL_PAGE_SIZES = [25, 50, 100] as const

/** Categories surfaced by the Type filter — matches the reference three. */
const BILL_TYPES = ['None', 'Revenue', 'Client Account'] as const

interface BillFilters {
  matter: string
  responsibleSolicitor: string
  originatingSolicitor: string
  dueFrom: string
  dueTo: string
  issueFrom: string
  issueTo: string
  overdueOnly: boolean
  type: string
  currency: string
}

const EMPTY_BILL_FILTERS: BillFilters = {
  matter: '',
  responsibleSolicitor: '',
  originatingSolicitor: '',
  dueFrom: '',
  dueTo: '',
  issueFrom: '',
  issueTo: '',
  overdueOnly: false,
  type: '',
  currency: '',
}

/**
 * Bills tab body. Mirrors the reference contact-scoped bills view: status
 * sub-tabs · MagnifyingGlass by ID · Columns popover · Filters popover · table
 * (or empty state) · paging + Export footer.
 *
 * Data flows through `useInvoices()` filtered to `client_id ===
 * contactId`; the dev DEV_BYPASS path returns an empty list so users
 * see the "No bills match your filters." state out of the box.
 */
function BillsTab({ contactId }: { contactId: string }) {
  const { data: allInvoices } = useInvoices()
  const { data: allCases } = useCases()
  const invoices = useMemo(
    () => (allInvoices ?? []).filter((i) => i.client_id === contactId),
    [allInvoices, contactId],
  )
  const contactCases = useMemo(
    () => (allCases ?? []).filter((c) => c.client_id === contactId),
    [allCases, contactId],
  )

  const [billTab, setBillTab] = useState<BillTab>('Unpaid')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<BillFilters>(EMPTY_BILL_FILTERS)
  const [visibleCols, setVisibleCols] = useState<Set<BillColumnId>>(
    () =>
      new Set(BILL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )
  const [pageSize, setPageSize] = useState<(typeof BILL_PAGE_SIZES)[number]>(
    25,
  )
  const [page, setPage] = useState(0)

  // Status filter pipeline.
  const byStatus = useMemo(() => {
    switch (billTab) {
      case 'Draft':
        return invoices.filter((i) => i.status === 'Draft')
      case 'Unpaid':
        return invoices.filter(
          (i) => i.status === 'Sent' || i.status === 'Overdue',
        )
      case 'Paid':
        return invoices.filter((i) => i.status === 'Paid')
      case 'All':
        return invoices
      case 'Pending approval':
      case 'Archive':
        // No analogue on Invoice yet — render the empty state.
        return []
      default:
        return invoices
    }
  }, [invoices, billTab])

  const filtered = useMemo(() => {
    return byStatus.filter((inv) => {
      // MagnifyingGlass by ID — substring match because IDs may be long UUIDs.
      const q = search.trim().toLowerCase()
      if (q && !inv.id.toLowerCase().includes(q)) return false

      if (filters.matter && inv.client_id !== filters.matter) {
        // We attach the matter filter to client_id today because
        // Invoice doesn't carry a case_id; will switch to case_id
        // once the column ships.
        return false
      }
      if (filters.overdueOnly && inv.status !== 'Overdue') return false

      if (filters.dueFrom && inv.due_date && inv.due_date < filters.dueFrom)
        return false
      if (filters.dueTo && inv.due_date && inv.due_date > filters.dueTo)
        return false
      // issue date filter: Invoice doesn't carry an `issued_at`
      // column yet, so we fall back to `created_at`.
      if (
        filters.issueFrom &&
        inv.created_at &&
        inv.created_at.slice(0, 10) < filters.issueFrom
      )
        return false
      if (
        filters.issueTo &&
        inv.created_at &&
        inv.created_at.slice(0, 10) > filters.issueTo
      )
        return false
      return true
    })
  }, [byStatus, search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * pageSize
  const end = Math.min(start + pageSize, filtered.length)
  const pageRows = filtered.slice(start, end)

  const orderedCols = useMemo(
    () => BILL_COLUMNS.filter((c) => visibleCols.has(c.id)),
    [visibleCols],
  )

  // Reset paging when filters / status change.
  useEffect(() => {
    setPage(0)
  }, [billTab, search, filters, pageSize])

  // Active facet count surfaced as a badge on the Filters button.
  const activeFilterCount =
    (filters.matter ? 1 : 0) +
    (filters.responsibleSolicitor ? 1 : 0) +
    (filters.originatingSolicitor ? 1 : 0) +
    (filters.dueFrom || filters.dueTo ? 1 : 0) +
    (filters.issueFrom || filters.issueTo ? 1 : 0) +
    (filters.overdueOnly ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.currency ? 1 : 0)

  return (
    <section
      className="rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Status sub-tabs + right-side toolbar share a row. */}
      <div
        className="flex items-center justify-between gap-4 px-6 py-3 border-b flex-wrap"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-1">
          {BILL_TABS.map((t) => (
            <BillStatusTab
              key={t}
              active={billTab === t}
              onClick={() => setBillTab(t)}
            >
              {t}
            </BillStatusTab>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <MagnifyingGlass
              size={13}
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-subtle)' }}
            />
            <Input
              placeholder="Search by ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-[13px] rounded-lg"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
              }}
            />
          </div>
          <BillsColumnsPopover
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <BillsFiltersPopover
            filters={filters}
            cases={contactCases}
            activeCount={activeFilterCount}
            onApply={setFilters}
            onClear={() => setFilters(EMPTY_BILL_FILTERS)}
          />
        </div>
      </div>

      {/* Body — table or empty state. */}
      {filtered.length === 0 ? (
        <NoBillsEmptyState />
      ) : (
        <div className="overflow-auto">
          <table className="w-full" style={{ tableLayout: 'auto' }}>
            <thead style={{ background: 'var(--surface-sunken)' }}>
              <tr>
                <th
                  className="px-3 py-2.5 text-left text-[11.5px] font-semibold"
                  style={{ color: 'var(--text-muted)', width: 80 }}
                >
                  Actions
                </th>
                {orderedCols.map((c) => (
                  <th
                    key={c.id}
                    className="px-3 py-2.5 text-left text-[11.5px] font-semibold whitespace-nowrap"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((inv) => (
                <BillRow key={inv.id} invoice={inv} columns={orderedCols} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer — pagination + Export. Same vocabulary as the
          Documents footer for consistency. */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-t"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-1">
          <PagerBtn
            onClick={() => setPage(0)}
            disabled={safePage === 0}
            aria-label="First page"
          >
            <CaretDoubleLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            aria-label="Previous page"
          >
            <CaretLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn
            onClick={() =>
              setPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={safePage >= totalPages - 1}
            aria-label="Next page"
          >
            <CaretRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn
            onClick={() => setPage(totalPages - 1)}
            disabled={safePage >= totalPages - 1}
            aria-label="Last page"
          >
            <CaretDoubleRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <span
            className="ml-2 text-[12px] tabular-nums"
            style={{ color: 'var(--text-muted)' }}
          >
            {filtered.length === 0
              ? 'No results found'
              : `${start + 1}–${end} of ${filtered.length}`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-medium border cursor-pointer"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {pageSize}{' '}
                  <CaretDown size={11} strokeWidth={1.75} />
                </button>
              }
            />
            <DropdownMenuContent align="end">
              {BILL_PAGE_SIZES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => setPageSize(s)}
                  className="text-[12.5px]"
                >
                  {s} per page
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            disabled={filtered.length === 0}
            onClick={() =>
              toast.info(
                'Bill export ships once the billing screen lands.',
              )
            }
          >
            <DownloadSimple size={13} strokeWidth={1.75} />
            Export
          </Button>
        </div>
      </div>
    </section>
  )
}

// ── Bills — sub-components ─────────────────────────────────────────────

/**
 * Status sub-tab. Pill-style button; the active state gets a filled
 * navy background so it reads as a "you are here" indicator (the standard pattern
 * uses an outlined border treatment, but our pill matches the rest
 * of the LegaLite tabs).
 */
function BillStatusTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 h-9 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
      style={{
        background: active ? 'var(--surface-sunken)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        border: active
          ? '1px solid var(--border-default)'
          : '1px solid transparent',
      }}
    >
      {children}
    </button>
  )
}

/**
 * Columns popover — staged-changes pattern (mirrors Documents).
 * Actions column is fixed (always visible); the rest are toggleable.
 */
function BillsColumnsPopover({
  visible,
  onChange,
}: {
  visible: Set<BillColumnId>
  onChange: (next: Set<BillColumnId>) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<BillColumnId>>(new Set(visible))
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const openPopover = () => {
    setDraft(new Set(visible))
    setOpen(true)
  }
  const apply = () => {
    onChange(draft)
    setOpen(false)
  }
  const toggle = (id: BillColumnId) => {
    const next = new Set(draft)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setDraft(next)
  }

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (open ? setOpen(false) : openPopover())}
      >
        <Columns size={13} strokeWidth={1.75} />
        Columns
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 280,
          }}
        >
          <div className="p-4 max-h-[420px] overflow-y-auto">
            <div
              className="text-[11.5px] uppercase tracking-wider font-semibold mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Visible columns
            </div>
            <ul className="space-y-1.5">
              <li>
                <span
                  className="inline-flex items-center gap-2 text-[13px] opacity-60"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-sm border"
                    style={{
                      borderColor: 'var(--gold)',
                      background: 'var(--gold)',
                    }}
                    aria-hidden
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6.5L5 9.5L10 3.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  Actions
                </span>
              </li>
              {BILL_COLUMNS.map((c) => {
                const checked = draft.has(c.id)
                return (
                  <li key={c.id}>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[13px]">
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                        style={{
                          borderColor: checked
                            ? 'var(--gold)'
                            : 'var(--border-default)',
                          background: checked ? 'var(--gold)' : 'transparent',
                        }}
                        aria-hidden
                      >
                        {checked && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6.5L5 9.5L10 3.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {c.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        className="sr-only"
                      />
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
          <div
            className="flex items-center justify-start gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button size="sm" onClick={apply}>
              Update columns
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Filters popover — Matter / Responsible Solicitor / Originating
 * Solicitor / Due-date range / Issue-date range / Show overdue only
 * / Type / Currency / Custom Fields stub. Staged-changes pattern
 * with Apply + Clear in the footer.
 *
 * Today the Solicitor and Currency pickers are stubs (we don't have
 * a firm-users picker or a multi-currency catalog yet); they show
 * the the standard pattern copy so users can preview the surface area.
 */
function BillsFiltersPopover({
  filters,
  cases,
  activeCount,
  onApply,
  onClear,
}: {
  filters: BillFilters
  cases: Case[]
  activeCount: number
  onApply: (f: BillFilters) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<BillFilters>(filters)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const openPopover = () => {
    setDraft(filters)
    setOpen(true)
  }
  const apply = () => {
    onApply(draft)
    setOpen(false)
  }
  const clear = () => {
    setDraft(EMPTY_BILL_FILTERS)
    onClear()
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (open ? setOpen(false) : openPopover())}
      >
        <Funnel size={13} strokeWidth={1.75} />
        Filters
        {activeCount > 0 && (
          <span
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10.5px] font-semibold tabular-nums"
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          >
            {activeCount}
          </span>
        )}
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 360,
          }}
        >
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Matter — filtered to the contact's own cases. */}
            <BillFilterSelect
              label="Matter"
              value={draft.matter}
              placeholder="Find a matter by matter name or client"
              onChange={(v) => setDraft({ ...draft, matter: v })}
              options={cases.map((c) => ({ value: c.id, label: c.title }))}
            />

            {/* Solicitor pickers — stubbed text inputs until the
                firm-users picker ships. */}
            <BillFilterInput
              label="Responsible Solicitor"
              value={draft.responsibleSolicitor}
              placeholder="Find a firm user"
              onChange={(v) =>
                setDraft({ ...draft, responsibleSolicitor: v })
              }
            />
            <BillFilterInput
              label="Originating Solicitor"
              value={draft.originatingSolicitor}
              placeholder="Find a firm user"
              onChange={(v) =>
                setDraft({ ...draft, originatingSolicitor: v })
              }
            />

            {/* Due date range. */}
            <BillFilterDateRange
              label="Due date"
              from={draft.dueFrom}
              to={draft.dueTo}
              onChange={(from, to) =>
                setDraft({ ...draft, dueFrom: from, dueTo: to })
              }
            />
            {/* Issue date range. */}
            <BillFilterDateRange
              label="Issue date"
              from={draft.issueFrom}
              to={draft.issueTo}
              onChange={(from, to) =>
                setDraft({ ...draft, issueFrom: from, issueTo: to })
              }
            />

            <label className="flex items-center gap-2 cursor-pointer select-none text-[13px]">
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                style={{
                  borderColor: draft.overdueOnly
                    ? 'var(--gold)'
                    : 'var(--border-default)',
                  background: draft.overdueOnly ? 'var(--gold)' : 'transparent',
                }}
                aria-hidden
              >
                {draft.overdueOnly && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6.5L5 9.5L10 3.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span style={{ color: 'var(--text-primary)' }}>
                Show overdue bills only
              </span>
              <input
                type="checkbox"
                checked={draft.overdueOnly}
                onChange={() =>
                  setDraft({ ...draft, overdueOnly: !draft.overdueOnly })
                }
                className="sr-only"
              />
            </label>

            <BillFilterSelect
              label="Type"
              value={draft.type}
              placeholder="All"
              onChange={(v) => setDraft({ ...draft, type: v })}
              options={BILL_TYPES.map((t) => ({ value: t, label: t }))}
            />

            <BillFilterInput
              label="Currency"
              value={draft.currency}
              placeholder="Find a currency"
              onChange={(v) => setDraft({ ...draft, currency: v })}
            />

            {/* Custom Fields stub — follows the standard pattern. */}
            <div>
              <div
                className="text-[12.5px] font-semibold mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Custom Fields
              </div>
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                Customise and speed up your workflow by creating Custom
                Fields. Available once the firm settings screen ships.
              </p>
            </div>
          </div>
          <div
            className="flex items-center justify-start gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button size="sm" onClick={apply}>
              Apply filters
            </Button>
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function BillFilterSelect({
  label,
  value,
  placeholder,
  onChange,
  options,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div>
      <div
        className="text-[12.5px] font-semibold mb-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: value ? 'var(--text-primary)' : 'var(--text-muted)',
            colorScheme: 'light',
          }}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
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
    </div>
  )
}

function BillFilterInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div
        className="text-[12.5px] font-semibold mb-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 rounded-lg border px-3 text-[13px]"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
        }}
      />
    </div>
  )
}

function BillFilterDateRange({
  label,
  from,
  to,
  onChange,
}: {
  label: string
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  return (
    <div>
      <div
        className="text-[12.5px] font-semibold mb-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => onChange(e.target.value, to)}
          className="flex-1 h-10 rounded-lg border px-3 text-[13px]"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            colorScheme: 'light',
          }}
        />
        <span style={{ color: 'var(--text-muted)' }} aria-hidden>
          –
        </span>
        <input
          type="date"
          value={to}
          onChange={(e) => onChange(from, e.target.value)}
          className="flex-1 h-10 rounded-lg border px-3 text-[13px]"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            colorScheme: 'light',
          }}
        />
      </div>
    </div>
  )
}

/**
 * Single bill row. Renders an Actions dropdown plus every visible
 * column from the registry. Fields not on Invoice yet (last_sent,
 * pending_payment, paid_on, type, total/net_total/tax) render an
 * em-dash so the table stays scannable; they light up automatically
 * the day those columns ship.
 */
function BillRow({
  invoice,
  columns,
}: {
  invoice: Invoice
  columns: BillColumn[]
}) {
  const dash = (
    <span style={{ color: 'var(--text-subtle)' }}>—</span>
  )
  const fmtDate = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : null
  const fmtMoney = (n?: number | null) =>
    n != null
      ? new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GHS',
        }).format(n)
      : null

  const value = (id: BillColumnId): React.ReactNode => {
    switch (id) {
      case 'last_sent':
        return dash
      case 'id':
        return (
          <span
            className="font-mono text-[12px] tracking-wide"
            style={{ color: 'var(--text-muted)' }}
          >
            {invoice.id.slice(0, 8)}
          </span>
        )
      case 'status':
        return (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium"
            style={{
              background:
                invoice.status === 'Paid'
                  ? 'rgba(34,197,94,0.12)'
                  : invoice.status === 'Overdue'
                    ? 'rgba(220,38,38,0.12)'
                    : 'rgba(201,151,43,0.16)',
              color:
                invoice.status === 'Paid'
                  ? '#16A34A'
                  : invoice.status === 'Overdue'
                    ? '#DC2626'
                    : 'var(--gold-dark)',
            }}
          >
            {invoice.status}
          </span>
        )
      case 'due':
        return fmtDate(invoice.due_date) ?? dash
      case 'clients':
        return invoice.client_name || dash
      case 'matters':
        return dash
      case 'issue_date':
        return fmtDate(invoice.created_at) ?? dash
      case 'pending_payment':
        return dash
      case 'balance':
        return fmtMoney(invoice.amount_ghs) ?? dash
      case 'paid_on':
        return dash
      case 'paid':
        return dash
      case 'type':
        return dash
      case 'total':
        return fmtMoney(invoice.amount_ghs) ?? dash
      case 'net_total':
        return dash
      case 'total_tax':
        return dash
      default:
        return dash
    }
  }

  return (
    <tr
      className="border-t transition-colors"
      style={{ borderColor: 'var(--border-soft)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-overlay)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <td className="px-3 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center justify-center h-7 w-7 rounded-md border cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-muted)',
                }}
                aria-label={`Actions for invoice ${invoice.id}`}
              >
                <CaretDown size={12} strokeWidth={1.75} />
              </button>
            }
          />
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem
              onClick={() => toast.info('Bill preview is coming next.')}
              className="text-[12.5px] cursor-pointer"
            >
              Open
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toast.info('Sending bills ships with the billing screen.')
              }
              className="text-[12.5px] cursor-pointer"
            >
              PaperPlaneTilt
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toast.info('Recording payment ships next.')
              }
              className="text-[12.5px] cursor-pointer"
            >
              Record payment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
      {columns.map((c) => (
        <td
          key={c.id}
          className="px-3 py-2 text-[13px] whitespace-nowrap"
          style={{ color: 'var(--text-primary)' }}
        >
          {value(c.id)}
        </td>
      ))}
    </tr>
  )
}

/**
 * Illustrated empty state for the Bills tab. Replaces the previous
 * plain-text "No bills match your filters." line with the same kind
 * of inline-SVG family used by Documents / Transactions / Comms so
 * the four contact-detail tabs read as one coherent surface.
 */
function NoBillsEmptyState() {
  return (
    <div className="py-16 px-6 text-center">
      <div className="mx-auto mb-6 w-[180px]" aria-hidden>
        <NoBillsIllustration />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        No bills match your filters.
      </p>
      <p
        className="mt-1 text-[12.5px] max-w-md mx-auto"
        style={{ color: 'var(--text-muted)' }}
      >
        Issue your first bill from a closed matter, or relax the filters
        above to see drafts and unpaid invoices.
      </p>
    </div>
  )
}

/**
 * Inline SVG of a paper invoice / receipt with line items, a total
 * row, a cedi (₵) currency stamp in the corner, and a blue "+" badge
 * at the bottom-right. Mirrors the design vocabulary of the other
 * empty-state illustrations in this file.
 *
 * Composition (in z-order):
 *   1. Ground shadow ellipse
 *   2. White receipt panel with a zig-zag bottom edge (the classic
 *      "torn paper" tell that signals a printed bill)
 *   3. Title bar at the top — a darker stripe with a circular
 *      cedi badge on the left
 *   4. Four horizontal line-item strokes
 *   5. A bolder total row at the bottom
 *   6. Blue "+" badge bottom-right of the panel
 *
 * 220×180 viewBox so the illustration sits at the same visual weight
 * as Documents / Bank accounts / Communications.
 */
function NoBillsIllustration() {
  const PAPER_FILL = '#FFFFFF'
  const STROKE = '#1F2A44'
  const TEXT_LINE = '#C7D2DD'
  const TOTAL_LINE = '#1F2A44'
  const HEADER_FILL = '#F1F5FA'
  const ACCENT_TINT = 'rgba(201,151,43,0.18)' // soft gold for the ₵ badge
  const ACCENT = '#B0831F'
  const SHADOW = 'rgba(13, 27, 42, 0.08)'
  const BADGE_FILL = '#1E88E5'
  const BADGE_PLUS = '#FFFFFF'

  return (
    <svg
      viewBox="0 0 220 180"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      role="img"
      aria-label="No bills illustration"
    >
      {/* Ground shadow — same anchor used by the other empty states. */}
      <ellipse cx="110" cy="160" rx="68" ry="5" fill={SHADOW} />

      {/* Receipt panel. Drawn as a single path so we can carve the
          zig-zag "torn paper" bottom edge in one shape. The zig-zags
          start at the lower-left corner and march to the right with
          alternating peaks/troughs. */}
      <path
        d="
          M52 22
          h116
          a8 8 0 0 1 8 8
          v110
          l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8
          l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8
          V30
          a8 8 0 0 1 8 -8
          Z
        "
        fill={PAPER_FILL}
        stroke={STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Title bar — a soft tinted stripe at the top so the receipt
          reads as having a header / company name row. */}
      <path
        d="
          M52 22
          h116
          a8 8 0 0 1 8 8
          v12
          H44
          v-12
          a8 8 0 0 1 8 -8
          Z
        "
        fill={HEADER_FILL}
      />
      <line
        x1="44"
        y1="42"
        x2="176"
        y2="42"
        stroke={STROKE}
        strokeWidth="2"
      />

      {/* Cedi (₵) stamp on the left side of the header. Circle
          background tinted in our gold accent so the receipt feels
          on-brand without leaning fully into navy. */}
      <circle cx="64" cy="32" r="9" fill={ACCENT_TINT} stroke={ACCENT} strokeWidth="2" />
      <text
        x="64"
        y="35.5"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill={ACCENT}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        ₵
      </text>

      {/* Four line items. Each pair = description line on the left,
          amount line on the right, so the receipt reads as a
          structured ledger. */}
      <line x1="58" y1="60" x2="118" y2="60" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="138" y1="60" x2="168" y2="60" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />

      <line x1="58" y1="74" x2="110" y2="74" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="138" y1="74" x2="168" y2="74" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />

      <line x1="58" y1="88" x2="124" y2="88" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="138" y1="88" x2="168" y2="88" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />

      <line x1="58" y1="102" x2="104" y2="102" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="138" y1="102" x2="168" y2="102" stroke={TEXT_LINE} strokeWidth="3" strokeLinecap="round" />

      {/* Divider line above the total row. */}
      <line x1="58" y1="116" x2="168" y2="116" stroke={STROKE} strokeWidth="1.5" strokeDasharray="2 3" />

      {/* TOTAL row — bolder strokes so it reads as the bottom-line
          number on the bill. */}
      <line x1="58" y1="128" x2="100" y2="128" stroke={TOTAL_LINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="132" y1="128" x2="170" y2="128" stroke={TOTAL_LINE} strokeWidth="4" strokeLinecap="round" />

      {/* "+" badge bottom-right of the receipt — same affordance the
          other empty states use to hint at "create one". */}
      <circle cx="178" cy="142" r="16" fill={BADGE_FILL} />
      <line
        x1="178"
        y1="134"
        x2="178"
        y2="150"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="170"
        y1="142"
        x2="186"
        y2="142"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Transactions tab ───────────────────────────────────────────────────

type TxnColumnId =
  | 'date'
  | 'source_destination'
  | 'reference'
  | 'client'
  | 'matter'
  | 'funds_out'
  | 'funds_in'
  | 'running_balance'

interface TxnColumn {
  id: TxnColumnId
  label: string
  defaultVisible: boolean
}

/**
 * Transactions column registry. Every column defaults to visible —
 * matches the reference all-checked state on first open.
 */
const TXN_COLUMNS: TxnColumn[] = [
  { id: 'date', label: 'Date', defaultVisible: true },
  { id: 'source_destination', label: 'Source/Destination', defaultVisible: true },
  { id: 'reference', label: 'Reference', defaultVisible: true },
  { id: 'client', label: 'Client', defaultVisible: true },
  { id: 'matter', label: 'Matter', defaultVisible: true },
  { id: 'funds_out', label: 'Funds out', defaultVisible: true },
  { id: 'funds_in', label: 'Funds in', defaultVisible: true },
  { id: 'running_balance', label: 'Running balance', defaultVisible: true },
]

/**
 * Transactions tab body. We don't yet have a bank-accounts table or a
 * ledger, so this whole tab is structurally industry-standard but
 * permanently lands on the "No bank accounts found" empty state. The
 * toolbar (date range + Columns popover) and the table-shaped scaffold
 * are still rendered so the surface area looks complete and is ready
 * to hold rows the moment the ledger ships.
 */
function TransactionsTab({ contactId }: { contactId: string }) {
  void contactId // wired through for future ledger queries
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [visibleCols, setVisibleCols] = useState<Set<TxnColumnId>>(
    () =>
      new Set(TXN_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )

  return (
    <section
      className="rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Card label — matches the "Transactions" header inside the
          panel, with a gold underline accent. */}
      <div
        className="px-6 pt-5 pb-4 border-b"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <h2
          className="text-[15px] font-semibold inline-flex items-center"
          style={{ color: 'var(--text-primary)' }}
        >
          Transactions
          <span
            className="ml-3 inline-block h-[2px] w-16 rounded-full"
            style={{ background: 'var(--gold)' }}
            aria-hidden
          />
        </h2>
      </div>

      {/* Toolbar — date range on the left, Columns popover on the
          right. */}
      <div
        className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-lg border px-3 text-[13px]"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
              colorScheme: 'light',
              width: 160,
            }}
            aria-label="From date"
          />
          <span aria-hidden style={{ color: 'var(--text-muted)' }}>
            –
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-lg border px-3 text-[13px]"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
              colorScheme: 'light',
              width: 160,
            }}
            aria-label="To date"
          />
        </div>
        <TxnColumnsPopover visible={visibleCols} onChange={setVisibleCols} />
      </div>

      {/* Empty state — no ledger today, so this lands permanently
          until the bank-accounts table ships. */}
      <NoBankAccountsEmptyState />

      {/* Footer — pagination, even though there's nothing to page
          through yet. Keeps the structure consistent with Documents /
          Bills. */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-t"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-1">
          <PagerBtn onClick={() => {}} disabled aria-label="First page">
            <CaretDoubleLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => {}} disabled aria-label="Previous page">
            <CaretLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => {}} disabled aria-label="Next page">
            <CaretRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => {}} disabled aria-label="Last page">
            <CaretDoubleRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <span
            className="ml-2 text-[12px] tabular-nums"
            style={{ color: 'var(--text-muted)' }}
          >
            No results found
          </span>
        </div>
      </div>
    </section>
  )
}

/**
 * Transactions Columns popover — same staged-changes pattern as the
 * other column pickers in this file. Smaller because there's only
 * one fixed (Actions) plus 8 toggleable columns.
 */
function TxnColumnsPopover({
  visible,
  onChange,
}: {
  visible: Set<TxnColumnId>
  onChange: (next: Set<TxnColumnId>) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<TxnColumnId>>(new Set(visible))
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const toggle = (id: TxnColumnId) => {
    const next = new Set(draft)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setDraft(next)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (!open) setDraft(new Set(visible))
          setOpen(!open)
        }}
      >
        Columns
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 260,
          }}
        >
          <div className="p-4 max-h-[360px] overflow-y-auto">
            <ul className="space-y-1.5">
              <li>
                <span
                  className="inline-flex items-center gap-2 text-[13px] opacity-60"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-sm border"
                    style={{
                      borderColor: 'var(--gold)',
                      background: 'var(--gold)',
                    }}
                    aria-hidden
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6.5L5 9.5L10 3.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  Actions
                </span>
              </li>
              {TXN_COLUMNS.map((c) => {
                const checked = draft.has(c.id)
                return (
                  <li key={c.id}>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[13px]">
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                        style={{
                          borderColor: checked
                            ? 'var(--gold)'
                            : 'var(--border-default)',
                          background: checked ? 'var(--gold)' : 'transparent',
                        }}
                        aria-hidden
                      >
                        {checked && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6.5L5 9.5L10 3.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {c.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        className="sr-only"
                      />
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
          <div
            className="flex items-center justify-start gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button
              size="sm"
              onClick={() => {
                onChange(draft)
                setOpen(false)
              }}
            >
              Update columns
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * "No bank accounts found" empty state for Transactions. Uses the
 * custom inline illustration below.
 */
function NoBankAccountsEmptyState() {
  return (
    <div className="py-16 px-6 text-center">
      <div className="mx-auto mb-6 w-[180px]" aria-hidden>
        <NoBankAccountsIllustration />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        No bank accounts found
      </p>
      <p
        className="mt-1 text-[12.5px] max-w-md mx-auto"
        style={{ color: 'var(--text-muted)' }}
      >
        You don&rsquo;t have a bank account in the matter&rsquo;s currency
        yet. Create a bank account in this currency to start recording
        transactions.
      </p>
    </div>
  )
}

/**
 * Inline SVG of a stylised bank building sitting on a white card,
 * with a small "+" badge in the bottom-right corner. Mirrors the reference
 * Transactions-empty illustration.
 *
 * Composition (in z-order):
 *   1. Ground shadow ellipse
 *   2. White card panel (rounded rectangle, navy outline, slight tilt)
 *   3. Bank building inside the card:
 *      - Pediment (triangular roof)
 *      - Cornice line beneath the pediment
 *      - Four columns
 *      - Base / floor
 *   4. Blue + badge bottom-right of the card
 *
 * Drawn at a 220×180 viewBox so it scales to whatever wrapper width
 * the caller sets — keeps the dimensions consistent with
 * NoFilesIllustration.
 */
function NoBankAccountsIllustration() {
  // Palette — same source of truth pattern as NoFilesIllustration.
  const CARD_FILL = '#FFFFFF'
  const STROKE = '#1F2A44' // brand-aligned navy outline
  const BANK_INTERIOR = '#E0E7EF' // pale cool grey for column gaps / floor
  const SHADOW = 'rgba(13, 27, 42, 0.08)'
  const BADGE_FILL = '#1E88E5'
  const BADGE_PLUS = '#FFFFFF'

  return (
    <svg
      viewBox="0 0 220 180"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      role="img"
      aria-label="No bank accounts illustration"
    >
      {/* Ground shadow */}
      <ellipse cx="110" cy="158" rx="68" ry="5" fill={SHADOW} />

      {/* Card panel — slight clockwise tilt to give the illustration
          some movement without committing to a full perspective. */}
      <g transform="rotate(-4 110 92)">
        <rect
          x="36"
          y="34"
          width="148"
          height="116"
          rx="10"
          ry="10"
          fill={CARD_FILL}
          stroke={STROKE}
          strokeWidth="3"
        />

        {/* Bank building — centred inside the card. */}
        {/* Pediment (triangular roof) */}
        <path
          d="M70 70 L110 52 L150 70 Z"
          fill={CARD_FILL}
          stroke={STROKE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Cornice — thin bar beneath the pediment so the columns
            look like they're holding up a proper entablature. */}
        <rect
          x="65"
          y="70"
          width="90"
          height="6"
          rx="1.5"
          fill={CARD_FILL}
          stroke={STROKE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Four columns. Each column is a rounded vertical bar so
            the silhouette reads as classical without overcommitting
            to capitals/bases. */}
        <rect
          x="72"
          y="82"
          width="10"
          height="34"
          rx="2"
          fill={BANK_INTERIOR}
          stroke={STROKE}
          strokeWidth="2.5"
        />
        <rect
          x="91"
          y="82"
          width="10"
          height="34"
          rx="2"
          fill={BANK_INTERIOR}
          stroke={STROKE}
          strokeWidth="2.5"
        />
        <rect
          x="110"
          y="82"
          width="10"
          height="34"
          rx="2"
          fill={BANK_INTERIOR}
          stroke={STROKE}
          strokeWidth="2.5"
        />
        <rect
          x="129"
          y="82"
          width="10"
          height="34"
          rx="2"
          fill={BANK_INTERIOR}
          stroke={STROKE}
          strokeWidth="2.5"
        />
        {/* Floor / base — a thick horizontal slab that the columns
            sit on. Slightly wider than the cornice so the building
            looks anchored. */}
        <rect
          x="62"
          y="120"
          width="96"
          height="8"
          rx="2"
          fill={CARD_FILL}
          stroke={STROKE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </g>

      {/* "+" badge — drawn outside the rotated group so the badge
          stays upright. Bottom-right of the card. */}
      <circle
        cx="178"
        cy="138"
        r="16"
        fill={BADGE_FILL}
      />
      <line
        x1="178"
        y1="130"
        x2="178"
        y2="146"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="170"
        y1="138"
        x2="186"
        y2="138"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Communications tab ─────────────────────────────────────────────────

const COMM_SUB_TABS = ['Logs', 'Secure messages', 'Client portals'] as const
type CommSubTab = (typeof COMM_SUB_TABS)[number]

const COMM_TYPE_FILTERS = ['All', 'Phone', 'Email'] as const
type CommTypeFilter = (typeof COMM_TYPE_FILTERS)[number]

const COMM_DATE_PRESETS = [
  'All dates',
  'Today',
  'This week',
  'This month',
  'This year',
] as const
type CommDatePreset = (typeof COMM_DATE_PRESETS)[number]

type CommColumnId =
  | 'recorded_time'
  | 'type'
  | 'date_time'
  | 'subject_body_attachment'
  | 'matter'
  | 'from'
  | 'to'
  | 'notifications'

interface CommColumn {
  id: CommColumnId
  label: string
  defaultVisible: boolean
}

const COMM_COLUMNS: CommColumn[] = [
  { id: 'recorded_time', label: 'Recorded time', defaultVisible: true },
  { id: 'type', label: 'Type', defaultVisible: true },
  { id: 'date_time', label: 'Date and time', defaultVisible: true },
  {
    id: 'subject_body_attachment',
    label: 'Subject, body and attachment',
    defaultVisible: true,
  },
  { id: 'matter', label: 'Matter', defaultVisible: true },
  { id: 'from', label: 'From', defaultVisible: true },
  { id: 'to', label: 'To', defaultVisible: true },
  { id: 'notifications', label: 'Notifications', defaultVisible: true },
]

/**
 * Communications tab body. Mirrors the reference contact-scoped Communications
 * view:
 *   - Sub-tabs (Logs / Secure messages / Client portals) — Logs is
 *     wired; the other two stub a toast until those flows ship.
 *   - Right-rail: Notification settings link + New ▾ dropdown
 *     (New phone log / New email log).
 *   - Toolbar: All / Phone / Email pills · date range · All-dates
 *     preset dropdown · keyword filter · Columns popover · Filters
 *     popover.
 *   - Body: empty state (chat bubbles + plus badge) with two CTAs
 *     for the most common create flows.
 *   - Footer: paging + Expand rows + Export.
 *
 * No phone/email log table exists on the backend yet, so the body
 * permanently lands on the empty state. All controls are wired to
 * local state so the surface previews correctly.
 */
function CommunicationsTab({ contactId }: { contactId: string }) {
  void contactId // wired through for future log queries

  const [subTab, setSubTab] = useState<CommSubTab>('Logs')
  const [typeFilter, setTypeFilter] = useState<CommTypeFilter>('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [datePreset, setDatePreset] = useState<CommDatePreset>('All dates')
  const [search, setSearch] = useState('')
  const [visibleCols, setVisibleCols] = useState<Set<CommColumnId>>(
    () =>
      new Set(COMM_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )
  const [expandRows, setExpandRows] = useState(false)
  void expandRows // reserved for the row-density toggle once logs render

  return (
    <section
      className="rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Sub-tabs + right-rail row */}
      <div
        className="px-6 py-3 flex items-end justify-between border-b gap-4 flex-wrap"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-end gap-1">
          {COMM_SUB_TABS.map((t) => (
            <CommSubTabButton
              key={t}
              active={subTab === t}
              onClick={() => {
                if (t === 'Logs') {
                  setSubTab(t)
                  return
                }
                toast.info(`${t} is coming next.`)
              }}
            >
              {t}
            </CommSubTabButton>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              toast.info('Notification settings ship with the comms backend.')
            }
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium cursor-pointer"
            style={{ color: 'var(--gold-dark)' }}
          >
            <Bell size={13} strokeWidth={1.75} />
            Notification settings
          </button>
          <CommNewDropdown />
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="px-6 py-3 flex items-center gap-2 flex-wrap border-b"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        {/* All / Phone / Email pills — pill-segmented control. */}
        <div
          className="inline-flex rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--border-default)' }}
        >
          {COMM_TYPE_FILTERS.map((t) => {
            const active = typeFilter === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className="px-3 h-9 text-[12.5px] font-medium transition-colors cursor-pointer"
                style={{
                  background: active
                    ? 'var(--surface-sunken)'
                    : 'var(--surface-card)',
                  color: active
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                }}
              >
                {t}
              </button>
            )
          })}
        </div>

        {/* Date range. */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 rounded-lg border px-3 text-[13px]"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            colorScheme: 'light',
            width: 150,
          }}
          aria-label="From date"
        />
        <span aria-hidden style={{ color: 'var(--text-muted)' }}>
          –
        </span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 rounded-lg border px-3 text-[13px]"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            colorScheme: 'light',
            width: 150,
          }}
          aria-label="To date"
        />

        {/* All dates / Today / This week / This month / This year preset
            — separate from the explicit range so users can pick a
            quick filter without typing dates. */}
        <div className="relative" style={{ width: 130 }}>
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as CommDatePreset)}
            className="w-full h-9 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
              colorScheme: 'light',
            }}
          >
            {COMM_DATE_PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <CaretDown
            size={12}
            strokeWidth={1.75}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
        </div>

        {/* Subject / body keyword search. */}
        <div className="flex-1 min-w-[180px]">
          <Input
            placeholder="Filter by subject or body"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-[13px] rounded-lg"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
            }}
          />
        </div>

        <CommColumnsPopover visible={visibleCols} onChange={setVisibleCols} />
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.info('Advanced comm filters ship with the comms backend.')
          }
        >
          <Funnel size={13} strokeWidth={1.75} />
          Filters
          <CaretDown size={12} strokeWidth={1.75} />
        </Button>
      </div>

      {/* Empty state — no log table yet, so this is the permanent
          body until the comms backend ships. */}
      <NoLogsEmptyState />

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-t"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-1">
          <PagerBtn onClick={() => {}} disabled aria-label="First page">
            <CaretDoubleLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => {}} disabled aria-label="Previous page">
            <CaretLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => {}} disabled aria-label="Next page">
            <CaretRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => {}} disabled aria-label="Last page">
            <CaretDoubleRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <span
            className="ml-2 text-[12px] tabular-nums"
            style={{ color: 'var(--text-muted)' }}
          >
            No results found
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label
            className="inline-flex items-center gap-2 text-[12px] cursor-pointer select-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span
              role="switch"
              aria-checked={expandRows}
              tabIndex={0}
              onClick={() => setExpandRows((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  setExpandRows((v) => !v)
                }
              }}
              className="relative inline-flex h-[18px] w-[32px] rounded-full transition-colors"
              style={{
                background: expandRows
                  ? 'var(--gold)'
                  : 'var(--border-default)',
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 h-[14px] w-[14px] rounded-full bg-white transition-transform"
                style={{
                  transform: expandRows
                    ? 'translateX(14px)'
                    : 'translateX(0)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
                }}
              />
            </span>
            Expand rows
          </label>

          <Button
            variant="outline"
            size="sm"
            disabled
            onClick={() => toast.info('Communications export ships next.')}
          >
            <DownloadSimple size={13} strokeWidth={1.75} />
            Export
          </Button>
        </div>
      </div>
    </section>
  )
}

// ── Communications — sub-components ────────────────────────────────────

/**
 * Sub-tab button used by the Logs / Secure messages / Client portals
 * row. TextUnderline indicator on active, same treatment as the page-
 * level tab bar above.
 */
function CommSubTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative px-3 py-2 text-[13.5px] font-medium transition-colors cursor-pointer"
      style={{
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      }}
    >
      {children}
      {active && (
        <span
          className="absolute left-2 right-2 -bottom-px h-[2px] rounded-t"
          style={{ background: 'var(--gold)' }}
        />
      )}
    </button>
  )
}

/**
 * "New" dropdown in the Communications toolbar — opens with two
 * options (New phone log / New email log). Both stub to a toast
 * until the comms backend ships.
 */
function CommNewDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap"
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
              boxShadow:
                '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--gold-dark, #B0831F)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--gold)'
            }}
          >
            New
            <CaretDown size={12} strokeWidth={2} />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => toast.info('Phone log form is coming next.')}
          className="text-[12.5px] cursor-pointer"
        >
          <Phone size={12} strokeWidth={1.75} /> New phone log
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => toast.info('Email log form is coming next.')}
          className="text-[12.5px] cursor-pointer"
        >
          <Envelope size={12} strokeWidth={1.75} /> New email log
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Communications Columns popover — same staged-changes pattern as
 * Bills/Documents/Transactions. Actions is fixed; the rest are
 * toggleable.
 */
function CommColumnsPopover({
  visible,
  onChange,
}: {
  visible: Set<CommColumnId>
  onChange: (next: Set<CommColumnId>) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<CommColumnId>>(new Set(visible))
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const toggle = (id: CommColumnId) => {
    const next = new Set(draft)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setDraft(next)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (!open) setDraft(new Set(visible))
          setOpen(!open)
        }}
      >
        <Columns size={13} strokeWidth={1.75} />
        Columns
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 280,
          }}
        >
          <div className="p-4 max-h-[360px] overflow-y-auto">
            <div
              className="text-[11.5px] uppercase tracking-wider font-semibold mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Visible columns
            </div>
            <ul className="space-y-1.5">
              <li>
                <span
                  className="inline-flex items-center gap-2 text-[13px] opacity-60"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-sm border"
                    style={{
                      borderColor: 'var(--gold)',
                      background: 'var(--gold)',
                    }}
                    aria-hidden
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6.5L5 9.5L10 3.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  Actions
                </span>
              </li>
              {COMM_COLUMNS.map((c) => {
                const checked = draft.has(c.id)
                return (
                  <li key={c.id}>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[13px]">
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                        style={{
                          borderColor: checked
                            ? 'var(--gold)'
                            : 'var(--border-default)',
                          background: checked ? 'var(--gold)' : 'transparent',
                        }}
                        aria-hidden
                      >
                        {checked && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6.5L5 9.5L10 3.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {c.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        className="sr-only"
                      />
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
          <div
            className="flex items-center justify-start gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button
              size="sm"
              onClick={() => {
                onChange(draft)
                setOpen(false)
              }}
            >
              Update columns
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * "No phone or email logs found" empty state for Communications.
 * Uses the custom inline illustration below.
 */
function NoLogsEmptyState() {
  return (
    <div className="py-14 px-6 text-center">
      <div className="mx-auto mb-6 w-[180px]" aria-hidden>
        <NoLogsIllustration />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        No phone or email logs found.
      </p>
      <p
        className="mt-1 text-[12.5px]"
        style={{ color: 'var(--text-muted)' }}
      >
        Keep track of every conversation.
      </p>
      <div className="mt-5 flex items-center justify-center gap-2">
        <Button
          size="sm"
          onClick={() => toast.info('Phone log form is coming next.')}
        >
          <Phone size={12} strokeWidth={1.75} />
          New phone log
        </Button>
        <Button
          size="sm"
          onClick={() => toast.info('Email log form is coming next.')}
        >
          <Envelope size={12} strokeWidth={1.75} />
          New email log
        </Button>
      </div>
    </div>
  )
}

/**
 * Inline SVG of two overlapping speech bubbles with a "+" badge in
 * the bottom-right. Mirrors the reference Communications-empty illustration.
 *
 * Composition (in z-order):
 *   1. Ground shadow
 *   2. Back bubble (rounded rectangle + tail), slightly larger, sits
 *      up-and-to-the-left
 *   3. Front bubble (rounded rectangle + tail), with three dots inside
 *      representing chat content
 *   4. Blue "+" badge bottom-right
 *
 * 220×180 viewBox so it scales identically to the other illustrations
 * in this file (Documents, Bank accounts).
 */
function NoLogsIllustration() {
  const BUBBLE_FILL = '#FFFFFF'
  const STROKE = '#1F2A44'
  const DOT = '#9CA3AF'
  const SHADOW = 'rgba(13, 27, 42, 0.08)'
  const BADGE_FILL = '#1E88E5'
  const BADGE_PLUS = '#FFFFFF'

  return (
    <svg
      viewBox="0 0 220 180"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      role="img"
      aria-label="No phone or email logs illustration"
    >
      {/* Ground shadow */}
      <ellipse cx="110" cy="158" rx="68" ry="5" fill={SHADOW} />

      {/* Back bubble — drawn first so the front bubble overlaps it.
          Path: rounded rectangle with a tail pointing down-left. */}
      <path
        d="
          M40 40
          h78
          a14 14 0 0 1 14 14
          v36
          a14 14 0 0 1 -14 14
          H72
          l-10 12
          l-2 -12
          H40
          a14 14 0 0 1 -14 -14
          V54
          a14 14 0 0 1 14 -14
          Z
        "
        fill={BUBBLE_FILL}
        stroke={STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Front bubble — bigger, sits down-and-right of the back one,
          tail points down-right. Three dots inside for chat content. */}
      <path
        d="
          M102 68
          h64
          a14 14 0 0 1 14 14
          v38
          a14 14 0 0 1 -14 14
          h-22
          l8 14
          l-18 -14
          H102
          a14 14 0 0 1 -14 -14
          V82
          a14 14 0 0 1 14 -14
          Z
        "
        fill={BUBBLE_FILL}
        stroke={STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Three chat dots, evenly spaced inside the front bubble. */}
      <circle cx="118" cy="100" r="4" fill={DOT} />
      <circle cx="134" cy="100" r="4" fill={DOT} />
      <circle cx="150" cy="100" r="4" fill={DOT} />

      {/* "+" badge — bottom-right corner. Same composition as the
          bank-accounts illustration so the empty states share a
          consistent affordance. */}
      <circle cx="184" cy="140" r="16" fill={BADGE_FILL} />
      <line
        x1="184"
        y1="132"
        x2="184"
        y2="148"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="176"
        y1="140"
        x2="192"
        y2="140"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Notes tab ──────────────────────────────────────────────────────────

const NOTE_TIME_FILTERS = ['All', 'With time', 'Without time'] as const
type NoteTimeFilter = (typeof NOTE_TIME_FILTERS)[number]

type NoteColumnId =
  | 'recorded_time'
  | 'date'
  | 'subject'
  | 'note'
  | 'author'
  | 'notifications'

interface NoteColumn {
  id: NoteColumnId
  label: string
  defaultVisible: boolean
}

const NOTE_COLUMNS: NoteColumn[] = [
  { id: 'recorded_time', label: 'Recorded time', defaultVisible: true },
  { id: 'date', label: 'Date', defaultVisible: true },
  { id: 'subject', label: 'Subject', defaultVisible: true },
  { id: 'note', label: 'Note', defaultVisible: true },
  { id: 'author', label: 'Author', defaultVisible: true },
  { id: 'notifications', label: 'Notifications', defaultVisible: true },
]

/**
 * Notes tab body. Mirrors the reference contact-scoped Notes view:
 *
 *   - Card label "Notes" + "New note" gold primary button.
 *   - Toolbar: All / With time / Without time pill toggle (filters
 *     by whether the note has a recorded-time entry attached) plus a
 *     keyword search and Columns popover.
 *   - Body: table or empty state. We don't have a Notes table on the
 *     backend yet, so this currently lands on the empty state until
 *     that migration ships.
 *   - Footer: paging + Expand rows + Export.
 *
 * The "New note" button opens a dialog with a Subject, a rich-text
 * Note area, a File-note-to (Matter/IdentificationCard) toggle, a contact
 * picker, a Date, an optional Recorded time entry, and a
 * Notifications picker.
 */
function NotesTab({
  contact,
}: {
  contact: NonNullable<ReturnType<typeof useClient>['data']>
}) {
  const [timeFilter, setTimeFilter] = useState<NoteTimeFilter>('All')
  const [search, setSearch] = useState('')
  const [visibleCols, setVisibleCols] = useState<Set<NoteColumnId>>(
    () =>
      new Set(NOTE_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )
  const [expandRows, setExpandRows] = useState(false)
  const [newNoteOpen, setNewNoteOpen] = useState(false)
  // `timeFilter` is held in state but doesn't filter anything yet
  // because the Notes table doesn't exist. Suppresses the unused-var
  // lint without leaking the placeholder into runtime.
  void timeFilter

  return (
    <section
      className="rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Card label + New note button. */}
      <div
        className="px-6 pt-5 pb-4 border-b flex items-center justify-between gap-4"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <h2
          className="text-[15px] font-semibold inline-flex items-center"
          style={{ color: 'var(--text-primary)' }}
        >
          Notes
          <span
            className="ml-3 inline-block h-[2px] w-12 rounded-full"
            style={{ background: 'var(--gold)' }}
            aria-hidden
          />
        </h2>
        <button
          type="button"
          onClick={() => setNewNoteOpen(true)}
          className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap"
          style={{
            background: 'var(--gold)',
            color: 'var(--navy)',
            boxShadow:
              '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--gold-dark, #B0831F)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--gold)'
          }}
        >
          New note
        </button>
      </div>

      {/* Toolbar */}
      <div
        className="px-6 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div
          className="inline-flex rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--border-default)' }}
        >
          {NOTE_TIME_FILTERS.map((t) => {
            const active = timeFilter === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTimeFilter(t)}
                className="px-3 h-9 text-[12.5px] font-medium transition-colors cursor-pointer"
                style={{
                  background: active
                    ? 'var(--surface-sunken)'
                    : 'var(--surface-card)',
                  color: active
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                }}
              >
                {t}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <MagnifyingGlass
              size={13}
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-subtle)' }}
            />
            <Input
              placeholder="Filter by keyword"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-[13px] rounded-lg"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
              }}
            />
          </div>
          <NoteColumnsPopover
            visible={visibleCols}
            onChange={setVisibleCols}
          />
        </div>
      </div>

      {/* Body — currently always empty until the Notes table lands. */}
      <NoNotesEmptyState onNewNote={() => setNewNoteOpen(true)} />

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-t"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <div className="flex items-center gap-1">
          <PagerBtn onClick={() => {}} disabled aria-label="First page">
            <CaretDoubleLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => {}} disabled aria-label="Previous page">
            <CaretLeft size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => {}} disabled aria-label="Next page">
            <CaretRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <PagerBtn onClick={() => {}} disabled aria-label="Last page">
            <CaretDoubleRight size={14} strokeWidth={1.75} />
          </PagerBtn>
          <span
            className="ml-2 text-[12px] tabular-nums"
            style={{ color: 'var(--text-muted)' }}
          >
            No results found
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label
            className="inline-flex items-center gap-2 text-[12px] cursor-pointer select-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span
              role="switch"
              aria-checked={expandRows}
              tabIndex={0}
              onClick={() => setExpandRows((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  setExpandRows((v) => !v)
                }
              }}
              className="relative inline-flex h-[18px] w-[32px] rounded-full transition-colors"
              style={{
                background: expandRows
                  ? 'var(--gold)'
                  : 'var(--border-default)',
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 h-[14px] w-[14px] rounded-full bg-white transition-transform"
                style={{
                  transform: expandRows
                    ? 'translateX(14px)'
                    : 'translateX(0)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
                }}
              />
            </span>
            Expand rows
          </label>

          <Button
            variant="outline"
            size="sm"
            disabled
            onClick={() => toast.info('Notes export ships next.')}
          >
            <DownloadSimple size={13} strokeWidth={1.75} />
            Export
          </Button>
        </div>
      </div>

      <NewNoteDialog
        open={newNoteOpen}
        onOpenChange={setNewNoteOpen}
        contact={contact}
      />
    </section>
  )
}

/**
 * Empty state for the Notes tab. Reuses the same composition family
 * (custom inline SVG of a note card with a pen + "+" badge) as the
 * other contact-detail empty states.
 */
function NoNotesEmptyState({ onNewNote }: { onNewNote: () => void }) {
  return (
    <div className="py-14 px-6 text-center">
      <div className="mx-auto mb-6 w-[180px]" aria-hidden>
        <NoNotesIllustration />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        No results found
      </p>
      <p
        className="mt-1 text-[12.5px] max-w-md mx-auto"
        style={{ color: 'var(--text-muted)' }}
      >
        Capture call summaries, meeting notes, and matter updates so
        nothing falls through the cracks.
      </p>
      <div className="mt-5">
        <Button size="sm" onClick={onNewNote}>
          <Plus size={13} strokeWidth={2} />
          New note
        </Button>
      </div>
    </div>
  )
}

/**
 * Inline SVG illustration for the Notes empty state — a stylised
 * notepad with three text lines and a small pen overlapping the
 * bottom-right corner, plus the same blue "+" badge used by the
 * other empty states in this file.
 *
 * Same 220×180 viewBox, navy outline, white paper, and accent badge
 * as Documents / Bank accounts / Communications / Bills.
 */
function NoNotesIllustration() {
  const PAPER = '#FFFFFF'
  const STROKE = '#1F2A44'
  const TEXT_LINE = '#C7D2DD'
  const SHADOW = 'rgba(13, 27, 42, 0.08)'
  const PEN_BARREL = '#1E88E5'
  const PEN_TIP = '#1F2A44'
  const BADGE_FILL = '#1E88E5'
  const BADGE_PLUS = '#FFFFFF'

  return (
    <svg
      viewBox="0 0 220 180"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      role="img"
      aria-label="No notes illustration"
    >
      <ellipse cx="110" cy="160" rx="68" ry="5" fill={SHADOW} />

      {/* Notepad — single rounded rectangle, drawn with a slight
          counter-clockwise tilt for visual interest. */}
      <g transform="rotate(-3 110 90)">
        {/* Top binder strip — darker stripe with three "rings". */}
        <rect
          x="42"
          y="32"
          width="136"
          height="118"
          rx="10"
          ry="10"
          fill={PAPER}
          stroke={STROKE}
          strokeWidth="3"
        />
        <rect
          x="42"
          y="32"
          width="136"
          height="14"
          fill="#E0E7EF"
        />
        <line
          x1="42"
          y1="46"
          x2="178"
          y2="46"
          stroke={STROKE}
          strokeWidth="2"
        />
        <circle cx="68" cy="39" r="2" fill={STROKE} />
        <circle cx="110" cy="39" r="2" fill={STROKE} />
        <circle cx="152" cy="39" r="2" fill={STROKE} />

        {/* Text lines — three rows on the notepad body. */}
        <line
          x1="58"
          y1="68"
          x2="162"
          y2="68"
          stroke={TEXT_LINE}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="58"
          y1="84"
          x2="148"
          y2="84"
          stroke={TEXT_LINE}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="58"
          y1="100"
          x2="158"
          y2="100"
          stroke={TEXT_LINE}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="58"
          y1="116"
          x2="124"
          y2="116"
          stroke={TEXT_LINE}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* Pen — drawn outside the rotated group so the badge sits
          flat. Pen barrel is sky blue with a navy tip; sits at a
          ~30° angle overlapping the lower-right corner of the pad. */}
      <g transform="rotate(35 150 132)">
        <rect
          x="116"
          y="128"
          width="52"
          height="8"
          rx="2"
          fill={PEN_BARREL}
          stroke={STROKE}
          strokeWidth="2"
        />
        <path
          d="M168 128 L176 132 L168 136 Z"
          fill={PEN_TIP}
          stroke={STROKE}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <line
          x1="124"
          y1="128"
          x2="124"
          y2="136"
          stroke={STROKE}
          strokeWidth="2"
        />
      </g>

      {/* "+" badge — bottom-right, identical pattern to the other
          empty-state illustrations. */}
      <circle cx="184" cy="142" r="16" fill={BADGE_FILL} />
      <line
        x1="184"
        y1="134"
        x2="184"
        y2="150"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="176"
        y1="142"
        x2="192"
        y2="142"
        stroke={BADGE_PLUS}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Columns popover for the Notes tab — same staged-changes pattern
 * as the rest of the column pickers in this file. Actions is fixed;
 * the rest are toggleable.
 */
function NoteColumnsPopover({
  visible,
  onChange,
}: {
  visible: Set<NoteColumnId>
  onChange: (next: Set<NoteColumnId>) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<NoteColumnId>>(new Set(visible))
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const toggle = (id: NoteColumnId) => {
    const next = new Set(draft)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setDraft(next)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (!open) setDraft(new Set(visible))
          setOpen(!open)
        }}
      >
        <Columns size={13} strokeWidth={1.75} />
        Columns
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 260,
          }}
        >
          <div className="p-4 max-h-[320px] overflow-y-auto">
            <ul className="space-y-1.5">
              <li>
                <span
                  className="inline-flex items-center gap-2 text-[13px] opacity-60"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-sm border"
                    style={{
                      borderColor: 'var(--gold)',
                      background: 'var(--gold)',
                    }}
                    aria-hidden
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6.5L5 9.5L10 3.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  Actions
                </span>
              </li>
              {NOTE_COLUMNS.map((c) => {
                const checked = draft.has(c.id)
                return (
                  <li key={c.id}>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[13px]">
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                        style={{
                          borderColor: checked
                            ? 'var(--gold)'
                            : 'var(--border-default)',
                          background: checked ? 'var(--gold)' : 'transparent',
                        }}
                        aria-hidden
                      >
                        {checked && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6.5L5 9.5L10 3.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {c.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        className="sr-only"
                      />
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
          <div
            className="flex items-center justify-start gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button
              size="sm"
              onClick={() => {
                onChange(draft)
                setOpen(false)
              }}
            >
              Update columns
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * "New note" dialog. Follows the standard pattern:
 *   - Subject (required-ish text)
 *   - Note: a rich-text style block. The toolbar is a row of icon
 *     buttons (TextB / TextItalic / TextUnderline / Highlight / Ordered list /
 *     Bullet list / Link / Undo / Redo) sitting above a textarea.
 *     Today the toolbar buttons are visual-only — the editor uses
 *     a plain textarea until the Tiptap version drift is resolved.
 *   - File note to… Matter / IdentificationCard pill toggle (IdentificationCard-default
 *     since this dialog is reached from a contact page).
 *   - IdentificationCard picker (locked to the current contact today).
 *   - Date (defaults to today).
 *   - Recorded time — optional time entry with the duration input
 *     and the gold play button (timer is a future enhancement).
 *   - Notifications — chip-list of firm users (auto-populated with
 *     the current user as a starting point).
 *   - Footer: Save note / Cancel.
 *
 * Persistence: notes table doesn't exist yet — Save toasts and
 * closes for now. The local state collects all the structured
 * fields so the migration ships a complete payload.
 */
function NewNoteDialog({
  open,
  onOpenChange,
  contact,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  contact: NonNullable<ReturnType<typeof useClient>['data']>
}) {
  // Pull the signed-in user's name so we can default-notify them on
  // every new note. Falls back to a stub label when auth hasn't
  // hydrated yet (e.g. on the very first SSR pass).
  const currentUserName = useAuthStore((s) => s.user?.name) || 'You'

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [fileTo, setFileTo] = useState<'matter' | 'contact'>('contact')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [recordedTime, setRecordedTime] = useState('')
  const [notifyUsers, setNotifyUsers] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Reset every open so the previous draft doesn't bleed across sessions.
  useEffect(() => {
    if (open) {
      setSubject('')
      setBody('')
      setFileTo('contact')
      setDate(new Date().toISOString().slice(0, 10))
      setRecordedTime('')
      // Default-notify the current user so the author is always
      // in the loop. They can remove themselves if they don't want
      // a notification.
      setNotifyUsers([currentUserName])
    }
  }, [open, currentUserName])

  const canSave = subject.trim().length > 0 && !submitting

  const handleSave = async () => {
    if (!canSave) return
    setSubmitting(true)
    try {
      // Persistence stub — Notes table lands later.
      await new Promise((r) => setTimeout(r, 250))
      toast.success(`Note "${subject}" saved.`)
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[760px] p-0 overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle
            className="text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            New note
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 max-h-[70vh] overflow-y-auto space-y-5">
          {/* Subject */}
          <div>
            <Label
              htmlFor="note-subject"
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Subject
            </Label>
            <input
              id="note-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-10 rounded-lg border px-3 text-[13px]"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
              }}
              autoFocus
            />
          </div>

          {/* Note (rich text) */}
          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Note
            </Label>
            <NoteEditor value={body} onChange={setBody} />
          </div>

          {/* File note to + IdentificationCard picker — split row. */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                className="text-[12px] font-semibold mb-1.5 block"
                style={{ color: 'var(--text-primary)' }}
              >
                File note to…
              </Label>
              <div
                className="inline-flex rounded-lg border overflow-hidden"
                style={{ borderColor: 'var(--border-default)' }}
              >
                {([
                  { value: 'matter', label: 'Matter' },
                  { value: 'contact', label: 'Contact' },
                ] as const).map((opt) => {
                  const active = fileTo === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFileTo(opt.value)}
                      className="px-4 h-9 text-[12.5px] font-medium transition-colors cursor-pointer"
                      style={{
                        background: active
                          ? 'var(--surface-sunken)'
                          : 'var(--surface-card)',
                        color: active
                          ? 'var(--text-primary)'
                          : 'var(--text-muted)',
                      }}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <Label
                className="text-[12px] font-semibold mb-1.5 block"
                style={{ color: 'var(--text-primary)' }}
              >
                {fileTo === 'matter' ? 'Matter *' : 'Contact *'}
              </Label>
              <div className="relative">
                <select
                  value={contact.id}
                  disabled
                  className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-not-allowed"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-primary)',
                    colorScheme: 'light',
                  }}
                >
                  <option value={contact.id}>
                    {contact.full_name}
                    {contact.email ? ` (${contact.email})` : ''}
                  </option>
                </select>
                <CaretDown
                  size={13}
                  strokeWidth={1.75}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Date
            </Label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-lg border px-3 text-[13px]"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
                colorScheme: 'light',
                width: 220,
              }}
            />
          </div>

          {/* Recorded time — duration input + live stopwatch. */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--border-soft)' }}>
            <div
              className="text-[13px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Recorded time
            </div>
            <p
              className="mt-0.5 text-[12px]"
              style={{ color: 'var(--text-muted)' }}
            >
              Add a time entry to this note
            </p>
            <div className="mt-3 flex items-center gap-3">
              <input
                value={recordedTime}
                onChange={(e) => setRecordedTime(e.target.value)}
                placeholder="1h 12m, 1:12…"
                className="flex-1 max-w-[260px] h-10 rounded-lg border px-3 text-[13px]"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                }}
              />
              <Stopwatch onCommit={(formatted) => setRecordedTime(formatted)} />
            </div>
          </div>

          {/* Notifications */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--border-soft)' }}>
            <div
              className="text-[13px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Notifications
            </div>
            <p
              className="mt-0.5 text-[12px]"
              style={{ color: 'var(--text-muted)' }}
            >
              Select firm users to receive notifications about this note.
            </p>
            <div className="mt-3">
              <NotificationsPicker
                value={notifyUsers}
                onChange={setNotifyUsers}
              />
            </div>
          </div>
        </div>

        <DialogFooter
          className="px-6 py-4 border-t flex sm:flex-row sm:justify-start gap-2"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <PrimaryDialogBtn
            disabled={!canSave}
            onClick={handleSave}
            label={submitting ? 'Saving…' : 'Save note'}
          />
          <GhostDialogBtn
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            label="Cancel"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Real rich-text editor backed by Tiptap. Renders the reference icon
 * toolbar above a `contenteditable` surface; every button is wired
 * to a Tiptap command and lights up with a gold-tinted background
 * when the cursor is sitting inside that mark/format.
 *
 * Active extensions:
 *   - StarterKit  → paragraph, bold, italic, strike, lists, history
 *   - TextUnderline   → <u> mark
 *   - Highlight   → <mark> mark (multi-colour off; single yellow)
 *   - Link        → <a> mark with safe-URL sanitisation
 *   - Placeholder → "Type something" prompt when the doc is empty
 *
 * Bridges to the parent via a single `value` (HTML string) +
 * `onChange` prop so the dialog can persist a single field without
 * leaking Tiptap internals.
 */
function NoteEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TiptapUnderline,
      TiptapHighlight.configure({ multicolor: false }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      TiptapPlaceholder.configure({ placeholder: 'Type something' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'tiptap-editor block w-full min-h-[140px] px-3 py-3 text-[13px] outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Keep external resets (dialog re-open, programmatic clears) in
  // sync with the editor's internal doc.
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const promptForLink = () => {
    if (!editor) return
    const current = editor.getAttributes('link').href as string | undefined
    const next = window.prompt('URL', current ?? 'https://')
    if (next === null) return
    if (next === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: next })
      .run()
  }

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: 'var(--border-default)',
        background: 'var(--surface-card)',
      }}
    >
      <div
        className="flex items-center gap-1 px-2 py-1.5 border-b"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <ToolbarBtn
          label="Bold"
          active={editor?.isActive('bold')}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <TextB size={14} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Italic"
          active={editor?.isActive('italic')}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <TextItalic size={14} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Underline"
          active={editor?.isActive('underline')}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <TextUnderline size={14} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Highlight"
          active={editor?.isActive('highlight')}
          onClick={() => editor?.chain().focus().toggleHighlight().run()}
        >
          <HighlighterCircle size={14} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarSep />
        <ToolbarBtn
          label="Ordered list"
          active={editor?.isActive('orderedList')}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListNumbers size={14} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Bullet list"
          active={editor?.isActive('bulletList')}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List size={14} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarSep />
        <ToolbarBtn
          label="Link"
          active={editor?.isActive('link')}
          onClick={promptForLink}
        >
          <LinkIcon size={14} strokeWidth={2} />
        </ToolbarBtn>
        <span className="ml-auto inline-flex items-center gap-1">
          <ToolbarBtn
            label="Undo"
            disabled={!editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <ArrowUUpLeft size={14} strokeWidth={2} />
          </ToolbarBtn>
          <ToolbarBtn
            label="Redo"
            disabled={!editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <ArrowUUpRight size={14} strokeWidth={2} />
          </ToolbarBtn>
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

function ToolbarBtn({
  onClick,
  label,
  children,
  active,
  disabled,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
}) {
  // Active state uses a gold-tinted background so the user can see
  // at a glance whether the cursor is sitting inside that mark. The
  // disabled state (e.g. Undo when there's nothing to undo) just
  // greys out the icon without changing the hit target.
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active ?? undefined}
      disabled={disabled}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        color: active ? 'var(--gold-dark)' : 'var(--text-muted)',
        background: active ? 'rgba(201,151,43,0.18)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        if (active) return
        e.currentTarget.style.background = 'var(--surface-sunken)'
        e.currentTarget.style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        if (active) return
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-muted)'
      }}
    >
      {children}
    </button>
  )
}

function ToolbarSep() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-px mx-1"
      style={{ background: 'var(--border-soft)' }}
    />
  )
}

/**
 * Stub list of firm users used by the Notifications picker. The
 * current authenticated user is folded in at render time via the
 * `useAuthStore`. Once a real `useFirmUsers` hook ships, swap this
 * constant for the live list — the picker UI stays the same.
 */
const STUB_FIRM_USERS = [
  'Kofi Mensah',
  'Ama Owusu',
  'Yaw Boateng',
  'Akosua Asante',
  'Esi Annan',
] as const

/**
 * Multi-select dropdown for picking which firm users get notified
 * about a note. The trigger renders selected users as chips; an
 * arrow opens a popover with checkboxes for the full firm-user
 * list (including the signed-in user). Closes on click-outside.
 */
function NotificationsPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const currentUserName = useAuthStore((s) => s.user?.name) || 'You'
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Click-outside closes — same pattern as the other popovers in
  // this file.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // Compose the full options list. `Set` de-dupes the current user
  // against the stub list in case they share a name.
  const allOptions = useMemo(() => {
    const set = new Set<string>()
    set.add(currentUserName)
    for (const u of STUB_FIRM_USERS) set.add(u)
    // Anything previously selected stays in the list (so removed
    // stub users don't vanish mid-edit).
    for (const v of value) set.add(v)
    return Array.from(set)
  }, [currentUserName, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allOptions
    return allOptions.filter((o) => o.toLowerCase().includes(q))
  }, [allOptions, query])

  const toggle = (name: string) => {
    onChange(
      value.includes(name) ? value.filter((v) => v !== name) : [...value, name],
    )
  }

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Trigger — chips + dropdown chevron. Acts as the "selected
          users" surface AND the open affordance.
          Rendered as a div (not a button) because each chip contains
          its own remove-× button; nested <button> elements are
          invalid HTML and trigger a hydration mismatch. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((v) => !v)
          }
        }}
        className="w-full flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-2 min-h-[40px] text-left cursor-pointer"
        style={{
          borderColor: open ? 'var(--gold)' : 'var(--border-default)',
          background: 'var(--surface-card)',
          boxShadow: open
            ? '0 0 0 2px rgba(201,151,43,0.16)'
            : 'none',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value.length === 0 ? (
          <span
            className="text-[13px] px-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Select firm users…
          </span>
        ) : (
          value.map((u) => (
            <span
              key={u}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium"
              style={{
                background: 'rgba(14,165,233,0.15)',
                color: '#0369A1',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {u}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggle(u)
                }}
                className="cursor-pointer"
                aria-label={`Remove ${u} from notifications`}
              >
                <X size={11} strokeWidth={2} />
              </button>
            </span>
          ))
        )}
        <CaretDown
          size={13}
          strokeWidth={1.75}
          className="ml-auto"
          style={{ color: 'var(--text-muted)' }}
        />
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border overflow-hidden"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
          }}
          role="listbox"
        >
          {/* MagnifyingGlass row — narrows the option list by name. */}
          <div
            className="px-3 py-2 border-b"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search firm users…"
              className="w-full h-8 text-[13px] bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
              autoFocus
            />
          </div>
          <ul className="max-h-[220px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li
                className="px-3 py-3 text-[12.5px]"
                style={{ color: 'var(--text-muted)' }}
              >
                No firm users match &ldquo;{query}&rdquo;.
              </li>
            ) : (
              filtered.map((name) => {
                const checked = value.includes(name)
                return (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => toggle(name)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] cursor-pointer transition-colors"
                      style={{
                        color: 'var(--text-primary)',
                        background: checked
                          ? 'rgba(201,151,43,0.08)'
                          : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (checked) return
                        e.currentTarget.style.background =
                          'var(--surface-sunken)'
                      }}
                      onMouseLeave={(e) => {
                        if (checked) return
                        e.currentTarget.style.background = 'transparent'
                      }}
                      role="option"
                      aria-selected={checked}
                    >
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                        style={{
                          borderColor: checked
                            ? 'var(--gold)'
                            : 'var(--border-default)',
                          background: checked
                            ? 'var(--gold)'
                            : 'transparent',
                        }}
                        aria-hidden
                      >
                        {checked && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6.5L5 9.5L10 3.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="flex-1 truncate">
                        {name}
                        {name === currentUserName && (
                          <span
                            className="ml-2 text-[11.5px]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            (you)
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * Live stopwatch used by the New-note dialog (and reusable elsewhere
 * when we wire time tracking into the rest of the app). Counts up in
 * seconds, formats as `HH:MM:SS`, toggles play/pause on the gold
 * pill, and emits the human-readable duration (`Nh Nm Ns`) back to
 * the parent via `onCommit` so the user can hit "Save note" with a
 * sensible string baked into the recorded-time input.
 *
 * Implementation notes:
 *   - `setInterval` is intentionally 1s tick; cumulative drift is
 *     tolerable for short note durations and the simpler code is
 *     worth more than millisecond accuracy.
 *   - The interval is cleared on unmount AND on each effect re-run
 *     so paused timers don't leak.
 *   - "Commit" fires every tick while running, so the input stays in
 *     sync with the running clock and the user can hit Save mid-run
 *     without losing the elapsed time.
 */
function Stopwatch({
  onCommit,
}: {
  onCommit: (formatted: string) => void
}) {
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])

  // Push the latest reading up to the parent every tick (or pause).
  useEffect(() => {
    if (seconds === 0) return
    onCommit(humanizeDuration(seconds))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds])

  const display = formatClock(seconds)

  return (
    <button
      type="button"
      onClick={() => setRunning((v) => !v)}
      className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border text-[13px] font-medium tabular-nums cursor-pointer transition-colors"
      style={{
        borderColor: running ? 'var(--gold)' : 'var(--border-default)',
        background: running
          ? 'rgba(201,151,43,0.10)'
          : 'var(--surface-card)',
        color: 'var(--text-primary)',
      }}
      aria-pressed={running}
      aria-label={running ? 'Pause timer' : 'Start timer'}
    >
      <span
        className="inline-flex items-center justify-center h-5 w-5 rounded-full"
        style={{
          background: 'var(--gold)',
          color: 'var(--navy)',
        }}
        aria-hidden
      >
        {running ? (
          <Pause size={10} strokeWidth={2.5} />
        ) : (
          <Play size={10} strokeWidth={2.5} />
        )}
      </span>
      {display}
    </button>
  )
}

/** Format an integer second count as `HH:MM:SS`. */
function formatClock(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/**
 * Format a second count as a compact human-readable string —
 * e.g. `1h 12m`, `42s`, `2h 5m 30s`. Matches the reference "1h 12m, 1:12…"
 * placeholder so users see a familiar shape when the timer commits.
 */
function humanizeDuration(secs: number): string {
  if (secs <= 0) return ''
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 || parts.length === 0) parts.push(`${s}s`)
  return parts.join(' ')
}

// ── Documents — sub-components ─────────────────────────────────────────

/**
 * Priority popover (formerly "Sort") — currently single setting
 * ("Show folders first"). Built as a popover instead of a dropdown so
 * the description text fits comfortably. Toggle commits immediately;
 * no Apply step. The trigger label was renamed from "Sort" to
 * "Priority" because the underlying control governs *which row sits
 * at the top*, not the column-sort direction — Priority reads more
 * accurately than Sort for that intent.
 */
function SortPopover({
  showFoldersFirst,
  onToggle,
}: {
  showFoldersFirst: boolean
  onToggle: (v: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
      >
        Priority
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border p-4"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 280,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div
                className="text-[13px] font-semibold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Show folders first
              </div>
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                With this setting turned on, folders will appear at the
                top of the list when sorting by the Name, Last edit at,
                and Uploaded date columns.
              </p>
            </div>
            <span
              role="switch"
              aria-checked={showFoldersFirst}
              tabIndex={0}
              onClick={() => onToggle(!showFoldersFirst)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  onToggle(!showFoldersFirst)
                }
              }}
              className="relative inline-flex h-[22px] w-[40px] rounded-full transition-colors shrink-0 mt-0.5 cursor-pointer"
              style={{
                background: showFoldersFirst
                  ? 'var(--gold)'
                  : 'var(--border-default)',
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 h-[18px] w-[18px] rounded-full bg-white transition-transform"
                style={{
                  transform: showFoldersFirst
                    ? 'translateX(18px)'
                    : 'translateX(0)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
                }}
              />
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Columns popover — staged-changes pattern (mirrors the contacts list
 * ColumnsPicker). Edit a local draft set, Update columns commits, Cancel
 * or click-outside discards.
 */
function ColumnsPopover({
  visible,
  onChange,
}: {
  visible: Set<DocColumnId>
  onChange: (next: Set<DocColumnId>) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<DocColumnId>>(new Set(visible))
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const openPopover = () => {
    setDraft(new Set(visible))
    setOpen(true)
  }
  const apply = () => {
    onChange(draft)
    setOpen(false)
  }
  const toggle = (id: DocColumnId) => {
    const next = new Set(draft)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setDraft(next)
  }

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (open ? setOpen(false) : openPopover())}
      >
        <Columns size={13} strokeWidth={1.75} />
        Columns
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 280,
          }}
        >
          <div className="p-4 max-h-[360px] overflow-y-auto">
            <div
              className="text-[11.5px] uppercase tracking-wider font-semibold mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Visible columns
            </div>
            <ul className="space-y-1.5">
              {/* `Action` is fixed — always visible, not toggleable. */}
              <li>
                <span
                  className="inline-flex items-center gap-2 text-[13px] opacity-60"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-sm border"
                    style={{
                      borderColor: 'var(--gold)',
                      background: 'var(--gold)',
                    }}
                    aria-hidden
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6.5L5 9.5L10 3.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  Action
                </span>
              </li>
              {DOC_COLUMNS.map((c) => {
                const checked = draft.has(c.id)
                return (
                  <li key={c.id}>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[13px]">
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                        style={{
                          borderColor: checked
                            ? 'var(--gold)'
                            : 'var(--border-default)',
                          background: checked ? 'var(--gold)' : 'transparent',
                        }}
                        aria-hidden
                      >
                        {checked && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6.5L5 9.5L10 3.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {c.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        className="sr-only"
                      />
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
          <div
            className="flex items-center justify-start gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button size="sm" onClick={apply}>
              Update columns
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Filters popover — Matter picker, Category picker, "Show Items in
 * Bin" toggle, Apply / Clear. Today the picker dropdowns are stubs
 * (we don't yet aggregate available categories from documents); the
 * UI is in place for the day they wire up.
 */
function FiltersPopover({
  caseFilter,
  categoryFilter,
  showBin,
  onApply,
  onClear,
}: {
  caseFilter: string
  categoryFilter: string
  showBin: boolean
  onApply: (caseId: string, category: string, showBin: boolean) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const [draftCase, setDraftCase] = useState(caseFilter)
  const [draftCategory, setDraftCategory] = useState(categoryFilter)
  const [draftBin, setDraftBin] = useState(showBin)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const activeCount =
    (caseFilter ? 1 : 0) + (categoryFilter ? 1 : 0) + (showBin ? 1 : 0)

  const openPopover = () => {
    setDraftCase(caseFilter)
    setDraftCategory(categoryFilter)
    setDraftBin(showBin)
    setOpen(true)
  }
  const apply = () => {
    onApply(draftCase, draftCategory, draftBin)
    setOpen(false)
  }
  const clear = () => {
    setDraftCase('')
    setDraftCategory('')
    setDraftBin(false)
    onClear()
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (open ? setOpen(false) : openPopover())}
      >
        <Funnel size={13} strokeWidth={1.75} />
        Filters
        {activeCount > 0 && (
          <span
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10.5px] font-semibold tabular-nums"
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          >
            {activeCount}
          </span>
        )}
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 320,
          }}
        >
          <div className="p-4 space-y-4">
            <div>
              <div
                className="text-[12.5px] font-semibold mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Case
              </div>
              <select
                value={draftCase}
                onChange={(e) => setDraftCase(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-[13px] appearance-none cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: draftCase
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  colorScheme: 'light',
                }}
              >
                <option value="">Find a case</option>
              </select>
            </div>
            <div>
              <div
                className="text-[12.5px] font-semibold mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Category
              </div>
              <select
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-[13px] appearance-none cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: draftCategory
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  colorScheme: 'light',
                }}
              >
                <option value="">Find a document category</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none text-[13px]">
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
                style={{
                  borderColor: draftBin
                    ? 'var(--gold)'
                    : 'var(--border-default)',
                  background: draftBin ? 'var(--gold)' : 'transparent',
                }}
                aria-hidden
              >
                {draftBin && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2 6.5L5 9.5L10 3.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span style={{ color: 'var(--text-primary)' }}>
                Show items in Bin
              </span>
              <input
                type="checkbox"
                checked={draftBin}
                onChange={() => setDraftBin((v) => !v)}
                className="sr-only"
              />
            </label>
          </div>
          <div
            className="flex items-center justify-start gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button size="sm" onClick={apply}>
              Apply filters
            </Button>
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * "New" dropdown — surfaces the reference four creation entry points. Each
 * menu item opens its own dialog; the parent owns the open state so
 * the dialogs survive dropdown close.
 */
function NewDropdown({
  onUploadFiles,
  onUploadFolder,
  onCreateFolder,
  onCreateFromTemplate,
}: {
  onUploadFiles: () => void
  onUploadFolder: () => void
  onCreateFolder: () => void
  onCreateFromTemplate: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap"
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
              boxShadow:
                '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                'var(--gold-dark, #B0831F)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--gold)'
            }}
          >
            New
            <CaretDown size={12} strokeWidth={2} />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={onUploadFiles}
          className="text-[12.5px] cursor-pointer"
        >
          UploadSimple files
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onUploadFolder}
          className="text-[12.5px] cursor-pointer"
        >
          UploadSimple folder
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onCreateFolder}
          className="text-[12.5px] cursor-pointer"
        >
          Create folder
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onCreateFromTemplate}
          className="text-[12.5px] cursor-pointer"
        >
          Create document from template
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Empty state shown when the contact has no documents. Follows the standard pattern:
 * an open-book illustration with a bright-blue magnifying glass
 * overlapping the bottom-right corner, plus the "No files found"
 * headline and the drag-and-drop subhead.
 */
function DocumentsEmptyState() {
  return (
    <div className="py-20 px-6 text-center">
      <div className="mx-auto mb-6 w-[180px]" aria-hidden>
        <NoFilesIllustration />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        No files found
      </p>
      <p
        className="mt-1 text-[12.5px]"
        style={{ color: 'var(--text-muted)' }}
      >
        Drag and drop files here or use the &ldquo;New&rdquo; button.
      </p>
    </div>
  )
}

/**
 * Inline SVG of an open book with a magnifying glass overlapping the
 * bottom-right corner. Mirrors the reference contact-scoped Documents empty
 * state. Drawn at a 220×180 viewBox; scales to whatever wrapper width
 * the caller sets.
 *
 * Composition (in z-order):
 *   1. Book shadow ellipse at the base (subtle ground anchor)
 *   2. Left page (white panel with text lines)
 *   3. Right page (white panel with text lines)
 *   4. Centre spine (the V where the pages meet)
 *   5. Magnifying glass: outer ring, lens fill, inner highlight, handle
 *
 * Colours pull from the design tokens so the illustration adapts to
 * theme changes without us editing fills directly.
 */
function NoFilesIllustration() {
  // Palette — pulled out so each shape references the same hue.
  const PAGE_FILL = '#FFFFFF'
  const PAGE_STROKE = '#1F2A44' // navy-ish outline matching the brand navy
  const TEXT_LINE = '#C7D2DD' // light grey for the "text" strokes
  const SHADOW = 'rgba(13, 27, 42, 0.08)'
  const LENS_FILL = '#7DD3FC' // light sky-blue glass
  const LENS_HIGHLIGHT = '#FFFFFF'
  const LENS_RIM = '#1E88E5' // saturated blue matching the reference accent
  const HANDLE = '#1E88E5'

  return (
    <svg
      viewBox="0 0 220 180"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      role="img"
      aria-label="No documents illustration"
    >
      {/* Ground shadow — grounds the book without committing to a
          full floor. Stays subtle. */}
      <ellipse cx="110" cy="160" rx="78" ry="6" fill={SHADOW} />

      {/* Left page */}
      <path
        d="M18 36 L102 30 L106 132 L22 138 Z"
        fill={PAGE_FILL}
        stroke={PAGE_STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Right page */}
      <path
        d="M118 30 L202 36 L198 138 L114 132 Z"
        fill={PAGE_FILL}
        stroke={PAGE_STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Centre spine — the V where the two pages meet. Drawn after
          the pages so the joint reads cleanly. */}
      <path
        d="M102 30 L110 40 L118 30"
        fill="none"
        stroke={PAGE_STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M106 132 L110 142 L114 132"
        fill="none"
        stroke={PAGE_STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <line
        x1="110"
        y1="40"
        x2="110"
        y2="142"
        stroke={PAGE_STROKE}
        strokeWidth="2"
      />

      {/* Text lines — left page. Slight downward slope mirrors the
          page's perspective tilt. */}
      <line
        x1="34"
        y1="60"
        x2="92"
        y2="56"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="34"
        y1="74"
        x2="92"
        y2="70"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="34"
        y1="88"
        x2="80"
        y2="85"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="34"
        y1="102"
        x2="92"
        y2="98"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="34"
        y1="116"
        x2="70"
        y2="113"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Text lines — right page. */}
      <line
        x1="128"
        y1="56"
        x2="186"
        y2="60"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="128"
        y1="70"
        x2="186"
        y2="74"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="128"
        y1="85"
        x2="170"
        y2="88"
        stroke={TEXT_LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Magnifying glass — drawn last so it sits on top of the book.
          Composition: handle first, then the rim/lens disc so the
          handle disappears under the disc's edge. */}
      {/* Handle */}
      <line
        x1="172"
        y1="140"
        x2="200"
        y2="168"
        stroke={HANDLE}
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* Lens disc — outer rim */}
      <circle
        cx="156"
        cy="124"
        r="32"
        fill={LENS_RIM}
      />
      {/* Lens disc — inner glass */}
      <circle
        cx="156"
        cy="124"
        r="24"
        fill={LENS_FILL}
      />
      {/* Lens highlight — small white crescent in the upper-left
          quadrant gives the glass its glassy read. */}
      <path
        d="M141 112 Q146 104 156 104"
        stroke={LENS_HIGHLIGHT}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  )
}

/**
 * Single document row. Renders a tight Action menu in the first cell
 * plus every visible column from the registry. Missing fields (Size /
 * Author / Comments — not on Document yet) render an em-dash so the
 * table stays scannable.
 */
function DocumentRow({
  doc,
  columns,
  expanded,
}: {
  doc: Document
  columns: DocColumn[]
  expanded: boolean
}) {
  const dash = (
    <span style={{ color: 'var(--text-subtle)' }}>—</span>
  )
  const cellPad = expanded ? 'py-3.5' : 'py-2'
  const fmtDate = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : null

  const value = (id: DocColumnId): React.ReactNode => {
    switch (id) {
      case 'recorded_time':
        return dash
      case 'name':
        return (
          <span className="inline-flex items-center gap-2 min-w-0">
            <FolderOpen
              size={14}
              strokeWidth={1.75}
              style={{ color: 'var(--gold-dark)' }}
            />
            <span
              className="text-[13px] font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {doc.title}
            </span>
          </span>
        )
      case 'case':
        return doc.case_id ?? dash
      case 'category':
        return doc.template_type || dash
      case 'size':
        return dash
      case 'last_edit':
        return fmtDate(doc.updated_at) ?? dash
      case 'received_at':
        return fmtDate(doc.created_at) ?? dash
      case 'comments':
        return dash
      case 'contact':
        return dash
      case 'author':
        return dash
      case 'uploaded_by':
        return dash
      case 'uploaded_date':
        return fmtDate(doc.created_at) ?? dash
      case 'id':
        return (
          <span
            className="font-mono text-[12px] tracking-wide"
            style={{ color: 'var(--text-muted)' }}
          >
            {doc.id}
          </span>
        )
      default:
        return dash
    }
  }

  return (
    <tr
      className="border-t transition-colors"
      style={{ borderColor: 'var(--border-soft)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-overlay)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <td className={`px-3 ${cellPad}`}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center justify-center h-7 w-7 rounded-md border cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-muted)',
                }}
                aria-label={`Actions for ${doc.title}`}
              >
                <CaretDown size={12} strokeWidth={1.75} />
              </button>
            }
          />
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem
              onClick={() => toast.info('Document preview is coming next.')}
              className="text-[12.5px] cursor-pointer"
            >
              Open
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toast.info('Document downloads ship next.')}
              className="text-[12.5px] cursor-pointer"
            >
              DownloadSimple
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toast.info('Document moves ship next.')}
              className="text-[12.5px] cursor-pointer"
            >
              Move
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
      {columns.map((c) => (
        <td
          key={c.id}
          className={`px-3 ${cellPad} text-[13px] whitespace-nowrap`}
          style={{ color: 'var(--text-primary)' }}
        >
          {value(c.id)}
        </td>
      ))}
    </tr>
  )
}

/**
 * Default category list for the upload dialog. Pulled from the
 * standard the standard pattern set so users see familiar legal-document buckets.
 * Persisted as the document's `template_type` string column for now;
 * the firm-settings screen will let firms manage this list later.
 */
const DOCUMENT_CATEGORIES = [
  'Agreements',
  'Answers',
  'Briefs',
  'Closings',
  'Communications',
  'Correspondence',
  'Court orders',
  'Discovery',
  'Evidence',
  'Filings',
  'Memos',
  'Notices',
  'Pleadings',
  'Receipts',
  'Reports',
  'Research',
  'Settlements',
  'Transcripts',
  'Wills',
  'Other',
] as const

/**
 * One staged file inside the UploadSimple dialog. The user can stack
 * multiple of these via "+ Add another file"; each row carries its
 * own metadata (file name, matter, received date, category, author).
 */
interface StagedFile {
  id: string
  file: File | null
  fileName: string
  extension: string
  matter: string
  receivedDate: string
  category: string
  author: string
}

function emptyStagedFile(): StagedFile {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `staged-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file: null,
    fileName: '',
    extension: '',
    matter: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    category: '',
    author: '',
  }
}

/**
 * UploadSimple dialog — opens from New ▸ UploadSimple files. Mirrors the reference
 * modal: file row + metadata fields (File name · Matter · Received
 * date · Category · Author), with "+ Add another file" to attach
 * more in a single submission, then UploadSimple / Cancel.
 *
 * On UploadSimple we call `useCreateDocument().mutateAsync` once per staged
 * file. Most metadata maps cleanly onto the existing Document schema
 * (`title`, `template_type`, `case_id`, `client_id`); `received_date`
 * and `author` are kept in form state and surfaced once those columns
 * ship with the contact-detail migration.
 */
function UploadDialog({
  open,
  onOpenChange,
  contactId,
  contactCases,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  contactId: string
  contactCases: Case[]
}) {
  const createMutation = useCreateDocument()
  const [staged, setStaged] = useState<StagedFile[]>(() => [emptyStagedFile()])
  const [submitting, setSubmitting] = useState(false)

  // Reset the staged list every time the dialog re-opens — the
  // previous submission's leftovers shouldn't carry over.
  useEffect(() => {
    if (open) setStaged([emptyStagedFile()])
  }, [open])

  const updateRow = (id: string, patch: Partial<StagedFile>) => {
    setStaged((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  }
  const removeRow = (id: string) => {
    setStaged((prev) =>
      prev.length === 1 ? prev : prev.filter((r) => r.id !== id),
    )
  }
  const addRow = () => {
    setStaged((prev) => [...prev, emptyStagedFile()])
  }

  // Submission is valid when every row has both a file and a non-
  // empty file name. Matter / category / author stay optional —
  // matches the standard pattern (only the file + filename are required).
  const canSubmit =
    staged.length > 0 &&
    staged.every((r) => r.file !== null && r.fileName.trim().length > 0) &&
    !submitting

  const handleUpload = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      // Run uploads sequentially so a single failure surfaces clearly
      // — Promise.allSettled would swallow per-row errors behind a
      // bulk success.
      for (const row of staged) {
        await createMutation.mutateAsync({
          title: row.fileName + row.extension,
          template_type: row.category,
          case_id: row.matter,
          client_id: contactId,
          court: '',
          suit_number: '',
          parties: '',
          judge: '',
          content: '',
        })
      }
      toast.success(
        staged.length === 1
          ? 'File uploaded.'
          : `${staged.length} files uploaded.`,
      )
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `UploadSimple failed: ${err.message}`
          : 'Upload failed. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle
            className="text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            UploadSimple
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 max-h-[60vh] overflow-y-auto space-y-5">
          {staged.map((row, idx) => (
            <UploadRow
              key={row.id}
              index={idx}
              row={row}
              cases={contactCases}
              onChange={(patch) => updateRow(row.id, patch)}
              onRemove={
                staged.length > 1 ? () => removeRow(row.id) : undefined
              }
            />
          ))}

          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 text-[13px] font-medium cursor-pointer"
            style={{ color: 'var(--gold-dark)' }}
          >
            <span
              className="inline-flex items-center justify-center h-5 w-5 rounded-full"
              style={{
                background: 'var(--gold)',
                color: 'var(--navy)',
              }}
              aria-hidden
            >
              <Plus size={12} strokeWidth={2.25} />
            </span>
            Add another file
          </button>
        </div>

        <DialogFooter
          className="px-6 py-4 border-t flex sm:flex-row sm:justify-start gap-2"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <button
            type="button"
            onClick={handleUpload}
            disabled={!canSubmit}
            className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
              boxShadow:
                '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
            }}
            onMouseEnter={(e) => {
              if (!canSubmit) return
              e.currentTarget.style.background =
                'var(--gold-dark, #B0831F)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--gold)'
            }}
          >
            {submitting
              ? 'Uploading…'
              : staged.length > 1
                ? `UploadSimple ${staged.length} files`
                : 'Upload'}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="inline-flex items-center h-9 px-3 rounded-lg text-[13px] font-medium cursor-pointer transition-colors disabled:opacity-50"
            style={{
              color: 'var(--text-muted)',
              background: 'transparent',
            }}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * One file-row inside the UploadSimple dialog. Renders the file picker
 * (chip with filename + Replace) above the metadata form (File name,
 * Matter, Received date, Category, Author). Splits the filename into
 * `fileName` + `extension` on selection so the user can edit the
 * stem without losing the `.csv`/`.pdf`/etc. suffix.
 */
function UploadRow({
  index,
  row,
  cases,
  onChange,
  onRemove,
}: {
  index: number
  row: StagedFile
  cases: Case[]
  onChange: (patch: Partial<StagedFile>) => void
  onRemove?: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  // Picker rendered as a hidden native input that we trigger via a
  // button click. Lets us style the affordance without dropping the
  // native file dialog.
  const onPickFile = () => fileInputRef.current?.click()
  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    // Split "foo.bar.csv" → name "foo.bar", ext ".csv". The leading
    // dot is preserved so we can re-join cleanly on submit.
    const dot = f.name.lastIndexOf('.')
    const stem = dot === -1 ? f.name : f.name.slice(0, dot)
    const ext = dot === -1 ? '' : f.name.slice(dot)
    onChange({ file: f, fileName: stem, extension: ext })
  }

  return (
    <section
      className="space-y-4 pt-1"
      style={{
        borderTop:
          index > 0 ? '1px solid var(--border-soft)' : undefined,
        paddingTop: index > 0 ? 16 : 0,
      }}
    >
      {/* File picker. Two states: empty (Choose file button) /
          chosen (filename chip + Replace file). */}
      <div className="flex items-start gap-3">
        <span
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
          style={{
            background: 'var(--surface-sunken)',
            color: 'var(--gold-dark)',
          }}
          aria-hidden
        >
          <FolderOpen size={16} strokeWidth={1.75} />
        </span>
        <div className="flex-1 min-w-0">
          <Label
            className="text-[12px] font-semibold mb-1.5 block"
            style={{ color: 'var(--text-primary)' }}
          >
            File
          </Label>
          <div
            className="flex items-center justify-between gap-2 rounded-lg border px-3 h-10 text-[13px]"
            style={{
              borderColor: 'var(--border-default)',
              background: row.file
                ? 'var(--surface-card)'
                : 'var(--surface-sunken)',
              color: row.file ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <span className="truncate">
              {row.file
                ? `${row.fileName}${row.extension}`
                : 'No file chosen'}
            </span>
            <button
              type="button"
              onClick={onPickFile}
              className="text-[12.5px] font-medium cursor-pointer shrink-0"
              style={{ color: 'var(--gold-dark)' }}
            >
              {row.file ? 'Replace file' : 'Choose file'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={onFileChosen}
              aria-label="Choose file to upload"
            />
          </div>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[12.5px] font-medium cursor-pointer self-end pb-2.5 whitespace-nowrap"
            style={{ color: 'var(--gold-dark)' }}
          >
            Remove
          </button>
        )}
      </div>

      {/* File name — required, with the extension pinned as a
          suffix chip so the user knows it can't be lost. */}
      <div>
        <Label
          htmlFor={`file-name-${row.id}`}
          className="text-[12px] font-semibold mb-1.5 block"
          style={{ color: 'var(--text-primary)' }}
        >
          File name *
        </Label>
        <div
          className="flex items-center rounded-lg border h-10 overflow-hidden"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
          }}
        >
          <input
            id={`file-name-${row.id}`}
            value={row.fileName}
            onChange={(e) => onChange({ fileName: e.target.value })}
            placeholder="e.g. contract-draft"
            className="flex-1 h-full px-3 text-[13px] bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          {row.extension && (
            <span
              className="px-3 text-[12.5px] tabular-nums border-l"
              style={{
                borderColor: 'var(--border-soft)',
                color: 'var(--text-muted)',
                background: 'var(--surface-sunken)',
              }}
            >
              {row.extension}
            </span>
          )}
        </div>
      </div>

      {/* Matter picker. Today it's filtered to the contact's own
          cases since this dialog is always reached from a contact
          detail page; the firm-wide picker ships with /documents/new
          when that lands. */}
      <div>
        <Label
          className="text-[12px] font-semibold mb-1.5 block"
          style={{ color: 'var(--text-primary)' }}
        >
          Matter
        </Label>
        <div className="relative">
          <select
            value={row.matter}
            onChange={(e) => onChange({ matter: e.target.value })}
            className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: row.matter
                ? 'var(--text-primary)'
                : 'var(--text-muted)',
              colorScheme: 'light',
            }}
          >
            <option value="">Find a matter by matter name or client</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
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
      </div>

      {/* Received date + Category — side by side at md+, stacked
          below to mirror the reference two-up row. */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label
            className="text-[12px] font-semibold mb-1.5 block"
            style={{ color: 'var(--text-primary)' }}
          >
            Received date
          </Label>
          <input
            type="date"
            value={row.receivedDate}
            onChange={(e) => onChange({ receivedDate: e.target.value })}
            className="w-full h-10 rounded-lg border px-3 text-[13px]"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
              colorScheme: 'light',
            }}
          />
        </div>
        <div>
          <Label
            className="text-[12px] font-semibold mb-1.5 block"
            style={{ color: 'var(--text-primary)' }}
          >
            Category
          </Label>
          <div className="relative">
            <select
              value={row.category}
              onChange={(e) => onChange({ category: e.target.value })}
              className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: row.category
                  ? 'var(--text-primary)'
                  : 'var(--text-muted)',
                colorScheme: 'light',
              }}
            >
              <option value="">Find a document category</option>
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
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
        </div>
      </div>

      {/* Author — free text. Kept here for parity with the standard pattern; persisted
          once the contact-detail migration adds an author column. */}
      <div>
        <Label
          className="text-[12px] font-semibold mb-1.5 block"
          style={{ color: 'var(--text-primary)' }}
        >
          Author
        </Label>
        <input
          value={row.author}
          onChange={(e) => onChange({ author: e.target.value })}
          className="w-full h-10 rounded-lg border px-3 text-[13px]"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
          }}
        />
      </div>
    </section>
  )
}

/**
 * UploadSimple-folder dialog. Variant of UploadDialog where the user picks
 * a whole directory; we display the folder name (read-only chip), the
 * matter / received date / category metadata, and create one Document
 * row per file in the folder on submit.
 *
 * The native folder picker is opt-in via the non-standard
 * `webkitdirectory` / `directory` attributes — Chromium, Safari, and
 * Firefox all support it on `<input type="file">`. The TS DOM lib
 * doesn't include either attribute yet, so we set them via ref after
 * mount.
 */
function UploadFolderDialog({
  open,
  onOpenChange,
  contactId,
  contactCases,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  contactId: string
  contactCases: Case[]
}) {
  const createMutation = useCreateDocument()
  const [files, setFiles] = useState<File[]>([])
  const [folderName, setFolderName] = useState('')
  const [matter, setMatter] = useState('')
  const [receivedDate, setReceivedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [category, setCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Wire `webkitdirectory` after mount — the React DOM types don't
  // surface either attribute yet, so we set them imperatively.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.setAttribute('webkitdirectory', '')
    el.setAttribute('directory', '')
  }, [open])

  useEffect(() => {
    if (open) {
      setFiles([])
      setFolderName('')
      setMatter('')
      setCategory('')
      setReceivedDate(new Date().toISOString().slice(0, 10))
    }
  }, [open])

  const onPickFolder = () => inputRef.current?.click()
  const onFolderChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? [])
    if (list.length === 0) return
    // `webkitRelativePath` carries the relative path inside the
    // picked folder ("folderName/sub/file.ext"). The first segment
    // is the folder's own name — pull it out for the display chip.
    const first = list[0] as File & { webkitRelativePath?: string }
    const root = first.webkitRelativePath?.split('/')[0] ?? 'New folder'
    setFiles(list)
    setFolderName(root)
  }

  const canSubmit =
    files.length > 0 && folderName.trim().length > 0 && !submitting

  const handleUpload = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      for (const f of files) {
        await createMutation.mutateAsync({
          title: f.name,
          template_type: category,
          case_id: matter,
          client_id: contactId,
          court: '',
          suit_number: '',
          parties: '',
          judge: '',
          content: '',
        })
      }
      toast.success(
        `Uploaded ${files.length} file${files.length === 1 ? '' : 's'} from ${folderName}.`,
      )
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Folder upload failed: ${err.message}`
          : 'Folder upload failed. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle
            className="text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            UploadSimple
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-4">
          <div className="flex items-start gap-3">
            <span
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
              style={{
                background: 'var(--surface-sunken)',
                color: 'var(--gold-dark)',
              }}
              aria-hidden
            >
              <FolderOpen size={16} strokeWidth={1.75} />
            </span>
            <div className="flex-1 min-w-0">
              <Label
                className="text-[12px] font-semibold mb-1.5 block"
                style={{ color: 'var(--text-primary)' }}
              >
                Folder *
              </Label>
              <div
                className="flex items-center justify-between gap-2 rounded-lg border px-3 h-10 text-[13px]"
                style={{
                  borderColor: 'var(--border-default)',
                  background: folderName
                    ? 'var(--surface-card)'
                    : 'var(--surface-sunken)',
                  color: folderName
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                }}
              >
                <span className="truncate">
                  {folderName
                    ? `${folderName} (${files.length} file${
                        files.length === 1 ? '' : 's'
                      })`
                    : 'No folder chosen'}
                </span>
                <button
                  type="button"
                  onClick={onPickFolder}
                  className="text-[12.5px] font-medium cursor-pointer shrink-0"
                  style={{ color: 'var(--gold-dark)' }}
                >
                  {folderName ? 'Replace folder' : 'Choose folder'}
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={onFolderChosen}
                  aria-label="Choose folder to upload"
                />
              </div>
            </div>
          </div>

          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Matter
            </Label>
            <div className="relative">
              <select
                value={matter}
                onChange={(e) => setMatter(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: matter
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  colorScheme: 'light',
                }}
              >
                <option value="">Find a matter by matter name or client</option>
                {contactCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                className="text-[12px] font-semibold mb-1.5 block"
                style={{ color: 'var(--text-primary)' }}
              >
                Received date
              </Label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-[13px]"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  colorScheme: 'light',
                }}
              />
            </div>
            <div>
              <Label
                className="text-[12px] font-semibold mb-1.5 block"
                style={{ color: 'var(--text-primary)' }}
              >
                Category
              </Label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--surface-card)',
                    color: category
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                    colorScheme: 'light',
                  }}
                >
                  <option value="">Find a document category</option>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
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
            </div>
          </div>
        </div>

        <DialogFooter
          className="px-6 py-4 border-t flex sm:flex-row sm:justify-start gap-2"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <PrimaryDialogBtn
            disabled={!canSubmit}
            onClick={handleUpload}
            label={
              submitting
                ? 'Uploading…'
                : files.length > 1
                  ? `UploadSimple ${files.length} files`
                  : 'Upload'
            }
          />
          <GhostDialogBtn
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            label="Cancel"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Create-folder dialog. Simple two-field form (Folder name *
 * Category) — no upload pipeline because nothing is being persisted
 * yet beyond the folder record. Today it just toasts on submit; once
 * the folders table ships we'll point this at a real mutation.
 */
function CreateFolderDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [folderName, setFolderName] = useState('')
  const [category, setCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setFolderName('')
      setCategory('')
    }
  }, [open])

  const canSubmit = folderName.trim().length > 0 && !submitting

  const handleCreate = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      // Stubbed: the folders table lands with the file-storage
      // backend. Today we just toast so users can complete the flow
      // end-to-end without a server round-trip.
      await new Promise((r) => setTimeout(r, 250))
      toast.success(`Folder "${folderName}" created.`)
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[520px] p-0 overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle
            className="text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Create folder
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-4">
          <div>
            <Label
              htmlFor="cf-folder-name"
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Folder name *
            </Label>
            <input
              id="cf-folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full h-10 rounded-lg border px-3 text-[13px]"
              style={{
                borderColor: folderName
                  ? 'var(--border-default)'
                  : '#E0788A',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
              }}
              autoFocus
            />
          </div>
          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Category
            </Label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: category
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  colorScheme: 'light',
                }}
              >
                <option value="">Find a document category</option>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
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
          </div>
        </div>

        <DialogFooter
          className="px-6 py-4 border-t flex sm:flex-row sm:justify-start gap-2"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <PrimaryDialogBtn
            disabled={!canSubmit}
            onClick={handleCreate}
            label={submitting ? 'Creating…' : 'Create'}
          />
          <GhostDialogBtn
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            label="Cancel"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Create-document-from-template dialog. Template picker is empty
 * today (no templates seeded), so the dropdown renders the "No
 * results found" state inline. Document name + "Create a PDF
 * document" toggle round out the form; footer carries the same
 * sub-processor disclosure the standard pattern shows.
 *
 * On Create we mint a real Document record with `template_type` set
 * to the chosen template name (or empty if none) and `content` left
 * blank for the editor to fill in. The PDF toggle is held in form
 * state until the export pipeline lands.
 */
function CreateFromTemplateDialog({
  open,
  onOpenChange,
  contactId,
  contactCases,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  contactId: string
  contactCases: Case[]
}) {
  const createMutation = useCreateDocument()
  const [templateQuery, setTemplateQuery] = useState('')
  const [docName, setDocName] = useState('')
  const [matter, setMatter] = useState('')
  const [makePdf, setMakePdf] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setTemplateQuery('')
      setDocName('')
      setMatter('')
      setMakePdf(true)
    }
  }, [open])

  const canSubmit = docName.trim().length > 0 && !submitting

  const handleCreate = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await createMutation.mutateAsync({
        title: docName.trim(),
        template_type: templateQuery.trim(), // empty if user didn't pick one
        case_id: matter,
        client_id: contactId,
        court: '',
        suit_number: '',
        parties: '',
        judge: '',
        content: '',
      })
      toast.success(
        makePdf
          ? `Document "${docName}" created (will be exported as PDF).`
          : `Document "${docName}" created.`,
      )
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Create failed: ${err.message}`
          : 'Create failed. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle
            className="text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Create document from template
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-4">
          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Document template *
            </Label>
            <input
              value={templateQuery}
              onChange={(e) => setTemplateQuery(e.target.value)}
              placeholder="Find a document template"
              className="w-full h-10 rounded-lg border px-3 text-[13px]"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
              }}
            />
            {/* Inline "no results" panel. Follows the standard pattern where
                the picker shows search results / empty state directly
                below the input rather than in a separate dropdown. */}
            <div
              className="mt-2 rounded-lg border px-4 py-12 text-center"
              style={{
                borderColor: 'var(--border-soft)',
                background: 'var(--surface-sunken)',
              }}
            >
              <p
                className="text-[13.5px] font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                No results found.
              </p>
              <p
                className="mt-1 text-[12px]"
                style={{ color: 'var(--text-muted)' }}
              >
                Document templates ship with the firm settings screen.
              </p>
            </div>
          </div>

          <div>
            <Label
              htmlFor="ct-name"
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Document name *
            </Label>
            <input
              id="ct-name"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Name your new document"
              className="w-full h-10 rounded-lg border px-3 text-[13px]"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <Label
              className="text-[12px] font-semibold mb-1.5 block"
              style={{ color: 'var(--text-primary)' }}
            >
              Matter
            </Label>
            <div className="relative">
              <select
                value={matter}
                onChange={(e) => setMatter(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 pr-9 text-[13px] appearance-none cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: matter
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  colorScheme: 'light',
                }}
              >
                <option value="">Find a matter by matter name or client</option>
                {contactCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
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
          </div>

          {/* Create as PDF checkbox — the reference default is on. */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-[13px]">
            <span
              className="inline-flex h-4 w-4 items-center justify-center rounded-sm border transition-colors"
              style={{
                borderColor: makePdf
                  ? 'var(--gold)'
                  : 'var(--border-default)',
                background: makePdf ? 'var(--gold)' : 'transparent',
              }}
              aria-hidden
            >
              {makePdf && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6.5L5 9.5L10 3.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              Create a PDF document
            </span>
            <input
              type="checkbox"
              checked={makePdf}
              onChange={() => setMakePdf((v) => !v)}
              className="sr-only"
            />
          </label>

          {/* Sub-processor disclosure — the standard pattern surfaces this because
              they hand template rendering off to Nintex. LegaLite
              runs renders in-house today, so the copy is adapted
              to a generic disclaimer pointing at our Terms / Privacy
              Policy. Update once the official sub-processor list
              ships. */}
          <p
            className="text-[11.5px] leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            Documents made from templates are processed via LegaLite&rsquo;s
            document engine. For further information, please refer to our
            <button
              type="button"
              onClick={() => toast.info('Terms of Service ship next.')}
              className="underline cursor-pointer ml-1"
              style={{ color: 'var(--gold-dark)' }}
            >
              Terms of Service
            </button>{' '}
            and
            <button
              type="button"
              onClick={() => toast.info('Privacy Policy ships next.')}
              className="underline cursor-pointer ml-1"
              style={{ color: 'var(--gold-dark)' }}
            >
              Privacy Policy
            </button>
            .
          </p>
        </div>

        <DialogFooter
          className="px-6 py-4 border-t flex sm:flex-row sm:justify-start gap-2 items-center"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgba(13,27,42,0.015)',
          }}
        >
          <PrimaryDialogBtn
            disabled={!canSubmit}
            onClick={handleCreate}
            label={submitting ? 'Creating…' : 'Create'}
          />
          <GhostDialogBtn
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            label="Cancel"
          />
          <button
            type="button"
            onClick={() =>
              toast.info('Document automation docs ship with the help centre.')
            }
            className="ml-auto text-[12.5px] font-medium cursor-pointer underline"
            style={{ color: 'var(--gold-dark)' }}
          >
            Learn more about document automation
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Shared dialog footer buttons ───────────────────────────────────────

/**
 * Primary action button used in dialog footers — gold pill, navy text,
 * subtle gold-tinted shadow. Centralised so all four dialog Submit
 * buttons share the same hover/disabled treatment.
 */
function PrimaryDialogBtn({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: 'var(--gold)',
        color: 'var(--navy)',
        boxShadow:
          '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.background = 'var(--gold-dark, #B0831F)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--gold)'
      }}
    >
      {label}
    </button>
  )
}

/**
 * Ghost cancel button used in dialog footers — quiet text-only style
 * matching the contacts page header's Cancel button. Centralised so
 * the four dialogs share the same hover treatment.
 */
function GhostDialogBtn({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center h-9 px-3 rounded-lg text-[13px] font-medium cursor-pointer transition-colors disabled:opacity-50"
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
      {label}
    </button>
  )
}

function PagerBtn({
  onClick,
  disabled,
  children,
  ...rest
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => {
        if (!disabled)
          e.currentTarget.style.background = 'var(--surface-sunken)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
