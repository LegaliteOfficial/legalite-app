'use client'

import { useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import {
  User,
  Lock,
  Bell,
  Palette,
  Plug,
  Building,
  Phone,
  CreditCard,
  Mail,
  MessageSquare,
  Clock,
  Briefcase,
  DollarSign,
  Shield,
  Monitor,
  PanelLeft,
  Minimize2,
  Calendar,
  Key,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/shared/Spinner'
import { useAuthStore } from '@/stores/auth.store'
import { useMutation } from '@apollo/client/react'
import {
  ChangePasswordMutationDoc,
  UpdateProfileMutationDoc,
} from '@/lib/graphql/operations'
import { toast } from 'sonner'

type SectionId = 'profile' | 'notifications' | 'security' | 'appearance' | 'integrations'

// ---------------------------------------------------------------------------
// Custom Toggle Switch
// ---------------------------------------------------------------------------

function ToggleSwitch({
  checked,
  onToggle,
  disabled = false,
}: {
  checked: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        background: checked ? '#C9972B' : '#D1D5DB',
      }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out"
        style={{
          transform: checked ? 'translateX(1.25rem)' : 'translateX(0.15rem)',
        }}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Section Label
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label
      className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
      style={{ color: '#6B7280' }}
    >
      {children}
    </Label>
  )
}

// ---------------------------------------------------------------------------
// Save Button
// ---------------------------------------------------------------------------

function SaveButton({
  onClick,
  isPending,
  label = 'Save Changes',
  pendingLabel = 'Saving...',
}: {
  onClick: () => void
  isPending: boolean
  label?: string
  pendingLabel?: string
}) {
  return (
    <Button
      onClick={onClick}
      disabled={isPending}
      className="text-white font-medium px-6"
      style={{
        background: 'linear-gradient(135deg, #C9972B 0%, #B8860B 100%)',
      }}
    >
      {isPending ? (
        <>
          <Spinner size={14} className="mr-2" /> {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Toggle Row
// ---------------------------------------------------------------------------

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onToggle,
}: {
  icon: React.ElementType
  label: string
  description: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: 'rgba(201,151,43,0.08)' }}
        >
          <Icon size={16} style={{ color: '#C9972B' }} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: '#0D1B2A' }}>
            {label}
          </p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            {description}
          </p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onToggle={onToggle} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card Wrapper
// ---------------------------------------------------------------------------

function Card({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: 'white', borderColor: 'var(--border)' }}
    >
      <h2
        className="font-heading text-lg font-bold mb-1"
        style={{ color: '#0D1B2A' }}
      >
        {title}
      </h2>
      <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
        {subtitle}
      </p>
      {children}
    </div>
  )
}

// ===========================================================================
// Main Settings Page
// ===========================================================================

const VALID_SECTIONS: readonly SectionId[] = ['profile', 'notifications', 'security', 'appearance', 'integrations']

export default function SettingsPage() {
  const { user, setAuth, token } = useAuthStore()
  const searchParams = useSearchParams()
  const sectionParam = searchParams?.get('section') as SectionId | null
  const initialSection: SectionId = sectionParam && VALID_SECTIONS.includes(sectionParam) ? sectionParam : 'profile'
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection)

  // ---- Profile state ----
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    firm: user?.firm ?? '',
    role: user?.role ?? '',
    bio: '',
  })

  // ---- Notification state ----
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsAlerts: false,
    deadlineReminders: true,
    caseUpdates: true,
    billingAlerts: false,
  })

  // ---- Security state ----
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // ---- Appearance state ----
  const [appearance, setAppearance] = useState({
    theme: 'light' as 'light' | 'dark',
    sidebarPosition: 'left' as 'left' | 'right',
    compactMode: false,
  })

  // ---- Integrations state ----
  const [integrations, setIntegrations] = useState({
    googleCalendar: false,
    emailProvider: 'gmail',
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const maskedApiKey = 'll_sk_****************************3f7a'
  const fullApiKey = 'll_sk_prod_a8c2d9e1f3b4c5d6e7f8a9b0c1d2e3f7a'

  // ---- Mutations ----
  const [updateProfileMutation, updateProfileState] = useMutation(
    UpdateProfileMutationDoc,
    {
      onCompleted: (data) => {
        const updated = data.updateProfile
        if (updated && token) {
          setAuth(
            {
              ...updated,
              firm: updated.firm ?? undefined,
              gba_number: updated.gba_number ?? undefined,
            } as Parameters<typeof setAuth>[0],
            token,
          )
        }
        toast.success('Profile updated successfully.')
      },
      onError: () =>
        toast.error('Unable to update profile. Please try again.'),
    },
  )
  const updateProfile = {
    isPending: updateProfileState.loading,
    mutate: (data: typeof profile) => {
      void updateProfileMutation({
        variables: {
          input: {
            name: data.name,
            firm: data.firm || null,
            phone: data.phone || null,
          },
        },
      })
    },
  }

  const [changePasswordMutation, changePasswordState] = useMutation(
    ChangePasswordMutationDoc,
    {
      onCompleted: () => {
        setPasswords({
          current_password: '',
          new_password: '',
          confirm_password: '',
        })
        toast.success('Password changed successfully.')
      },
      onError: () =>
        toast.error(
          'Unable to change password. Please check your current password.',
        ),
    },
  )
  const changePassword = {
    isPending: changePasswordState.loading,
    mutate: (data: { current_password: string; new_password: string }) => {
      void changePasswordMutation({ variables: { input: data } })
    },
  }

  // Notifications and appearance are not yet implemented server-side —
  // keep them client-only with a fake "save" toast until those resolvers exist.
  const saveNotifications = {
    isPending: false,
    mutate: (_data: typeof notifications) => {
      toast.success('Notification preferences saved (local only).')
    },
  }
  const saveAppearance = {
    isPending: false,
    mutate: (_data: typeof appearance) => {
      toast.success('Appearance settings saved (local only).')
    },
  }

  // ---- Handlers ----
  const handleSaveProfile = useCallback(() => {
    if (!profile.name) {
      toast.error('Name is required.')
      return
    }
    updateProfile.mutate(profile)
  }, [profile, updateProfile])

  const handleChangePassword = useCallback(() => {
    if (!passwords.current_password) {
      toast.error('Please enter your current password.')
      return
    }
    if (passwords.new_password.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error('Passwords do not match.')
      return
    }
    changePassword.mutate({
      current_password: passwords.current_password,
      new_password: passwords.new_password,
    })
  }, [passwords, changePassword])

  const handleCopyApiKey = useCallback(() => {
    navigator.clipboard.writeText(fullApiKey)
    toast.success('API key copied to clipboard.')
  }, [])

  // ---- Sidebar sections ----
  const sections: { id: SectionId; label: string; icon: React.ElementType }[] =
    [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'security', label: 'Security', icon: Lock },
      { id: 'appearance', label: 'Appearance', icon: Palette },
      { id: 'integrations', label: 'Integrations', icon: Plug },
    ]

  // =========================================================================
  // Render
  // =========================================================================

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
        <ChevronLeft size={14} strokeWidth={2} /> Back to settings
      </Link>
      <h1
        className="font-heading text-xl font-bold mb-6"
        style={{ color: '#0D1B2A' }}
      >
        Account settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ---- Sidebar ---- */}
        <div className="lg:col-span-1">
          <div
            className="rounded-xl border p-2 space-y-1 lg:sticky lg:top-6"
            style={{ background: 'white', borderColor: 'var(--border)' }}
          >
            {sections.map((s) => {
              const Icon = s.icon
              const isActive = activeSection === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: isActive
                      ? 'rgba(201,151,43,0.08)'
                      : 'transparent',
                    color: isActive ? '#C9972B' : '#6B7280',
                  }}
                >
                  <Icon size={16} />
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ---- Content ---- */}
        <div className="lg:col-span-3 space-y-6">
          {/* ================= PROFILE ================= */}
          {activeSection === 'profile' && (
            <Card
              title="Profile Information"
              subtitle="Update your personal and professional details."
            >
              <div className="space-y-4 max-w-lg">
                {/* Name */}
                <div>
                  <SectionLabel>Full Name *</SectionLabel>
                  <Input
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, name: e.target.value }))
                    }
                    className="h-10"
                  />
                </div>

                {/* Email */}
                <div>
                  <SectionLabel>
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} /> Email
                    </div>
                  </SectionLabel>
                  <Input
                    value={profile.email}
                    disabled
                    className="h-10 bg-gray-50"
                  />
                  <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
                    Email cannot be changed.
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <SectionLabel>
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} /> Phone
                    </div>
                  </SectionLabel>
                  <Input
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+233 XX XXX XXXX"
                    className="h-10"
                  />
                </div>

                {/* Firm */}
                <div>
                  <SectionLabel>
                    <div className="flex items-center gap-1.5">
                      <Building size={12} /> Law Firm
                    </div>
                  </SectionLabel>
                  <Input
                    value={profile.firm}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, firm: e.target.value }))
                    }
                    placeholder="e.g. Mensah & Associates"
                    className="h-10"
                  />
                </div>

                {/* Role */}
                <div>
                  <SectionLabel>
                    <div className="flex items-center gap-1.5">
                      <CreditCard size={12} /> Role
                    </div>
                  </SectionLabel>
                  <Input
                    value={profile.role}
                    disabled
                    className="h-10 bg-gray-50"
                  />
                  <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
                    Role is managed by your organization admin.
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <SectionLabel>Bio</SectionLabel>
                  <Textarea
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, bio: e.target.value }))
                    }
                    placeholder="A short professional bio..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="pt-2">
                  <SaveButton
                    onClick={handleSaveProfile}
                    isPending={updateProfile.isPending}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* ================= NOTIFICATIONS ================= */}
          {activeSection === 'notifications' && (
            <Card
              title="Notification Preferences"
              subtitle="Choose how you want to be notified about important events."
            >
              <div className="max-w-lg divide-y" style={{ borderColor: '#F3F4F6' }}>
                <ToggleRow
                  icon={Mail}
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
                  icon={MessageSquare}
                  label="SMS Alerts"
                  description="Get text messages for urgent notifications."
                  checked={notifications.smsAlerts}
                  onToggle={() =>
                    setNotifications((n) => ({
                      ...n,
                      smsAlerts: !n.smsAlerts,
                    }))
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
                  icon={DollarSign}
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
                  onClick={() => saveNotifications.mutate(notifications)}
                  isPending={saveNotifications.isPending}
                  label="Save Preferences"
                  pendingLabel="Saving..."
                />
              </div>
            </Card>
          )}

          {/* ================= SECURITY ================= */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              {/* Change Password */}
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
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: '#9CA3AF' }}
                      >
                        {showCurrentPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
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
                          setPasswords((p) => ({
                            ...p,
                            new_password: e.target.value,
                          }))
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
                        {showNewPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
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
                      isPending={changePassword.isPending}
                      label="Update Password"
                      pendingLabel="Updating..."
                    />
                  </div>
                </div>
              </Card>

              {/* Two-Factor Auth */}
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

              {/* Session Management */}
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
                        <Monitor
                          size={16}
                          style={{ color: 'rgb(16,185,129)' }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: '#0D1B2A' }}
                        >
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
                      toast.success(
                        'All other sessions have been terminated.',
                      )
                    }
                  >
                    Sign Out All Other Sessions
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* ================= APPEARANCE ================= */}
          {activeSection === 'appearance' && (
            <Card
              title="Appearance"
              subtitle="Customize how LegaLite looks and feels."
            >
              <div className="max-w-lg space-y-6">
                {/* Theme */}
                <div>
                  <SectionLabel>Theme</SectionLabel>
                  <div className="flex gap-3 mt-2">
                    {(['light', 'dark'] as const).map((theme) => (
                      <button
                        key={theme}
                        onClick={() =>
                          setAppearance((a) => ({ ...a, theme }))
                        }
                        className="flex-1 rounded-lg border-2 p-4 text-center text-sm font-medium transition-all"
                        style={{
                          borderColor:
                            appearance.theme === theme
                              ? '#C9972B'
                              : '#E5E7EB',
                          background:
                            appearance.theme === theme
                              ? 'rgba(201,151,43,0.04)'
                              : 'white',
                          color:
                            appearance.theme === theme
                              ? '#C9972B'
                              : '#6B7280',
                        }}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className="h-8 w-8 rounded-lg border"
                            style={{
                              background:
                                theme === 'light' ? '#FFFFFF' : '#1F2937',
                              borderColor:
                                theme === 'light' ? '#E5E7EB' : '#374151',
                            }}
                          />
                          {theme === 'light' ? 'Light' : 'Dark'}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] mt-2" style={{ color: '#9CA3AF' }}>
                    Dark mode is coming soon.
                  </p>
                </div>

                {/* Sidebar Position */}
                <div>
                  <SectionLabel>
                    <div className="flex items-center gap-1.5">
                      <PanelLeft size={12} /> Sidebar Position
                    </div>
                  </SectionLabel>
                  <div className="flex gap-3 mt-2">
                    {(['left', 'right'] as const).map((pos) => (
                      <button
                        key={pos}
                        onClick={() =>
                          setAppearance((a) => ({
                            ...a,
                            sidebarPosition: pos,
                          }))
                        }
                        className="flex-1 rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-all capitalize"
                        style={{
                          borderColor:
                            appearance.sidebarPosition === pos
                              ? '#C9972B'
                              : '#E5E7EB',
                          background:
                            appearance.sidebarPosition === pos
                              ? 'rgba(201,151,43,0.04)'
                              : 'white',
                          color:
                            appearance.sidebarPosition === pos
                              ? '#C9972B'
                              : '#6B7280',
                        }}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compact Mode */}
                <ToggleRow
                  icon={Minimize2}
                  label="Compact Mode"
                  description="Reduce spacing and padding for denser information display."
                  checked={appearance.compactMode}
                  onToggle={() =>
                    setAppearance((a) => ({
                      ...a,
                      compactMode: !a.compactMode,
                    }))
                  }
                />

                <div className="pt-2">
                  <SaveButton
                    onClick={() => saveAppearance.mutate(appearance)}
                    isPending={saveAppearance.isPending}
                    label="Save Appearance"
                    pendingLabel="Saving..."
                  />
                </div>
              </div>
            </Card>
          )}

          {/* ================= INTEGRATIONS ================= */}
          {activeSection === 'integrations' && (
            <div className="space-y-6">
              {/* Google Calendar */}
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

              {/* Email Provider */}
              <Card
                title="Email Provider"
                subtitle="Configure your preferred email integration."
              >
                <div className="max-w-lg">
                  <SectionLabel>
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} /> Email Provider
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

              {/* API Keys */}
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
                        {showApiKey ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
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
                    <p
                      className="text-[10px] mt-1.5"
                      style={{ color: '#9CA3AF' }}
                    >
                      Keep your API key secure. Do not share it publicly.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
