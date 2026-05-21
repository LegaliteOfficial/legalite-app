import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_URL,
})

// Attach JWT from Zustand persisted store on every request.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('ll:auth')
      if (raw) {
        const parsed = JSON.parse(raw)
        const token: string | undefined = parsed?.state?.token
        if (token) config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      // ignore JSON parse errors
    }
  }
  return config
})

// We deliberately do NOT redirect to /login on 401 here. Auth is enforced
// at the route level by <AuthGuard /> which validates the token once on
// dashboard mount. A blanket window.location redirect on every 401 makes
// transient failures (cold-start backend, expired token mid-session,
// flaky network) look like the app forcibly signed the user out. Instead,
// let the calling code handle the error (toast, retry, etc.). AuthGuard
// will re-validate on the next navigation and clean up if the token is
// genuinely invalid.
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err),
)
