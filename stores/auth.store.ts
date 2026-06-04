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
  isAuthenticated: boolean
  setAuth: (
    user: User,
    token: string,
    activeMembership?: FirmMembership | null,
    memberships?: FirmMembership[],
  ) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      activeMembership: null,
      memberships: [],
      isAuthenticated: false,

      setAuth: (user, token, activeMembership = null, memberships = []) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ll:token', token)
        }
        set({
          user,
          token,
          activeMembership,
          memberships,
          isAuthenticated: true,
        })
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ll:token')
        }
        set({
          user: null,
          token: null,
          activeMembership: null,
          memberships: [],
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
