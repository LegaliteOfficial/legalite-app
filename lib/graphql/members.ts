/**
 * Firm members — list / role changes / activation / transfer of ownership.
 *
 * Invitations are a separate domain (`./invitations`) because they have
 * their own lifecycle (issued → accepted/revoked/expired) and the email
 * shape differs from member shape.
 */

import { graphql } from '@/types/generated'

export const FirmMembersQueryDoc = graphql(/* GraphQL */ `
  query FirmMembers {
    firmMembers {
      id
      firm_id
      profile_id
      firm_role
      professional_title
      employment_type
      status
      name
      email
      gba_number
      verification_status
      joined_at
      left_at
    }
  }
`)

export const ChangeMemberRoleMutationDoc = graphql(/* GraphQL */ `
  mutation ChangeMemberRole($input: ChangeMemberRoleInput!) {
    changeMemberRole(input: $input) {
      id
      firm_role
      professional_title
      status
      name
      email
    }
  }
`)

export const ChangeProfessionalTitleMutationDoc = graphql(/* GraphQL */ `
  mutation ChangeProfessionalTitle($input: ChangeProfessionalTitleInput!) {
    changeProfessionalTitle(input: $input) {
      id
      firm_role
      professional_title
    }
  }
`)

export const DeactivateMemberMutationDoc = graphql(/* GraphQL */ `
  mutation DeactivateMember($member_id: ID!) {
    deactivateMember(member_id: $member_id) {
      id
      status
    }
  }
`)

export const ReactivateMemberMutationDoc = graphql(/* GraphQL */ `
  mutation ReactivateMember($member_id: ID!) {
    reactivateMember(member_id: $member_id) {
      id
      status
    }
  }
`)

export const LeaveFirmMutationDoc = graphql(/* GraphQL */ `
  mutation LeaveFirm {
    leaveFirm
  }
`)

export const TransferOwnershipMutationDoc = graphql(/* GraphQL */ `
  mutation TransferOwnership($input: TransferOwnershipInput!) {
    transferOwnership(input: $input) {
      id
      firm_role
      name
    }
  }
`)
