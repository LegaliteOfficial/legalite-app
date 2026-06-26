'use client'

/**
 * Dashboard — composition root.
 *
 * Owns: the tab choice + the onboarding banner's dismissal state.
 * Everything else (chrome, tab bodies, chart, feed) lives in
 * `_components/`. Static config in `_constants.ts`.
 */

import { useEffect, useState } from 'react'
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

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()
  const [activeTab, setActiveTab] = useState<TabId>('personal')
  const [bannerVisible, setBannerVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setBannerVisible(
      window.localStorage.getItem(BANNER_DISMISSED_KEY) !== '1',
    )
  }, [])

  const dismissBanner = () => {
    setBannerVisible(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(BANNER_DISMISSED_KEY, '1')
    }
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
