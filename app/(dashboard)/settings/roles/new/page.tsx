'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronRight, Info,
  Users, Briefcase, Clock, CreditCard, Landmark, Receipt,
  Settings as SettingsIcon, ShieldAlert, ListChecks, Trash2, Lock,
} from 'lucide-react'
import { toast } from 'sonner'

// ──────────────────────────────────────────────────────────────────────────
// Data model
// ──────────────────────────────────────────────────────────────────────────

type PermissionDef = { id: string; label: string }
type PermissionGroup = { id: string; label: string; Icon: typeof Users; permissions: PermissionDef[] }
type SectionDef = {
  id: string
  label: string
  description: string
  groups: PermissionGroup[]
  note?: string
  newCount?: number
}

const PERMISSION_SECTIONS: SectionDef[] = [
  {
    id: 'contacts',
    label: 'Clients & Contacts management',
    description: 'Limits who can view, edit, create, delete or export, and set different permissions for clients and contacts.',
    note: 'Updating contact permissions may affect third-party integrations and the client portal.',
    groups: [
      {
        id: 'contacts',
        label: 'Contacts',
        Icon: Users,
        permissions: [
          { id: 'create-contacts',      label: 'Create contacts' },
          { id: 'edit-contacts',        label: 'Edit contacts' },
          { id: 'delete-contacts',      label: 'Delete contacts' },
          { id: 'bulk-delete-contacts', label: 'Bulk delete contacts' },
          { id: 'export-contacts',      label: 'Export contacts' },
          { id: 'send-review-requests', label: 'Send review requests' },
        ],
      },
    ],
  },
  {
    id: 'cases',
    label: 'Cases & Matters management',
    description: 'Limits who can view, edit, create, delete, export, or perform bulk actions and set different permissions for cases.',
    note: 'Cases and their connected items (documents, notes, tasks, communications, and activities) are also governed by matter permissions controlled by groups.',
    groups: [
      {
        id: 'cases',
        label: 'Cases',
        Icon: Briefcase,
        permissions: [
          { id: 'create-cases',          label: 'Create cases' },
          { id: 'edit-case-properties',  label: 'Edit case properties' },
          { id: 'bulk-edit-cases',       label: 'Bulk edit cases' },
          { id: 'delete-cases',          label: 'Delete cases' },
          { id: 'bulk-delete-cases',     label: 'Bulk delete cases' },
          { id: 'export-cases',          label: 'Export cases' },
          { id: 'view-case-timeline',    label: 'View case timeline' },
          { id: 'view-restricted-cases', label: 'View restricted cases' },
          { id: 'view-case-financials',  label: 'View case financials' },
        ],
      },
    ],
  },
  {
    id: 'timekeeping',
    label: 'Timekeeping & Activities',
    description: 'Enables access to activities, where time and expenses are tracked against cases.',
    note: 'Activities are also governed by matter permissions controlled by groups.',
    groups: [
      {
        id: 'activities',
        label: 'Activities',
        Icon: Clock,
        permissions: [
          { id: 'view-own-activities',   label: 'View own activities' },
          { id: 'edit-own-activities',   label: 'Edit own activities' },
          { id: 'delete-own-activities', label: 'Delete own activities' },
          { id: 'view-team-activities',  label: 'View other users’ activities' },
          { id: 'edit-team-activities',  label: 'Edit other users’ activities' },
        ],
      },
    ],
  },
  {
    id: 'financial',
    label: 'Billing & Financial management',
    description: 'Provides access to financial management, including bills and client fund requests.',
    newCount: 2,
    groups: [
      { id: 'accounts',     label: 'Accounts',      Icon: Landmark,    permissions: [
        { id: 'view-accounts',         label: 'View trust and operating accounts' },
        { id: 'manage-account-info',   label: 'Manage account information' },
      ]},
      { id: 'transactions', label: 'Transactions',  Icon: CreditCard, permissions: [
        { id: 'view-transactions',     label: 'View transactions' },
        { id: 'create-transactions',   label: 'Create transactions' },
        { id: 'manage-transactions',   label: 'Manage transactions' },
      ]},
      { id: 'bills',        label: 'Bills and client fund requests', Icon: Receipt, permissions: [
        { id: 'view-bills',            label: 'View bills and trust requests' },
        { id: 'manage-bills',          label: 'Manage bills and trust requests' },
        { id: 'create-bills',          label: 'Create bills and client fund requests' },
      ]},
    ],
  },
  {
    id: 'firm',
    label: 'Firm settings',
    description: 'Manages firm-wide settings across objects and accounts.',
    groups: [
      {
        id: 'account-settings',
        label: 'Account settings',
        Icon: SettingsIcon,
        permissions: [
          { id: 'view-firm-feed',           label: 'View account firm feed' },
          { id: 'manage-roles',             label: 'Manage roles' },
          { id: 'manage-users',             label: 'Manage users' },
          { id: 'manage-custom-fields',     label: 'Manage custom fields' },
          { id: 'manage-review-location',   label: 'Manage location for review requests' },
        ],
      },
    ],
  },
  {
    id: 'conflict',
    label: 'Conflict check',
    description: 'Limits who can use conflict check and view the conflict-of-interest report.',
    groups: [
      {
        id: 'conflict',
        label: 'Conflict check',
        Icon: ShieldAlert,
        permissions: [
          { id: 'manage-conflict-checks',   label: 'Manage conflict checks' },
          { id: 'view-conflict-report',     label: 'View conflict check report' },
        ],
      },
    ],
  },
  {
    id: 'tasks',
    label: 'Tasks management',
    description: 'Controls who can view, edit, and bulk-delete tasks.',
    newCount: 1,
    groups: [
      { id: 'view-tasks',   label: 'View tasks',   Icon: ListChecks, permissions: [
        { id: 'view-assigned-tasks', label: 'View tasks from assigned matters' },
        { id: 'view-all-tasks',      label: 'View tasks across the firm' },
      ]},
      { id: 'bulk-tasks',   label: 'Bulk delete tasks', Icon: Trash2,  permissions: [
        { id: 'bulk-delete-tasks',   label: 'Bulk delete tasks' },
      ]},
    ],
  },
  {
    id: 'non-config',
    label: 'Non-configurable permissions',
    description: 'These permissions are always granted and cannot be modified. Listed here for visibility.',
    groups: [
      {
        id: 'non-config',
        label: 'Always granted',
        Icon: Lock,
        permissions: [
          { id: 'view-own-profile', label: 'View and edit own profile' },
          { id: 'change-password',  label: 'Change own password' },
          { id: 'sign-in-out',      label: 'Sign in and sign out' },
        ],
      },
    ],
  },
]

// Templates pre-fill permission IDs to `true`.
const TEMPLATE_PERMISSIONS: Record<string, string[]> = {
  administrator: PERMISSION_SECTIONS.flatMap((s) => s.groups.flatMap((g) => g.permissions.map((p) => p.id))),
  accounts:      ['view-accounts','manage-account-info','view-transactions','create-transactions','manage-transactions'],
  reports:       ['view-own-activities','view-team-activities','view-bills'],
  billing:       ['view-bills','manage-bills','create-bills','view-transactions'],
  'general-access': [
    'create-contacts','edit-contacts','send-review-requests',
    'create-cases','edit-case-properties','view-case-timeline',
    'view-own-activities','edit-own-activities','view-assigned-tasks',
  ],
}

// Permissions that ship enabled by default even without a template (following the standard pattern).
const DEFAULT_ENABLED = new Set(['view-own-activities', 'view-assigned-tasks'])
// Non-configurable section's permissions are always on — locked.
const ALWAYS_ON = new Set(PERMISSION_SECTIONS.find((s) => s.id === 'non-config')!.groups.flatMap((g) => g.permissions.map((p) => p.id)))

const TEMPLATE_OPTIONS = [
  { value: '',              label: 'Without a role as a template' },
  { value: 'administrator', label: 'Administrator' },
  { value: 'accounts',      label: 'Accounts' },
  { value: 'reports',       label: 'Reports' },
  { value: 'billing',       label: 'Billing' },
  { value: 'general-access',label: 'General Access' },
]

// ──────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { id: 'role-details', label: 'Role details' },
  { id: 'template',     label: 'Choose a role template' },
  ...PERMISSION_SECTIONS.map((s) => ({ id: s.id, label: s.label })),
]

const initialPermissions = (): Record<string, boolean> => {
  const map: Record<string, boolean> = {}
  for (const section of PERMISSION_SECTIONS) {
    for (const group of section.groups) {
      for (const p of group.permissions) {
        map[p.id] = DEFAULT_ENABLED.has(p.id) || ALWAYS_ON.has(p.id)
      }
    }
  }
  return map
}

export default function CreateRolePage() {
  const router = useRouter()

  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [template, setTemplate] = useState('')
  const [permissions, setPermissions] = useState<Record<string, boolean>>(initialPermissions)
  const [activeId, setActiveId] = useState<string>('role-details')

  // Scrollspy via IntersectionObserver.
  useEffect(() => {
    const targets = SIDEBAR_ITEMS
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null)
    if (targets.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the highest intersection ratio that's intersecting.
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        setActiveId(visible[0].target.id)
      },
      { rootMargin: '-120px 0px -55% 0px', threshold: [0, 0.2, 0.5, 1] },
    )
    targets.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
  }, [])

  const togglePermission = (id: string) => {
    if (ALWAYS_ON.has(id)) return
    setPermissions((p) => ({ ...p, [id]: !p[id] }))
  }

  const handleTemplateChange = (value: string) => {
    setTemplate(value)
    if (!value) return
    const granted = new Set([...(TEMPLATE_PERMISSIONS[value] ?? []), ...ALWAYS_ON])
    const next: Record<string, boolean> = {}
    for (const section of PERMISSION_SECTIONS) {
      for (const group of section.groups) {
        for (const p of group.permissions) {
          next[p.id] = granted.has(p.id)
        }
      }
    }
    setPermissions(next)
    const label = TEMPLATE_OPTIONS.find((o) => o.value === value)?.label
    toast.success(`Permissions pre-filled from "${label}".`)
  }

  const grantedCounts = useMemo(() => {
    const counts: Record<string, { granted: number; total: number }> = {}
    for (const section of PERMISSION_SECTIONS) {
      let granted = 0
      let total = 0
      for (const group of section.groups) {
        for (const p of group.permissions) {
          total += 1
          if (permissions[p.id]) granted += 1
        }
      }
      counts[section.id] = { granted, total }
    }
    return counts
  }, [permissions])

  const handleCreate = () => {
    if (!roleName.trim()) {
      toast.error('Role name is required.')
      return
    }
    if (!roleDescription.trim()) {
      toast.error('Role description is required.')
      return
    }
    toast.success(`Role "${roleName}" created (dev preview — not persisted).`)
    router.push('/settings/roles')
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--surface-card)' }}>
      {/* Sticky top bar */}
      <div
        className="sticky top-0 z-20 backdrop-blur"
        style={{ background: 'rgba(248, 244, 238, 0.85)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--navy)' }}>
              <Link href="/settings" className="hover:opacity-70 transition-opacity" style={{ color: '#6B7280' }}>Settings</Link>
              <ChevronRight size={14} strokeWidth={2.25} style={{ color: '#9CA3AF' }} />
              <Link href="/settings/roles" className="hover:opacity-70 transition-opacity" style={{ color: '#6B7280' }}>Roles</Link>
              <ChevronRight size={14} strokeWidth={2.25} style={{ color: '#9CA3AF' }} />
              <span className="font-bold">Create custom role</span>
            </div>
            <h1 className="font-heading text-2xl font-extrabold leading-tight" style={{ color: 'var(--navy)' }}>
              Create custom role
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings/roles"
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold border transition-colors hover:bg-black/5"
              style={{ borderColor: 'var(--border)', color: 'var(--navy)', background: 'white' }}
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #C9972B 0%, #B8860B 100%)' }}
            >
              Create custom role
            </button>
          </div>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div className="px-6 py-8 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-8 max-w-6xl mx-auto">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="text-[10px] font-bold tracking-[3px] uppercase mb-3" style={{ color: '#9CA3AF' }}>
            Sections
          </div>
          <ul className="space-y-0.5">
            {SIDEBAR_ITEMS.map((item) => {
              const active = item.id === activeId
              const counts = grantedCounts[item.id]
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm transition-colors"
                    style={{
                      background: active ? 'rgba(201,151,43,0.10)' : 'transparent',
                      color: active ? 'var(--gold)' : 'var(--navy)',
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    <span>{item.label}</span>
                    {counts && (
                      <span
                        className="text-[10px] font-bold tabular-nums"
                        style={{ color: active ? 'var(--gold)' : '#9CA3AF' }}
                      >
                        {counts.granted}/{counts.total}
                      </span>
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        </aside>

        {/* Content */}
        <div className="space-y-6 min-w-0">
          {/* Role details */}
          <Section id="role-details" title="Role details" description="Provide a name and description so anyone in the firm understands what this role does.">
            <Field label="Role name" required>
              <input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Junior Associate"
                className="h-10 w-full rounded-md border px-3 text-sm bg-white transition-colors focus:outline-none focus:border-yellow-600"
                style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
              />
            </Field>
            <Field label="Role description" required>
              <textarea
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Describe in one or two sentences what this role can do and who it’s for."
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm bg-white transition-colors focus:outline-none focus:border-yellow-600 resize-y"
                style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
              />
            </Field>
          </Section>

          {/* Template */}
          <Section
            id="template"
            title="Choose a role template"
            description="Select an existing role as a starting point. We’ll pre-fill the permissions below and you can fine-tune them."
          >
            <Field label="Template">
              <select
                value={template}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 pr-9 text-sm transition-colors focus:outline-none focus:border-yellow-600 appearance-none"
                style={{
                  borderColor: 'var(--border)', color: 'var(--navy)',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236B7280\' stroke-width=\'2.25\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '12px',
                }}
              >
                {TEMPLATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>
          </Section>

          {/* Permission sections */}
          {PERMISSION_SECTIONS.map((section) => (
            <PermissionSectionCard
              key={section.id}
              section={section}
              permissions={permissions}
              counts={grantedCounts[section.id]}
              onTogglePermission={togglePermission}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Primitives
// ──────────────────────────────────────────────────────────────────────────

function Section({
  id, title, description, children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border p-6 scroll-mt-32"
      style={{ background: 'var(--cream-white)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.05)' }}
    >
      <h2 className="font-heading text-lg font-bold mb-1" style={{ color: 'var(--navy)' }}>{title}</h2>
      {description && (
        <p className="text-sm mb-5 leading-relaxed" style={{ color: '#6B7280' }}>{description}</p>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function PermissionSectionCard({
  section, permissions, counts, onTogglePermission,
}: {
  section: SectionDef
  permissions: Record<string, boolean>
  counts: { granted: number; total: number }
  onTogglePermission: (id: string) => void
}) {
  return (
    <section
      id={section.id}
      className="rounded-2xl border p-6 scroll-mt-32"
      style={{ background: 'var(--cream-white)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.05)' }}
    >
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--navy)' }}>{section.label}</h2>
          {section.newCount ? (
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'rgba(201,151,43,0.15)', color: 'var(--gold)' }}
            >
              New ({section.newCount})
            </span>
          ) : null}
        </div>
        <span className="text-xs font-semibold tabular-nums shrink-0 mt-1.5" style={{ color: '#6B7280' }}>
          {counts.granted}/{counts.total} granted
        </span>
      </div>
      <p className="text-sm mb-5 leading-relaxed" style={{ color: '#6B7280' }}>{section.description}</p>

      <div className="space-y-6">
        {section.groups.map((group) => (
          <div key={group.id}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <group.Icon size={15} strokeWidth={2} style={{ color: 'var(--navy)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--navy)' }}>{group.label}</span>
            </div>
            <ul className="space-y-1">
              {group.permissions.map((p) => (
                <li key={p.id}>
                  <PermissionRow
                    id={p.id}
                    label={p.label}
                    enabled={!!permissions[p.id]}
                    locked={ALWAYS_ON.has(p.id)}
                    onToggle={() => onTogglePermission(p.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {section.note && (
        <div
          className="mt-6 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-relaxed"
          style={{ background: 'rgba(59,130,246,0.06)', color: '#1E3A8A' }}
        >
          <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color: '#3B82F6' }} />
          <p><span className="font-bold">Note: </span>{section.note}</p>
        </div>
      )}
    </section>
  )
}

function PermissionRow({
  id, label, enabled, locked, onToggle,
}: {
  id: string
  label: string
  enabled: boolean
  locked: boolean
  onToggle: () => void
}) {
  return (
    <label
      htmlFor={`perm-${id}`}
      className="flex items-center justify-between gap-4 py-2 px-1 rounded-md transition-colors hover:bg-black/[0.02]"
      style={{ cursor: locked ? 'not-allowed' : 'pointer' }}
    >
      <span className="text-sm" style={{ color: locked ? '#9CA3AF' : 'var(--navy)' }}>
        {label}
        {locked && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>locked</span>}
      </span>
      <ToggleSwitch id={`perm-${id}`} checked={enabled} onChange={onToggle} disabled={locked} />
    </label>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1.5">
        <span className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>{label}</span>
        {required && <span className="text-xs font-bold" style={{ color: '#DC2626' }}>*</span>}
      </div>
      {children}
    </div>
  )
}

function ToggleSwitch({
  id, checked, onChange, disabled,
}: {
  id?: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: checked ? 'var(--gold)' : '#D1D5DB' }}
    >
      <span
        className="pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: checked ? 'translateX(1.125rem)' : 'translateX(0.15rem)' }}
      />
    </button>
  )
}
