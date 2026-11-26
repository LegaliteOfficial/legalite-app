'use client'

import { useCallback, useState } from 'react'
import {
  RequestPasswordResetMutationDoc,
  ResetPasswordMutationDoc,
} from '@/lib/graphql/auth'
import { InvitationLookupQueryDoc } from '@/lib/graphql/invitations'
import {
  applyAuthPayload,
  callAuth,
  getAccessToken,
  type AuthAction,
  type AuthPayload,
} from '@/lib/auth/session-client'
import type {
  AcceptInviteMutationVariables,
  LoginMutationVariables,
  RegisterOwnerMutationVariables,
  RequestPasswordResetMutation,
  RequestPasswordResetMutationVariables,
  ResetPasswordMutation,
  ResetPasswordMutationVariables,
} from '@/types/generated/graphql'
import { useMutation, useQuery } from '@apollo/client/react'

// Sign-in hooks call the app's own /api/auth routes, not the API directly,
// so the refresh token is set as an HttpOnly cookie the page cannot read
// (see lib/auth/bff.ts). Each hook stores the result in the auth store and
// keeps the `{ data: { <field>: payload } }` shape callers already use.
// Failures reject with an Error whose message is safe to show.

function useAuthAction<Field extends string, Vars extends { input: unknown }>(
  action: AuthAction,
  field: Field,
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const run = useCallback(
    async ({ variables }: { variables: Vars }): Promise<{ data: Record<Field, AuthPayload> }> => {
      setLoading(true)
      setError(null)
      try {
        const payload = await callAuth(action, { input: variables.input })
        applyAuthPayload(payload)
        return { data: { [field]: payload } as Record<Field, AuthPayload> }
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [action, field],
  )
  const reset = useCallback(() => setError(null), [])
  return { run, loading, error, reset }
}

export function useRegisterUser() {
  const { run, loading, error, reset } = useAuthAction<'registerOwner', RegisterOwnerMutationVariables>(
    'register',
    'registerOwner',
  )
  return { registerMutation: run, loading, error, reset }
}

export function useLoginUser() {
  const { run, loading, error, reset } = useAuthAction<'login', LoginMutationVariables>('login', 'login')
  return { loginMutation: run, loading, error, reset }
}

// ── Invitation acceptance (recipient side) ───────────────────────────────────
//
// The accept-invite page is public: an invited colleague lands here from the
// email link before they have an account. `useInvitationLookup` reads the
// invitation (firm, role, title, invited email) from the token so the page can
// show what they're joining, and `useAcceptInvite` creates their account +
// membership and signs them straight in.

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
  const { run, loading, error, reset } = useAuthAction<'acceptInvite', AcceptInviteMutationVariables>(
    'accept-invite',
    'acceptInvite',
  )
  return { acceptInviteMutation: run, loading, error, reset }
}

/** Run an auth action that acts on the current session (needs its token). */
export async function callSessionAction(
  action: 'accept-invitation' | 'switch-firm',
  input: Record<string, unknown>,
): Promise<AuthPayload> {
  const accessToken = await getAccessToken()
  const payload = await callAuth(action, { input, accessToken })
  applyAuthPayload(payload)
  return payload
}

// Accepting an invitation as someone who already has an account. They are
// signed in; the backend checks the invitation was sent to their email and
// returns a token scoped to the firm they just joined.
export function useAcceptInvitation() {
  const [loading, setLoading] = useState(false)
  return {
    loading,
    accept: async (token: string) => {
      setLoading(true)
      try {
        return await callSessionAction('accept-invitation', { token })
      } finally {
        setLoading(false)
      }
    },
  }
}

// ── Password reset (public) ───────────────────────────────────────────────
//
// Both mutations are unauthenticated and don't touch the auth store — the
// forgot-password page only needs loading/error state, and the reset page
// sends the user to /login on success rather than signing them in directly.

export function useRequestPasswordReset() {
  const [requestPasswordResetMutation, { loading, error, reset }] =
    useMutation<
      RequestPasswordResetMutation,
      RequestPasswordResetMutationVariables
    >(RequestPasswordResetMutationDoc)

  return { requestPasswordResetMutation, loading, error, reset }
}

export function useResetPassword() {
  const [resetPasswordMutation, { loading, error, reset }] = useMutation<
    ResetPasswordMutation,
    ResetPasswordMutationVariables
  >(ResetPasswordMutationDoc)

  return { resetPasswordMutation, loading, error, reset }
}
