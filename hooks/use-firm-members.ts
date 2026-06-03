import { useMutation, useQuery } from '@apollo/client/react'
import {
  FirmMembersQueryDoc,
  PendingInvitationsQueryDoc,
  InviteMemberMutationDoc,
  ResendInvitationMutationDoc,
  RevokeInvitationMutationDoc,
  ChangeMemberRoleMutationDoc,
  ChangeProfessionalTitleMutationDoc,
  DeactivateMemberMutationDoc,
  ReactivateMemberMutationDoc,
} from '@/lib/graphql/operations'
import {
  type FirmMembersQuery,
  type PendingInvitationsQuery,
  type InviteMemberInput,
  type PendingInvitationsQueryVariables,
  InviteMemberMutation,
  InviteMemberMutationVariables,
  ResendInvitationMutation,
  RevokeInvitationMutation,
  RevokeInvitationMutationVariables,
  DeactivateMemberMutation,
  DeactivateMemberMutationVariables,
  ChangeMemberRoleMutation,
  ChangeMemberRoleMutationVariables,
  ChangeProfessionalTitleMutation,
  ChangeProfessionalTitleMutationVariables,
} from '@/types/generated/graphql'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export type FirmMember = FirmMembersQuery['firmMembers'][number]
export type PendingInvitation = PendingInvitationsQuery['pendingInvitations'][number]


export function useFirmMembers() {
  const { data, loading, error, refetch } = useQuery(FirmMembersQueryDoc, {
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  return {
    data: data?.firmMembers as FirmMember[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function usePendingInvitations() {
  const { data, loading, error, refetch } = useQuery<PendingInvitationsQuery, PendingInvitationsQueryVariables>(PendingInvitationsQueryDoc, {
    // skip: DEV_BYPASS,
    // errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  return {
    data: data?.pendingInvitations as PendingInvitation[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function useInviteMember() {
  const [mutate, state] = useMutation<InviteMemberMutation, InviteMemberMutationVariables>(InviteMemberMutationDoc, {
    refetchQueries: [PendingInvitationsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (input: InviteMemberInput) => {
      const res = await mutate({ variables: { input } })
      return res.data?.inviteMember
    },
  }
}

export function useResendInvitation() {
  const [mutate, state] = useMutation<ResendInvitationMutation, ResendInvitationMutation>(ResendInvitationMutationDoc, {
    refetchQueries: [PendingInvitationsQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (id: string) => {
      const res = await mutate({ variables: { input: { id } } })
      return res.data?.resendInvitation
    },
  }
}

export function useRevokeInvitation() {
  const [mutate, state] = useMutation<RevokeInvitationMutation, RevokeInvitationMutationVariables>(RevokeInvitationMutationDoc, {
    refetchQueries: [PendingInvitationsQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (id: string) => {
      await mutate({ variables: { input: { id } } })
    },
  }
}

export function useChangeMemberRole() {
  const [mutate, state] = useMutation<ChangeMemberRoleMutation, ChangeMemberRoleMutationVariables>(ChangeMemberRoleMutationDoc, {
    refetchQueries: [FirmMembersQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async ({ member_id, firm_role }: { member_id: string; firm_role: string }) => {
      await mutate({ variables: { input: { member_id, firm_role } } })
    },
  }
}

export function useChangeProfessionalTitle() {
  const [mutate, state] = useMutation<ChangeProfessionalTitleMutation, ChangeProfessionalTitleMutationVariables>(ChangeProfessionalTitleMutationDoc, {
    refetchQueries: [FirmMembersQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async ({
      member_id,
      professional_title,
    }: {
      member_id: string
      professional_title: string
    }) => {
      await mutate({ variables: { input: { member_id, professional_title } } })
    },
  }
}

export function useDeactivateMember() {
  const [mutate, state] = useMutation<DeactivateMemberMutation, DeactivateMemberMutationVariables>(DeactivateMemberMutationDoc, {
    refetchQueries: [FirmMembersQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (member_id: string) => {
      await mutate({ variables: { member_id } })
    },
  }
}

export function useReactivateMember() {
  const [mutate, state] = useMutation(ReactivateMemberMutationDoc, {
    refetchQueries: [FirmMembersQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (member_id: string) => {
      await mutate({ variables: { member_id } })
    },
  }
}

// ── Shared display metadata ──────────────────────────────────────────────────

export const PROFESSIONAL_TITLES: { value: string; label: string }[] = [
  { value: 'managing_partner', label: 'Managing Partner' },
  { value: 'senior_partner', label: 'Senior Partner' },
  { value: 'partner', label: 'Partner' },
  { value: 'lawyer', label: 'Lawyer' },
  { value: 'associate', label: 'Associate' },
  { value: 'paralegal', label: 'Paralegal' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'support_staff', label: 'Support Staff' },
]

// Invitees can be admins or members; "owner" is reserved for the firm owner
// and is transferred via /settings/transfer-ownership, not granted by invite.
export const INVITE_FIRM_ROLES: { value: string; label: string; description: string }[] = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Can manage members, billing, and firm-wide settings.',
  },
  {
    value: 'member',
    label: 'Member',
    description: 'Standard access to matters, clients, and their own work.',
  },
]

export function titleLabel(value: string): string {
  return PROFESSIONAL_TITLES.find((t) => t.value === value)?.label ?? prettify(value)
}

export function roleLabel(value: string): string {
  if (value === 'owner') return 'Owner'
  return INVITE_FIRM_ROLES.find((r) => r.value === value)?.label ?? prettify(value)
}

function prettify(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
