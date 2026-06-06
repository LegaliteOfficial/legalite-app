/**
 * Member invitations — the lifecycle from invite → accept/revoke.
 *
 * Note: AcceptInvite lives in `./auth` because it's a login-shaped
 * mutation that returns AuthPayload. Lookup, create, resend, revoke
 * (firm-owner side) live here.
 */

import { graphql } from '@/types/generated'

export const PendingInvitationsQueryDoc = graphql(/* GraphQL */ `
  query PendingInvitations {
    pendingInvitations {
      id
      firm_id
      email
      firm_role
      professional_title
      invited_by
      expires_at
      created_at
    }
  }
`)

export const InviteMemberMutationDoc = graphql(/* GraphQL */ `
  mutation InviteMember($input: InviteMemberInput!) {
    inviteMember(input: $input) {
      invitation {
        id
        firm_id
        email
        firm_role
        professional_title
        expires_at
        created_at
      }
      token
      accept_url
    }
  }
`)

export const ResendInvitationMutationDoc = graphql(/* GraphQL */ `
  mutation ResendInvitation($input: InvitationIdInput!) {
    resendInvitation(input: $input) {
      invitation {
        id
        expires_at
      }
      token
      accept_url
    }
  }
`)

export const RevokeInvitationMutationDoc = graphql(/* GraphQL */ `
  mutation RevokeInvitation($input: InvitationIdInput!) {
    revokeInvitation(input: $input) {
      id
      revoked_at
    }
  }
`)

export const InvitationLookupQueryDoc = graphql(/* GraphQL */ `
  query InvitationLookup($input: LookupInvitationInput!) {
    invitationLookup(input: $input) {
      email
      firm_name
      firm_role
      professional_title
      expires_at
    }
  }
`)
