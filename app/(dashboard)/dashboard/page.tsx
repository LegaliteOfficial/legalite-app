'use client'

/**
 * Dashboard — composition root.
 *
 * Owns: the tab choice + the onboarding banner's dismissal state.
 * Everything else (chrome, tab bodies, chart, feed) lives in
 * `_components/`. Static config in `_constants.ts`.
 */

import { useState, useSyncExternalStore } from 'react'
import { useDashboardStats } from '@/hooks/use-dashboard'
import { BANNER_DISMISSED_KEY } from './_constants'
import type { TabId } from './_types'
import { DashboardHeader } from './_components/DashboardHeader'
import { FirmDashboard } from './_components/FirmDashboard'
import { FirmFeed } from './_components/FirmFeed'
import { OnboardingBanner } from './_components/OnboardingBanner'
import { PerformanceTab } from './_components/PerformanceTab'
import { PersonalDashboard } from './_components/PersonalDashboard'
import { TabBar } from './_components/TabBar'

const BANNER_EVENT = 'll:banner-dismissed'

function subscribeBanner(cb: () => void) {
  window.addEventListener('storage', cb)
  window.addEventListener(BANNER_EVENT, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(BANNER_EVENT, cb)
  }
}

function readBannerVisible(): boolean {
  try {
    return window.localStorage.getItem(BANNER_DISMISSED_KEY) !== '1'
  } catch {
    return true
  }
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()
  const [activeTab, setActiveTab] = useState<TabId>('personal')
  // Hidden on the server and first paint, then shown unless dismissed before.
  const bannerVisible = useSyncExternalStore(
    subscribeBanner,
    readBannerVisible,
    () => false,
  )

  const dismissBanner = () => {
    try {
      window.localStorage.setItem(BANNER_DISMISSED_KEY, '1')
    } catch {
      /* storage blocked: the banner just returns next visit */
    }
    window.dispatchEvent(new Event(BANNER_EVENT))
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <DashboardHeader />

        {bannerVisible && (
          <div className="mt-6">
            <OnboardingBanner onDismiss={dismissBanner} />
          </div>
        )}

        <div className="mt-7">
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="mt-6">
          {activeTab === 'personal' && <PersonalDashboard />}
          {activeTab === 'firm' && (
            <FirmDashboard stats={stats} isLoading={isLoading} />
          )}
          {activeTab === 'performance' && <PerformanceTab />}
          {activeTab === 'feed' && (
            <FirmFeed activity={stats?.recent_activity} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  )
}
