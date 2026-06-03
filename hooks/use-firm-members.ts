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
import type {
  FirmMembersQuery,
  PendingInvitationsQuery,
  InviteMemberInput,
} from '@/types/generated/graphql'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export type FirmMember = FirmMembersQuery['firmMembers'][number]
export type PendingInvitation = PendingInvitationsQuery['pendingInvitations'][number]

/**
 * DEV ONLY — sample roster shown when the GraphQL backend is unreachable
 * AND `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`, mirroring the pattern in
 * hooks/use-clients.ts so /settings/members renders without a live API.
 */
const DEV_SAMPLE_MEMBERS: FirmMember[] = [
  {
    id: 'dev-mem-1',
    firm_id: 'dev-firm',
    profile_id: 'dev-owner',
    firm_role: 'owner',
    professional_title: 'managing_partner',
    employment_type: 'full_time',
    status: 'active',
    name: 'Ama Owusu',
    email: 'ama.owusu@example.gh',
    gba_number: 'GBA-10231',
    verification_status: 'verified',
    joined_at: '2026-01-04T09:00:00Z',
    left_at: null,
  },
  {
    id: 'dev-mem-2',
    firm_id: 'dev-firm',
    profile_id: 'dev-assoc',
    firm_role: 'member',
    professional_title: 'associate',
    employment_type: 'full_time',
    status: 'active',
    name: 'Kojo Mensah',
    email: 'kojo.mensah@example.gh',
    gba_number: 'GBA-20984',
    verification_status: 'verified',
    joined_at: '2026-02-18T09:00:00Z',
    left_at: null,
  },
]

const DEV_SAMPLE_INVITES: PendingInvitation[] = [
  {
    id: 'dev-inv-1',
    firm_id: 'dev-firm',
    email: 'nana.adjei@example.gh',
    firm_role: 'member',
    professional_title: 'paralegal',
    invited_by: 'dev-owner',
    expires_at: '2026-06-17T09:00:00Z',
    created_at: '2026-06-03T09:00:00Z',
  },
]

export function useFirmMembers() {
  const { data, loading, error, refetch } = useQuery(FirmMembersQueryDoc, {
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  if (DEV_BYPASS) {
    return { data: DEV_SAMPLE_MEMBERS, isLoading: false, error: undefined, refetch }
  }
  return {
    data: data?.firmMembers as FirmMember[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function usePendingInvitations() {
  const { data, loading, error, refetch } = useQuery(PendingInvitationsQueryDoc, {
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  if (DEV_BYPASS) {
    return { data: DEV_SAMPLE_INVITES, isLoading: false, error: undefined, refetch }
  }
  return {
    data: data?.pendingInvitations as PendingInvitation[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

export function useInviteMember() {
  const [mutate, state] = useMutation(InviteMemberMutationDoc, {
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
  const [mutate, state] = useMutation(ResendInvitationMutationDoc, {
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
  const [mutate, state] = useMutation(RevokeInvitationMutationDoc, {
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
  const [mutate, state] = useMutation(ChangeMemberRoleMutationDoc, {
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
  const [mutate, state] = useMutation(ChangeProfessionalTitleMutationDoc, {
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
  const [mutate, state] = useMutation(DeactivateMemberMutationDoc, {
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
