'use client'

/**
 * Account & payment info — composition root.
 *
 * Three tabs (Account Info / Payment Info / Account Administration) +
 * a destructive "Close Account" button parked to the right of the tab
 * strip. Each tab is its own component; the only state at this level
 * is the active tab.
 */

import { useState } from 'react'
import Link from 'next/link'
import { CaretRight } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { AccountAdministrationTab } from './_components/AccountAdministrationTab'
import { AccountInfoForm } from './_components/AccountInfoForm'
import { PaymentInfoTab } from './_components/PaymentInfoTab'
import { TABS } from './_constants'
import type { TabId } from './_types'

export default function AccountInfoPage() {
  const [activeTab, setActiveTab] = useState<TabId>('account')

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ background: 'var(--surface-card)' }}
    >
      <div
        className="flex items-center gap-2 text-sm mb-5"
        style={{ color: 'var(--navy)' }}
      >
        <Link
          href="/settings"
          className="hover:opacity-70 transition-opacity"
          style={{ color: '#6B7280' }}
        >
          Settings
        </Link>
        <CaretRight
          size={14}
          strokeWidth={2.25}
          style={{ color: '#9CA3AF' }}
        />
        <span className="font-bold">Account and Payment Info</span>
      </div>

      <div
        className="flex items-end justify-between border-b mb-8"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-6">
          {TABS.map((t) => {
            const active = t.id === activeTab
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className="relative pb-3 text-sm font-semibold transition-colors"
                style={{ color: active ? 'var(--navy)' : '#6B7280' }}
              >
                {t.label}
                {active && (
                  <span
                    className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full"
                    style={{ background: 'var(--gold)' }}
                  />
                )}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() =>
            toast.error(
              'Close Account is disabled in this build. Real implementation will require multi-step confirmation.',
            )
          }
          className="mb-2 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold border transition-colors hover:bg-red-50"
          style={{ borderColor: '#FCA5A5', color: '#B91C1C' }}
        >
          Close Account
        </button>
      </div>

      {activeTab === 'account' && <AccountInfoForm />}
      {activeTab === 'payment' && <PaymentInfoTab />}
      {activeTab === 'admin' && <AccountAdministrationTab />}
    </div>
  )
}
