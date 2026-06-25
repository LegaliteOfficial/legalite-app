'use client'

import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'

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

const SYSTEM_ITEMS: Item[] = [
  { label: 'Account and payment info', description: 'Manage your firm account, plan, and payment details.',                                                    href: '/settings/account-info' },
  { label: 'Firm members',             description: 'Invite, remove, and manage everyone in your firm.',                                                       href: '/settings/members' },
  { label: 'Roles and permissions',    description: 'Configure firm roles and professional titles for your team.', badge: 'New',                                href: '/settings/roles' },
  { label: 'Custom fields',            description: 'Create custom fields for clients, cases, and matters.',                                                   href: '/settings/custom-fields' },
  { label: 'Recovery bin',             description: 'Recover recently deleted matters, clients, tasks, and documents.',                                        href: '/settings/recovery-bin' },
]

const PERSONAL_ITEMS: Item[] = [
  { label: 'Profile',                  description: 'Update your name, contact information, and professional details.', href: '/settings/account?section=profile' },
  { label: 'Notifications',            description: 'Email and in-app notification preferences.',                       href: '/settings/account?section=notifications' },
]

const FIRM_ITEMS: Item[] = [
  { label: 'Firm profile',           description: 'Firm name, address, branding, and default jurisdiction.',                                  href: '/firm/settings' },
  { label: 'Practice areas',         description: 'Manage the practice areas and matter types your firm handles.',                    href: '/settings/practice-areas' },
  { label: 'AI settings',            description: 'Configure citation style, default mode, and firm knowledge base options.',         href: '/settings/ai' },
]

const COLUMNS: Column[] = [
  { title: 'System',           items: SYSTEM_ITEMS },
  { title: 'Firm preferences', items: FIRM_ITEMS },
  { title: 'Personal',         items: PERSONAL_ITEMS },
]

export default function SettingsHubPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <PageHeader
          title="Settings"
          description="Manage your firm, account, and preferences."
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-10">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2
                className="text-[10.5px] font-medium tracking-[0.12em] uppercase mb-4 pb-3 border-b"
                style={{ color: 'var(--text-muted)', borderColor: 'var(--border-soft)' }}
              >
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

        <Card padding="md" className="mt-10 flex items-center gap-4">
          <div className="flex-1 text-[13.5px]" style={{ color: 'var(--text-primary)' }}>
            <span className="font-medium">You are the firm owner.</span>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              You can administer the{' '}
              <Link href="/firm/billing" className="font-medium hover:underline underline-offset-2" style={{ color: 'var(--gold)' }}>
                firm subscription
              </Link>{' '}
              and have sole control of the{' '}
              <Link href="/firm/calendar" className="font-medium hover:underline underline-offset-2" style={{ color: 'var(--gold)' }}>
                firm calendar
              </Link>
              .
            </span>
          </div>
          <Link
            href="/settings/transfer-ownership"
            className="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-[13px] font-medium border transition-colors shrink-0"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              background: 'var(--surface-card)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-overlay)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-card)')}
          >
            Transfer role
          </Link>
        </Card>

        <div className="mt-6">
          <Link
            href="/settings/license-attribution"
            className="text-[12px] font-medium hover:underline underline-offset-2"
            style={{ color: 'var(--text-muted)' }}
          >
            License attribution
          </Link>
        </div>
      </div>
    </div>
  )
}

function SettingsLink({ label, description, href, badge }: Item) {
  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-2">
        <span
          className="font-medium text-[14px] transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </span>
        {badge && (
          <span
            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider"
            style={{ background: 'rgba(201,151,43,0.14)', color: 'var(--gold-dark)' }}
          >
            {badge}
          </span>
        )}
        <ArrowRight
          size={13}
          strokeWidth={1.75}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--text-muted)' }}
        />
      </div>
      <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
    </Link>
  )
}
