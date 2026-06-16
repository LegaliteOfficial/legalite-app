/**
 * Firm-user roster used by every lawyer / staff dropdown in the editor.
 *
 * Until the dedicated firm-roster screen ships we synthesize the list
 * from (a) the current viewer and (b) lawyers already named on other
 * cases — the union is a decent approximation. Swap this hook for a
 * `useFirmUsers()` Apollo hook when the roster admin lands; callers
 * already only know the names, so the change is contained.
 */

import { useMemo } from 'react'
import { useCases } from '@/hooks/use-cases'
import { useAuthStore } from '@/stores/auth.store'

export function useFirmUserOptions(): string[] {
  const { data: existingCases } = useCases()
  const { user } = useAuthStore()

  return useMemo(() => {
    const set = new Set<string>()
    if (user?.name) set.add(user.name)
    for (const c of existingCases ?? []) {
      if (c.assigned_lawyer) set.add(c.assigned_lawyer)
      if (c.originating_lawyer) set.add(c.originating_lawyer)
    }
    return Array.from(set).sort()
  }, [user, existingCases])
}
