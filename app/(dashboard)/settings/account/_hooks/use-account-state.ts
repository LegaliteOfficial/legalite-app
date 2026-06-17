'use client'

import { useCallback, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMutation } from '@apollo/client/react'
import { toast } from 'sonner'
import {
  ChangePasswordMutationDoc,
  UpdateProfileMutationDoc,
} from '@/lib/graphql/settings'
import { useAuthStore } from '@/stores/auth.store'
import { VALID_SECTIONS } from '../_constants'
import type { SectionId } from '../_types'

/**
 * Account-settings page state. Owns:
 *   - which section is active (seeded from `?section=` query if valid)
 *   - per-section form drafts (profile / notifications / passwords /
 *     2FA / appearance / integrations)
 *   - the profile + password mutations, plus stubbed save handlers for
 *     notifications + appearance (server resolvers don't exist yet)
 *
 * Notifications and appearance fall through to local-only toasts until
 * the backend ships their resolvers; the surface area lights up the
 * moment a real mutation lands.
 */
export function useAccountState() {
  const { user, setAuth, token } = useAuthStore()
  const searchParams = useSearchParams()
  const sectionParam = searchParams?.get('section') as SectionId | null
  const initialSection: SectionId =
    sectionParam && VALID_SECTIONS.includes(sectionParam)
      ? sectionParam
      : 'profile'
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection)

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    firm: user?.firm ?? '',
    role: user?.role ?? '',
    bio: '',
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsAlerts: false,
    deadlineReminders: true,
    caseUpdates: true,
    billingAlerts: false,
  })

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [appearance, setAppearance] = useState({
    theme: 'light' as 'light' | 'dark',
    sidebarPosition: 'left' as 'left' | 'right',
    compactMode: false,
  })

  const [integrations, setIntegrations] = useState({
    googleCalendar: false,
    emailProvider: 'gmail',
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const maskedApiKey = 'll_sk_****************************3f7a'
  const fullApiKey = 'll_sk_prod_a8c2d9e1f3b4c5d6e7f8a9b0c1d2e3f7a'

  const [updateProfileMutation, updateProfileState] = useMutation(
    UpdateProfileMutationDoc,
    {
      onCompleted: (data) => {
        const updated = data.updateProfile
        if (updated && token) {
          // Preserve the existing membership context; profile mutation
          // doesn't touch firm assignment.
          setAuth(updated, token)
        }
        toast.success('Profile updated successfully.')
      },
      onError: () =>
        toast.error('Unable to update profile. Please try again.'),
    },
  )

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

  const handleSaveProfile = useCallback(() => {
    if (!profile.name) {
      toast.error('Name is required.')
      return
    }
    void updateProfileMutation({
      variables: {
        input: {
          name: profile.name,
          phone: profile.phone || null,
          bio: profile.bio || null,
        },
      },
    })
  }, [profile, updateProfileMutation])

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
    void changePasswordMutation({
      variables: {
        input: {
          current_password: passwords.current_password,
          new_password: passwords.new_password,
        },
      },
    })
  }, [passwords, changePasswordMutation])

  const handleCopyApiKey = useCallback(() => {
    navigator.clipboard.writeText(fullApiKey)
    toast.success('API key copied to clipboard.')
  }, [])

  // Notifications + appearance are local-only until backend resolvers
  // ship — keep the user-visible surface intact so the toggle states
  // persist within the session.
  const saveNotifications = () =>
    toast.success('Notification preferences saved (local only).')
  const saveAppearance = () =>
    toast.success('Appearance settings saved (local only).')

  return {
    activeSection,
    setActiveSection,
    // profile
    profile,
    setProfile,
    handleSaveProfile,
    profilePending: updateProfileState.loading,
    // notifications
    notifications,
    setNotifications,
    saveNotifications,
    // security
    passwords,
    setPasswords,
    twoFactorEnabled,
    setTwoFactorEnabled,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    handleChangePassword,
    changePending: changePasswordState.loading,
    // appearance
    appearance,
    setAppearance,
    saveAppearance,
    // integrations
    integrations,
    setIntegrations,
    showApiKey,
    setShowApiKey,
    maskedApiKey,
    fullApiKey,
    handleCopyApiKey,
  }
}

export type AccountState = ReturnType<typeof useAccountState>
