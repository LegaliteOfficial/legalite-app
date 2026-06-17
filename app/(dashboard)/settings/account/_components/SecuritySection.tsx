'use client'

import { Eye, EyeSlash, Monitor, Shield } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from './primitives/Card'
import { SaveButton } from './primitives/SaveButton'
import { SectionLabel } from './primitives/SectionLabel'
import { ToggleRow } from './primitives/ToggleRow'
import type { AccountState } from '../_hooks/use-account-state'

export function SecuritySection({ state }: { state: AccountState }) {
  const {
    passwords,
    setPasswords,
    twoFactorEnabled,
    setTwoFactorEnabled,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    handleChangePassword,
    changePending,
  } = state

  return (
    <div className="space-y-6">
      <Card
        title="Change Password"
        subtitle="Update your account password regularly for security."
      >
        <div className="space-y-4 max-w-lg">
          <div>
            <SectionLabel>Current Password</SectionLabel>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwords.current_password}
                onChange={(e) =>
                  setPasswords((p) => ({
                    ...p,
                    current_password: e.target.value,
                  }))
                }
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#9CA3AF' }}
              >
                {showCurrentPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <SectionLabel>New Password</SectionLabel>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={passwords.new_password}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, new_password: e.target.value }))
                }
                placeholder="Minimum 6 characters"
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#9CA3AF' }}
              >
                {showNewPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <SectionLabel>Confirm New Password</SectionLabel>
            <Input
              type="password"
              value={passwords.confirm_password}
              onChange={(e) =>
                setPasswords((p) => ({
                  ...p,
                  confirm_password: e.target.value,
                }))
              }
              className="h-10"
            />
          </div>
          <div className="pt-2">
            <SaveButton
              onClick={handleChangePassword}
              isPending={changePending}
              label="Update Password"
              pendingLabel="Updating..."
            />
          </div>
        </div>
      </Card>

      <Card
        title="Two-Factor Authentication"
        subtitle="Add an extra layer of security to your account."
      >
        <div className="max-w-lg">
          <ToggleRow
            icon={Shield}
            label="Enable Two-Factor Authentication"
            description="Require a verification code in addition to your password when signing in."
            checked={twoFactorEnabled}
            onToggle={() => {
              setTwoFactorEnabled(!twoFactorEnabled)
              toast.success(
                twoFactorEnabled
                  ? 'Two-factor authentication disabled.'
                  : 'Two-factor authentication enabled.',
              )
            }}
          />
        </div>
      </Card>

      <Card
        title="Session Management"
        subtitle="Manage your active sessions and sign out of other devices."
      >
        <div className="max-w-lg space-y-3">
          <div
            className="flex items-center justify-between rounded-lg border p-3"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: 'rgba(16,185,129,0.1)' }}
              >
                <Monitor size={16} style={{ color: 'rgb(16,185,129)' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#0D1B2A' }}>
                  Current Session
                </p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  Active now
                </p>
              </div>
            </div>
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: 'rgba(16,185,129,0.1)',
                color: 'rgb(16,185,129)',
              }}
            >
              Active
            </span>
          </div>

          <Button
            variant="outline"
            className="text-sm"
            style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
            onClick={() =>
              toast.success('All other sessions have been terminated.')
            }
          >
            Sign Out All Other Sessions
          </Button>
        </div>
      </Card>
    </div>
  )
}
