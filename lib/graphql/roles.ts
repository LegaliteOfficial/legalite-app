/**
 * Firm roles + the permission catalog used to build the role editor.
 *
 * Note: assigning a role to a member is `SetMemberRoles` here; the older
 * `ChangeMemberRole` (which uses the legacy role enum) lives in `./members`.
 */

import { graphql } from '@/types/generated'

export const PermissionCatalogQueryDoc = graphql(/* GraphQL */ `
  query PermissionCatalog {
    permissionCatalog {
      key
      label
      description
      groups {
        key
        label
        permissions {
          slug
          label
        }
      }
    }
  }
`)

export const FirmRolesQueryDoc = graphql(/* GraphQL */ `
  query FirmRoles {
    firmRoles {
      id
      firm_id
      name
      slug
      description
      permissions
      is_system
      status
      member_count
      created_at
      updated_at
    }
  }
`)

export const FirmRoleQueryDoc = graphql(/* GraphQL */ `
  query FirmRole($id: ID!) {
    firmRole(id: $id) {
      id
      firm_id
      name
      slug
      description
      permissions
      is_system
      status
      member_count
      created_at
      updated_at
    }
  }
`)

export const CreateFirmRoleMutationDoc = graphql(/* GraphQL */ `
  mutation CreateFirmRole($input: CreateFirmRoleInput!) {
    createFirmRole(input: $input) {
      id
      name
      slug
      description
      permissions
      is_system
      status
      member_count
      created_at
      updated_at
    }
  }
`)

export const UpdateFirmRoleMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateFirmRole($input: UpdateFirmRoleInput!) {
    updateFirmRole(input: $input) {
      id
      name
      slug
      description
      permissions
      is_system
      status
      member_count
      updated_at
    }
  }
`)

export const ArchiveFirmRoleMutationDoc = graphql(/* GraphQL */ `
  mutation ArchiveFirmRole($input: RoleIdInput!) {
    archiveFirmRole(input: $input) {
      id
      status
    }
  }
`)

export const SetMemberRolesMutationDoc = graphql(/* GraphQL */ `
  mutation SetMemberRoles($input: SetMemberRolesInput!) {
    setMemberRoles(input: $input) {
      id
      name
      slug
      is_system
    }
  }
`)
