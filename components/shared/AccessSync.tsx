'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApolloClient } from '@apollo/client/react'
import { toast } from 'sonner'
import { MyAccessQueryDoc } from '@/lib/graphql/auth'
import { useAuthStore } from '@/stores/auth.store'
import { useSwitchFirm } from '@/hooks/use-switch-firm'
import { DEV_BYPASS } from '@/lib/access'

/** How often access is re-read while the app is open. */
const REFRESH_MS = 60_000

/**
 * Keeps the member's permissions current. An administrator can change
 * someone's roles or remove them at any time; the backend applies that on the
 * next request, and this re-reads it on load, every minute and when the tab
 * regains focus so the interface matches. If the member was removed from the
 * firm, they are moved to another firm they belong to, or signed out.
 */
export function AccessSync() {
  if (DEV_BYPASS) return null
  return <AccessSyncInner />
}

function AccessSyncInner() {
  const apollo = useApolloClient()
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const setAccess = useAuthStore((s) => s.setAccess)
  const logout = useAuthStore((s) => s.logout)
  const switchFirm = useSwitchFirm()
  const busy = useRef(false)

  const refresh = useCallback(async () => {
    if (!token || busy.current) return
    busy.current = true
    try {
      const { data } = await apollo.query({ query: MyAccessQueryDoc, fetchPolicy: 'network-only' })
      const access = data?.myAccess
      if (!access) return
      if (access.active) {
        setAccess({
          permissions: access.permissions,
          firm_role: access.firm_role,
          professional_title: access.professional_title,
        })
        return
      }
      // No longer a member of the active firm.
      const { activeMembership, memberships } = useAuthStore.getState()
      if (!activeMembership) return
      const other = memberships.find(
        (m) => m.status === 'active' && m.firm_id !== activeMembership.firm_id,
      )
      toast.error(`You no longer have access to ${activeMembership.firm_name}.`)
      if (other) {
        await switchFirm.mutateAsync(other.firm_id)
        router.replace('/dashboard')
      } else {
        logout()
        await apollo.clearStore()
        router.replace('/login')
      }
    } catch {
      // Network blips are ignored; the next refresh tries again.
    } finally {
      busy.current = false
    }
  }, [apollo, token, setAccess, logout, switchFirm, router])

  useEffect(() => {
    void refresh()
    const id = setInterval(() => void refresh(), REFRESH_MS)
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  return null
}
