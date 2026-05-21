import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  firm?: string
  role: 'lawyer' | 'senior_partner' | 'associate' | 'paralegal' | 'admin'
  gbaNumber?: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ll:token', token)
        }
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ll:token')
        }
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'll:auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
      // Derive isAuthenticated from token presence on rehydration. Without
      // this, the persisted partial state (user + token) is restored from
      // localStorage but `isAuthenticated` stays at its default `false` —
      // making AuthGuard bounce every authed user to /login on refresh.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AuthStore>
        return {
          ...current,
          ...p,
          isAuthenticated: !!p.token,
        }
      },
    }
  )
)
