'use client'

import {
  LoginMutationDoc,
  RegisterOwnerMutationDoc,
} from '@/lib/graphql/mutations/auth'
import {
  AcceptInviteMutationDoc,
  InvitationLookupQueryDoc,
} from '@/lib/graphql/operations'
import { useAuthStore } from '@/stores/auth.store'
import type {
  AcceptInviteMutation,
  AcceptInviteMutationVariables,
  LoginMutation,
  LoginMutationVariables,
  RegisterOwnerMutation,
  RegisterOwnerMutationVariables,
} from '@/types/generated/graphql'
import { useMutation, useQuery } from '@apollo/client/react'

// The two hooks below own the "write to the auth store on success" side
// effect so every caller doesn't have to remember it. onCompleted runs
// when the GraphQL response succeeds; onError fires on network or
// GraphQL errors and lets Apollo reject the awaited mutation so the
// component's try/catch can render a user-facing message.
//
// We do NOT throw inside onError — Apollo already rejects the awaited
// promise when `errorPolicy: 'none'` (the default). Throwing here would
// double-report and trip React's strict-mode error overlay.

export function useRegisterUser() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const [registerMutation, { loading, error, reset }] = useMutation<
    RegisterOwnerMutation,
    RegisterOwnerMutationVariables
  >(RegisterOwnerMutationDoc, {
    onCompleted: (data) => {
      const payload = data.registerOwner
      setAuth(
        payload.user,
        payload.token,
        payload.active_membership ?? null,
        payload.memberships ?? [],
      )
    },
  })

  return { registerMutation, loading, error, reset }
}

export function useLoginUser() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loginMutation, { loading, error, reset }] = useMutation<
    LoginMutation,
    LoginMutationVariables
  >(LoginMutationDoc, {
    onCompleted: (data) => {
      const payload = data.login
      setAuth(
        payload.user,
        payload.token,
        payload.active_membership ?? null,
        payload.memberships ?? [],
      )
    },
  })

  return { loginMutation, loading, error, reset }
}

// ── Invitation acceptance (recipient side) ───────────────────────────────────
//
// The accept-invite page is public: an invited colleague lands here from the
// email link before they have an account. `useInvitationLookup` reads the
// invitation (firm, role, title, invited email) from the token so the page can
// show what they're joining, and `useAcceptInvite` creates their account +
// membership and logs them straight in by writing to the auth store — same
// side-effect contract as useLoginUser / useRegisterUser above.

export function useInvitationLookup(token: string | undefined) {
  const { data, loading, error } = useQuery(InvitationLookupQueryDoc, {
    variables: { input: { token: token ?? '' } },
    skip: !token,
    // A bad/expired token is an expected outcome here, not a crash — surface
    // it as `error` and let the page render its invalid state.
    errorPolicy: 'none',
    fetchPolicy: 'network-only',
  })
  return {
    invitation: data?.invitationLookup,
    loading,
    error,
  }
}

export function useAcceptInvite() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const [acceptInviteMutation, { loading, error, reset }] = useMutation<
    AcceptInviteMutation,
    AcceptInviteMutationVariables
  >(AcceptInviteMutationDoc, {
    onCompleted: (data) => {
      const payload = data.acceptInvite
      setAuth(
        payload.user,
        payload.token,
        payload.active_membership ?? null,
        payload.memberships ?? [],
      )
    },
  })

  return { acceptInviteMutation, loading, error, reset }
}
