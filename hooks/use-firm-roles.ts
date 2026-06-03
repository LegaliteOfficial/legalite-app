import { useMutation, useQuery } from '@apollo/client/react'
import {
  PermissionCatalogQueryDoc,
  FirmRolesQueryDoc,
  FirmRoleQueryDoc,
  CreateFirmRoleMutationDoc,
  UpdateFirmRoleMutationDoc,
  ArchiveFirmRoleMutationDoc,
  SetMemberRolesMutationDoc,
} from '@/lib/graphql/operations'
import type {
  FirmRolesQuery,
  PermissionCatalogQuery,
  CreateFirmRoleInput,
  UpdateFirmRoleInput,
} from '@/types/generated/graphql'

export type FirmRole = FirmRolesQuery['firmRoles'][number]
export type PermissionSection = PermissionCatalogQuery['permissionCatalog'][number]

export function useFirmRoles() {
  const { data, loading, error, refetch } = useQuery(FirmRolesQueryDoc,)
  return {
    data: data?.firmRoles as FirmRole[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function useFirmRole(id?: string) {
  const { data, loading, error } = useQuery(FirmRoleQueryDoc, {
    variables: { id: id ?? '' },
  })
  return { data: data?.firmRole as FirmRole | undefined, isLoading: loading, error }
}

/**
 * The permission catalog (sections → groups → permissions). Fetched from the
 * backend so the UI never drifts from what the server will accept. The
 * create-role page can fall back to its local catalog if this is unavailable.
 */
export function usePermissionCatalog() {
  const { data, loading, error } = useQuery(PermissionCatalogQueryDoc, {
    errorPolicy: 'all',
  })
  return {
    data: data?.permissionCatalog as PermissionSection[] | undefined,
    isLoading: loading,
    error,
  }
}

export function useCreateFirmRole() {
  const [mutate, state] = useMutation(CreateFirmRoleMutationDoc, {
    refetchQueries: [FirmRolesQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (input: CreateFirmRoleInput) => {
      const res = await mutate({ variables: { input } })
      return res.data?.createFirmRole
    },
  }
}

export function useUpdateFirmRole() {
  const [mutate, state] = useMutation(UpdateFirmRoleMutationDoc, {
    refetchQueries: [FirmRolesQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (input: UpdateFirmRoleInput) => {
      const res = await mutate({ variables: { input } })
      return res.data?.updateFirmRole
    },
  }
}

export function useArchiveFirmRole() {
  const [mutate, state] = useMutation(ArchiveFirmRoleMutationDoc, {
    refetchQueries: [FirmRolesQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (id: string) => {
      await mutate({ variables: { input: { id } } })
    },
  }
}

export function useSetMemberRoles() {
  const [mutate, state] = useMutation(SetMemberRolesMutationDoc, {
    refetchQueries: ['FirmMembers'],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (member_id: string, role_ids: string[]) => {
      const res = await mutate({ variables: { input: { member_id, role_ids } } })
      return res.data?.setMemberRoles
    },
  }
}
