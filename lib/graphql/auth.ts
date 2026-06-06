/**
 * Auth domain operations.
 *
 * Every login-shaped mutation returns `AuthPayload`, so they all reuse
 * the AuthPayloadFields fragment. Me returns AuthUser directly.
 */

import { graphql } from '@/types/generated'

export const LoginMutationDoc = graphql(/* GraphQL */ `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      ...AuthPayloadFields
    }
  }
`)

export const RegisterOwnerMutationDoc = graphql(/* GraphQL */ `
  mutation RegisterOwner($input: RegisterOwnerInput!) {
    registerOwner(input: $input) {
      ...AuthPayloadFields
    }
  }
`)

export const AcceptInviteMutationDoc = graphql(/* GraphQL */ `
  mutation AcceptInvite($input: AcceptInviteInput!) {
    acceptInvite(input: $input) {
      ...AuthPayloadFields
    }
  }
`)

export const GoogleAuthMutationDoc = graphql(/* GraphQL */ `
  mutation GoogleAuth($input: GoogleAuthInput!) {
    googleAuth(input: $input) {
      ...AuthPayloadFields
    }
  }
`)

export const SwitchFirmMutationDoc = graphql(/* GraphQL */ `
  mutation SwitchFirm($input: SwitchFirmInput!) {
    switchFirm(input: $input) {
      ...AuthPayloadFields
    }
  }
`)

export const MeQueryDoc = graphql(/* GraphQL */ `
  query Me {
    me {
      ...AuthUserFields
    }
  }
`)
