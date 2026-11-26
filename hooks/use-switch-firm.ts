import { useState } from 'react'
import { useApolloClient } from '@apollo/client/react'
import { callSessionAction } from '@/hooks/use-auth'

/**
 * Switch the active firm. The backend issues a token scoped to the new firm
 * (same session, so the refresh cookie is unchanged); the Apollo cache is
 * cleared so no data from the previous firm lingers.
 */
export function useSwitchFirm() {
  const apollo = useApolloClient()
  const [isPending, setPending] = useState(false)
  return {
    isPending,
    mutateAsync: async (firmId: string) => {
      setPending(true)
      try {
        const payload = await callSessionAction('switch-firm', { firmId })
        await apollo.clearStore()
        return payload
      } finally {
        setPending(false)
      }
    },
  }
}
