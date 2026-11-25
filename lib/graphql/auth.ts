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

export const RequestPasswordResetMutationDoc = graphql(/* GraphQL */ `
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input) {
      message
    }
  }
`)

export const ResetPasswordMutationDoc = graphql(/* GraphQL */ `
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      message
    }
  }
`)

/** What the signed-in user can do in their active firm, read fresh. */
export const MyAccessQueryDoc = graphql(/* GraphQL */ `
  query MyAccess {
    myAccess {
      firm_id
      active
      firm_role
      professional_title
      permissions
    }
  }
`)

/** Accept an invitation as a signed-in user who already has an account. */
export const AcceptInvitationMutationDoc = graphql(/* GraphQL */ `
  mutation AcceptInvitation($input: LookupInvitationInput!) {
    acceptInvitation(input: $input) {
      ...AuthPayloadFields
    }
  }
`)
