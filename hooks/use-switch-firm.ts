import { useMutation } from '@apollo/client/react'
import { useApolloClient } from '@apollo/client/react'
import { SwitchFirmMutationDoc } from '@/lib/graphql/auth'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Switch the active firm. The backend issues a token scoped to the new firm;
 * the Apollo cache is cleared so no data from the previous firm lingers.
 */
export function useSwitchFirm() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const apollo = useApolloClient()
  const [mutate, state] = useMutation(SwitchFirmMutationDoc)
  return {
    isPending: state.loading,
    mutateAsync: async (firmId: string) => {
      const res = await mutate({ variables: { input: { firmId } } })
      const payload = res.data?.switchFirm
      if (!payload) throw new Error('Could not switch firms. Please try again.')
      setAuth(
        payload.user,
        payload.token,
        payload.active_membership ?? null,
        payload.memberships ?? [],
        payload.permissions ?? [],
      )
      await apollo.clearStore()
      return payload
    },
  }
}
