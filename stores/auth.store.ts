import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Identity-only fields. Firm membership lives on `memberships` /
// `activeMembership` below, never inside User (see docs/TENANCY.md §2).
export interface User {
  id: string
  email: string
  name: string
  role: 'lawyer' | 'senior_partner' | 'associate' | 'paralegal' | 'admin' | string
  first_name?: string | null
  last_name?: string | null
  gba_number?: string | null
  supreme_court_enrollment_no?: string | null
  practising_license_no?: string | null
  digital_address?: string | null
  verification_status?: string | null
  // Optional legacy field, no longer populated. Kept so old reads don't blow up.
  firm?: string | null
}

export interface FirmMembership {
  firm_id: string
  firm_name: string
  firm_slug: string
  firm_role: 'owner' | 'admin' | 'member' | string
  professional_title: string
  status: string
}

interface AuthStore {
  user: User | null
  /** Short-lived access token. Memory only: never written to storage. */
  token: string | null
  accessTokenExpiresAt: string | null
  activeMembership: FirmMembership | null
  memberships: FirmMembership[]
  /** Effective permission slugs in the active firm; ['*'] means all. */
  permissions: string[]
  /**
   * This browser has a sign-in (an HttpOnly refresh cookie). Persisted, so a
   * reload knows to fetch a new access token rather than show the login page.
   */
  isAuthenticated: boolean
  setAuth: (
    user: User,
    token: string,
    activeMembership?: FirmMembership | null,
    memberships?: FirmMembership[],
    permissions?: string[],
    accessTokenExpiresAt?: string | null,
  ) => void
  /** Refresh what the user may do without changing who they are. */
  setAccess: (access: { permissions: string[]; firm_role?: string | null; professional_title?: string | null }) => void
  /** Sign out: ends the session on the server and clears local state. */
  logout: () => void
  /** Clear local state only (the server already ended the session). */
  clearLocal: () => void
}

const SIGNED_OUT = {
  user: null,
  token: null,
  accessTokenExpiresAt: null,
  activeMembership: null,
  memberships: [],
  permissions: [],
  isAuthenticated: false,
}

function dropCachedData() {
  if (typeof window === 'undefined') return
  // Older builds kept the token here; remove it wherever it lingers.
  localStorage.removeItem('ll:token')
  // Drop the previous user's client and case records from the in-memory
  // GraphQL cache, so the next person to sign in on this tab never sees
  // them. clearStore does not refetch.
  void import('@/lib/apollo')
    .then((m) => m.getApolloClient().clearStore())
    .catch(() => undefined)
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...SIGNED_OUT,

      // Arguments left out keep their current value, so a profile update
      // (user + token only) does not drop the firm membership.
      setAuth: (user, token, activeMembership, memberships, permissions, accessTokenExpiresAt) => {
        set((state) => ({
          user,
          token,
          accessTokenExpiresAt:
            accessTokenExpiresAt === undefined ? state.accessTokenExpiresAt : accessTokenExpiresAt,
          activeMembership:
            activeMembership === undefined ? state.activeMembership : activeMembership,
          memberships: memberships ?? state.memberships,
          permissions: permissions ?? state.permissions,
          isAuthenticated: true,
        }))
      },

      setAccess: ({ permissions, firm_role, professional_title }) =>
        set((state) => ({
          permissions,
          activeMembership: state.activeMembership
            ? {
                ...state.activeMembership,
                firm_role: firm_role ?? state.activeMembership.firm_role,
                professional_title:
                  professional_title ?? state.activeMembership.professional_title,
              }
            : null,
        })),

      logout: () => {
        if (typeof window !== 'undefined') {
          void import('@/lib/auth/session-client')
            .then((m) => m.signOut())
            .catch(() => undefined)
        }
        dropCachedData()
        set(SIGNED_OUT)
      },

      clearLocal: () => {
        dropCachedData()
        set(SIGNED_OUT)
      },
    }),
    {
      name: 'll:auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        activeMembership: state.activeMembership,
        memberships: state.memberships,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AuthStore> & { token?: string }
        // A token persisted by an older build is discarded, not trusted: it
        // has no session behind it. The person signs in again once.
        const hadSession = p.isAuthenticated === true && !p.token
        if (typeof window !== 'undefined') localStorage.removeItem('ll:token')
        if (p.token && typeof window !== 'undefined') {
          // Rewrite storage without it once hydration finishes.
          queueMicrotask(() => useAuthStore.setState({}))
        }
        return {
          ...current,
          user: p.user ?? null,
          activeMembership: p.activeMembership ?? null,
          memberships: p.memberships ?? [],
          isAuthenticated: hadSession,
        }
      },
    },
  ),
)
