'use client'

import {
  LoginMutationDoc,
  RegisterOwnerMutationDoc,
} from '@/lib/graphql/mutations/auth'
import { useAuthStore } from '@/stores/auth.store'
import type {
  LoginMutation,
  LoginMutationVariables,
  RegisterOwnerMutation,
  RegisterOwnerMutationVariables,
} from '@/types/generated/graphql'
import { useMutation } from '@apollo/client/react'

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
