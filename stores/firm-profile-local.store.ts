/**
 * Firm profile — local persisted store
 * ====================================
 *
 * What it stores
 * --------------
 * The firm's own record: legal name, registration and tax IDs,
 * contact details, office address, and a couple of practice defaults.
 * This is the data that shows up on letterheads, bills, the client
 * portal footer, and anywhere the firm presents itself.
 *
 * Why a -local store
 * ------------------
 * The backend exposes `currentFirm` / `updateFirm` (see
 * lib/graphql/firms.ts) and this store is shaped to match
 * `UpdateFirmInput` field-for-field, plus one practice default the
 * API doesn't carry yet (`default_jurisdiction`). Until the GraphQL
 * service is reachable, this persisted store is the source of truth;
 * when it is, the read API stays the same and writes route through
 * the mutation.
 *
 * Branding (display name, logo, colour) deliberately lives in the
 * separate firm.store so the sidebar can subscribe to just those
 * fields; the settings screen writes the firm name to both so the
 * wordmark stays in step.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FirmProfile {
  /** Registered legal name of the firm. */
  name: string
  /** Sole practitioner / partnership / LLP / chambers / in-house. */
  firm_type: string
  /** Registrar-General company / business registration number. */
  registration_number: string
  /** Ghana Revenue Authority Taxpayer Identification Number. */
  tin: string
  /** Four-digit year the firm was established, or null if unset. */
  year_established: number | null
  email: string
  phone: string
  website: string
  /** Street address line. */
  office_address: string
  /** GhanaPost GPS digital address, e.g. "GA-143-9080". */
  digital_address: string
  city: string
  /** Region of the office address (one of the 16 Ghana regions). */
  region: string
  /** Default region/jurisdiction applied to new matters. */
  default_jurisdiction: string
  /** Short blurb used on the portal footer and letterhead. */
  description: string
}

interface FirmProfileStore {
  profile: FirmProfile
  /** Bumps on every write — selector hooks rerender via this scalar. */
  revision: number
  /** Merge a partial update into the profile. */
  updateProfile: (patch: Partial<FirmProfile>) => void
}

// ── Dev seed ──────────────────────────────────────────────────────
// A plausible Accra commercial firm so the screen renders complete
// under a missing backend. Real firms overwrite every field.
const DEV_SEED: FirmProfile = {
  name: 'Mensah & Associates',
  firm_type: 'partnership',
  registration_number: 'CG-0123456789',
  tin: 'C0001234567',
  year_established: 2014,
  email: 'info@mensahlaw.com.gh',
  phone: '+233 30 222 1234',
  website: 'https://www.mensahlaw.com.gh',
  office_address: '12 Liberation Road, Ridge',
  digital_address: 'GA-143-9080',
  city: 'Accra',
  region: 'Greater Accra',
  default_jurisdiction: 'Greater Accra',
  description:
    'Full-service commercial law firm advising on corporate, real estate, and dispute resolution matters across Ghana.',
}

export const useFirmProfileStore = create<FirmProfileStore>()(
  persist(
    (set) => ({
      profile: DEV_SEED,
      revision: 0,
      updateProfile: (patch) =>
        set((prev) => ({
          profile: { ...prev.profile, ...patch },
          revision: prev.revision + 1,
        })),
    }),
    {
      name: 'll:firm-profile',
      partialize: (state) => ({ profile: state.profile }),
      skipHydration: true,
    },
  ),
)
