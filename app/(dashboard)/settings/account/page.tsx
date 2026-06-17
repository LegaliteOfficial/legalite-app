'use client'

/**
 * Account settings — composition root.
 *
 * Left sidebar nav switches between five sections (Profile,
 * Notifications, Security, Appearance, Integrations). All state +
 * mutations live in `useAccountState`; each section is its own file.
 *
 * Wrapped in Suspense because `useSearchParams()` is used to seed the
 * initial active section from `?section=`; Next 16 requires a
 * Suspense boundary above any client tree that reads search params.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { CaretLeft } from '@phosphor-icons/react'
import { AppearanceSection } from './_components/AppearanceSection'
import { IntegrationsSection } from './_components/IntegrationsSection'
import { NotificationsSection } from './_components/NotificationsSection'
import { ProfileSection } from './_components/ProfileSection'
import { SecuritySection } from './_components/SecuritySection'
import { Sidebar } from './_components/Sidebar'
import { useAccountState } from './_hooks/use-account-state'

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  )
}

function SettingsPageInner() {
  const state = useAccountState()

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ background: 'var(--surface-card)' }}
    >
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-xs font-semibold mb-3 hover:opacity-70 transition-opacity"
        style={{ color: '#6B7280' }}
      >
        <CaretLeft size={14} strokeWidth={2} /> Back to settings
      </Link>
      <h1
        className="font-heading text-xl font-bold mb-6"
        style={{ color: '#0D1B2A' }}
      >
        Account settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Sidebar
          active={state.activeSection}
          onChange={state.setActiveSection}
        />

        <div className="lg:col-span-3 space-y-6">
          {state.activeSection === 'profile' && (
            <ProfileSection state={state} />
          )}
          {state.activeSection === 'notifications' && (
            <NotificationsSection state={state} />
          )}
          {state.activeSection === 'security' && (
            <SecuritySection state={state} />
          )}
          {state.activeSection === 'appearance' && (
            <AppearanceSection state={state} />
          )}
          {state.activeSection === 'integrations' && (
            <IntegrationsSection state={state} />
          )}
        </div>
      </div>
    </div>
  )
}
