'use client'

import Link from 'next/link'
import { CreditCard, ArrowRight } from 'lucide-react'

type Item = {
  label: string
  description: string
  href: string
  badge?: string
}

type Column = {
  title: string
  items: Item[]
}

// SYSTEM — firm administration. Items that exist as fully-built forms link into
// /settings/account?section=… so we don't lose the working UI. Items still to
// be built go to placeholder routes (will 404 until we build them).
const SYSTEM_ITEMS: Item[] = [
  { label: 'Account and Payment Info', description: 'Manage your firm account, plan, and payment details.',                                                    href: '/settings/account-info' },
  { label: 'Firm Members',             description: 'Invite, remove, and manage everyone in your firm.',                                                       href: '/team' },
  { label: 'Roles and Permissions',    description: 'Configure firm roles (owner, admin, member) and professional titles for your team.', badge: 'New',        href: '/settings/roles' },
  { label: 'Custom Fields',            description: 'Create custom fields for clients, cases, and matters.',                                                   href: '/settings/custom-fields' },
  { label: 'Recovery Bin',             description: 'Recover recently deleted matters, clients, tasks, and documents.',                                        href: '/settings/recovery-bin' },
  { label: 'Security and Compliance',  description: 'Passwords, two-factor authentication, and active session management.',                                    href: '/settings/account?section=security' },
  { label: 'Document Templates',       description: 'Manage your firm-wide document templates and merge fields.',                                              href: '/settings/templates' },
]

// PERSONAL — settings scoped to the logged-in user.
const PERSONAL_ITEMS: Item[] = [
  { label: 'Profile',                  description: 'Update your name, contact information, and professional details.', href: '/settings/account?section=profile' },
  { label: 'Appearance',               description: 'Customize how LegaLite looks on this device.',                     href: '/settings/account?section=appearance' },
  { label: 'Contact and Calendar Sync',description: 'Connect Google Workspace or Microsoft 365 for calendar sync.',     href: '/settings/account?section=integrations' },
  { label: 'Connected Apps',           description: 'Manage third-party applications connected to your account.',       href: '/settings/account?section=integrations' },
  { label: 'Text Snippets',            description: 'Manage your personal library of reusable text snippets.',          href: '/settings/snippets' },
  { label: 'Notifications',            description: 'Email and in-app notification preferences.',                       href: '/settings/account?section=notifications' },
]

// FIRM PREFERENCES — workspace-level configuration. Visible to owner/admin
// per the tenancy model.
const FIRM_ITEMS: Item[] = [
  { label: 'Firm Profile',           description: 'Firm name, address, branding, and default jurisdiction (Ghana).',                  href: '/firm/settings' },
  { label: 'Billing and Plan',       description: 'View invoices, change plan, and manage payment methods.',                          href: '/firm/billing' },
  { label: 'Practice Areas',         description: 'Manage the practice areas and matter types your firm handles.',                    href: '/settings/practice-areas' },
  { label: 'AI Settings',            description: 'Configure citation style, default mode, and firm knowledge base options.',         href: '/settings/ai' },
  { label: 'Automated Workflows',    description: 'Speed up the firm’s repetitive work with automation rules.',                  href: '/settings/workflows' },
  { label: 'Client Portal',          description: 'Branding and access controls for the client-facing portal.',                       href: '/settings/portal' },
]

const COLUMNS: Column[] = [
  { title: 'SYSTEM',           items: SYSTEM_ITEMS },
  { title: 'PERSONAL',         items: PERSONAL_ITEMS },
  { title: 'FIRM PREFERENCES', items: FIRM_ITEMS },
]

export default function SettingsHubPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--cream)' }}>
      <h1 className="font-heading text-xl font-bold mb-6" style={{ color: '#0D1B2A' }}>
        Settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-10">
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-xs font-extrabold tracking-[2.5px] uppercase mb-5 pb-3 border-b" style={{ color: 'var(--navy)', borderColor: 'var(--border)' }}>
              {col.title}
            </h2>
            <ul className="space-y-5">
              {col.items.map((item) => (
                <li key={item.label}>
                  <SettingsLink {...item} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Ownership notice — primary subscriber / Transfer role */}
      <div
        className="mt-10 rounded-xl border flex items-center gap-4 px-5 py-4"
        style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}
      >
        <span
          className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
          style={{ background: 'rgba(201,151,43,0.10)' }}
        >
          <CreditCard size={18} strokeWidth={1.75} style={{ color: 'var(--gold)' }} />
        </span>
        <div className="flex-1 text-sm" style={{ color: 'var(--navy)' }}>
          <span className="font-semibold">You are the firm owner.</span>{' '}
          You can administer the{' '}
          <Link href="/firm/billing" className="underline underline-offset-2 font-semibold" style={{ color: 'var(--gold)' }}>
            firm subscription
          </Link>{' '}
          and have sole control of the{' '}
          <Link href="/firm/calendar" className="underline underline-offset-2 font-semibold" style={{ color: 'var(--gold)' }}>
            firm calendar
          </Link>
          .
        </div>
        <Link
          href="/settings/transfer-ownership"
          className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold border shrink-0 transition-colors hover:bg-black/5"
          style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
        >
          Transfer role
        </Link>
      </div>

      <div className="mt-8">
        <Link
          href="/settings/license-attribution"
          className="text-xs font-semibold underline underline-offset-2"
          style={{ color: 'var(--gold)' }}
        >
          License attribution
        </Link>
      </div>
    </div>
  )
}

function SettingsLink({ label, description, href, badge }: Item) {
  return (
    <Link href={href} className="group block">
      <div className="flex items-start gap-2">
        <span
          className="font-bold text-[15px] group-hover:opacity-80 transition-opacity"
          style={{ color: 'var(--gold)' }}
        >
          {label}
        </span>
        {badge && (
          <span
            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(201,151,43,0.15)', color: 'var(--gold)' }}
          >
            {badge}
          </span>
        )}
        <ArrowRight
          size={13}
          strokeWidth={2.25}
          className="opacity-0 group-hover:opacity-100 transition-opacity mt-1"
          style={{ color: 'var(--gold)' }}
        />
      </div>
      <p className="text-sm mt-1 leading-snug font-medium" style={{ color: '#4B5563' }}>
        {description}
      </p>
    </Link>
  )
}
