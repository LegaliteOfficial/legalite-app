'use client'

import {
  Calendar,
  Copy,
  Envelope,
  Eye,
  EyeSlash,
  Key,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from './primitives/Card'
import { SectionLabel } from './primitives/SectionLabel'
import { ToggleRow } from './primitives/ToggleRow'
import type { AccountState } from '../_hooks/use-account-state'

export function IntegrationsSection({ state }: { state: AccountState }) {
  const {
    integrations,
    setIntegrations,
    showApiKey,
    setShowApiKey,
    maskedApiKey,
    fullApiKey,
    handleCopyApiKey,
  } = state

  return (
    <div className="space-y-6">
      <Card
        title="Google Calendar"
        subtitle="Sync your court dates and deadlines with Google Calendar."
      >
        <div className="max-w-lg">
          <ToggleRow
            icon={Calendar}
            label="Google Calendar Sync"
            description="Automatically sync deadlines and hearing dates to your Google Calendar."
            checked={integrations.googleCalendar}
            onToggle={() => {
              setIntegrations((i) => ({
                ...i,
                googleCalendar: !i.googleCalendar,
              }))
              toast.success(
                integrations.googleCalendar
                  ? 'Google Calendar disconnected.'
                  : 'Google Calendar connected.',
              )
            }}
          />
        </div>
      </Card>

      <Card
        title="Email Provider"
        subtitle="Configure your preferred email integration."
      >
        <div className="max-w-lg">
          <SectionLabel>
            <div className="flex items-center gap-1.5">
              <Envelope size={12} /> Email Provider
            </div>
          </SectionLabel>
          <div className="flex gap-3 mt-2">
            {[
              { value: 'gmail', label: 'Gmail' },
              { value: 'outlook', label: 'Outlook' },
              { value: 'other', label: 'Other' },
            ].map((provider) => (
              <button
                key={provider.value}
                onClick={() =>
                  setIntegrations((i) => ({
                    ...i,
                    emailProvider: provider.value,
                  }))
                }
                className="flex-1 rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-all"
                style={{
                  borderColor:
                    integrations.emailProvider === provider.value
                      ? '#C9972B'
                      : '#E5E7EB',
                  background:
                    integrations.emailProvider === provider.value
                      ? 'rgba(201,151,43,0.04)'
                      : 'white',
                  color:
                    integrations.emailProvider === provider.value
                      ? '#C9972B'
                      : '#6B7280',
                }}
              >
                {provider.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card
        title="API Keys"
        subtitle="Manage your API keys for third-party integrations."
      >
        <div className="max-w-lg space-y-4">
          <div>
            <SectionLabel>
              <div className="flex items-center gap-1.5">
                <Key size={12} /> Production API Key
              </div>
            </SectionLabel>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={showApiKey ? fullApiKey : maskedApiKey}
                readOnly
                className="h-10 font-mono text-xs bg-gray-50"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeSlash size={16} /> : <Eye size={16} />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={handleCopyApiKey}
              >
                <Copy size={16} />
              </Button>
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: '#9CA3AF' }}>
              Keep your API key secure. Do not share it publicly.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
