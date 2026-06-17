'use client'

import {
  Briefcase,
  ChatCircle,
  Clock,
  CurrencyDollar,
  Envelope,
} from '@phosphor-icons/react'
import { Card } from './primitives/Card'
import { SaveButton } from './primitives/SaveButton'
import { ToggleRow } from './primitives/ToggleRow'
import type { AccountState } from '../_hooks/use-account-state'

export function NotificationsSection({ state }: { state: AccountState }) {
  const { notifications, setNotifications, saveNotifications } = state
  return (
    <Card
      title="Notification Preferences"
      subtitle="Choose how you want to be notified about important events."
    >
      <div className="max-w-lg divide-y" style={{ borderColor: '#F3F4F6' }}>
        <ToggleRow
          icon={Envelope}
          label="Email Notifications"
          description="Receive important updates and summaries via email."
          checked={notifications.emailNotifications}
          onToggle={() =>
            setNotifications((n) => ({
              ...n,
              emailNotifications: !n.emailNotifications,
            }))
          }
        />
        <ToggleRow
          icon={ChatCircle}
          label="SMS Alerts"
          description="Get text messages for urgent notifications."
          checked={notifications.smsAlerts}
          onToggle={() =>
            setNotifications((n) => ({ ...n, smsAlerts: !n.smsAlerts }))
          }
        />
        <ToggleRow
          icon={Clock}
          label="Deadline Reminders"
          description="Receive alerts before upcoming case deadlines."
          checked={notifications.deadlineReminders}
          onToggle={() =>
            setNotifications((n) => ({
              ...n,
              deadlineReminders: !n.deadlineReminders,
            }))
          }
        />
        <ToggleRow
          icon={Briefcase}
          label="Case Updates"
          description="Be notified when cases are updated or assigned."
          checked={notifications.caseUpdates}
          onToggle={() =>
            setNotifications((n) => ({
              ...n,
              caseUpdates: !n.caseUpdates,
            }))
          }
        />
        <ToggleRow
          icon={CurrencyDollar}
          label="Billing Alerts"
          description="Get notified about invoices and payment activity."
          checked={notifications.billingAlerts}
          onToggle={() =>
            setNotifications((n) => ({
              ...n,
              billingAlerts: !n.billingAlerts,
            }))
          }
        />
      </div>

      <div className="pt-6">
        <SaveButton
          onClick={saveNotifications}
          isPending={false}
          label="Save Preferences"
          pendingLabel="Saving..."
        />
      </div>
    </Card>
  )
}
