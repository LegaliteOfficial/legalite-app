/**
 * Client assignees
 * ----------------
 * Returns the list of firm members (lawyers, partners, associates,
 * paralegals) assigned to each client. Mirrors the pattern of
 * `useClients()` / `useCases()` — short-circuits to a sample list
 * in `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` mode so the UI has real
 * shape to render before the backend lands.
 *
 * Today this is local-only; when the integrations release ships,
 * swap the dev short-circuit for a real query that joins
 * client_assignments → users.
 */

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

/**
 * Returns a map keyed by client id → assignee list. Designed so
 * the caller can synchronously look up each row's assignees while
 * iterating its clients list, without an N+1 fetch per row.
 *
 * In dev mode the map is the static sample above; in real mode
 * this becomes a single GraphQL query that joins
 * `client_assignments` → `users` and bucket by client id.
 */
export function useClientAssignees(): Map<string, Assignee[]> {
  // Object identity matters here so React doesn't re-render on
  // every poll — wrap in a Map keyed off the constant.
  if (DEV_BYPASS) {
    return new Map(Object.entries(DEV_SAMPLE_ASSIGNEES))
  }
  // TODO(integrations-release): wire the real fetch. Empty map is
  // safe — the UI just renders "Unassigned" until then.
  return new Map()
}
