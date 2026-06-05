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

// ── DEV_BYPASS dev sample ──────────────────────────────────────────────
// When `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` we short-circuit the Apollo
// round-trip so the /settings/roles page renders without a live backend.
// Covers the three system roles + a single custom role so the tabs
// (All / Custom / System) all have something to show.
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
const DEV_SAMPLE_FIRM_ROLES: FirmRole[] = [
  {
    id: 'role-owner',
    firm_id: 'dev-firm',
    name: 'Owner',
    slug: 'owner',
    description: 'Full administrative access to every surface in the firm.',
    permissions: [],
    is_system: true,
    status: 'active',
    member_count: 1,
    created_at: '2026-01-01T09:00:00Z',
    updated_at: '2026-01-01T09:00:00Z',
  },
  {
    id: 'role-admin',
    firm_id: 'dev-firm',
    name: 'Administrator',
    slug: 'administrator',
    description: 'Manage cases, clients, billing, and members.',
    permissions: [],
    is_system: true,
    status: 'active',
    member_count: 2,
    created_at: '2026-01-01T09:00:00Z',
    updated_at: '2026-01-01T09:00:00Z',
  },
  {
    id: 'role-member',
    firm_id: 'dev-firm',
    name: 'Member',
    slug: 'member',
    description: 'Day-to-day access to the cases and clients they own.',
    permissions: [],
    is_system: true,
    status: 'active',
    member_count: 6,
    created_at: '2026-01-01T09:00:00Z',
    updated_at: '2026-01-01T09:00:00Z',
  },
  {
    id: 'role-paralegal',
    firm_id: 'dev-firm',
    name: 'Paralegal',
    slug: 'paralegal',
    description: 'Read-only on most surfaces, write on document drafting.',
    permissions: [],
    is_system: false,
    status: 'active',
    member_count: 3,
    created_at: '2026-02-10T09:00:00Z',
    updated_at: '2026-02-10T09:00:00Z',
  },
]

export function useFirmRoles() {
  // Skip Apollo entirely in dev-bypass mode so /settings/roles doesn't
  // wait on a network timeout before rendering the sample list.
  const { data, loading, error, refetch } = useQuery(FirmRolesQueryDoc, {
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  if (DEV_BYPASS) {
    return {
      data: DEV_SAMPLE_FIRM_ROLES,
      isLoading: false,
      error: undefined,
      refetch,
    }
  }
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
    skip: DEV_BYPASS || !id,
  })
  if (DEV_BYPASS) {
    const match = id ? DEV_SAMPLE_FIRM_ROLES.find((r) => r.id === id) : undefined
    return { data: match, isLoading: false, error: undefined }
  }
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
