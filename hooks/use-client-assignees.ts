/**
 * Client assignees
 * ----------------
 * The firm members assigned to each client, keyed by client id so the list
 * view can look up a row's team without an N+1 fetch. Wired to the real
 * `clientAssignments` GraphQL query (one round-trip, grouped client-side);
 * short-circuits to a sample list in `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` mode.
 */

import { useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import {
  ClientAssignmentsQueryDoc,
  SetClientAssignmentsMutationDoc,
} from '@/lib/graphql/assignments'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

/**
 * Roles surfaced in the assignee chip / tooltip. Matches the
 * `User.role` enum so we can swap in the real user table without
 * a type churn later.
 */
export type AssigneeRole =
  | 'senior_partner'
  | 'lawyer'
  | 'associate'
  | 'paralegal'
  | 'admin'

export interface Assignee {
  id: string
  name: string
  role: AssigneeRole
  /** Optional avatar URL; the UI falls back to initials when null. */
  avatar_url?: string | null
}

/**
 * Human-readable label for each role — used in the avatar tooltip
 * so users can tell at a glance whether they're looking at a
 * partner, a lawyer, or a paralegal without clicking through.
 */
export const ROLE_LABEL: Record<AssigneeRole, string> = {
  senior_partner: 'Senior Partner',
  lawyer: 'Lawyer',
  associate: 'Associate',
  paralegal: 'Paralegal',
  admin: 'Admin',
}

/**
 * DEV ONLY — sample firm members. Reused inside
 * `DEV_SAMPLE_ASSIGNEES` so we can vary the team makeup per client
 * without redefining people every time. Names lean Ghanaian to
 * keep the dev data on-brand for the LegaLite market.
 */
const TEAM: Record<string, Assignee> = {
  ab: { id: 'u-ab', name: 'Akosua Boateng', role: 'senior_partner' },
  ka: { id: 'u-ka', name: 'Kwame Asante', role: 'lawyer' },
  ya: { id: 'u-ya', name: 'Yaa Asantewaa', role: 'lawyer' },
  nm: { id: 'u-nm', name: 'Nana Mensah', role: 'senior_partner' },
  ko: { id: 'u-ko', name: 'Kojo Owusu', role: 'associate' },
  am: { id: 'u-am', name: 'Ama Mensa', role: 'associate' },
  ed: { id: 'u-ed', name: 'Efua Darko', role: 'associate' },
  ks: { id: 'u-ks', name: 'Kofi Sarpong', role: 'paralegal' },
  ag: { id: 'u-ag', name: 'Adwoa Gyamfi', role: 'paralegal' },
  ya2: { id: 'u-ya2', name: 'Yaw Antwi', role: 'paralegal' },
  fb: { id: 'u-fb', name: 'Fiifi Boakye', role: 'lawyer' },
  ng: { id: 'u-ng', name: 'Nii Quaye', role: 'associate' },
}

/**
 * DEV ONLY — mapping from client id to the team members on file
 * for that client. Chosen to cover the common rendering cases:
 *   - dev-client-1: 4 assignees (fills the avatar stack, no overflow)
 *   - dev-client-2: 7 assignees (overflow → "+3")
 *   - dev-client-3: 2 assignees (lean team)
 *   - dev-client-4: 1 assignee  (single avatar)
 * If a client id has no entry here, the assignees list is empty
 * (UI renders an "Unassigned" hint).
 */
const DEV_SAMPLE_ASSIGNEES: Record<string, Assignee[]> = {
  'dev-client-1': [TEAM.ab, TEAM.ka, TEAM.ko, TEAM.ks],
  'dev-client-2': [TEAM.nm, TEAM.ya, TEAM.am, TEAM.ed, TEAM.ks, TEAM.ag, TEAM.ya2],
  'dev-client-3': [TEAM.fb, TEAM.ng],
  'dev-client-4': [TEAM.ab],
}

// professional_title (backend) → the narrower AssigneeRole the UI colours by.
function toAssigneeRole(title?: string | null): AssigneeRole {
  switch (title) {
    case 'managing_partner':
    case 'senior_partner':
    case 'partner':
      return 'senior_partner'
    case 'associate':
      return 'associate'
    case 'paralegal':
      return 'paralegal'
    case 'secretary':
    case 'support_staff':
    case 'admin':
      return 'admin'
    default:
      return 'lawyer'
  }
}

/**
 * Map keyed by client id → assignee list, for synchronous per-row lookup while
 * iterating the clients list. One GraphQL query, grouped client-side.
 */
export function useClientAssignees(): Map<string, Assignee[]> {
  const { data } = useQuery(ClientAssignmentsQueryDoc, {
    skip: DEV_BYPASS,
    errorPolicy: 'all',
  })

  return useMemo(() => {
    if (DEV_BYPASS) return new Map(Object.entries(DEV_SAMPLE_ASSIGNEES))
    const map = new Map<string, Assignee[]>()
    for (const a of data?.clientAssignments ?? []) {
      const assignee: Assignee = {
        id: a.member_id,
        name: a.name,
        role: toAssigneeRole(a.professional_title),
        avatar_url: a.avatar_url ?? null,
      }
      const list = map.get(a.client_id)
      if (list) list.push(assignee)
      else map.set(a.client_id, [assignee])
    }
    return map
  }, [data])
}

/** Replace the full set of members assigned to a client. */
export function useSetClientAssignments() {
  const [mutate, state] = useMutation(SetClientAssignmentsMutationDoc, {
    refetchQueries: [ClientAssignmentsQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (
      client_id: string,
      assignments: { member_id: string; assignment_role?: string }[],
    ) => {
      const res = await mutate({ variables: { input: { client_id, assignments } } })
      return res.data?.setClientAssignments
    },
  }
}
