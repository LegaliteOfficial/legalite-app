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
  token: string | null
  activeMembership: FirmMembership | null
  memberships: FirmMembership[]
  /** Effective permission slugs in the active firm; ['*'] means all. */
  permissions: string[]
  isAuthenticated: boolean
  setAuth: (
    user: User,
    token: string,
    activeMembership?: FirmMembership | null,
    memberships?: FirmMembership[],
    permissions?: string[],
  ) => void
  /** Refresh what the user may do without changing who they are. */
  setAccess: (access: { permissions: string[]; firm_role?: string | null; professional_title?: string | null }) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      activeMembership: null,
      memberships: [],
      permissions: [],
      isAuthenticated: false,

      // Arguments left out keep their current value, so a profile update
      // (user + token only) does not drop the firm membership.
      setAuth: (user, token, activeMembership, memberships, permissions) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ll:token', token)
        }
        set((state) => ({
          user,
          token,
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
          localStorage.removeItem('ll:token')
        }
        set({
          user: null,
          token: null,
          activeMembership: null,
          memberships: [],
          permissions: [],
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'll:auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        activeMembership: state.activeMembership,
        memberships: state.memberships,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AuthStore>
        return {
          ...current,
          ...p,
          isAuthenticated: !!p.token,
        }
      },
    },
  ),
)
