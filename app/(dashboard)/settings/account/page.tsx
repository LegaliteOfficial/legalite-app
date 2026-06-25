'use client'

/**
 * Account settings — composition root.
 *
 * Two-pane layout: a fixed header and a fixed left nav, with only the
 * content column scrolling. The page root owns the scroll boundaries so
 * the sidebar stays put as you read a long section (Profile, Security,
 * etc.) instead of drifting off with the content.
 *
 * Wrapped in Suspense because `useSearchParams()` is used to seed the
 * initial active section from `?section=`; Next 16 requires a
 * Suspense boundary above any client tree that reads search params.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { CaretLeft } from '@phosphor-icons/react'
import { AppearanceSection } from './_components/AppearanceSection'
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
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: 'var(--surface-page)' }}
    >
      {/* Fixed header — does not scroll with the content. */}
      <div className="shrink-0 px-6 pt-6 pb-4">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-xs font-semibold mb-3 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
        >
          <CaretLeft size={14} strokeWidth={2} /> Back to settings
        </Link>
        <h1
          className="font-heading text-xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Account settings
        </h1>
      </div>

      {/* Body: on mobile the whole thing scrolls; from lg up the nav is
          a fixed column and only the content column scrolls. */}
      <div className="flex-1 min-h-0 px-6 pb-6 flex flex-col lg:flex-row gap-6 overflow-y-auto lg:overflow-hidden">
        <div className="lg:w-60 shrink-0 lg:overflow-y-auto">
          <Sidebar
            active={state.activeSection}
            onChange={state.setActiveSection}
          />
        </div>

        <div className="flex-1 min-h-0 lg:overflow-y-auto space-y-6">
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
        </div>
      </div>
    </div>
  )
}
